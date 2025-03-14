import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { Settings, LogOut, CreditCard, Bell, Captions, Edit } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';


export default function ProfileScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedTab, setSelectedTab] = useState('basic-info');

  // Fetch profile and titles
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.session) {
          throw new Error('No user session found. Please log in.');
        }

        const userId = session.session.user.id;

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          throw new Error('Failed to fetch profile data.');
        }

        setProfile(profileData);
        setSelectedTitle(profileData.title || '');

        // Fetch titles data
        const { data: titlesData, error: titlesError } = await supabase
          .from('titles')
          .select('*')
          .order('points_required', { ascending: true });

        if (titlesError) {
          throw new Error('Failed to fetch titles.');
        }

        setTitles(titlesData || []);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
        if (error.message.includes('No user session found')) {
          router.replace('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    try {
      setLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updates = {
        ...profile,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) throw updateError;

      setProfile(updates);
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // Handle title selection
  const handleTitleChange = async (itemValue) => {
    setSelectedTitle(itemValue);
    try {
      const updates = {
        ...profile,
        title: itemValue,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) throw updateError;

      setProfile(updates);
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  // Menu items
  const menuItems = [
    {
      icon: <Edit size={24} color={colors.text} />,
      title: 'Edit Profile',
      subtitle: 'Update your profile details',
    },
    {
      icon: <Captions size={24} color={colors.text} />,
      title: 'Request',
      subtitle: 'The request you submited',
    },
    {
      icon: <Settings size={24} color={colors.text} />,
      title: 'Settings',
      subtitle: 'App settings and preferences',
    },

  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Filter titles based on points
  const unlockedTitles = titles.filter(title => title.points_required <= profile.points);
  const lockedTitles = titles.filter(title => title.points_required > profile.points);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Image
          source={{ uri: profile.avatar_url || 'https://static.vecteezy.com/system/resources/thumbnails/005/129/844/small_2x/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg' }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: colors.text }]}>{profile.first_name} {profile.last_name}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{profile.selected_title}</Text>
        <Text style={[styles.email, { color: colors.text }]}>{profile.email}</Text>
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
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => {
                if (item.title === 'Settings') {
                  router.push('/settings'); // Navigate to the EditProfileScreen
                }
                if (item.title === 'Edit Profile') {
                  router.push('/EditProfileScreen'); // Navigate to the EditProfileScreen
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
          <Text style={[styles.title, { color: colors.text }]}>Your Rank : { profile.selected_title }</Text>
          <Text style={[styles.title, { color: colors.text }]}>Select Your Title</Text>
          <Picker
            selectedValue={selectedTitle || ''}
            onValueChange={handleTitleChange}
            style={{ height: 50, width: '100%', color: colors.text }}
          >
            {unlockedTitles.map((title) => (
              <Picker.Item key={title.id} label={title.title} value={title.title} />
            ))}
          </Picker>
          <Text style={[styles.title, { color: colors.text }]}>Locked Titles</Text>
          {lockedTitles.map((title) => (
            <Text key={title.id} style={[styles.lockedTitle, { color: colors.text }]}>
              {title.title} (Requires {title.points_required} points)
            </Text>
          ))}
        </View>
      )}

      {selectedTab === 'achievements' && (
        <View style={styles.achievementsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.achievementText, { color: colors.text }]}>
            Coming soon!
          </Text>
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
  gamificationContainer: {
    padding: 20,
    gap: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  points: {
    fontSize: 16,
    marginBottom: 20,
  },
  titleItem: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
  },
  unlockedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lockedText: {
    fontSize: 14,
    opacity: 0.8,
  },
  achievementsContainer: {
    padding: 20,
  },
  achievementText: {
    fontSize: 16,
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
  lockedTitle: {
    fontSize: 14,
    color: 'gray',
    marginVertical: 4,
  },
});