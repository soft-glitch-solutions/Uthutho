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
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CheckCircle, PlusCircle } from 'lucide-react-native'; // Icons
import { supabase } from '../../../lib/supabase'; // Adjust the path
import { useNavigation } from '@react-navigation/native';

const TRANSPORT_TYPES = ['Bus 🚌', 'Train 🚂', 'Taxi 🚕'];
const WAITING_COLORS = {
  low: '#3b82f6', // Blue
  moderate: '#f97316', // Orange
  high: '#ef4444', // Red
};

export default function StopsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [userSession, setUserSession] = useState(null);

  // Fetch stops from Supabase
  const fetchStops = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
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
          onPress={() => navigation.navigate('StopRequest')}
          style={styles.requestButton}
        >
          <PlusCircle size={20} color={colors.text} />
          <Text style={[styles.requestButtonText, { color: colors.text }]}>Request Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput
        style={[styles.searchBar, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Search stops..."
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
                onPress={() => setSelectedStop(stop)}
              >
                <View style={styles.stopHeader}>
                  <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
                  <View style={[styles.waitingBadge, { backgroundColor: waitingColor }]}>
                    <Text style={styles.waitingText}>{waitingCount} waiting</Text>
                  </View>
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
                  {TRANSPORT_TYPES.map((type) => {
                    const typeWaiting = stop.stop_waiting?.filter(
                      (w) => w.transport_type === type
                    ).length || 0;

                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.transportButton, { borderColor: colors.primary }]}
                        onPress={() => markAsWaiting(stop.id, type)}
                      >
                        <Text style={[styles.transportText, { color: colors.text }]}>
                          {type} ({typeWaiting})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  stopCard: {
    borderRadius: 15,
    padding: 15,
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
  waitingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
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
});