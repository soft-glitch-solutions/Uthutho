import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { router } from 'expo-router';
import { Settings, LogOut, Camera, Captions, Edit, Badge } from 'lucide-react-native';
import { useProfile } from '@/hook/useProfile';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const {
    loading,
    profile,
    titles,
    handleSelectTitle,
    handleSignOut,
    uploadAvatar,
    uploading,
  } = useProfile();

  const [selectedTab, setSelectedTab] = useState('basic-info');
  const [selectedTitle, setSelectedTitle] = useState(profile?.selected_title || '');

  // Ref for file input (web only)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file input change for web
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const publicUrl = await uploadAvatar(file); // Use the uploadAvatar function from the hook
      console.log('Avatar uploaded successfully:', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Handle image picker (mobile) or file input (web)
  const handleImagePicker = () => {
    if (Platform.OS === 'web') {
      // Trigger file input click
      fileInputRef.current?.click();
    } else {
      // Mobile: Use expo-image-picker
      handleImagePickerMobile();
    }
  };

  // Handle image picker for mobile
  const handleImagePickerMobile = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        const publicUrl = await uploadAvatar(selectedImage); // Use the uploadAvatar function from the hook
        console.log('Avatar uploaded successfully:', publicUrl);
      }
    } catch (error) {
      console.error('Error picking or uploading image:', error);
      alert('Failed to pick or upload image. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unlockedTitles = titles.filter((title) => profile?.titles?.includes(title.title));
  const lockedTitles = titles.filter((title) => !profile?.titles?.includes(title.title));

  const basicMenuItems = [
    {
      icon: <Edit size={24} color={colors.text} />,
      title: 'Edit Profile',
      subtitle: 'Update your profile details',
    },
    {
      icon: <Captions size={24} color={colors.text} />,
      title: 'Request',
      subtitle: 'The request you submitted',
    },
    {
      icon: <Settings size={24} color={colors.text} />,
      title: 'Settings',
      subtitle: 'App settings and preferences',
    },
  ];

  const rankMenuItems = [
    {
      icon: <Badge size={24} color={colors.text} />,
      title: 'Change Title',
      subtitle: 'Change your profile title',
    },
    {
      icon: <Edit size={24} color={colors.text} />,
      title: 'Title To Earn',
      subtitle: 'Look at what title to earn',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleImagePicker}
          disabled={uploading}
        >
          <Image
            source={{
              uri: profile?.avatar_url ||
                'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
            }}
            style={styles.avatar}
          />
          <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
            <Camera size={16} color="white" />
          </View>
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="white" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>{profile?.selected_title}</Text>
        <Text style={[styles.email, { color: colors.text }]}>{profile?.email}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'basic-info' && styles.activeTab]}
          onPress={() => setSelectedTab('basic-info')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>Basic Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'gamification' && styles.activeTab]}
          onPress={() => setSelectedTab('gamification')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>Rank</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>Awards</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'basic-info' && (
        <View style={styles.menuContainer}>
          {basicMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                if (item.title === 'Settings') {
                  router.push('/settings');
                }
                if (item.title === 'Request') {
                  router.push('/request');
                }
                if (item.title === 'Edit Profile') {
                  router.push('/EditProfileScreen');
                }
              }}
            >
              {item.icon}
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.text }]}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedTab === 'gamification' && (
        <View style={styles.menuContainer}>
          {rankMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                if (item.title === 'Change Title') {
                  router.push('/changetitle');
                }
                if (item.title === 'Title To Earn') {
                  router.push('/titleearn');
                }
                if (item.title === 'Edit Profile') {
                  router.push('/EditProfileScreen');
                }
              }}
            >
              {item.icon}
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.text }]}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: colors.primary }]}
        onPress={handleSignOut}
      >
        <LogOut size={24} color="white" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1ea2b1',
  },
  email: {
    fontSize: 16,
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  tab: {
    padding: 10,
    borderRadius: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    padding: 20,
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    gap: 10,
    marginTop: 20,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});