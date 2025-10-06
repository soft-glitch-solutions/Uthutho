import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import StopBlock from '../../components/stop/StopBlock';
import { Plus, Map, Share2 , MapPin, Clock, Users, Bookmark, BookmarkCheck, ArrowLeft, Navigation, CircleAlert as AlertCircle, Shield} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { formatTimeAgo } from '../../components/utils';

interface StopInfo {
  last_updated: string;
  avg_wait_time: string;
  busyness_level: number;
  safety_level: number;
  total_waiting: number;
  waiting_users: Array<{
    id: string;
    user_id: string;
    route_id: string;
    transport_type: string;
    created_at: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
    routes: {
      name: string;
      transport_type: string;
    };
  }>;
}

// Skeleton Loading Components
const SkeletonLoader = ({ colors }) => (
  <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <View style={[styles.skeleton, { width: 40, height: 40, borderRadius: 20 }]} />
      <View style={[styles.skeleton, { width: 40, height: 40, borderRadius: 20 }]} />
    </View>

    <View style={styles.content}>
      {/* Image Skeleton */}
      <View style={[styles.skeleton, { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 }]} />
      
      {/* Title Skeleton */}
      <View style={[styles.skeleton, { width: '70%', height: 24, marginBottom: 10 }]} />
      
      {/* Waiting Count Skeleton */}
      <View style={styles.waitingCountContainer}>
        <View style={[styles.skeleton, { width: 150, height: 32, borderRadius: 20 }]} />
        <View style={[styles.skeleton, { width: 44, height: 44, borderRadius: 5 }]} />
      </View>

      {/* Stop Information Card Skeleton */}
      <View style={styles.sectionI}>
        <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.skeletonInfoRow}>
              <View style={[styles.skeleton, { width: 16, height: 16, borderRadius: 8 }]} />
              <View style={[styles.skeleton, { width: 80, height: 14 }]} />
              <View style={[styles.skeleton, { width: 60, height: 14 }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Currently Waiting Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeleton, { width: 200, height: 18, marginBottom: 15 }]} />
        {[1, 2].map((item) => (
          <View key={item} style={[styles.skeleton, { width: '100%', height: 80, borderRadius: 12, marginBottom: 12 }]} />
        ))}
      </View>

      {/* Map Block Skeleton */}
      <View style={[styles.skeleton, { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 }]} />

      {/* Nearby Stops Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeleton, { width: 120, height: 18, marginBottom: 15 }]} />
        {[1, 2].map((item) => (
          <View key={item} style={[styles.skeleton, { width: '100%', height: 80, borderRadius: 8, marginBottom: 10 }]} />
        ))}
      </View>

      {/* Recent Activity Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeleton, { width: 150, height: 18, marginBottom: 15 }]} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeleton, { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 }]} />
        ))}
      </View>
    </View>
  </ScrollView>
);

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [stopDetails, setStopDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showAddPost, setShowAddPost] = useState(false);
  const [stopInfo, setStopInfo] = useState<StopInfo | null>(null);
  const router = useRouter();
  const [nearbyStops, setNearbyStops] = useState([]);

  useEffect(() => {
    if (stopId) {
      fetchStopDetails();
      loadStopInfo();
      fetchNearbyStops();
      
      // Set up real-time subscription for waiting users
      const subscription = supabase
        .channel('stop_waiting_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stop_waiting',
            filter: `stop_id=eq.${stopId}`
          },
          () => {
            loadStopInfo(); // Refresh waiting data when changes occur
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stopId]);

  const loadStopInfo = async () => {
    try {
      // Get current active waiting users (not expired)
      const { data: waitingData, error } = await supabase
        .from('stop_waiting')
        .select(`
          *,
          profiles:user_id (first_name, last_name, avatar_url),
          routes:route_id (name, transport_type)
        `)
        .eq('stop_id', stopId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const totalWaiting = waitingData?.length || 0;
      
      // Calculate busyness level based on actual waiting count
      let busynessLevel = 1;
      if (totalWaiting >= 10) busynessLevel = 5;
      else if (totalWaiting >= 7) busynessLevel = 4;
      else if (totalWaiting >= 4) busynessLevel = 3;
      else if (totalWaiting >= 2) busynessLevel = 2;
      else busynessLevel = 1;

      // Calculate average wait time based on how long people have been waiting
      let avgWaitTime = '5-10 minutes';
      if (waitingData && waitingData.length > 0) {
        const now = new Date();
        const waitTimes = waitingData.map(waiting => {
          const waitStart = new Date(waiting.created_at);
          const minutesWaited = Math.floor((now - waitStart) / (1000 * 60));
          return minutesWaited;
        });
        
        const avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
        const minWait = Math.max(5, Math.floor(avgWait));
        const maxWait = Math.max(10, Math.floor(avgWait) + 5);
        avgWaitTime = `${minWait}-${maxWait} minutes`;
      }

      setStopInfo({
        last_updated: 'Just now',
        avg_wait_time: avgWaitTime,
        busyness_level: busynessLevel,
        safety_level: 4, // You can keep this from stop_busy_times or calculate differently
        total_waiting: totalWaiting,
        waiting_users: waitingData || []
      });
    } catch (error) {
      console.error('Error loading stop info:', error);
      // Fallback to default values
      setStopInfo({
        last_updated: 'Unknown',
        avg_wait_time: '5-10 minutes',
        busyness_level: 1,
        safety_level: 4,
        total_waiting: 0,
        waiting_users: []
      });
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !stopDetails) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      let favorites = profile?.favorites || [];
      const favoriteItem = {
        id: stopDetails.id,
        name: stopDetails.name,
        type: 'stop' as const,
      };

      if (isFavorite) {
        favorites = favorites.filter((fav: any) => !(fav.id === stopDetails.id && fav.type === 'stop'));
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

  const fetchStopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*, stop_posts(*, profiles(*))')
        .eq('id', stopId)
        .single();

      if (error) throw error;

      const filteredPosts = data.stop_posts.filter((post) => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const timeDiff = now - postDate;
        return timeDiff < 24 * 60 * 60 * 1000;
      });

      setStopDetails({ ...data, stop_posts: filteredPosts });
    } catch (error) {
      console.error('Error fetching stop details:', error);
      Alert.alert('Error', 'Failed to fetch stop details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPost = async () => {
    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return;

      const { error } = await supabase
        .from('stop_posts')
        .insert({
          stop_id: stopId,
          user_id: userId,
          content: newPostContent,
        });

      if (error) throw error;
      Alert.alert('Success', 'Post added!');
      setNewPostContent('');
      setShowAddPost(false);
      fetchStopDetails();
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to add post');
    }
  };

  const handlePostPress = (postId) => {
    router.push(`/stop-post-details?postId=${postId}`);
  };

  const fetchNearbyStops = async () => {
    try {
      const { data, error } = await supabase
        .from('nearby_spots')
        .select('*')
        .eq('stop_id', stopId);
  
      if (error) throw error;
      setNearbyStops(data);
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
    }
  };

  const handleSharePost = async (postContent) => {
    try {
      await Sharing.shareAsync({
        message: postContent,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const renderWaitingUser = ({ item }) => (
    <View style={styles.waitingUser}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        <Text style={styles.waitingFor}>
          Waiting for {item.routes?.name || item.transport_type}
        </Text>
      </View>
      <Text style={styles.waitingTime}>
        {formatTimeAgo(item.created_at)}
      </Text>
    </View>
  );

  const openMap = () => {
    if (!stopDetails) return;
    const lat = stopDetails.latitude;
    const long = stopDetails.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url).catch((err) => console.error('Error opening map:', err));
  };

  // Show skeleton loader while loading
  if (isLoading) {
    return <SkeletonLoader colors={colors} />;
  }

  if (!stopDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Failed to load stop details.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          {isFavorite ? (
            <Bookmark size={24} color="#1ea2b1" fill="#1ea2b1" />
          ) : (
            <BookmarkCheck size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: stopDetails?.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={[styles.title, { color: colors.text }]}>{stopDetails.name}</Text>

        {/* Real-time Waiting Information */}
        <View style={styles.waitingCountContainer}>
          <View style={styles.waitingCountBadge}>
            <Users size={20} color="#1ea2b1" />
            <Text style={styles.waitingCountText}>
              {stopInfo?.total_waiting || 0} people waiting now
            </Text>
          </View>

          <TouchableOpacity
            onPress={openMap}
            style={[styles.mapButton, { backgroundColor: colors.primary }]}
          >
            <Map size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stop Information Card */}
        <View style={styles.sectionI}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#1ea2b1" />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{stopInfo?.last_updated || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Users size={16} color="#1ea2b1" />
              <Text style={styles.infoLabel}>Avg. Wait Time:</Text>
              <Text style={styles.infoValue}>{stopInfo?.avg_wait_time || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <AlertCircle size={16} color="#1ea2b1" />
              <Text style={styles.infoLabel}>Busyness Level:</Text>
              <View style={styles.busynessMeter}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.busynessDot,
                      level <= (stopInfo?.busyness_level || 0) ? styles.busynessDotActive : styles.busynessDotInactive
                    ]}
                  />
                ))}
                <Text style={styles.busynessText}>{stopInfo?.busyness_level || 0}/5</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Shield size={16} color="#1ea2b1" />
              <Text style={styles.infoLabel}>Safety Rating:</Text>
              <Text style={styles.infoValue}>{stopInfo?.safety_level || 0}/5</Text>
            </View>
          </View>
        </View>

        {/* Currently Waiting People */}
        {stopInfo?.waiting_users && stopInfo.waiting_users.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Currently Waiting ({stopInfo.waiting_users.length})
            </Text>
            <FlatList
              data={stopInfo.waiting_users}
              renderItem={renderWaitingUser}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        <StopBlock
          stopId={stopId}
          stopName={stopDetails.name}
          stopLocation={{ latitude: stopDetails.latitude, longitude: stopDetails.longitude }}
          colors={colors}
          radius={0.5}
        />

        {/* Nearby Stops */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Spots</Text>
          {nearbyStops.length > 0 ? (
            nearbyStops.map((stop) => (
              <View key={stop.id} style={[styles.nearbyStopContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.nearbyStopName, { color: colors.text }]}>{stop.name}</Text>
                {stop.description && (
                  <Text style={[styles.nearbyStopDescription, { color: colors.textSecondary }]}>
                    {stop.description}
                  </Text>
                )}
                {stop.distance_meters && (
                  <Text style={[styles.nearbyStopDistance, { color: colors.textSecondary }]}>
                    {stop.distance_meters} meters away
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noNearbyStopsContainer}>
              <Text style={[styles.noNearbyStopsText, { color: colors.text }]}>
                No nearby stops found.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setShowAddPost(!showAddPost)} style={styles.addPostButton}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showAddPost && (
            <View style={[styles.addPostContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Share what's happening at this stop..."
                placeholderTextColor={colors.textSecondary}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <TouchableOpacity
                style={[styles.postButton, { backgroundColor: colors.primary }]}
                onPress={handleAddPost}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {stopDetails.stop_posts.length > 0 ? (
            <FlatList
              data={stopDetails.stop_posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noPostsContainer}>
              <Text style={[styles.noPostsText, { color: colors.textSecondary }]}>
                No recent activity at this stop.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const renderPost = ({ item, colors }) => (
  <TouchableOpacity onPress={() => handlePostPress(item.id)} style={[styles.postContainer, { backgroundColor: colors.card }]}>
    <View style={styles.postHeader}>
      <Image
        source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.postHeaderText}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        {item.profiles.selected_title && (
          <Text style={[styles.selectedTitle, { color: colors.primary }]}>
            {item.profiles.selected_title}
          </Text>
        )}
        <Text style={[styles.postTime, { color: colors.textSecondary }]}>
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
    </View>
    <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
    <TouchableOpacity
      style={styles.shareButton}
      onPress={() => handleSharePost(item.content)}
    >
      <Share2 size={18} color={colors.primary} />
      <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  waitingCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waitingCountText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  mapButton: {
    padding: 10,
    borderRadius: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addPostButton: {
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  postButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Skeleton Loading Styles
  skeleton: {
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
  },
  skeletonCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  skeletonInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  
  // Existing styles
  sectionI: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  busynessMeter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busynessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  busynessDotActive: {
    backgroundColor: '#1ea2b1',
  },
  busynessDotInactive: {
    backgroundColor: '#333333',
  },
  busynessText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
  },
  waitingUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  waitingFor: {
    fontSize: 14,
    color: '#666666',
  },
  waitingTime: {
    fontSize: 14,
    color: '#1ea2b1',
  },
  // Add other existing styles as needed...
});