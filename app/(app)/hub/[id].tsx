import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Clock, Users, Bookmark, BookmarkCheck, ArrowLeft, Navigation, MessageSquare, Route as RouteIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useFavorites } from '@/hook/useFavorites';
import { formatTimeAgo } from '@/components/utils';

interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  transport_type?: string;
  image?: string;
}

interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

type TabType = 'routes' | 'activity';

// Skeleton Loading Components
const SkeletonLoader = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={[styles.favoriteButton, styles.skeleton]} />
      </View>

      {/* Hub Image Skeleton */}
      <View style={[styles.imageContainer, styles.skeleton]} />

      {/* Hub Info Skeleton */}
      <View style={styles.infoSection}>
        <View style={[styles.skeletonTextLarge, styles.skeleton, { width: '70%', marginBottom: 12 }]} />
        <View style={[styles.skeletonTextMedium, styles.skeleton, { width: '90%', marginBottom: 8 }]} />
        <View style={[styles.skeletonTextSmall, styles.skeleton, { width: '60%', marginBottom: 12 }]} />
        <View style={[styles.skeletonBadge, styles.skeleton, { width: '30%' }]} />
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionButtons}>
        <View style={[styles.actionButton, styles.skeleton]} />
        <View style={[styles.actionButton, styles.skeleton]} />
      </View>

      {/* Tab Skeleton */}
      <View style={styles.tabContainer}>
        <View style={[styles.tab, styles.skeleton, { flex: 1, height: 44 }]} />
        <View style={[styles.tab, styles.skeleton, { flex: 1, height: 44 }]} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.section}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.routeItem, styles.skeleton, { height: 100 }]} />
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default function HubDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [hub, setHub] = useState<Hub | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<TabType>('routes');

  // Filter posts to only show from this week
  const getThisWeeksPosts = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return posts.filter(post => new Date(post.created_at) >= oneWeekAgo);
  };

  const thisWeeksPosts = getThisWeeksPosts();
  const hasRecentActivity = thisWeeksPosts.length > 0;

  useEffect(() => {
    if (id) {
      loadHubDetails();
      loadHubRoutes();
      loadHubPosts();
      loadFollowerCount();
      populateFollowerCounts();
    }
  }, [id]);

  // Check favorite status whenever hub data or favorites change
  useEffect(() => {
    if (hub && id) {
      checkIfFollowing();
    }
  }, [hub, id, favorites]);

  // Set default tab based on available content
  useEffect(() => {
    if (!loading) {
      // If no recent activity, default to routes tab
      if (!hasRecentActivity && activeTab === 'activity') {
        setActiveTab('routes');
      }
    }
  }, [loading, hasRecentActivity]);

  const loadHubDetails = async () => {
    try {
      const { data: hubData, error: hubError } = await supabase
        .from('hubs')
        .select('*')
        .eq('id', id)
        .single();

      if (hubError) {
        console.error('Error loading hub:', hubError);
        return;
      }

      setHub(hubData);
    } catch (error) {
      console.error('Error loading hub details:', error);
    }
    setLoading(false);
  };

  const loadHubRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('hub_id', id)
        .order('created_at', { ascending: false });

      if (!error) {
        setRoutes(data || []);
      }
    } catch (error) {
      console.error('Error loading hub routes:', error);
    }
  };

  const loadHubPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hub_posts')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url)
        `)
        .eq('hub_id', id)
        .order('created_at', { ascending: false })
        .limit(20); // Get more posts to filter by week

      if (!error) {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading hub posts:', error);
    }
  };

  const loadFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'hub')
        .eq('entity_id', id);

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
      
      const { data } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', 'hub')
        .eq('entity_id', id);

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
      if (!user || !id) return;

      // Use the isFavorite function from useFavorites hook
      const isHubFavorite = isFavorite(id as string);
      setIsFollowing(isHubFavorite);

      // Also check in the database to ensure consistency
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'hub')
        .eq('entity_id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      // If there's a discrepancy between local state and database, sync them
      const isInDatabase = !!data;
      if (isInDatabase !== isHubFavorite) {
        setIsFollowing(isInDatabase);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    try {
      if (!user || !hub) {
        Alert.alert('Login Required', 'Please login to follow hubs.');
        return;
      }

      const entityType = 'hub';
      const entityId = hub.id;
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

          await removeFromFavorites(entityId);
        } else {
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

          await addToFavorites({ 
            id: entityId, 
            type: entityType, 
            name: hub.name, 
            data: hub 
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

  const openInMaps = () => {
    if (!hub) {
      console.log("No hub available, skipping openInMaps.");
      return;
    }

    const lat = hub.latitude;
    const lng = hub.longitude;
    const label = encodeURIComponent(hub.name);

    const iosUrl = `comgooglemaps://?q=${lat},${lng}`;
    const androidUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    if (Platform.OS === "web") {
      const confirm = window.confirm(`Would you like to open ${hub.name} in Google Maps?`);
      if (confirm) {
        window.open(webUrl, "_blank");
      }
      return;
    }

    Alert.alert(
      "Open in Maps",
      `Would you like to open ${hub.name} in Google Maps?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: async () => {
            try {
              let url = Platform.OS === "ios" ? iosUrl : Platform.OS === "android" ? androidUrl : webUrl;

              const supported = await Linking.canOpenURL(url);
              if (!supported) {
                url = webUrl;
              }

              await Linking.openURL(url);
            } catch (err) {
              console.error("Error opening maps:", err);
              Alert.alert("Error", "Unable to open Google Maps.");
            }
          },
        },
      ]
    );
  };

  const navigateToRoute = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  const renderRoutesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Routes from this Hub ({routes.length})</Text>
      {routes.length === 0 ? (
        <View style={styles.emptyState}>
          <RouteIcon size={24} color="#666666" />
          <Text style={styles.emptyStateText}>No routes available from this hub</Text>
          <Text style={styles.emptyStateSubtext}>
            Check back later for new routes or explore other hubs
          </Text>
        </View>
      ) : (
        routes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeItem}
            onPress={() => navigateToRoute(route.id)}
          >
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{route.name}</Text>
              <Text style={styles.routeDestination}>
                {route.start_point} → {route.end_point}
              </Text>
              <View style={styles.routeDetails}>
                <Text style={styles.routeType}>{route.transport_type}</Text>
                <Text style={styles.routeCost}>R {route.cost}</Text>
              </View>
            </View>
            
            <View style={styles.routeArrow}>
              <Text style={styles.routeArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>This Week's Activity ({thisWeeksPosts.length})</Text>
      {thisWeeksPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={24} color="#666666" />
          <Text style={styles.emptyStateText}>No activity this week</Text>
          <Text style={styles.emptyStateSubtext}>
            Be the first to share updates about this hub
          </Text>
        </View>
      ) : (
        thisWeeksPosts.map((post) => (
          <View key={post.id} style={styles.postItem}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthorInfo}>
                {post.profiles.avatar_url ? (
                  <Image 
                    source={{ uri: post.profiles.avatar_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {post.profiles.first_name[0]}{post.profiles.last_name[0]}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.postAuthor}>
                    {post.profiles.first_name} {post.profiles.last_name}
                  </Text>
                  <Text style={styles.postTime}>
                    {formatTimeAgo(post.created_at)}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        ))
      )}
    </View>
  );

  // Only show activity tab if there's recent activity
  const shouldShowActivityTab = hasRecentActivity;
  
  if (loading) {
    return <SkeletonLoader />;
  }

  if (!hub) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Hub not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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

      {/* Hub Image */}
      <View style={styles.imageContainer}>
        {hub.image ? (
          <Image
            source={{ uri: hub.image }}
            style={styles.hubImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.hubName}>{hub.name}</Text>
          </View>
        )}
      </View>

      {/* Hub Info */}
      <View style={styles.infoSection}>
        <Text style={styles.hubName}>{hub.name}</Text>
        {hub.address && (
          <Text style={styles.hubAddress}>{hub.address}</Text>
        )}
        
        {/* Follower Count */}
        <View style={styles.followerContainer}>
          <Users size={16} color="#1ea2b1" />
          <Text style={styles.followerText}>
            {favoritesCountMap[hub.id] || followerCount} {favoritesCountMap[hub.id] === 1 ? 'follower' : 'followers'}
          </Text>
        </View>

        {hub.transport_type && (
          <View style={styles.transportBadge}>
            <Text style={styles.transportType}>{hub.transport_type}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
          <Navigation size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/feeds')}>
          <MessageSquare size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>View Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selectors - Only show activity tab if there's recent activity */}
      {shouldShowActivityTab && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'routes' && [styles.activeTab, { backgroundColor: '#1ea2b1' }]
            ]}
            onPress={() => setActiveTab('routes')}
          >
            <RouteIcon size={16} color={activeTab === 'routes' ? '#ffffff' : '#666666'} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'routes' ? '#ffffff' : '#666666' }
            ]}>
              Routes ({routes.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'activity' && [styles.activeTab, { backgroundColor: '#1ea2b1' }]
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <MessageSquare size={16} color={activeTab === 'activity' ? '#ffffff' : '#666666'} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'activity' ? '#ffffff' : '#666666' }
            ]}>
              This Week ({thisWeeksPosts.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Content */}
      <View style={styles.section}>
        {!shouldShowActivityTab ? (
          // If no activity tab, always show routes
          renderRoutesTab()
        ) : (
          // If activity tab exists, show based on active tab
          activeTab === 'routes' ? renderRoutesTab() : renderActivityTab()
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonTextLarge: {
    height: 28,
  },
  skeletonTextMedium: {
    height: 20,
  },
  skeletonTextSmall: {
    height: 16,
  },
  skeletonBadge: {
    height: 28,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
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
  // Rest of the styles
  followerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  imageContainer: {
    height: 200,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hubName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  hubAddress: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 12,
  },
  coordinates: {
    marginBottom: 12,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
  },
  transportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1ea2b120',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  transportType: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  hubImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
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
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeType: {
    fontSize: 12,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeCost: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  routeArrow: {
    marginLeft: 12,
  },
  routeArrowText: {
    fontSize: 24,
    color: '#666666',
  },
  postItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: {
    marginBottom: 8,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 20,
  },
});