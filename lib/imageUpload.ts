// lib/imageUpload.ts
import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly MAX_WIDTH = 1200;
  private static readonly MAX_HEIGHT = 1200;
  private static readonly QUALITY = 0.7;
  private static readonly BUCKET_NAME = 'post-images';
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Compress and resize image
  static async compressImage(uri: string): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: this.MAX_WIDTH, height: this.MAX_HEIGHT } },
        ],
        { 
          compress: this.QUALITY, 
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true 
        }
      );

      if (!manipResult.base64) {
        throw new Error('Failed to compress image');
      }

      // Check file size
      const base64Length = manipResult.base64.length;
      const fileSizeInBytes = (base64Length * 3) / 4; // Approximate base64 size
      
      if (fileSizeInBytes > this.MAX_FILE_SIZE) {
        // Further compress if still too large
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          uri,
          [
            { resize: { width: 800, height: 800 } },
          ],
          { 
            compress: 0.5, 
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true 
          }
        );
        
        if (!furtherCompressed.base64) {
          throw new Error('Failed to further compress image');
        }
        
        return furtherCompressed.base64;
      }

      return manipResult.base64;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  // Upload image to Supabase
  static async uploadImage(base64Image: string, fileName: string): Promise<UploadResult> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists();

      const arrayBuffer = decode(base64Image);
      const fileExt = 'jpg';
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Ensure bucket exists and is public
  private static async ensureBucketExists() {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: this.MAX_FILE_SIZE,
        });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      throw error;
    }
  }

  // Clean up old images (run this daily via cron or edge function)
  static async cleanupOldImages(daysOld: number = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list();

      if (error) throw error;

      const filesToDelete = files?.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      });

      if (filesToDelete && filesToDelete.length > 0) {
        const filePaths = filesToDelete.map(file => file.name);
        
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) throw deleteError;

        console.log(`Deleted ${filePaths.length} old images`);
      }
    } catch (error) {
      console.error('Error cleaning up old images:', error);
    }
  }

  // Delete specific image
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      return !error;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
}