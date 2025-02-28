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
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CheckCircle, PlusCircle, Heart, Search, X } from 'lucide-react-native'; // Icons
import { supabase } from '../../../lib/supabase'; // Adjust the path
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const TRANSPORT_TYPES = ['Bus 🚌', 'Train 🚂', 'Taxi 🚕'];
const WAITING_COLORS = {
  low: '#3b82f6', // Blue
  moderate: '#f97316', // Orange
  high: '#ef4444', // Red
};

export default function StopsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [newMessage, setNewMessage] = useState('');
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
    } catch (error) {
      console.error('Error fetching stops:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch the current user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
    };

    fetchSession();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchStops();
    getUserLocation();
    fetchFavorites();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStops();
  };

  // Filter stops based on search query
  const filteredStops = stops.filter((stop) =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to stop details
  const navigateToStopDetails = (stopId) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  // Mark as waiting
  const markAsWaiting = async (stopId, transportType) => {
    if (!userSession?.user?.id) return;

    try {
      const { error } = await supabase
        .from('stop_waiting')
        .insert({
          stop_id: stopId,
          user_id: userSession.user.id,
          transport_type: transportType,
        });

      if (error) throw error;
      alert('Marked as waiting!');
      fetchStops(); // Refresh stops
    } catch (error) {
      console.error('Error marking as waiting:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Remove waiting status
  const removeWaiting = async (stopId) => {
    if (!userSession?.user?.id) return;

    try {
      const { error } = await supabase
        .from('stop_waiting')
        .delete()
        .eq('stop_id', stopId)
        .eq('user_id', userSession.user.id);

      if (error) throw error;
      alert('Marked as picked up!');
      fetchStops(); // Refresh stops
    } catch (error) {
      console.error('Error marking as picked up:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Create a stop post
  const createStopPost = async (stopId, content) => {
    if (!userSession?.user?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('stop_posts')
        .insert({
          stop_id: stopId,
          user_id: userSession.user.id,
          content,
          transport_waiting_for: selectedTransport,
        });

      if (error) throw error;
      alert('Message posted successfully!');
      setNewMessage('');
      fetchStops(); // Refresh stops
    } catch (error) {
      console.error('Error posting message:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Get waiting color based on waiting count
  const getWaitingColor = (waitingCount) => {
    if (waitingCount <= 3) return WAITING_COLORS.low;
    if (waitingCount <= 7) return WAITING_COLORS.moderate;
    return WAITING_COLORS.high;
  };

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
  };

  const isCloseToStop = (stop) => {
    if (!userLocation) return false;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      stop.latitude,
      stop.longitude
    );
    return distance < 0.5; // 0.5 km threshold
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleMarkAsWaiting = async (stopId) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('stop_waiting')
        .insert({
          stop_id: stopId,
          user_id: session.user.id,
          transport_type: 'bus', // Example transport type
        });

      if (error) throw error;
      alert('Marked as waiting!');
      fetchStops(); // Refresh data
    } catch (error) {
      console.error('Error marking as waiting:', error);
      alert('Failed to mark as waiting');
    }
  };

  const fetchFavorites = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('stop_id')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setUserFavorites(data.map(fav => fav.stop_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (stopId) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      if (userFavorites.includes(stopId)) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('stop_id', stopId)
          .eq('user_id', session.user.id);

        if (error) throw error;
        setUserFavorites(userFavorites.filter(id => id !== stopId));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            stop_id: stopId,
            user_id: session.user.id,
          });

        if (error) throw error;
        setUserFavorites([...userFavorites, stopId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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
        <Text style={[styles.headerText, { color: colors.text }]}>Transport Stops</Text>
        <TouchableOpacity
          onPress={() => router.push('/AddStop')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <PlusCircle size={20} color={colors.text} />
          <Text style={[styles.addButtonText, { color: colors.text }]}>Add Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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

            // Check if the current user is waiting at this stop
            const isUserWaitingAtThisStop = stop.stop_waiting?.some(
              (w) => w.user_id === userSession?.user?.id
            );

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
                  <TouchableOpacity onPress={() => toggleFavorite(stop.id)}>
                    <Heart
                      size={20}
                      color={userFavorites.includes(stop.id) ? colors.primary : colors.text}
                      fill={userFavorites.includes(stop.id) ? colors.primary : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.routeName, { color: colors.text }]}>
                  Route: {stop.routes ? stop.routes.name : 'Unknown'}
                </Text>
                <View style={[styles.waitingBadge, { backgroundColor: waitingColor }]}>
                  <Text style={styles.waitingText}>{waitingCount} waiting</Text>
                </View>

                {/* "Got Picked Up" Button */}
                {isUserWaitingAtThisStop && (
                  <TouchableOpacity
                    style={styles.pickedUpButton}
                    onPress={() => removeWaiting(stop.id)}
                  >
                    <CheckCircle size={16} color={colors.text} />
                    <Text style={[styles.pickedUpText, { color: colors.text }]}>Got Picked Up</Text>
                  </TouchableOpacity>
                )}

                {/* Transport Types */}
                <View style={styles.transportTypes}>
                  {(Array.isArray(stop.transport_types) ? stop.transport_types : []).filter(type => TRANSPORT_TYPES.includes(type)).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.transportButton, { borderColor: colors.primary }]}
                      onPress={() => markAsWaiting(stop.id, type)}
                    >
                      <Text style={[styles.transportText, { color: colors.text }]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isCloseToStop(stop) && (
                  <TouchableOpacity
                    style={[styles.waitingButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleMarkAsWaiting(stop.id)}
                  >
                    <Text style={styles.waitingButtonText}>I'm Waiting</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Stop Details Modal */}
      {selectedStop && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Stop Details</Text>
            {/* Add stop details and chat UI here */}
          </View>
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
    marginBottom: 10,
  },
  waitingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  waitingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  pickedUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  pickedUpText: {
    fontSize: 14,
  },
  transportTypes: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  transportButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  transportText: {
    fontSize: 12,
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  waitingButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  waitingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});