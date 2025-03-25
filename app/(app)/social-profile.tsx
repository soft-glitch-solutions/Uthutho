import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, Pressable, ScrollView, FlatList, Modal, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
);

export default function SocialProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const [stopTitles, setStopTitles] = useState<string[]>([]);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false); // State for avatar modal

  // Fetch stop titles
  useEffect(() => {
    const fetchStopTitles = async () => {
      try {
        const { data, error } = await supabase
          .from('stops')
          .select('name');

        if (error) throw error;

        const titles = data.map((stop) => stop.name);
        setStopTitles(titles);
      } catch (error) {
        console.error('Error fetching stop titles:', error);
      }
    };

    fetchStopTitles();
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, selected_title, favorites, points')
          .eq('id', id)
          .single();

        if (error) throw error;

        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error fetching profile', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const shareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${profile.first_name} ${profile.last_name}'s profile!`,
      });
    } catch (error) {
      Alert.alert('Error sharing profile', error.message);
    }
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>No profile found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Pressable onPress={() => setIsAvatarModalVisible(true)}>
          <Image 
            source={{ uri: profile.avatar_url }} 
            style={styles.profileAvatar} 
          />
        </Pressable>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile.first_name} {profile.last_name}</Text>
          {profile.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>{profile.selected_title}</Text>
          )}
          <Text style={[styles.pointsText, { color: colors.text }]}>TP: {profile.points || 0}</Text>
          <Pressable style={styles.shareButton} onPress={shareProfile}>
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </Pressable>
        </View>
      </View>

      {/* Favorites Section */}
      {profile.favorites && profile.favorites.length > 0 && (
        <View style={styles.favoritesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Supports the</Text>
          <FlatList
            data={profile.favorites.filter((favorite) => !stopTitles.includes(favorite))}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.hubCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.hubName, { color: colors.text }]}>{item}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Avatar Modal */}
      <Modal
        visible={isAvatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={styles.modalAvatar} 
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsAvatarModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedTitle: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  shareButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  favoritesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hubCard: {
    width: 120,
    height: 120,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  hubName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skeletonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  skeletonAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  skeletonText: {
    width: '80%',
    height: 20,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
    borderRadius: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalAvatar: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
});