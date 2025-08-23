import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { PlusCircle, Heart, Search, X, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import StopBlock from '../../../components/stop/StopBlock';

const TRANSPORT_TYPES = ['Bus 🚌', 'Train 🚂', 'Taxi 🚕'];
const WAITING_COLORS = {
  low: '#3b82f6',
  moderate: '#f97316',
  high: '#ef4444',
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * 
    Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function StopsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [sortedStops, setSortedStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSession, setUserSession] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);

  // Fetch stops from Supabase
  const fetchStops = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*, routes(name)')
        .order('name');

      if (error) throw error;
      setStops(data);
      return data;
    } catch (error) {
      console.error('Error fetching stops:', error);
      return [];
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Sort stops by distance from user
  const sortStopsByDistance = (stopsList) => {
    if (!userLocation || !stopsList) return stopsList;
    
    return [...stopsList].sort((a, b) => {
      const distanceA = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.latitude,
        a.longitude
      );
      const distanceB = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.latitude,
        b.longitude
      );
      return distanceA - distanceB;
    });
  };

  // Fetch the current user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
    };
    fetchSession();
  }, []);

  // Get user location and fetch data
  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for nearby stops');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      
      // Fetch stops after getting location
      const stopsData = await fetchStops();
      const sorted = sortStopsByDistance(stopsData);
      setSortedStops(sorted);
      fetchFavorites();
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    getUserLocation();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    const stopsData = await fetchStops();
    const sorted = sortStopsByDistance(stopsData);
    setSortedStops(sorted);
    fetchFavorites();
  };

  // Filter stops based on search query
  const filteredStops = sortedStops.filter((stop) =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Add or remove a stop from favorites
  const handleFavorite = async (stopName) => {
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
      if (profile.favorites.includes(stopName)) {
        updatedFavorites = profile.favorites.filter((favorite) => favorite !== stopName);
      } else {
        updatedFavorites = [...profile.favorites, stopName];
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorites: updatedFavorites })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUserFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  // Get waiting color based on waiting count
  const getWaitingColor = (waitingCount) => {
    if (waitingCount <= 3) return WAITING_COLORS.low;
    if (waitingCount <= 7) return WAITING_COLORS.moderate;
    return WAITING_COLORS.high;
  };

  // Navigate to stop details
  const navigateToStopDetails = (stopId) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  // Display distance in a user-friendly format
  const displayDistance = (stop) => {
    if (!userLocation || !stop.latitude || !stop.longitude) return '';
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      stop.latitude,
      stop.longitude
    );
    
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

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
        <Text style={[styles.headerText, { color: colors.text }]}>Nearby Stops</Text>
        <TouchableOpacity
          onPress={() => router.push('/AddStop')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <PlusCircle size={20} color={colors.text} />
          <Text style={[styles.addButtonText, { color: colors.text }]}>Add Stop</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.subtitle}>Mark yourself as waiting to help others</Text>
      </View>

      <View style={[styles.searchBarContainer, { borderColor: colors.border }]}>
        <Search size={20} color={colors.text} />
        <TextInput
          style={[styles.searchBar, { color: colors.text }]}
          placeholder="Search stops..."
          placeholderTextColor={colors.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <AlertCircle size={20} color="#1ea2b1" />
        <Text style={styles.infoText}>
          Help other travelers by marking when you're waiting at a stop. This creates real-time crowding information for the community.
        </Text>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={[styles.stopCard, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonText, { backgroundColor: colors.background }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '70%' }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '50%' }]} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredStops.map((stop) => {
            const waitingCount = stop.stop_waiting?.length || 0;
            const waitingColor = getWaitingColor(waitingCount);
            const distanceText = displayDistance(stop);

            return (
              <TouchableOpacity
                key={stop.id}
                style={[styles.stopCard, { backgroundColor: colors.card }]}
                onPress={() => navigateToStopDetails(stop.id)}
              >
                <Image
                  source={{ uri: stop.image_url || 'https://via.placeholder.com/150' }}
                  style={styles.stopImage}
                />
                <View style={styles.stopHeader}>
                  <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleFavorite(stop.name);
                    }}
                  >
                    <Heart
                      size={20}
                      color={userFavorites.includes(stop.name) ? colors.primary : colors.text}
                      fill={userFavorites.includes(stop.name) ? colors.primary : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.routeName, { color: colors.text }]}>
                  Route: {stop.routes ? stop.routes.name : 'Unknown'}
                </Text>
                
                {distanceText && (
                  <Text style={[styles.distanceText, { color: colors.primary }]}>
                    {distanceText}
                  </Text>
                )}
                
                <View style={[styles.waitingBadge, { backgroundColor: waitingColor }]}>
                  <Text style={styles.waitingText}>{waitingCount} waiting</Text>
                </View>

                <StopBlock
                  stopId={stop.id}
                  stopName={stop.name}
                  stopLocation={{ latitude: stop.latitude, longitude: stop.longitude }}
                  colors={colors}
                />
              </TouchableOpacity>
            );
          })}
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
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1ea2b150',
  },
  infoText: {
    flex: 1,
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchBar: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  grid: {
    gap: 20,
  },
  stopCard: {
    borderRadius: 15,
    overflow: 'hidden',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stopImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stopName: {
    fontSize: 18,
    fontWeight: '600',
  },
  routeName: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  distanceText: {
    fontSize: 13,
    marginBottom: 5,
    fontWeight: '500',
  },
  waitingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  waitingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
});