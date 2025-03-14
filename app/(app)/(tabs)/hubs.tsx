import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { MapPin, PlusCircle, Heart } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

export default function HubsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [hubs, setHubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch hubs from Supabase
  const fetchHubs = async () => {
    try {
      const { data, error } = await supabase
        .from('hubs')
        .select('*')
        .order('name');

      if (error) throw error;
      setHubs(data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch the user's favorites
  const fetchFavorites = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserFavorites(profile.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchHubs();
    fetchFavorites();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHubs();
    await fetchFavorites();
  };

  // Add or remove a hub from favorites
  const handleFavorite = async (hubName) => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      let updatedFavorites;
      if (profile.favorites.includes(hubName)) {
        updatedFavorites = profile.favorites.filter((favorite) => favorite !== hubName);
        alert('Hub removed from favorites!');
      } else {
        updatedFavorites = [...profile.favorites, hubName];
        alert('Hub added to favorites!');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorites: updatedFavorites })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUserFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Filter hubs based on search query
  const filteredHubs = hubs.filter((hub) =>
    hub.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>Transport Hubs</Text>
        <TouchableOpacity
          onPress={() => router.push('/AddHub')}
          style={[styles.requestButton, { backgroundColor: colors.primary }]}
        >
          <PlusCircle size={20} color={colors.text} />
          <Text style={[styles.requestButtonText, { color: colors.text }]}>Request Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput
        style={[styles.searchBar, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Search hubs..."
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={[styles.hubCard, { backgroundColor: colors.card }]}>
              <View style={[styles.hubImage, { backgroundColor: colors.background }]} />
              <View style={styles.hubInfo}>
                <View style={[styles.skeletonText, { backgroundColor: colors.background }]} />
                <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '70%' }]} />
                <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '50%' }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredHubs.map((hub) => (
            <TouchableOpacity
              key={hub.id}
              style={[styles.hubCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/hub-details?hubId=${hub.id}`)}
            >
              <Image source={{ uri: hub.image }} style={styles.hubImage} />
              <View style={styles.hubInfo}>
                <Text style={[styles.hubName, { color: colors.text }]}>{hub.name}</Text>
                <View style={styles.addressContainer}>
                  <MapPin size={16} color={colors.text} />
                  <Text style={[styles.hubAddress, { color: colors.text }]}>{hub.address}</Text>
                </View>
                <View style={styles.services}>
                  <View style={[styles.serviceTag, { backgroundColor: colors.primary }]}>
                    <Text style={styles.serviceText}>{hub.transport_type}</Text>
                  </View>
                </View>
              </View>
              {/* Heart Icon */}
              <TouchableOpacity
                onPress={() => handleFavorite(hub.name)}
                style={styles.favoriteButton}
              >
                <Heart
                  size={20}
                  color={colors.primary}
                  fill={userFavorites.includes(hub.name) ? colors.primary : 'transparent'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  requestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
    },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchBar: {
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  grid: {
    gap: 20,
  },
  hubCard: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  hubImage: {
    width: '100%',
    height: 150,
  },
  hubInfo: {
    padding: 15,
  },
  hubName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 5,
    },
    hubAddress: {
      fontSize: 14,
      opacity: 0.8,
    },
    services: {
      flexDirection: 'row',
      gap: 8,
    },
    serviceTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    serviceText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
    },
    favoriteButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    skeletonText: {
      height: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
  });