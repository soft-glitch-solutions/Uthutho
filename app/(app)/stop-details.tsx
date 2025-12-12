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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import StopBlock from '../../components/stop/StopBlock';
import { 
  Plus, 
  Map, 
  Share2, 
  Clock, 
  Users, 
  Bookmark, 
  BookmarkCheck, 
  ArrowLeft, 
  Navigation, 
  CircleAlert as AlertCircle, 
  Shield,
  MessageSquare,
  Trophy,
  Route as RouteIcon,
  Calendar
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { formatTimeAgo } from '../../components/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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

interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
  created_at: string;
  updated_at: string;
  order_number?: number;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    selected_title?: string;
  };
}

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

// Skeleton Loading Component
const SkeletonLoader = ({ colors, isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
  
  if (desktopMode) {
    return (
      <View style={[styles.container, styles.containerDesktop, { backgroundColor: colors.background }]}>
        <View style={styles.desktopWrapper}>
          {/* Left Column - Stop Info */}
          <View style={styles.desktopLeftColumn}>
            {/* Header Skeleton */}
            <View style={styles.headerDesktop}>
              <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
            </View>

            {/* Stop Image Skeleton */}
            <View style={[styles.skeletonImage, { backgroundColor: colors.card }]} />

            {/* Stop Info Skeleton */}
            <View style={styles.skeletonInfoSection}>
              <View style={[styles.skeletonTextLarge, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonTextMedium, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonTextMedium, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonBadge, { backgroundColor: colors.card }]} />
            </View>

            {/* Action Buttons Skeleton */}
            <View style={styles.skeletonActionButtons}>
              <View style={[styles.skeletonButton, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonButton, { backgroundColor: colors.card }]} />
            </View>

            {/* Leaderboard Button Skeleton */}
            <View style={[styles.skeletonButton, { backgroundColor: colors.card }]} />

            {/* Stop Information Card Skeleton */}
            <View style={styles.skeletonSection}>
              <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={styles.skeletonInfoRow}>
                    <View style={[styles.skeletonCircleSmall, { backgroundColor: colors.border }]} />
                    <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
                    <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column - Content */}
          <View style={styles.desktopRightColumn}>
            {/* Tab Selectors Skeleton */}
            <View style={styles.skeletonTabContainer}>
              <View style={[styles.skeletonTab, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonTab, { backgroundColor: colors.card }]} />
            </View>

            {/* Tab Content Skeleton */}
            <View style={styles.skeletonTabContent}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={[styles.skeletonPost, { backgroundColor: colors.card }]}>
                  <View style={styles.skeletonPostHeader}>
                    <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
                    <View>
                      <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonTextSmall, { backgroundColor: colors.border }]} />
                    </View>
                  </View>
                  <View style={[styles.skeletonTextLarge, { backgroundColor: colors.border }]} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile skeleton
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
        <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
      </View>
      <View style={styles.content}>
        <View style={[styles.skeletonImage, { backgroundColor: colors.card }]} />
        <View style={[styles.skeletonTextLarge, { backgroundColor: colors.card }]} />
        <View style={styles.waitingCountContainer}>
          <View style={[styles.skeletonBadge, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonCircle, { backgroundColor: colors.card }]} />
        </View>
        <View style={styles.section}>
          <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.skeletonInfoRow}>
                <View style={[styles.skeletonCircleSmall, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  
  const [stopDetails, setStopDetails] = useState<Stop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showAddPost, setShowAddPost] = useState(false);
  const [stopInfo, setStopInfo] = useState<StopInfo | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'activity' | 'routes'>('activity');

  // Filter posts to only show from this week
  const getThisWeeksPosts = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return posts.filter(post => new Date(post.created_at) >= oneWeekAgo);
  };

  const thisWeeksPosts = getThisWeeksPosts();

  useEffect(() => {
    if (stopId) {
      fetchStopDetails();
      loadStopInfo();
      loadStopRoutes();
      loadStopPosts();
      loadFollowerCount();
      checkIfFavorite();
      
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
            loadStopInfo();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stopId]);

  const checkIfFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      if (profile?.favorites) {
        const isStopFavorite = profile.favorites.some(
          (fav: any) => fav.id === stopId && fav.type === 'stop'
        );
        setIsFavorite(isStopFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const loadStopInfo = async () => {
    try {
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
      
      let busynessLevel = 1;
      if (totalWaiting >= 10) busynessLevel = 5;
      else if (totalWaiting >= 7) busynessLevel = 4;
      else if (totalWaiting >= 4) busynessLevel = 3;
      else if (totalWaiting >= 2) busynessLevel = 2;
      else busynessLevel = 1;

      let avgWaitTime = '5-10 minutes';
      if (waitingData && waitingData.length > 0) {
        const now = new Date();
        const waitTimes = waitingData.map(waiting => {
          const waitStart = new Date(waiting.created_at);
          return Math.floor((now - waitStart) / (1000 * 60));
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
        safety_level: 4,
        total_waiting: totalWaiting,
        waiting_users: waitingData || []
      });
    } catch (error) {
      console.error('Error loading stop info:', error);
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

  const loadStopRoutes = async () => {
    try {
      const { data: routeStops, error: routeStopsError } = await supabase
        .from('route_stops')
        .select(`
          route_id,
          order_number,
          routes (
            id,
            name,
            transport_type,
            cost,
            start_point,
            end_point,
            created_at,
            updated_at
          )
        `)
        .eq('stop_id', stopId)
        .order('order_number', { ascending: true });

      if (routeStopsError) throw routeStopsError;

      const formattedRoutes: Route[] = (routeStops || []).map(routeStop => ({
        ...routeStop.routes,
        order_number: routeStop.order_number
      }));

      setRoutes(formattedRoutes);
    } catch (error) {
      console.error('Error loading stop routes:', error);
      setRoutes([]);
    }
  };

  const loadStopPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('stop_posts')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url, selected_title)
        `)
        .eq('stop_id', stopId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading stop posts:', error);
    }
  };

  const loadFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'stop')
        .eq('entity_id', stopId);

      if (!error) {
        setFollowerCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const fetchStopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .eq('id', stopId)
        .single();

      if (error) throw error;
      setStopDetails(data);
    } catch (error) {
      console.error('Error fetching stop details:', error);
      Alert.alert('Error', 'Failed to fetch stop details.');
    } finally {
      setIsLoading(false);
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
        setFollowerCount(prev => isFavorite ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const openInMaps = () => {
    if (!stopDetails) return;
    const lat = stopDetails.latitude;
    const long = stopDetails.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url).catch((err) => console.error('Error opening map:', err));
  };

  const navigateToRoute = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
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
      loadStopPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to add post');
    }
  };

  const renderWaitingUser = ({ item }) => (
    <View style={[styles.waitingUser, isDesktop && styles.waitingUserDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.userInfo, isDesktop && styles.userInfoDesktop]}>
        <Text style={[styles.userName, isDesktop && styles.userNameDesktop, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        <Text style={[styles.waitingFor, isDesktop && styles.waitingForDesktop, { color: colors.text }]}>
          Waiting for {item.routes?.name || item.transport_type}
        </Text>
      </View>
      <Text style={[styles.waitingTime, isDesktop && styles.waitingTimeDesktop, { color: colors.primary }]}>
        {formatTimeAgo(item.created_at)}
      </Text>
    </View>
  );

  const renderPost = (post: Post) => (
    <TouchableOpacity 
      style={[styles.postItem, isDesktop && styles.postItemDesktop, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/stop-post-details?postId=${post.id}`)}
    >
      <View style={[styles.postHeader, isDesktop && styles.postHeaderDesktop]}>
        <Image
          source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={[styles.avatar, isDesktop && styles.avatarDesktop]}
        />
        <View style={[styles.postHeaderText, isDesktop && styles.postHeaderTextDesktop]}>
          <Text style={[styles.userName, isDesktop && styles.userNameDesktop, { color: colors.text }]}>
            {post.profiles.first_name} {post.profiles.last_name}
          </Text>
          {post.profiles.selected_title && (
            <Text style={[styles.selectedTitle, isDesktop && styles.selectedTitleDesktop, { color: colors.primary }]}>
              {post.profiles.selected_title}
            </Text>
          )}
          <Text style={[styles.postTime, isDesktop && styles.postTimeDesktop, { color: colors.text }]}>
            {formatTimeAgo(post.created_at)}
          </Text>
        </View>
      </View>
      <Text style={[styles.postContent, isDesktop && styles.postContentDesktop, { color: colors.text }]}>{post.content}</Text>
      <TouchableOpacity
        style={[styles.shareButton, isDesktop && styles.shareButtonDesktop]}
        onPress={() => Sharing.shareAsync({ message: post.content })}
      >
        <Share2 size={16} color={colors.primary} />
        <Text style={[styles.shareButtonText, isDesktop && styles.shareButtonTextDesktop, { color: colors.primary }]}>Share</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRoute = (route: Route) => (
    <TouchableOpacity 
      style={[styles.routeItem, isDesktop && styles.routeItemDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigateToRoute(route.id)}
    >
      <View style={[styles.routeInfo, isDesktop && styles.routeInfoDesktop]}>
        <Text style={[styles.routeName, isDesktop && styles.routeNameDesktop, { color: colors.text }]}>{route.name}</Text>
        <Text style={[styles.routeDestination, isDesktop && styles.routeDestinationDesktop, { color: colors.text }]}>
          {route.start_point} → {route.end_point}
        </Text>
        <View style={[styles.routeDetails, isDesktop && styles.routeDetailsDesktop]}>
          <Text style={[styles.routeType, isDesktop && styles.routeTypeDesktop, { color: colors.primary, backgroundColor: `${colors.primary}20` }]}>
            {route.transport_type}
          </Text>
          <Text style={[styles.routeCost, isDesktop && styles.routeCostDesktop, { color: colors.primary }]}>R {route.cost}</Text>
          <Text style={[styles.stopNumber, isDesktop && styles.stopNumberDesktop, { color: colors.text }]}>
            Stop #{route.order_number}
          </Text>
        </View>
      </View>
      <View style={[styles.routeArrow, isDesktop && styles.routeArrowDesktop]}>
        <Text style={[styles.routeArrowText, isDesktop && styles.routeArrowTextDesktop, { color: colors.text }]}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (activeTab === 'activity') {
      return (
        <View style={[styles.tabContent, isDesktop && styles.tabContentDesktop]}>
          {showAddPost && (
            <View style={[styles.addPostContainer, isDesktop && styles.addPostContainerDesktop, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, isDesktop && styles.inputDesktop, { color: colors.text, borderColor: colors.border }]}
                placeholder="Share what's happening at this stop..."
                placeholderTextColor={colors.text}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <TouchableOpacity
                style={[styles.postButton, isDesktop && styles.postButtonDesktop, { backgroundColor: colors.primary }]}
                onPress={handleAddPost}
              >
                <Text style={[styles.postButtonText, isDesktop && styles.postButtonTextDesktop]}>Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {thisWeeksPosts.length > 0 ? (
            <FlatList
              data={thisWeeksPosts}
              renderItem={({ item }) => renderPost(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyState, isDesktop && styles.emptyStateDesktop]}>
              <Calendar size={isDesktop ? 32 : 24} color={colors.text} />
              <Text style={[styles.emptyStateText, isDesktop && styles.emptyStateTextDesktop, { color: colors.text }]}>
                No activity this week
              </Text>
              <Text style={[styles.emptyStateSubtext, isDesktop && styles.emptyStateSubtextDesktop, { color: colors.text }]}>
                Be the first to post an update about this stop
              </Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View style={[styles.tabContent, isDesktop && styles.tabContentDesktop]}>
          {routes.length > 0 ? (
            <FlatList
              data={routes}
              renderItem={({ item }) => renderRoute(item)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyState, isDesktop && styles.emptyStateDesktop]}>
              <RouteIcon size={isDesktop ? 32 : 24} color={colors.text} />
              <Text style={[styles.emptyStateText, isDesktop && styles.emptyStateTextDesktop, { color: colors.text }]}>
                No routes available
              </Text>
              <Text style={[styles.emptyStateSubtext, isDesktop && styles.emptyStateSubtextDesktop, { color: colors.text }]}>
                This stop is not currently on any routes
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  if (isLoading) {
    return <SkeletonLoader colors={colors} isDesktop={isDesktop} />;
  }

  if (!stopDetails) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, isDesktop && styles.errorTextDesktop, { color: colors.text }]}>
          Failed to load stop details.
        </Text>
        <TouchableOpacity style={[styles.backButton, isDesktop && styles.backButtonDesktop]} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, isDesktop && styles.backButtonTextDesktop]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Desktop Layout
  if (isDesktop) {
    return (
      <ScrollView style={[styles.container, styles.containerDesktop, { backgroundColor: colors.background }]}>
        <View style={styles.desktopWrapper}>
          {/* Left Column - Stop Info */}
          <View style={styles.desktopLeftColumn}>
            {/* Header */}
            <View style={styles.headerDesktop}>
              <TouchableOpacity style={[styles.backButton, styles.backButtonDesktop]} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.favoriteButton, styles.favoriteButtonDesktop]} onPress={toggleFavorite}>
                {isFavorite ? (
                  <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
                ) : (
                  <Bookmark size={24} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Stop Image */}
            <View style={[styles.imageContainer, styles.imageContainerDesktop]}>
              {stopDetails?.image_url ? (
                <Image
                  source={{ uri: stopDetails.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, styles.imagePlaceholderDesktop, { backgroundColor: colors.card }]}>
                  <Text style={[styles.hubName, styles.hubNameDesktop, { color: colors.text }]}>{stopDetails.name}</Text>
                </View>
              )}
            </View>

            {/* Stop Info */}
            <View style={[styles.infoSection, styles.infoSectionDesktop]}>
              <Text style={[styles.hubName, styles.hubNameDesktop, { color: colors.text }]}>{stopDetails.name}</Text>
              
              {/* Follower Count */}
              <View style={[styles.followerContainer, styles.followerContainerDesktop]}>
                <Users size={16} color={colors.primary} />
                <Text style={[styles.followerText, styles.followerTextDesktop, { color: colors.primary }]}>
                  {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                </Text>
              </View>

              {/* Routes Count */}
              <View style={[styles.followerContainer, styles.followerContainerDesktop, { marginBottom: 0 }]}>
                <RouteIcon size={16} color={colors.primary} />
                <Text style={[styles.followerText, styles.followerTextDesktop, { color: colors.primary }]}>
                  {routes.length} {routes.length === 1 ? 'route' : 'routes'} pass here
                </Text>
              </View>

              {/* Real-time Waiting Information */}
              <View style={[styles.waitingCountContainer, styles.waitingCountContainerDesktop]}>
                <View style={[styles.waitingCountBadge, styles.waitingCountBadgeDesktop, { backgroundColor: `${colors.primary}20` }]}>
                  <Users size={20} color={colors.primary} />
                  <Text style={[styles.waitingCountText, styles.waitingCountTextDesktop, { color: colors.primary }]}>
                    {stopInfo?.total_waiting || 0} people waiting now
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionButtons, styles.actionButtonsDesktop]}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonDesktop, { backgroundColor: colors.primary }]} 
                onPress={openInMaps}
              >
                <Navigation size={20} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDesktop]}>Directions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonDesktop, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (isFavorite) {
                    router.push('/(tabs)/feeds');
                  } else {
                    router.push(`/community-preview?communityId=${stopDetails.id}&communityType=stop&communityName=${encodeURIComponent(stopDetails.name)}`);
                  }
                }}
              >
                <MessageSquare size={20} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDesktop]}>
                  {isFavorite ? 'View Posts' : 'Preview Posts'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Leaderboard Button */}
            <View style={[styles.section, styles.sectionDesktop]}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonDesktop, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/FilteredLeaderboard?entityId=${stopId}&entityType=stop&name=${encodeURIComponent(stopDetails.name)}`)}
              >
                <Trophy size={20} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDesktop]}>Leaderboard</Text>
              </TouchableOpacity>
            </View>

            {/* Stop Information Card */}
            <View style={[styles.section, styles.sectionDesktop]}>
              <View style={[styles.infoCard, styles.infoCardDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.infoRow, styles.infoRowDesktop]}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, styles.infoLabelDesktop, { color: colors.text }]}>Last Updated:</Text>
                  <Text style={[styles.infoValue, styles.infoValueDesktop, { color: colors.text }]}>{stopInfo?.last_updated || 'Unknown'}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowDesktop]}>
                  <Users size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, styles.infoLabelDesktop, { color: colors.text }]}>Avg. Wait Time:</Text>
                  <Text style={[styles.infoValue, styles.infoValueDesktop, { color: colors.text }]}>{stopInfo?.avg_wait_time || 'Unknown'}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowDesktop]}>
                  <AlertCircle size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, styles.infoLabelDesktop, { color: colors.text }]}>Busyness Level:</Text>
                  <View style={[styles.busynessMeter, styles.busynessMeterDesktop]}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.busynessDot,
                          level <= (stopInfo?.busyness_level || 0) 
                            ? [styles.busynessDotActive, { backgroundColor: colors.primary }]
                            : [styles.busynessDotInactive, { backgroundColor: colors.border }]
                        ]}
                      />
                    ))}
                    <Text style={[styles.busynessText, styles.busynessTextDesktop, { color: colors.text }]}>
                      {stopInfo?.busyness_level || 0}/5
                    </Text>
                  </View>
                </View>
                <View style={[styles.infoRow, styles.infoRowDesktop]}>
                  <Shield size={16} color={colors.primary} />
                  <Text style={[styles.infoLabel, styles.infoLabelDesktop, { color: colors.text }]}>Safety Rating:</Text>
                  <Text style={[styles.infoValue, styles.infoValueDesktop, { color: colors.text }]}>{stopInfo?.safety_level || 0}/5</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Content */}
          <View style={styles.desktopRightColumn}>
            {/* Tab Selectors */}
            <View style={[styles.tabContainer, styles.tabContainerDesktop]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  styles.tabDesktop,
                  activeTab === 'activity' && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('activity')}
              >
                <MessageSquare size={16} color={activeTab === 'activity' ? '#ffffff' : colors.text} />
                <Text style={[
                  styles.tabText,
                  styles.tabTextDesktop,
                  { color: activeTab === 'activity' ? '#ffffff' : colors.text }
                ]}>
                  Recent Activity ({thisWeeksPosts.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  styles.tabDesktop,
                  activeTab === 'routes' && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab('routes')}
              >
                <RouteIcon size={16} color={activeTab === 'routes' ? '#ffffff' : colors.text} />
                <Text style={[
                  styles.tabText,
                  styles.tabTextDesktop,
                  { color: activeTab === 'routes' ? '#ffffff' : colors.text }
                ]}>
                  Routes ({routes.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Mobile Layout
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          {isFavorite ? (
            <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
          ) : (
            <Bookmark size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Stop Image */}
        <View style={styles.imageContainer}>
          {stopDetails?.image_url ? (
            <Image
              source={{ uri: stopDetails.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.card }]}>
              <Text style={[styles.hubName, { color: colors.text }]}>{stopDetails.name}</Text>
            </View>
          )}
        </View>

        {/* Stop Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.hubName, { color: colors.text }]}>{stopDetails.name}</Text>
          
          {/* Follower Count */}
          <View style={styles.followerContainer}>
            <Users size={16} color={colors.primary} />
            <Text style={[styles.followerText, { color: colors.primary }]}>
              {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
            </Text>
          </View>

          {/* Routes Count */}
          <View style={[styles.followerContainer, { marginBottom: 0 }]}>
            <RouteIcon size={16} color={colors.primary} />
            <Text style={[styles.followerText, { color: colors.primary }]}>
              {routes.length} {routes.length === 1 ? 'route' : 'routes'} pass here
            </Text>
          </View>

          {/* Real-time Waiting Information */}
          <View style={styles.waitingCountContainer}>
            <View style={[styles.waitingCountBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.waitingCountText, { color: colors.primary }]}>
                {stopInfo?.total_waiting || 0} people waiting now
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={openInMaps}
          >
            <Navigation size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (isFavorite) {
                // If it's a favorite, go to feeds
                router.push('/(tabs)/feeds');
              } else {
                // If it's NOT a favorite, go to preview
                router.push(`/community-preview?communityId=${stopDetails.id}&communityType=stop&communityName=${encodeURIComponent(stopDetails.name)}`);
              }
            }}
          >
            <MessageSquare size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>
              {isFavorite ? 'View Posts' : 'Preview Posts'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stop Information Card */}
        <View style={styles.section}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Last Updated:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stopInfo?.last_updated || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Users size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Avg. Wait Time:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stopInfo?.avg_wait_time || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <AlertCircle size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Busyness Level:</Text>
              <View style={styles.busynessMeter}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.busynessDot,
                      level <= (stopInfo?.busyness_level || 0) 
                        ? [styles.busynessDotActive, { backgroundColor: colors.primary }]
                        : [styles.busynessDotInactive, { backgroundColor: colors.border }]
                    ]}
                  />
                ))}
                <Text style={[styles.busynessText, { color: colors.text }]}>
                  {stopInfo?.busyness_level || 0}/5
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Shield size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>Safety Rating:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{stopInfo?.safety_level || 0}/5</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/FilteredLeaderboard?entityId=${stopId}&entityType=stop&name=${encodeURIComponent(stopDetails.name)}`)}
            >
              <Trophy size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Leaderboard</Text>
            </TouchableOpacity>
          </View>

        {/* Tab Selectors */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'activity' && [styles.activeTab, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <MessageSquare size={16} color={activeTab === 'activity' ? '#ffffff' : colors.text} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'activity' ? '#ffffff' : colors.text }
            ]}>
              Recent Activity ({thisWeeksPosts.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'routes' && [styles.activeTab, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('routes')}
          >
            <RouteIcon size={16} color={activeTab === 'routes' ? '#ffffff' : colors.text} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'routes' ? '#ffffff' : colors.text }
            ]}>
              Routes ({routes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDesktop: {
    width: '100%',
  },
  
  // Desktop layout
  desktopWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  desktopLeftColumn: {
    width: '45%',
    paddingRight: 24,
  },
  desktopRightColumn: {
    width: '55%',
    paddingLeft: 24,
  },
  
  // Header
  headerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  backButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  favoriteButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  // Image
  imageContainerDesktop: {
    height: 280,
    marginBottom: 24,
  },
  imagePlaceholderDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Info Section
  infoSectionDesktop: {
    marginBottom: 24,
  },
  hubNameDesktop: {
    fontSize: 32,
    marginBottom: 12,
  },
  
  // Follower container
  followerContainerDesktop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  followerTextDesktop: {
    fontSize: 15,
    marginLeft: 6,
  },
  
  // Waiting count
  waitingCountContainerDesktop: {
    marginBottom: 24,
  },
  waitingCountBadgeDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  waitingCountTextDesktop: {
    fontSize: 15,
    marginLeft: 8,
  },
  
  // Action buttons
  actionButtonsDesktop: {
    marginBottom: 24,
    gap: 16,
  },
  actionButtonDesktop: {
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonTextDesktop: {
    fontSize: 15,
    marginLeft: 10,
  },
  
  // Section
  sectionDesktop: {
    marginBottom: 24,
  },
  
  // Info Card
  infoCardDesktop: {
    padding: 20,
    borderRadius: 12,
  },
  infoRowDesktop: {
    marginBottom: 14,
  },
  infoLabelDesktop: {
    fontSize: 15,
    marginLeft: 10,
  },
  infoValueDesktop: {
    fontSize: 15,
  },
  
  // Busyness meter
  busynessMeterDesktop: {
    gap: 6,
  },
  busynessTextDesktop: {
    fontSize: 15,
    marginLeft: 10,
  },
  
  // Tab container
  tabContainerDesktop: {
    marginBottom: 24,
    borderRadius: 10,
    padding: 6,
  },
  tabDesktop: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  tabTextDesktop: {
    fontSize: 13,
  },
  
  // Tab content
  tabContentDesktop: {
    minHeight: 300,
  },
  
  // Empty state
  emptyStateDesktop: {
    paddingVertical: 60,
  },
  emptyStateTextDesktop: {
    fontSize: 18,
    marginTop: 16,
  },
  emptyStateSubtextDesktop: {
    fontSize: 15,
    maxWidth: 400,
  },
  
  // Post item
  postItemDesktop: {
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
  },
  postHeaderDesktop: {
    marginBottom: 14,
  },
  avatarDesktop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  postHeaderTextDesktop: {
    flex: 1,
  },
  userNameDesktop: {
    fontSize: 15,
  },
  selectedTitleDesktop: {
    fontSize: 13,
    marginTop: 2,
  },
  postTimeDesktop: {
    fontSize: 12,
    marginTop: 2,
  },
  postContentDesktop: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  shareButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonTextDesktop: {
    fontSize: 13,
    marginLeft: 6,
  },
  
  // Route item
  routeItemDesktop: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  routeInfoDesktop: {
    flex: 1,
  },
  routeNameDesktop: {
    fontSize: 15,
  },
  routeDestinationDesktop: {
    fontSize: 13,
  },
  routeDetailsDesktop: {
    gap: 10,
  },
  routeTypeDesktop: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  routeCostDesktop: {
    fontSize: 13,
  },
  stopNumberDesktop: {
    fontSize: 11,
  },
  routeArrowDesktop: {
    marginLeft: 8,
  },
  routeArrowTextDesktop: {
    fontSize: 22,
  },
  
  // Add post container
  addPostContainerDesktop: {
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
  },
  inputDesktop: {
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  postButtonDesktop: {
    padding: 14,
    borderRadius: 8,
  },
  postButtonTextDesktop: {
    fontSize: 15,
  },
  
  // Waiting user
  waitingUserDesktop: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfoDesktop: {
    flex: 1,
  },
  userNameDesktop: {
    fontSize: 15,
  },
  waitingForDesktop: {
    fontSize: 13,
  },
  waitingTimeDesktop: {
    fontSize: 13,
  },
  
  // Error
  errorTextDesktop: {
    fontSize: 20,
  },
  backButtonTextDesktop: {
    fontSize: 15,
  },
  
  // Keep all existing mobile styles below
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  imageContainer: {
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  infoSection: {
    marginBottom: 20,
  },
  hubName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  followerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  followerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  waitingCountText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
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
  busynessDotActive: {},
  busynessDotInactive: {},
  busynessText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  waitingUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  waitingFor: {
    fontSize: 14,
  },
  waitingTime: {
    fontSize: 14,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#1ea2b1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
  // Post Styles
  postItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Route Styles
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  routeDestination: {
    fontSize: 14,
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeType: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeCost: {
    fontSize: 14,
    fontWeight: '500',
  },
  stopNumber: {
    fontSize: 12,
  },
  routeArrow: {
    marginLeft: 12,
  },
  routeArrowText: {
    fontSize: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  addPostContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 80,
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
  // Skeleton styles
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonImage: {
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  skeletonTextLarge: {
    height: 28,
    width: '70%',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonTextMedium: {
    height: 16,
    width: '50%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextSmall: {
    height: 12,
    width: '30%',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonBadge: {
    height: 32,
    width: 150,
    borderRadius: 20,
    marginBottom: 20,
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
  skeletonCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skeletonActionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  skeletonButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  skeletonTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  skeletonTab: {
    flex: 1,
    height: 44,
    borderRadius: 8,
  },
  skeletonTabContent: {
    minHeight: 200,
  },
  skeletonPost: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  skeletonPostHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  skeletonInfoSection: {
    marginBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
  backButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
});