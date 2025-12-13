import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, SafeAreaView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, Flame, MapPin, Calendar, Award, Trophy, Home, Navigation, Users, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  points: number;
  selected_title: string;
  preferred_transport?: string;
  home?: string;
  fire_count?: number;
  avatar_url: string;
}

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  type: 'hub' | 'stop';
  location_name: string;
  post_reactions: Array<{
    reaction_type: string;
  }>;
}

// Skeleton Loader Component
const SkeletonLoader = () => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonItem = ({ width, height, style = {} }) => (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );

  if (isDesktop) {
    return (
      <View style={[styles.container, styles.containerDesktop]}>
        {/* Desktop Header Skeleton */}
        <View style={styles.desktopHeader}>
          <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
          <SkeletonItem width={120} height={24} />
        </View>

        {/* Desktop Layout Skeleton */}
        <View style={styles.desktopLayout}>
          {/* Left Column Skeleton */}
          <View style={styles.leftColumn}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <SkeletonItem width={100} height={100} style={styles.skeletonCircle} />
                <SkeletonItem width={200} height={28} style={{ marginTop: 12 }} />
                <SkeletonItem width={150} height={20} style={{ marginTop: 4 }} />
              </View>

              <View style={styles.statsContainer}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.statItem}>
                    <SkeletonItem width={24} height={24} style={styles.skeletonCircle} />
                    <SkeletonItem width={60} height={24} style={{ marginTop: 4 }} />
                    <SkeletonItem width={80} height={14} style={{ marginTop: 2 }} />
                  </View>
                ))}
              </View>

              <SkeletonItem width={120} height={16} style={{ marginTop: 8 }} />
              <SkeletonItem width={180} height={16} style={{ marginTop: 8 }} />
            </View>
          </View>

          {/* Right Column Skeleton */}
          <View style={styles.rightColumn}>
            <SkeletonItem width={120} height={24} style={{ marginBottom: 16 }} />
            
            <ScrollView 
              style={styles.postsScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postsScrollContent}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <View key={item} style={[styles.postItem, styles.postItemDesktop]}>
                  <SkeletonItem width="100%" height={80} style={{ marginBottom: 12 }} />
                  <View style={styles.postFooter}>
                    <SkeletonItem width={120} height={16} />
                    <SkeletonItem width={60} height={16} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
        <SkeletonItem width={120} height={24} />
        <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
      </View>

      {/* Profile Card Skeleton */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <SkeletonItem width={80} height={80} style={styles.skeletonCircle} />
          <SkeletonItem width={150} height={28} style={{ marginTop: 12 }} />
          <SkeletonItem width={100} height={18} style={{ marginTop: 4 }} />
        </View>

        <View style={styles.statsContainer}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.statItem}>
              <SkeletonItem width={24} height={24} style={styles.skeletonCircle} />
              <SkeletonItem width={40} height={20} style={{ marginTop: 4 }} />
              <SkeletonItem width={60} height={14} style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>

        <SkeletonItem width={120} height={16} style={{ marginTop: 8 }} />
        <SkeletonItem width={180} height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Posts Section Skeleton */}
      <View style={styles.postsSection}>
        <SkeletonItem width={120} height={20} style={{ marginBottom: 16 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.postItem}>
            <SkeletonItem width="100%" height={60} style={{ marginBottom: 12 }} />
            <View style={styles.postFooter}>
              <SkeletonItem width={80} height={14} />
              <SkeletonItem width={40} height={14} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Desktop Layout Component
const DesktopUserProfile = ({ profile, posts, fireCount, router, navigateToPost }) => {
  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.desktopHeaderTitle}>User Profile</Text>
        <View style={styles.desktopHeaderPlaceholder} />
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Profile Info */}
        <View style={styles.leftColumn}>
          <View style={[styles.profileCard, styles.profileCardDesktop]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileIcon, styles.profileIconDesktop]}>
                <Image
                  source={{ uri: profile.avatar_url || 'https://via.placeholder.com/50' }}
                  style={[styles.profileIcon, styles.profileIconDesktop]}
                />
              </View>
              <Text style={styles.profileNameDesktop}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text style={styles.profileTitleDesktop}>{profile.selected_title}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statItem, styles.statItemDesktop]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fbbf2415' }]}>
                  <Trophy size={24} color="#fbbf24" />
                </View>
                <Text style={styles.statValueDesktop}>{profile.points}</Text>
                <Text style={styles.statLabelDesktop}>Points</Text>
              </View>
              <View style={[styles.statItem, styles.statItemDesktop]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#ff6b3515' }]}>
                  <Flame size={24} color="#ff6b35" />
                </View>
                <Text style={styles.statValueDesktop}>{fireCount}</Text>
                <Text style={styles.statLabelDesktop}>Fire Received</Text>
              </View>
              <View style={[styles.statItem, styles.statItemDesktop]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#1ea2b115' }]}>
                  <Award size={24} color="#1ea2b1" />
                </View>
                <Text style={styles.statValueDesktop}>Level {Math.floor(profile.points / 100) + 1}</Text>
                <Text style={styles.statLabelDesktop}>Explorer</Text>
              </View>
            </View>

            {profile.home && (
              <View style={styles.locationContainer}>
                <View style={styles.locationIconContainer}>
                  <Home size={20} color="#1ea2b1" />
                </View>
                <Text style={styles.locationTextDesktop}>Lives in {profile.home}</Text>
              </View>
            )}

            {profile.preferred_transport && (
              <View style={styles.transportContainer}>
                <View style={styles.transportIconContainer}>
                  <Navigation size={20} color="#1ea2b1" />
                </View>
                <Text style={styles.transportValueDesktop}>
                  Prefers {profile.preferred_transport}
                </Text>
              </View>
            )}
          </View>

          {/* Additional Stats */}
          <View style={[styles.additionalStats, { backgroundColor: '#1a1a1a' }]}>
            <Text style={styles.additionalStatsTitle}>Activity Stats</Text>
            <View style={styles.additionalStatsGrid}>
              <View style={styles.additionalStatItem}>
                <Users size={20} color="#1ea2b1" />
                <Text style={styles.additionalStatValue}>{posts.length}</Text>
                <Text style={styles.additionalStatLabel}>Posts</Text>
              </View>
              <View style={styles.additionalStatItem}>
                <Clock size={20} color="#1ea2b1" />
                <Text style={styles.additionalStatValue}>
                  {posts.length > 0 
                    ? new Date(posts[0].created_at).toLocaleDateString()
                    : 'No posts'
                  }
                </Text>
                <Text style={styles.additionalStatLabel}>Last Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Posts */}
        <View style={styles.rightColumn}>
          <View style={styles.postsHeader}>
            <Text style={styles.postsTitleDesktop}>Recent Posts ({posts.length})</Text>
            {posts.length > 0 && (
              <Text style={styles.postsSubtitle}>Latest activity from {profile.first_name}</Text>
            )}
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <View style={styles.noPostsIllustration}>
                <User size={48} color="#666666" />
              </View>
              <Text style={styles.noPostsTextDesktop}>No posts yet</Text>
              <Text style={styles.noPostsSubtitle}>This user hasn't posted anything yet</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.postsScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.postsScrollContent}
            >
              <View style={styles.postsGrid}>
                {posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.postItem, styles.postItemDesktop]}
                    onPress={() => navigateToPost(post.id, post.type)}
                  >
                    <Text style={styles.postContentDesktop} numberOfLines={4}>
                      {post.content}
                    </Text>
                    <View style={styles.postFooter}>
                      <View style={styles.postLocation}>
                        <MapPin size={14} color="#666666" />
                        <Text style={styles.postLocationTextDesktop}>
                          {post.location_name}
                        </Text>
                        <View style={styles.postTypeBadge}>
                          <Text style={styles.postTypeText}>
                            {post.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.postReactions}>
                        <Flame size={16} color="#ff6b35" />
                        <Text style={styles.postReactionCountDesktop}>
                          {post.post_reactions.filter(r => r.reaction_type === 'fire').length}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

