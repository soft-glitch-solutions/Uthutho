import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [uploading, setUploading] = useState(false); // State for avatar upload loading
  const [loading, setLoading] = useState(false); // State for profile update loading

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.session) {
          throw new Error('No user session found. Please log in.');
        }

        const userId = session.session.user.id;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          throw new Error('Failed to fetch profile data.');
        }

        setFirstName(profileData.first_name);
        setLastName(profileData.last_name);
        setEmail(profileData.email);
        setAvatarUrl(profileData.avatar_url);
        setPoints(profileData.points || 0);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      }
    };

    fetchProfile();
  }, []);

  // Handle saving profile changes
  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
        throw new Error('No user session found. Please log in.');
      }

      const userId = session.session.user.id;

      const updates = {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      alert('Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image picker for avatar upload
  const handleImagePicker = async () => {
    try {
      setUploading(true); // Start loading

      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        await uploadImage(selectedImage); // Upload the selected image
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick an image. Please try again.');
    } finally {
      setUploading(false); // Stop loading
    }
  };

  // Upload image to Supabase storage
  const uploadImage = async (uri: string) => {
    try {
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Fetch the image file
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload the image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the avatar URL in the profiles table
      await handleAvatarUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error.message);

    }
  };

  // Update the avatar URL in the profiles table
  const handleAvatarUpload = async (publicUrl: string) => {
    try {
      setLoading(true);
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
        throw new Error('No user session found.');
      }

      const updates = {
        id: session.session.user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl); // Update the avatar URL in state
    } catch (error) {
      console.error('Error updating avatar URL:', error.message);
      alert('Failed to update avatar URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        {/* Avatar Upload Section */}
        <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer} disabled={uploading || loading}>
          {uploading || loading ? (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text }}>Select Profile Picture</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Points Display */}
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, { color: colors.text }]}>Points: {points}</Text>
        </View>

        {/* First Name Input */}
        <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Last Name Input */}
        <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Email Input */}
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={uploading || loading}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});