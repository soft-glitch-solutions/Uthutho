import { useState, useEffect, useCallback } from 'react';
import { Profile } from "@/types/profile";
import { Title } from "@/types/title";
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker'; // Import expo-image-picker

export function useProfile() {
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false); // New state for image upload
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);

  // Fetch session on mount and listen for auth state changes
  useEffect(() => {
    const fetchSession = async () => {
      console.log('Fetching session...');
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
        console.error('Session error or no session found:', sessionError);
        throw new Error('No user session found. Please log in.');
      }
      console.log('Session fetched successfully:', session.session);
      setSession(session.session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed. New session:', session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile and titles when session changes
  useEffect(() => {
    if (session?.user) {
      console.log('Session user detected. Fetching profile and titles...');
      getProfile();
      fetchTitles();
    } else {
      console.log('No session user found.');
    }
  }, [session]);

  // Fetch user profile
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const userId = session.user.id;
      console.log('Fetching profile for user ID:', userId);

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, first_name, last_name, avatar_url, preferred_transport, points, titles, selected_title, favorites, updated_at`)
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      } else {
        console.log('No profile data found.');
      }
    } catch (error: any) {
      console.error('Error in getProfile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch titles and check for newly unlocked titles
  const fetchTitles = useCallback(async () => {
    try {
      if (!session?.user) throw new Error('No user session found');

      const userId = session.user.id;
      console.log('Fetching titles for user ID:', userId);

      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching titles:', error);
        throw error;
      }

      console.log('Titles fetched successfully:', data);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('points, titles')
        .eq('id', userId)
        .single();

      if (profileData) {
        console.log('Profile data for titles check:', profileData);

        // Filter and map titles correctly
        const newlyUnlockedTitles = data
          .filter(title => 
            title.points_required <= profileData.points && 
            !profileData.titles.includes(title.title))
          .map(title => title.title);

        console.log('Newly unlocked titles:', newlyUnlockedTitles);

        if (newlyUnlockedTitles.length > 0) {
          const updatedTitles = [...(profileData.titles || []), ...newlyUnlockedTitles];
          console.log('Updating profile with new titles:', updatedTitles);

          await supabase
            .from('profiles')
            .update({ titles: updatedTitles })
            .eq('id', userId);
          
          console.log('Profile updated with new titles.');
          getProfile();
        }
      }

      setTitles(data || []);
    } catch (error: any) {
      console.error('Error in fetchTitles:', error.message);
    }
  }, [session, getProfile]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(async (publicUrl: string) => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user session found');

      const userId = session.user.id;
      console.log('Uploading avatar for user ID:', userId);

      const updates = {
        id: userId,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) {
        console.error('Error uploading avatar:', updateError);
        throw updateError;
      }

      console.log('Avatar uploaded successfully.');
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    } catch (error: any) {
      console.error('Error in handleAvatarUpload:', error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Handle image picker and upload
  const handleImagePicker = useCallback(async () => {
    try {
      setUploading(true);
  
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
  
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (result.canceled) {
        console.log('Image picker canceled.');
        return;
      }
  
      if (!result.assets || result.assets.length === 0) {
        throw new Error('No image selected.');
      }
  
      const file = result.assets[0]; // Get the selected image
      console.log('Selected image:', file);
  
      if (!session?.user) throw new Error('No user session found');
  
      const userId = session.user.id;
      console.log('Uploading image for user ID:', userId);
  
      // Extract file extension from the URI
      const fileExt = file.uri.split('.').pop();
      const fileName = `${userId}.${fileExt}`; // Create a unique file name
      const filePath = `${fileName}`;
  
      // Check if a file already exists for the user
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list(userId); // List files in the user's folder
  
      if (listError) {
        console.error('Error listing existing files:', listError);
        throw listError;
      }
  
      // If a file exists, delete it
      if (existingFiles && existingFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath]); // Delete the old file
  
        if (deleteError) {
          console.error('Error deleting old file:', deleteError);
          throw deleteError;
        }
  
        console.log('Old file deleted successfully.');
      }
  
      // Convert base64 image data to a Blob
      const response = await fetch(file.uri);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
  
      // Upload the new image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'image/jpeg', // Set the content type
        });
  
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }
  
      // Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      if (!publicUrlData) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }
  
      const publicUrl = publicUrlData.publicUrl;
      console.log('Image uploaded successfully. Public URL:', publicUrl);
  
      // Update the user's avatar URL in the profile
      await handleAvatarUpload(publicUrl);
    } catch (error) {
      console.error('Error in handleImagePicker:', error.message);
    } finally {
      setUploading(false);
    }
  }, [session, handleAvatarUpload]);
  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      console.log('User signed out successfully.');
      setSession(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Error in handleSignOut:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

    // Upload an avatar image to Supabase storage
    const uploadAvatar = async (uri: string | File) => {
      try {
        setUploading(true);
    
        // Get the user ID
        const userId = session?.user?.id;
        if (!userId) throw new Error('User not authenticated');
    
        let blob: Blob;
    
        // Handle web (File object) and mobile (URI string)
        if (typeof uri === 'string') {
          // Mobile: Fetch the image from the URI and convert it to a Blob
          if (!uri.startsWith('http') && !uri.startsWith('data:')) {
            throw new Error('Invalid image URI');
          }
    
          console.log('Fetching image from URI:', uri);
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
    
          blob = await response.blob();
        } else {
          // Web: Use the File object directly
          blob = uri;
        }
    
        console.log('Image fetched successfully. Size:', blob.size, 'bytes');
    
        // Generate a unique filename with timestamp and user ID
        const timestamp = new Date().toISOString();
        const fileExt = typeof uri === 'string' ? uri.split('.').pop() || 'jpg' : uri.name.split('.').pop() || 'jpg';
        const fileName = `${userId}_${timestamp}.${fileExt}`;
        const filePath = `avatars/${fileName}`; // Explicitly specify the bucket in the path
    
        // Log the file and filename
        console.log('Uploading file:', fileName);
        console.log('File path:', filePath);
    
        // Upload the image to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars') // Explicitly specify the bucket
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: true,
          });
    
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw uploadError;
        }
    
        // Construct the public URL of the uploaded image
        const { data: publicUrlData } = await supabase.storage
          .from('avatars') // Explicitly specify the bucket
          .getPublicUrl(filePath);
    
        if (!publicUrlData) {
          throw new Error('Failed to get public URL for the uploaded image.');
        }
    
        const publicUrl = publicUrlData.publicUrl;
        console.log('Public URL:', publicUrl);
    
        // Update the profile with the new avatar URL
        await handleAvatarUpload(publicUrl);
        Alert.alert('Success', 'Avatar updated successfully!');
      } catch (err) {
        console.error('Error in uploadAvatar:', err);
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      } finally {
        setUploading(false);
      }
    };

  
  // Handle title selection
  const handleSelectTitle = useCallback(async (title: string) => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user session found');
      if (!profile?.titles?.includes(title)) {
        throw new Error('You have not unlocked this title yet.');
      }

      const userId = session.user.id;
      console.log('Selecting title for user ID:', userId);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selected_title: title })
        .eq('id', userId);

      if (updateError) {
        console.error('Error selecting title:', updateError);
        throw updateError;
      }

      console.log('Title selected successfully.');
      setProfile(prev => prev ? { ...prev, selected_title: title } : null);
    } catch (error: any) {
      console.error('Error in handleSelectTitle:', error.message);
    } finally {
      setLoading(false);
    }
  }, [session, profile]);


  return {
    loading,
    uploading,
    session,
    profile,
    titles,
    getProfile,
    fetchTitles,
    handleAvatarUpload,
    uploadAvatar,
    handleSelectTitle,
    handleImagePicker,
    handleSignOut,
  };
}