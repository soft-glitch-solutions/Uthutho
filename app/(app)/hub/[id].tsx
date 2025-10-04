import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Clock, Users, Heart, HeartOff, ArrowLeft, Navigation, MessageSquare, Route as RouteIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

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
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

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

      {/* Routes Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonTextMedium, styles.skeleton, { width: '50%', marginBottom: 16 }]} />
        {[1, 2].map((item) => (
          <View key={item} style={[styles.routeItem, styles.skeleton, { height: 100 }]} />
        ))}
      </View>

      {/* Posts Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonTextMedium, styles.skeleton, { width: '50%', marginBottom: 16 }]} />
        {[1, 2].map((item) => (
          <View key={item} style={[styles.postItem, styles.skeleton, { height: 80 }]} />
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default function HubDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [hub, setHub] = useState<Hub | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadHubDetails();
      loadHubRoutes();
      loadHubPosts();
      checkIfFavorite();
      loadFollowerCount();
    }
  }, [id]);

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
        .eq('hub_id', id);

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
          profiles (first_name, last_name)
        `)
        .eq('hub_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

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

  const checkIfFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      if (profile && profile.favorites) {
        const favorites = profile.favorites;
        setIsFavorite(favorites.some((fav: any) => fav.id === id && fav.type === 'hub'));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !hub) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      let favorites = profile?.favorites || [];
      const favoriteItem = {
        id: hub.id,
        name: hub.name,
        type: 'hub' as const,
      };

      if (isFavorite) {
        favorites = favorites.filter((fav: any) => !(fav.id === hub.id && fav.type === 'hub'));
      } else {
        favorites = [...favorites, favoriteItem];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ favorites })
        .eq('id', user.id);

      if (!error) {
        setIsFavorite(!isFavorite);
        // Update follower count after toggling favorite
        loadFollowerCount();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // ... rest of your existing functions (openInMaps, navigateToRoute) ...

const openInMaps = () => {
  if (!hub) {
    console.log("No hub available, skipping openInMaps.");
    return;
  }

  const lat = hub.latitude;
  const lng = hub.longitude;
  const label = encodeURIComponent(hub.name);

  // Native deep links
  const iosUrl = `comgooglemaps://?q=${lat},${lng}`;
  const androidUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

  // Web fallback
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  console.log("openInMaps called with hub:", hub);
  console.log("Generated URLs:", { iosUrl, androidUrl, webUrl });

  if (Platform.OS === "web") {
    const confirm = window.confirm(`Would you like to open ${hub.name} in Google Maps?`);
    if (confirm) {
      console.log("Opening in browser:", webUrl);
      window.open(webUrl, "_blank");
    } else {
      console.log("User cancelled on web.");
    }
    return;
  }

  // Native platforms
  Alert.alert(
    "Open in Maps",
    `Would you like to open ${hub.name} in Google Maps?`,
    [
      { text: "Cancel", style: "cancel", onPress: () => console.log("User cancelled openInMaps") },
      {
        text: "Open",
        onPress: async () => {
          try {
            let url =
              Platform.OS === "ios"
                ? iosUrl
                : Platform.OS === "android"
                ? androidUrl
                : webUrl;

            console.log("Trying URL:", url);

            const supported = await Linking.canOpenURL(url);
            console.log("canOpenURL result:", supported);

            if (!supported) {
              console.log("Deep link not supported, falling back to webUrl:", webUrl);
              url = webUrl;
            }

            await Linking.openURL(url);
            console.log("Successfully opened URL:", url);
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
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          {isFavorite ? (
            <Heart size={24} color="#1ea2b1" fill="#1ea2b1" />
          ) : (
            <HeartOff size={24} color="#ffffff" />
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
            {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
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

      {/* Routes from this Hub */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Routes from this Hub ({routes.length})</Text>
        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <RouteIcon size={24} color="#666666" />
            <Text style={styles.emptyStateText}>No routes available from this hub</Text>
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

      {/* Recent Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Posts ({posts.length})</Text>
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={24} color="#666666" />
            <Text style={styles.emptyStateText}>No posts yet from this hub</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postItem}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>
                  {post.profiles.first_name} {post.profiles.last_name}
                </Text>
                <Text style={styles.postTime}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
            </View>
          ))
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
  // New follower styles
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
  // Rest of the styles remain the same
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
    marginBottom: 30,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
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