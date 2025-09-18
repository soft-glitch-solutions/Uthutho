import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

export const useImageUpload = (updateProfile: (fields: any) => Promise<void>) => {
  const [uploading, setUploading] = useState(false);

  const getUserId = async () => {
    console.log('Fetching user session for user ID...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error fetching user session:', sessionError);
      return null;
    }
    console.log('User session fetched:', session.user.id);
    return session.user.id;
  };

  const fetchProfile = async () => {
    console.log('Fetching profile...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile data', error);
      throw error;
    }
    console.log('Profile data fetched:', data);
    return data;
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    console.log('Converting URI to Blob:', uri);

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Web Blob created:', blob);
      return blob;
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Mobile file read as base64, length:', base64.length);

      const byteCharacters = atob(base64);
      const byteArrays: Uint8Array[] = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      console.log('Mobile Blob created:', blob);
      return blob;
    }
  };

  const uploadImage = async (uri: string) => {
    console.log('Starting uploadImage with URI:', uri);
    setUploading(true);

    try {
      const userId = await getUserId();
      if (!userId) throw new Error('User not authenticated');

      const profile = await fetchProfile();
      const currentProfilePicture = profile?.avatar_url || '';
      console.log('Current profile picture URL:', currentProfilePicture);

      const timestamp = new Date().toISOString();
      const fileName = `${userId}_${timestamp}.jpg`;
      console.log('Generated file name:', fileName);

      const file = await uriToBlob(uri);
      console.log('File ready for upload:', file);

      console.log('Uploading file to Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`avatars/${fileName}`, file, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      const publicURL = `${supabase.storageUrl}/object/public/avatars/avatars/${fileName}`;
      console.log('Public URL of uploaded image:', publicURL);

      // Delete old avatar if exists
      if (currentProfilePicture) {
        const previousFileName = currentProfilePicture.split('/').pop();
        if (previousFileName) {
          console.log('Deleting old avatar:', previousFileName);
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`avatars/${previousFileName}`]);

          if (deleteError) {
            console.error('Error deleting previous file:', deleteError);
          }
        }
      }

      console.log('Updating profile with new avatar URL...');
      await updateProfile({ avatar_url: publicURL });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      console.error('Error in uploadImage:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      console.log('Upload process finished.');
      setUploading(false);
    }
  };

  const handleImagePicker = async () => {
    console.log('Opening image picker...');
    if (Platform.OS === 'web') {
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        console.log('Clicking file input for web...');
        fileInput.click();
      }
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log('Picked image URI:', uri);
        await uploadImage(uri);
      }
    }
  };

  const handleFileChange = async (event: any) => {
    console.log('File input change detected...');
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileUrl = URL.createObjectURL(file);
      console.log('Selected file URL (web):', fileUrl);
      await uploadImage(fileUrl);
    } else {
      console.error('Invalid file type selected');
      Alert.alert('Error', 'Please select a valid image file.');
    }
  };

  return { handleImagePicker, handleFileChange, uploadImage, uploading };
};
