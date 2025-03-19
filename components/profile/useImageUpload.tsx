import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase'; // Ensure path is correct

export const useImageUpload = (updateProfile) => {
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    console.log('Fetching user session...');
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Unable to fetch user session', sessionError);
      throw new Error('Unable to fetch user session');
    }
  
    console.log('User session fetched:', session);
  
    // Fetch profile data from Supabase
    console.log('Fetching profile data...');
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, avatar_url
      `)
      .eq('id', session.user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile data', error);
      throw new Error('Error fetching profile data');
    }
  
    console.log('Profile data fetched:', data);
  
    return data;
  };

  const getUserId = async () => {
    try {
      console.log('Fetching user session for user ID...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Error fetching user session:', sessionError);
        return null;
      }
      console.log('User session fetched for user ID:', session);
      return session.user.id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      console.log('Starting image upload process...');
      const userId = await getUserId();
      if (!userId) throw new Error('User not authenticated');
      
      console.log('User authenticated, proceeding to fetch profile...');
      const profile = await fetchProfile();
      const currentProfilePicture = profile?.avatar_url || '';
      console.log('Current profile picture URL:', currentProfilePicture);

      // Generate a unique filename with timestamp and user ID
      const timestamp = new Date().toISOString();
      const fileName = `${userId}_${timestamp}.jpg`;

      console.log('Generated file name:', fileName);

      // Convert image URI to a Blob if on the web
      const file = Platform.OS === 'web' ? await fetch(uri).then(r => r.blob()) : uri;

      // Log the file and filename
      console.log('Uploading file:', file);
      console.log('File name:', fileName);

      // Upload the image to Supabase Storage
      console.log('Uploading image to Supabase...');
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`avatars/${fileName}`, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        if (uploadError.message.includes('Duplicate')) {
          // Handle duplicate error if it occurs
          console.warn('File already exists. Handling duplication...');
        }
        throw uploadError;
      }

      // Construct the public URL of the uploaded image
      const publicURL = `https://ygkhmcnpjjvmbrbyybik.supabase.co/storage/v1/object/public/avatars/avatars/${fileName}`;
      console.log('Public URL:', publicURL);

      // Optionally delete the previous image if one exists
      if (currentProfilePicture) {
        // Extract file name from URL
        const previousFileName = currentProfilePicture.split('/').pop();
        console.log('Deleting previous file:', previousFileName);

        // Ensure the file path matches the one used during upload
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`avatars/${previousFileName}`]);

        if (deleteError) {
          console.error('Error deleting previous file:', deleteError);
          throw deleteError;
        }
      }

      // Update the profile with the new picture URL
      console.log('Updating profile with new avatar URL...');
      await updateProfile({ avatar_url: publicURL });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      console.error('Error in uploadImage:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      console.log('Upload process completed.');
      setUploading(false);
    }
  };

  const handleImagePicker = async () => {
    if (Platform.OS === 'web') {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.click();
    }
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.cancelled) {
        console.log('Picked image URI:', result.uri);
        await uploadImage(result.uri);
      }
    }
  };

  const handleFileChange = async (event) => {
    console.log('File change detected...');
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileUrl = URL.createObjectURL(file);
      console.log('Selected file URL:', fileUrl);
      await uploadImage(fileUrl);
    } else {
      console.error('Invalid file type selected');
      Alert.alert('Error', 'Please select a valid image file.');
    }
  };

  return { handleImagePicker, handleFileChange, uploading };
};