// Mobile Layout Component
const MobileUserProfile = ({ profile, posts, fireCount, router, navigateToPost }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Profile Info */}
      <ScrollView style={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileIcon}>
              <Image
                source={{ uri: profile.avatar_url || 'https://via.placeholder.com/50' }}
                style={styles.profileIcon}
              />
            </View>
            <Text style={styles.profileName}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={styles.profileTitle}>{profile.selected_title}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Trophy size={20} color="#fbbf24" />
              <Text style={styles.statValue}>{profile.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Flame size={20} color="#ff6b35" />
              <Text style={styles.statValue}>{fireCount}</Text>
              <Text style={styles.statLabel}>Fire Received</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={20} color="#1ea2b1" />
              <Text style={styles.statValue}>Level {Math.floor(profile.points / 100) + 1}</Text>
              <Text style={styles.statLabel}>Explorer</Text>
            </View>
          </View>

          {profile.home && (
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#1ea2b1" />
              <Text style={styles.locationText}>Lives in {profile.home}</Text>
            </View>
          )}
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>Recent Posts ({posts.length})</Text>
          {posts.length === 0 ? (
            <Text style={styles.noPostsText}>No posts yet</Text>
          ) : (
            posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => navigateToPost(post.id, post.type)}
              >
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.postFooter}>
                  <View style={styles.postLocation}>
                    <MapPin size={12} color="#666666" />
                    <Text style={styles.postLocationText}>
                      {post.location_name}
                    </Text>
                  </View>
                  <View style={styles.postReactions}>
                    <Flame size={14} color="#ff6b35" />
                    <Text style={styles.postReactionCount}>
                      {post.post_reactions.filter(r => r.reaction_type === 'fire').length}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [fireCount, setFireCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Check if viewing own profile and redirect
  useEffect(() => {
    if (currentUserId && id === currentUserId) {
      // This is the current user's own profile, redirect to /profile
      router.replace('/profile');
      return;
    }
  }, [currentUserId, id, router]);

  useEffect(() => {
    if (id && currentUserId && id !== currentUserId) {
      loadUserData();
    }
  }, [id, currentUserId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load profile first
      await loadUserProfile();
      
      // Then load posts and fire count
      await Promise.all([
        loadUserPosts(),
        loadFireCount()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserPosts = async () => {
    try {
      // Load hub posts
      const { data: hubPosts, error: hubError } = await supabase
        .from('hub_posts')
        .select(`
          id, content, created_at,
          hubs (name),
          post_reactions (reaction_type)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (hubError) throw hubError;

      // Load stop posts
      const { data: stopPosts, error: stopError } = await supabase
        .from('stop_posts')
        .select(`
          id, content, created_at,
          stops (name),
          post_reactions (reaction_type)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (stopError) throw stopError;

      // Combine and format posts
      const combinedPosts = [
        ...(hubPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          type: 'hub' as const,
          location_name: post.hubs?.name || 'Unknown Hub',
          post_reactions: post.post_reactions || []
        })),
        ...(stopPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          type: 'stop' as const,
          location_name: post.stops?.name || 'Unknown Stop',
          post_reactions: post.post_reactions || []
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 20); // Increased limit for desktop scrolling

      setPosts(combinedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadFireCount = async () => {
    try {
      // Fetch all hub post IDs for the user
      const { data: hubPosts, error: hubPostError } = await supabase
        .from('hub_posts')
        .select('id')
        .eq('user_id', id);

      if (hubPostError) {
        console.error('Error fetching user hub post IDs:', hubPostError);
        return;
      }
      const hubPostIds = (hubPosts || []).map(p => p.id);

      const { data: stopPosts, error: stopPostError } = await supabase
        .from('stop_posts')
        .select('id')
        .eq('user_id', id);

      if (stopPostError) {
        console.error('Error fetching user stop post IDs:', stopPostError);
        return;
      }
      const stopPostIds = (stopPosts || []).map(p => p.id);

      const { data: fireReactions, error: fireError } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('reaction_type', 'fire')
        .or(`post_hub_id.in.(${hubPostIds.join(',')}),post_stop_id.in.(${stopPostIds.join(',')})`);

      if (fireError) {
        console.error('Error loading fire reactions:', fireError);
        return;
      }

      const totalFireCount = fireReactions?.length || 0;
      setFireCount(totalFireCount);
      
      // Update profile with fire count
      if (profile && profile.fire_count !== totalFireCount) {
        setProfile(prev => prev ? { ...prev, fire_count: totalFireCount } : null);
      }
    } catch (error) {
      console.error('Error loading fire count:', error);
    }
  };

  const navigateToPost = (postId: string, postType: 'hub' | 'stop') => {
    if (postType === 'hub') {
      router.push(`/post/${postId}`);
    } else {
      router.push(`/post/${postId}`);
    }
  };

  // Show loading while checking user or redirecting
  if (loading || (currentUserId && id === currentUserId)) {
    return <SkeletonLoader />;
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, isDesktop && styles.errorContainerDesktop]}>
        <Text style={[styles.errorText, isDesktop && styles.errorTextDesktop]}>User not found</Text>
        <TouchableOpacity style={[styles.backButton, styles.errorBackButton]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDesktop) {
    return (
      <DesktopUserProfile
        profile={profile}
        posts={posts}
        fireCount={fireCount}
        router={router}
        navigateToPost={navigateToPost}
      />
    );
  }

  return (
    <MobileUserProfile
      profile={profile}
      posts={posts}
      fireCount={fireCount}
      router={router}
      navigateToPost={navigateToPost}
    />
  );
}

const styles = StyleSheet.create({
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Skeleton Styles
  skeletonItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonCircle: {
    borderRadius: 9999,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainerDesktop: {
    paddingTop: 100,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  errorTextDesktop: {
    fontSize: 24,
  },
  errorBackButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopHeaderPlaceholder: {
    width: 100,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    flex: 1,
  },
  leftColumn: {
    width: '35%',
    minWidth: 0,
  },
  rightColumn: {
    width: '65%',
    minWidth: 0,
    flex: 1,
  },
  
  // Desktop Profile Card
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileCardDesktop: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  profileIconDesktop: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileNameDesktop: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 16,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  profileTitleDesktop: {
    fontSize: 18,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  
  // Desktop Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemDesktop: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 2,
  },
  statValueDesktop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statLabelDesktop: {
    fontSize: 14,
    color: '#666666',
  },
  
  // Desktop Location/Transport
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1ea2b115',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 8,
  },
  locationTextDesktop: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  transportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  transportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1ea2b115',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transportLabel: {
    color: '#666666',
    fontSize: 14,
    marginRight: 8,
  },
  transportValue: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500',
  },
  transportValueDesktop: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  
  // Additional Stats
  additionalStats: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  additionalStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  additionalStatsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  additionalStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#666666',
  },
  
  // Desktop Posts Scroll
  postsScrollView: {
    flex: 1,
    marginTop: 16,
  },
  postsScrollContent: {
    paddingBottom: 20,
  },
  
  // Desktop Posts
  postsHeader: {
    marginBottom: 16,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  postsTitleDesktop: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  postsSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  postsGrid: {
    gap: 16,
  },
  postItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postItemDesktop: {
    borderRadius: 16,
    padding: 20,
  },
  postContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 12,
  },
  postContentDesktop: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  postLocationTextDesktop: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    marginRight: 12,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postReactionCount: {
    fontSize: 12,
    color: '#ff6b35',
    marginLeft: 4,
    fontWeight: '500',
  },
  postReactionCountDesktop: {
    fontSize: 14,
    color: '#ff6b35',
    marginLeft: 6,
    fontWeight: '600',
  },
  
  // Post Type Badge
  postTypeBadge: {
    backgroundColor: '#1ea2b115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  postTypeText: {
    fontSize: 10,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  
  // No Posts Desktop
  noPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noPostsIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noPostsText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  noPostsTextDesktop: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  noPostsSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Mobile Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  
  // Mobile Posts Section
  postsSection: {
    paddingHorizontal: 20,
  },
  
  // Mobile Scroll Content
  scrollContent: {
    flex: 1,
  },
  bottomSpace: {
    height: 20,
  },
});