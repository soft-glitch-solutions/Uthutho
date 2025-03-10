import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, Pressable, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Adjust the path
import { useTheme } from '../../context/ThemeContext'; // Import useTheme

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
  const { id } = useLocalSearchParams(); // Get the user ID from the route parameters
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme(); // Get theme colors

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, selected_title, favorites') // Ensure the ID and other fields are selected
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
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      <Text style={[styles.name, { color: colors.text }]}>{profile.first_name} {profile.last_name}</Text>
      {profile.selected_title && (
        <Text style={[styles.selectedTitle, { color: colors.primary }]}>{profile.selected_title}</Text>
      )}
      {/* Add more profile details as needed */}
      {profile.favorites && profile.favorites.length > 0 && (
        <View style={styles.favoritesContainer}>
          <Text style={[styles.favoritesTitle, { color: colors.text }]}>Supports the :</Text>
          {profile.favorites.map((favorite, index) => (
            <Text key={index} style={[styles.favoriteItem, { color: colors.text }]}>{favorite}</Text>
          ))}
        </View>
      )}
      <Pressable style={styles.shareButton} onPress={shareProfile}>
        <Text style={styles.shareButtonText}>Share Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    margin: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedTitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  favoritesContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  favoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favoriteItem: {
    fontSize: 14,
  },
  shareButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
});
