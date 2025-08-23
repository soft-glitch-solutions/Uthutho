import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Route as RouteIcon, MapPin, Clock, DollarSign, Heart, HeartOff, ArrowLeft, Users, TrendingUp, Shield } from 'lucide-react-native';

interface RouteStats {
  avg_journey_time: string;
  peak_hours: string;
  service_frequency: string;
  reliability_score: number;
  safety_rating: number;
}

// Skeleton Loading Component
const RouteDetailsSkeleton = ({ colors }) => {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header Skeleton */}
        <View style={styles.skeletonHeader}>
          <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
        </View>

        {/* Route Header Skeleton */}
        <View style={styles.skeletonRouteHeader}>
          <View style={[styles.skeletonCircleLarge, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonTextLarge, { backgroundColor: colors.card }]} />
        </View>

        {/* Info Cards Skeleton */}
        <View style={styles.skeletonInfoCards}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.skeletonInfoCard, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonCircleSmall, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextSmall, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>

        {/* Route Statistics Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonStatsCard, { backgroundColor: colors.card }]}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.skeletonStatRow}>
                <View style={[styles.skeletonCircleTiny, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextStatLabel, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextStatValue, { backgroundColor: colors.border }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Points Container Skeleton */}
        <View style={styles.skeletonPointsContainer}>
          {[1, 2].map((item) => (
            <View key={item} style={[styles.skeletonPointColumn, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonTextLabel, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextValue, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>

        {/* Stops Section Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.card }]} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.skeletonStopItem, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonTextStopName, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextStopDetails, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>

        {/* Button Skeleton */}
        <View style={[styles.skeletonButton, { backgroundColor: colors.card }]} />

        {/* Price Requests Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.card }]} />
          {[1, 2].map((item) => (
            <View key={item} style={[styles.skeletonRequestItem, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonTextRequest, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextRequest, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextRequest, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default function RouteDetailsScreen() {
  const { routeId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeRequests, setPriceChangeRequests] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchRouteDetails();
    loadRouteStats();
    fetchPriceChangeRequests();
  }, [routeId]);

  const loadRouteStats = async () => {
    try {
      setRouteStats({
        avg_journey_time: `${30 + Math.floor(Math.random() * 30)}-${45 + Math.floor(Math.random() * 30)} min`,
        peak_hours: '7-9 AM, 5-7 PM',
        service_frequency: `Every ${10 + Math.floor(Math.random() * 15)}-${15 + Math.floor(Math.random() * 15)} min`,
        reliability_score: 3 + Math.floor(Math.random() * 2),
        safety_rating: 3 + Math.floor(Math.random() * 2),
      });
    } catch (error) {
      console.error('Error loading route stats:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !route) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      let favorites = profile?.favorites || [];
      const favoriteItem = {
        id: route.id,
        name: route.name,
        type: 'route' as const,
      };

      if (isFavorite) {
        favorites = favorites.filter((fav: any) => !(fav.id === route.id && fav.type === 'route'));
      } else {
        favorites = [...favorites, favoriteItem];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ favorites })
        .eq('id', user.id);

      if (!error) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const fetchRouteDetails = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;
      setRoute(routeData);

      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId);

      if (stopsError) throw stopsError;

      const stopsWithWaitingCount = await Promise.all(
        stopsData.map(async (stop) => {
          const { data: waitingData, error: waitingError } = await supabase
            .from('stop_waiting')
            .select('id')
            .eq('stop_id', stop.id)
            .gt('expires_at', new Date().toISOString());

          if (waitingError) throw waitingError;
          return { ...stop, waitingCount: waitingData.length };
        })
      );

      setStops(stopsWithWaitingCount);
    } catch (error) {
      console.error('Error fetching route details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('price_change_requests')
        .select('*, profiles(*)')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPriceChangeRequests(data);

      const hasPending = data.some((request) => request.status === 'pending');
      setHasPendingRequest(hasPending);
    } catch (error) {
      console.error('Error fetching price change requests:', error);
    }
  };

  const handlePriceChangeRequest = async () => {
    if (!newPrice || isNaN(Number(newPrice))) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Error', 'You must be logged in to submit a price change request.');
        return;
      }

      if (hasPendingRequest) {
        Alert.alert('Error', 'There is already a pending price change request for this route.');
        return;
      }

      const { error } = await supabase
        .from('price_change_requests')
        .insert([
          {
            route_id: routeId,
            user_id: user.id,
            current_price: route.cost,
            new_price: Number(newPrice),
            status: 'pending',
          },
        ]);

      if (error) throw error;

      Alert.alert('Success', 'Your price change request has been submitted.');
      setModalVisible(false);
      setNewPrice('');
      fetchPriceChangeRequests();
    } catch (error) {
      console.error('Error submitting price change request:', error);
      Alert.alert('Error', 'There was an error submitting your request.');
    }
  };

  const openPriceChangeModal = () => {
    if (hasPendingRequest) {
      Alert.alert('Info', 'There is already a pending price change request for this route.');
      return;
    }
    setModalVisible(true);
  };

  if (loading) {
    return <RouteDetailsSkeleton colors={colors} />;
  }

  if (!route) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Route not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            {isFavorite ? (
              <Heart size={24} color="#1ea2b1" fill="#1ea2b1" />
            ) : (
              <HeartOff size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Route Header */}
        <View style={styles.routeHeader}>
          <View style={styles.routeIcon}>
            <RouteIcon size={32} color="#1ea2b1" />
          </View>
          <Text style={styles.routeName}>{route.name}</Text>
        </View>

        {/* Route Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <DollarSign size={20} color="#1ea2b1" />
            <Text style={styles.infoLabel}>Fare</Text>
            <Text style={styles.infoValue}>R {route.cost}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <RouteIcon size={20} color="#1ea2b1" />
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{route.transport_type}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <MapPin size={20} color="#1ea2b1" />
            <Text style={styles.infoLabel}>Stops</Text>
            <Text style={styles.infoValue}>{stops.length}</Text>
          </View>
        </View>
        
        {/* Route Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Clock size={16} color="#1ea2b1" />
              <Text style={styles.statLabel}>Estimated Journey Time:</Text>
              <Text style={styles.statValue}>{routeStats?.avg_journey_time || '45-60 min'}</Text>
            </View>
            <View style={styles.statRow}>
              <Users size={16} color="#1ea2b1" />
              <Text style={styles.statLabel}>Peak Hours:</Text>
              <Text style={styles.statValue}>{routeStats?.peak_hours || '7-9 AM, 5-7 PM'}</Text>
            </View>
            <View style={styles.statRow}>
              <RouteIcon size={16} color="#1ea2b1" />
              <Text style={styles.statLabel}>Service Frequency:</Text>
              <Text style={styles.statValue}>{routeStats?.service_frequency || 'Every 15-20 min'}</Text>
            </View>
            <View style={styles.statRow}>
              <TrendingUp size={16} color="#1ea2b1" />
              <Text style={styles.statLabel}>Reliability Score:</Text>
              <Text style={styles.statValue}>{routeStats?.reliability_score || 4}/5</Text>
            </View>
            <View style={styles.statRow}>
              <Shield size={16} color="#1ea2b1" />
              <Text style={styles.statLabel}>Safety Rating:</Text>
              <Text style={styles.statValue}>{routeStats?.safety_rating || 4}/5</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          {/* Start and End Points in Two Columns */}
          <View style={styles.pointsContainer}>
            <Pressable
              style={styles.pointColumn}
              onPress={() => router.push(`/hub-details?hubId=${route.start_hub_id}`)}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Start Point</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {route.start_point}
              </Text>
            </Pressable>

            <Pressable
              style={styles.pointColumn}
              onPress={() => router.push(`/hub-details?hubId=${route.end_hub_id}`)}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>End Point</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {route.end_point}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stops Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Stops</Text>
        {stops.length > 0 ? (
          stops.map((stop) => (
            <Pressable
              key={stop.id}
              style={[styles.stopItem, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/stop-details?stopId=${stop.id}`)}>
              <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
              <Text style={[styles.stopDetails, { color: colors.text }]}>
                People Waiting: {stop.waitingCount}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.noStopsText, { color: colors.text }]}>
            No stops available for this route.
          </Text>
        )}

        {/* Price Change Button */}
        <Pressable
          style={[styles.priceChangeButton, { backgroundColor: colors.primary }]}
          onPress={openPriceChangeModal}>
          <Text style={styles.buttonText}>Report Price Change</Text>
        </Pressable>

        {/* Price Change Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Report Price Change
              </Text>
              <Text style={[styles.modalDescription, { color: colors.text }]}>
                Please only submit a price change that is factual. If any data is submitted
                maliciously, your account will be banned. If your price is correct with
                current data, you will be awarded 10 points on your profile.
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text }]}>
                Current Price: R{route.cost.toFixed(2)}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                placeholder="Enter new price"
                placeholderTextColor={colors.text}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handlePriceChangeRequest}>
                  <Text style={styles.buttonText}>Submit</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Price Change Requests Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Price Change Requests
        </Text>
        {priceChangeRequests.length > 0 ? (
          priceChangeRequests.map((request) => (
            <View
              key={request.id}
              style={[styles.requestItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.requestText, { color: colors.text }]}>
                Old Price: R{request.current_price.toFixed(2)}
              </Text>
              <Text style={[styles.requestText, { color: colors.text }]}>
                New Price: R{request.new_price.toFixed(2)}
              </Text>
              <Text style={[styles.requestText, { color: colors.text }]}>
                Status: {request.status}
              </Text>
              <Pressable onPress={() => router.push(`/social-profile?id=${request.profiles.id}`)}>
                <Text style={[styles.requestText, { color: colors.text }]}>
                  Requested by: {request.profiles.first_name} {request.profiles.last_name}
                </Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={[styles.noRequestsText, { color: colors.text }]}>
            No price change requests available.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  routeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  routeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoCards: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pointColumn: {
    flex: 1,
    marginRight: 8,
  },
  stopItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopDetails: {
    fontSize: 14,
  },
  noStopsText: {
    textAlign: 'center',
    fontSize: 16,
  },
  priceChangeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  requestItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 14,
  },
  noRequestsText: {
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Skeleton Styles
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonRouteHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  skeletonCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  skeletonTextLarge: {
    height: 28,
    width: '60%',
    borderRadius: 8,
  },
  skeletonInfoCards: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  skeletonInfoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  skeletonCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  skeletonTextSmall: {
    height: 12,
    width: '60%',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTextMedium: {
    height: 16,
    width: '40%',
    borderRadius: 4,
  },
  skeletonStatsCard: {
    borderRadius: 12,
    padding: 16,
  },
  skeletonStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonCircleTiny: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skeletonTextStatLabel: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    marginLeft: 8,
    flex: 1,
  },
  skeletonTextStatValue: {
    height: 14,
    width: '20%',
    borderRadius: 4,
  },
  skeletonPointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonPointColumn: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 8,
  },
  skeletonTextLabel: {
    height: 16,
    width: '40%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextValue: {
    height: 14,
    width: '80%',
    borderRadius: 4,
  },
  skeletonStopItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTextStopName: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextStopDetails: {
    height: 14,
    width: '50%',
    borderRadius: 4,
  },
  skeletonButton: {
    height: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonRequestItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTextRequest: {
    height: 14,
    width: '80%',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSectionTitle: {
    height: 20,
    width: '50%',
    borderRadius: 6,
    marginBottom: 16,
  },
});