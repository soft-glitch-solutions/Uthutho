import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ProfileAvatarProps {
  url?: string | null;
  firstName?: string | null;
  onUpload: (file: any) => void;
}

const ProfileAvatar = ({ url, firstName, onUpload }: ProfileAvatarProps) => {
  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      onUpload(result.assets[0]);
    }
  };

  return (
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: url || 'https://via.placeholder.com/150' }}
        style={styles.avatar}
      />
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>Upload new avatar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadButton: {
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
});

export default ProfileAvatar;