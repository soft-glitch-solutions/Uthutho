import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
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

  // Handle avatar upload (update profile row)
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

  // Upload avatar (works web + mobile)
  const uploadAvatar = useCallback(
    async (fileOrUri: File | string) => {
      try {
        setUploading(true);
        if (!session?.user) throw new Error("User not authenticated");
        const userId = session.user.id;

        const timestamp = new Date().toISOString();
        const fileName = `${userId}_${timestamp}.jpg`;
        const filePath = `avatars/${fileName}`;

        let fileData: File | ArrayBuffer;

        if (Platform.OS === "web") {
          // Web: file comes from <input type="file" />
          fileData = fileOrUri as File;
        } else {
          // Native: fetch the file as ArrayBuffer
          const response = await fetch(fileOrUri as string);
          fileData = await response.arrayBuffer();
        }

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, fileData, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        if (!data) throw new Error("Failed to get public URL");

        await handleAvatarUpload(data.publicUrl);
        return data.publicUrl;
      } catch (err) {
        console.error("❌ Error uploading avatar:", err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [session, handleAvatarUpload]
  );

  // Handle image picker (mobile only)
  const handleImagePicker = useCallback(async () => {
    try {
      setUploading(true);
  
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
  
      let localUri = result.assets[0].uri;
  
      // iOS ph:// fix
      if (Platform.OS === "ios" && localUri.startsWith("ph://")) {
        const assetId = localUri.split("/").pop();
        const dest = `${FileSystem.cacheDirectory}${assetId}.jpg`;
        await FileSystem.copyAsync({ from: localUri, to: dest });
        localUri = dest;
      }
  
      await uploadAvatar(localUri);
    } catch (error: any) {
      console.error("❌ Error in handleImagePicker:", error.message || error);
    } finally {
      setUploading(false);
    }
  }, [uploadAvatar]);
  

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
