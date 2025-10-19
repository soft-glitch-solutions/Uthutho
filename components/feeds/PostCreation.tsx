// components/feeds/PostCreation.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Image as ImageIcon, Plus } from 'lucide-react-native';
import { ImageUploadService } from '@/lib/imageUpload';
import { PostCreationProps } from '@/types';

const PostCreation: React.FC<PostCreationProps> = ({
  newPost,
  setNewPost,
  createPost,
  maxLength = 500,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const characterCount = newPost.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to upload images');
        return;
      }

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 4 - selectedImages.length, // Max 4 images per post
      });

      if (!result.canceled && result.assets) {
        setCompressing(true);
        
        const compressedImages: string[] = [];
        
        for (const asset of result.assets) {
          try {
            const compressedBase64 = await ImageUploadService.compressImage(asset.uri);
            compressedImages.push(compressedBase64);
          } catch (error) {
            console.error('Error compressing image:', error);
            Alert.alert('Error', 'Failed to compress one of the images');
          }
        }
        
        setSelectedImages(prev => [...prev, ...compressedImages]);
        setCompressing(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || isOverLimit) return;
    
    setUploading(true);
    
    try {
      const uploadedImageUrls: string[] = [];
      
      // Upload images first
      for (const base64Image of selectedImages) {
        const result = await ImageUploadService.uploadImage(base64Image, `post-${Date.now()}`);
        if (result.success && result.url) {
          uploadedImageUrls.push(result.url);
        } else {
          console.error('Failed to upload image:', result.error);
        }
      }
      
      // Create post with image URLs
      await createPost(newPost, uploadedImageUrls);
      
      // Reset form
      setSelectedImages([]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post with images:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const canPost = newPost.trim() && !isOverLimit && !uploading && !compressing;

  return (
    <View style={styles.postCreationContainer}>
      <TextInput
        style={[
          styles.postInput,
          isOverLimit && styles.postInputError,
        ]}
        placeholder="What's happening?"
        placeholderTextColor="#777"
        value={newPost}
        onChangeText={setNewPost}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />
      
      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
          {selectedImages.map((base64Image, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image 
                source={{ uri: `data:image/jpeg;base64,${base64Image}` }} 
                style={styles.previewImage}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      
      <View style={styles.postFooter}>
        <View style={styles.footerLeft}>
          <TouchableOpacity 
            style={[
              styles.imageButton,
              (selectedImages.length >= 4 || uploading || compressing) && styles.imageButtonDisabled
            ]}
            onPress={pickImage}
            disabled={selectedImages.length >= 4 || uploading || compressing}
          >
            {compressing ? (
              <ActivityIndicator size="small" color="#1ea2b1" />
            ) : (
              <ImageIcon size={20} color="#1ea2b1" />
            )}
            <Text style={styles.imageButtonText}>
              {selectedImages.length}/4
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.characterCount,
            isNearLimit && styles.characterCountWarning,
            isOverLimit && styles.characterCountError,
          ]}>
            {characterCount}/{maxLength}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.postButton,
            !canPost && styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!canPost}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCreationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
  },
  postInputError: {
    borderColor: '#ef4444',
  },
  imagePreviewContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1ea2b1',
    gap: 6,
  },
  imageButtonDisabled: {
    opacity: 0.5,
  },
  imageButtonText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  characterCount: {
    fontSize: 14,
    color: '#666666',
  },
  characterCountWarning: {
    color: '#f59e0b',
  },
  characterCountError: {
    color: '#ef4444',
  },
  postButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PostCreation;