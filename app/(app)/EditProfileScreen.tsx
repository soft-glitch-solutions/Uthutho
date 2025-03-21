import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '@/hook/useProfile'; // Import the useProfile hook

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    uploadAvatar,
  } = useProfile(); // Use the useProfile hook

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false); // State for avatar upload loading

  // Ref for file input (web only)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when profile data changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(profile.email || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Handle saving profile changes
  const handleSave = async () => {
    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        avatar_url: avatarUrl,
      };

      await updateProfile(updates); // Use the updateProfile function from the hook
      alert('Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error.message);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Handle image picker for avatar upload (mobile)
  const handleImagePickerMobile = async () => {
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
        const publicUrl = await uploadAvatar(selectedImage); // Use the uploadAvatar function from the hook
        setAvatarUrl(publicUrl); // Update the avatar URL in state
      }
    } catch (error) {
      console.error('Error picking or uploading image:', error);
      alert('Failed to pick or upload image. Please try again.');
    } finally {
      setUploading(false); // Stop loading
    }
  };

  // Handle file input change for avatar upload (web)
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true); // Start loading

      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const publicUrl = await uploadAvatar(file); // Use the uploadAvatar function from the hook
      setAvatarUrl(publicUrl); // Update the avatar URL in state
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false); // Stop loading
    }
  };

  // Handle image picker (mobile) or file input (web)
  const handleImagePicker = () => {
    if (Platform.OS === 'web') {
      // Trigger file input click
      fileInputRef.current?.click();
    } else {
      handleImagePickerMobile();
    }
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileInputChange}
          />
        )}

        {/* Avatar Upload Section */}
        <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer} disabled={uploading}>
          {uploading ? (
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
          <Text style={[styles.pointsText, { color: colors.text }]}>Points: {profile?.points || 0}</Text>
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
          disabled={uploading}
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