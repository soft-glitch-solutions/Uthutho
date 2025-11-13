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
import { Route as RouteIcon, MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, ArrowLeft, Users, TrendingUp, Shield, Trophy } from 'lucide-react-native';
import { useAuth } from '@/hook/useAuth';
import { useFavorites } from '@/hook/useFavorites';

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
  const { user } = useAuth();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeRequests, setPriceChangeRequests] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRouteDetails();
    loadRouteStats();
    fetchPriceChangeRequests();
    loadFollowerCount();
    populateFollowerCounts();
  }, [routeId]);

  // Add this useEffect to check favorite status when route data or favorites change
  useEffect(() => {
    if (route && routeId) {
      checkIfFollowing();
    }
  }, [route, routeId, favorites]);

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

  const loadFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'route')
        .eq('entity_id', routeId);

      if (!error) {
        setFollowerCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const populateFollowerCounts = async () => {
    try {
      const newMap: Record<string, number> = {};
      
      // Get follower counts for this route
      const { data } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', 'route')
        .eq('entity_id', routeId);

      (data || []).forEach(f => { 
        newMap[f.entity_id] = (newMap[f.entity_id] || 0) + 1; 
      });

      setFavoritesCountMap(prev => ({ ...prev, ...newMap }));
    } catch (error) {
      console.error('Error populating follower counts:', error);
    }
  };

  const checkIfFollowing = async () => {
    try {
      if (!user || !routeId) return;

      // Use the useFavorites hook to check if it's already in favorites
      const isRouteFavorite = isFavorite(routeId as string);
      setIsFollowing(isRouteFavorite);

      // Also check the database directly as a fallback
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'route')
        .eq('entity_id', routeId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking follow status:', error);
        return;
      }

      // If database check differs from hook, update both
      const isInDatabase = !!data;
      if (isInDatabase !== isRouteFavorite) {
        setIsFollowing(isInDatabase);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    try {
      if (!user || !route) {
        Alert.alert('Login Required', 'Please login to follow routes.');
        return;
      }

      const entityType = 'route';
      const entityId = route.id;
      const isCurrentlyFollowing = isFollowing;
      const delta = isCurrentlyFollowing ? -1 : 1;

      // Optimistic UI update
      setIsFollowing(!isCurrentlyFollowing);
      setFollowerCount(prev => Math.max(0, prev + delta));
      setFavoritesCountMap(prev => ({ 
        ...prev, 
        [entityId]: Math.max(0, (prev[entityId] || 0) + delta) 
      }));

      try {
        if (isCurrentlyFollowing) {
          // Remove from favorites/followers
          const { error: favErr } = await supabase.rpc('remove_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          const { error: bumpErr } = await supabase.rpc('bump_favorites_count', {
            p_user_id: user.id,
            p_delta: -1,
          });
          if (bumpErr) console.warn('bump_favorites_count failed:', bumpErr);

          // Remove from local favorites state
          await removeFromFavorites(entityId);
        } else {
          // Add to favorites/followers
          const { error: favErr } = await supabase.rpc('add_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          const { error: bumpErr } = await supabase.rpc('bump_favorites_count', {
            p_user_id: user.id,
            p_delta: 1,
          });
          if (bumpErr) console.warn('bump_favorites_count failed:', bumpErr);

          // Add to local favorites state
          await addToFavorites({ 
            id: entityId, 
            type: entityType, 
            name: route.name, 
            data: route 
          });
        }
      } catch (e) {
        // Revert optimistic change on error
        setIsFollowing(isCurrentlyFollowing);
        setFollowerCount(prev => Math.max(0, prev - delta));
        setFavoritesCountMap(prev => ({ 
          ...prev, 
          [entityId]: Math.max(0, (prev[entityId] || 0) - delta) 
        }));
        console.error('Follow toggle failed:', e);
        Alert.alert('Error', 'Could not update follow status. Please try again.');
      }
    } catch (error) {
      console.error('Error in toggleFollow:', error);
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

      // Get stops through route_stops table instead of directly from stops
      const { data: routeStopsData, error: routeStopsError } = await supabase
        .from('route_stops')
        .select(`
          order_number,
          stops (
            id,
            name,
            latitude,
            longitude,
            route_id
          )
        `)
        .eq('route_id', routeId)
        .order('order_number', { ascending: true });

      if (routeStopsError) throw routeStopsError;

      // Process stops with waiting counts
      const stopsWithWaitingCount = await Promise.all(
        (routeStopsData || []).map(async (routeStop) => {
          const stop = routeStop.stops;
          const { data: waitingData, error: waitingError } = await supabase
            .from('stop_waiting')
            .select('id')
            .eq('stop_id', stop.id)
            .gt('expires_at', new Date().toISOString());

          if (waitingError) throw waitingError;
          return { 
            ...stop, 
            waitingCount: waitingData.length,
            order_number: routeStop.order_number 
          };
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

  const navigateToLeaderboard = () => {
    if (!route) return;
    router.push(`/FilteredLeaderboard?entityId=${route.id}&entityType=route&name=${encodeURIComponent(route.name)}`);
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
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFollow}>
            {isFollowing ? (
              <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
            ) : (
              <Bookmark size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Route Header */}
        <View style={styles.routeHeader}>
          <View style={styles.routeIcon}>
            <RouteIcon size={32} color="#1ea2b1" />
          </View>
          <Text style={styles.routeName}>{route.name}</Text>
          
          {/* Follower Count */}
          <View style={styles.followerContainer}>
            <Users size={16} color="#1ea2b1" />
            <Text style={styles.followerText}>
              {favoritesCountMap[route.id] || followerCount} {favoritesCountMap[route.id] === 1 ? 'follower' : 'followers'}
            </Text>
          </View>
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

        {/* Leaderboard Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.leaderboardButton, { backgroundColor: '#1ea2b1' }]}
            onPress={navigateToLeaderboard}
          >
            <Trophy size={20} color="#ffffff" />
            <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
          </TouchableOpacity>
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
              style={styles.pointColumn}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Start Point</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {route.start_point}
              </Text>
            </Pressable>

            <Pressable
              style={styles.pointColumn}>
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
              <View style={styles.stopHeader}>
                <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
                <Text style={[styles.stopOrder, { color: '#1ea2b1' }]}>
                  Stop #{stop.order_number}
                </Text>
              </View>
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
        {!hasPendingRequest && (
          <Pressable
            style={[styles.priceChangeButton, { backgroundColor: colors.primary }]}
            onPress={openPriceChangeModal}>
            <Text style={styles.buttonText}>Report Price Change</Text>
          </Pressable>
        )}
        
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
              <Pressable onPress={() => router.push(`/user/${request.profiles.id}`)}>
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
    paddingTop: 60,
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
  // Follower styles
  followerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  followerText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  stopOrder: {
    fontSize: 14,
    fontWeight: '600',
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
  // Leaderboard button styles
  leaderboardButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  leaderboardButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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