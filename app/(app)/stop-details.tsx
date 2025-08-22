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
import { Plus, Map, Share2 , MapPin, Clock, Users, Heart, HeartOff, ArrowLeft, Navigation, CircleAlert as AlertCircle, Shield} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { formatTimeAgo } from '../../components/utils';


interface StopInfo {
  last_updated: string;
  avg_wait_time: string;
  busyness_level: number;
  safety_level: number;
}

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
    fetchStopDetails();
    loadStopInfo();
    fetchNearbyStops(); 
  }, [stopId]);

    const loadStopInfo = async () => {
    try {
      // Get current day and hour for busyness data
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hourOfDay = now.getHours();

      const { data: busyData, error } = await supabase
        .from('stop_busy_times')
        .select('*')
        .eq('stop_id', id)
        .eq('day_of_week', dayOfWeek)
        .eq('hour_of_day', hourOfDay)
        .single();

      if (!error && busyData) {
        setStopInfo({
          last_updated: '2 minutes ago',
          avg_wait_time: `${8 + Math.floor(Math.random() * 8)}-${12 + Math.floor(Math.random() * 8)} minutes`,
          busyness_level: busyData.busyness_level,
          safety_level: busyData.safety_level,
        });
      } else {
        // Default values if no data
        setStopInfo({
          last_updated: '5 minutes ago',
          avg_wait_time: '8-12 minutes',
          busyness_level: 3,
          safety_level: 4,
        });
      }
    } catch (error) {
      console.error('Error loading stop info:', error);
    }
  };

    const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !stop) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      let favorites = profile?.favorites || [];
      const favoriteItem = {
        id: stop.id,
        name: stop.name,
        type: 'stop' as const,
      };

      if (isFavorite) {
        favorites = favorites.filter((fav: any) => !(fav.id === stop.id && fav.type === 'stop'));
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
      Alert.alert('Error', 'Failed to fetch nearby stops.');
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

  const renderPost = ({ item }) => (
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

  const openMap = () => {
    if (!stopDetails) return;
    const lat = stopDetails.latitude;
    const long = stopDetails.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url).catch((err) => console.error('Error opening map:', err));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
            <Heart size={24} color="#1ea2b1" fill="#1ea2b1" />
          ) : (
            <HeartOff size={24} color="#ffffff" />
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

         {/* Recent Activity */}

        
        <View style={styles.waitingCountContainer}>
          <Text style={[styles.waitingCount, { color: colors.text }]}>
            People waiting: {stopDetails.stop_posts.length}
          </Text>

          <TouchableOpacity
            onPress={openMap}
            style={[styles.mapButton, { backgroundColor: colors.primary }]}
          >
            <Map size={24} color="white" />
          </TouchableOpacity>
        </View>

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
            <Text style={styles.infoValue}>{stopInfo?.busyness_level || 0}/5</Text>
          </View>
          <View style={styles.infoRow}>
            <Shield size={16} color="#1ea2b1" />
            <Text style={styles.infoLabel}>Safety Rating:</Text>
            <Text style={styles.infoValue}>{stopInfo?.safety_level || 0}/5</Text>
          </View>
        </View>
      </View>

        <StopBlock
          stopId={stopId}
          stopName={stopDetails.name}
          stopLocation={{ latitude: stopDetails.latitude, longitude: stopDetails.longitude }}
          colors={colors}
          radius={0.5}
        />

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


      </View>
    </ScrollView>
  );
}

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
    paddingTop: 60,
    paddingBottom: 20,
  },
  waitingCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nearbyStopContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nearbyStopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nearbyStopDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  nearbyStopDistance: {
    fontSize: 12,
    color: '#666',
  },
  noNearbyStopsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  noNearbyStopsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
    backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionI: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitleI: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
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
  bottomSpace: {
    height: 20,
  },
});