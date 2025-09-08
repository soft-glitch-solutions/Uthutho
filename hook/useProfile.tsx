import { useState, useEffect, useCallback } from 'react';
import { Profile } from "@/types/profile";
import { Title } from "@/types/title";
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as FileSystem from "expo-file-system";

export function useProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);

  // Fetch session on mount and listen for auth state changes
  useEffect(() => {
    const fetchSession = async () => {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
          router.replace('/auth');
      }
      setSession(session.session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile and titles when session changes
  useEffect(() => {
    if (session?.user) {
      getProfile();
      fetchTitles();
    }
  }, [session]);

  // Fetch user profile
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const userId = session.user.id;

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, first_name, last_name, avatar_url, preferred_transport, points, titles, selected_title, favorites, updated_at`)
        .eq('id', userId)
        .single();

      console.log('Fetched profile data:', data);
      console.log('Profile fetch error:', error);
      if (error && status !== 406) {
        throw error;
      }
      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch titles and check for newly unlocked titles
  const fetchTitles = useCallback(async () => {
    try {
      if (!session?.user) throw new Error('No user session found');

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) {
        throw error;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('points, titles')
        .eq('id', userId)
        .single();

      if (profileData) {
        const newlyUnlockedTitles = data
          .filter(title => 
            title.points_required <= profileData.points && 
            !profileData.titles.includes(title.title))
          .map(title => title.title);

        if (newlyUnlockedTitles.length > 0) {
          const updatedTitles = [...(profileData.titles || []), ...newlyUnlockedTitles];

          await supabase
            .from('profiles')
            .update({ titles: updatedTitles })
            .eq('id', userId);

          getProfile();
        }
      }

      setTitles(data || []);
    } catch (error: any) {
      throw error;
    }
  }, [session, getProfile]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(async (publicUrl: string) => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user session found');

      const userId = session.user.id;

      const updates = {
        id: userId,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Handle image picker and upload
  const handleImagePicker = useCallback(async () => {
    try {
      setUploading(true);
  
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access gallery is required!");
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      console.log("📂 Picker result:", result);
  
      if (result.canceled || !result.assets?.length) {
        console.log("⚠️ No image selected");
        return;
      }
  
      const file = result.assets[0];
      let localUri = file.uri;
  
      // ✅ On iOS, convert ph:// URI to real path
      if (localUri.startsWith("ph://")) {
        const assetId = localUri.split("/").pop();
        const dest = `${FileSystem.cacheDirectory}${assetId}.jpg`;
        await FileSystem.copyAsync({ from: localUri, to: dest });
        localUri = dest;
        console.log("📱 iOS converted URI:", localUri);
      }
  
      if (!session?.user) throw new Error("No user session found");
      const userId = session.user.id;
  
      const fileExt = localUri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;
  
      // Fetch as blob
      const response = await fetch(localUri);
      const blob = await response.blob();
      console.log("📦 Blob ready:", blob.type, blob.size);
  
      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { cacheControl: "3600", upsert: true });
  
      if (uploadError) throw uploadError;
  
      console.log("✅ Uploaded file:", filePath);
  
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      if (!data) throw new Error("Failed to retrieve public URL");
  
      const publicUrl = data.publicUrl;
      console.log("🌍 Public URL:", publicUrl);
  
      await handleAvatarUpload(publicUrl);
    } catch (error: any) {
      console.error("❌ Error in handleImagePicker:", error.message || error);
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
        throw error;
      }
      setSession(null);
      setProfile(null);
      router.replace('/auth');
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload an avatar image to Supabase storage
  const uploadAvatar = async (uri: string | File) => {
    try {
      setUploading(true);

      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      let blob: Blob;

      if (typeof uri === 'string') {
        if (!uri.startsWith('http') && !uri.startsWith('data:')) {
          throw new Error('Invalid image URI');
        }

        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        blob = await response.blob();
      } else {
        blob = uri;
      }

      const timestamp = new Date().toISOString();
      const fileExt = typeof uri === 'string' ? uri.split('.').pop() || 'jpg' : uri.name.split('.').pop() || 'jpg';
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      const publicUrl = publicUrlData.publicUrl;

      await handleAvatarUpload(publicUrl);
    } catch (err) {
      throw err;
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selected_title: title })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, selected_title: title } : null);
    } catch (error: any) {
      throw error;
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