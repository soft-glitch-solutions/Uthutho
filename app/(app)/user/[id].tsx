import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, MapPin, Calendar, Award, Trophy, Home, Navigation, Users, MessageCircle, Share2, Edit3, MoreHorizontal, MessageSquare, Star, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LottieView from 'lottie-react-native';
import DotLottieReact from '@lottiefiles/dotlottie-react';

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
  bio?: string;
  avatar_url: string;
  created_at: string;
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

// Flame Animation Component
const FlameAnimation = () => {
  const flameAnimationRef = useRef(null);

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <LottieView
        ref={flameAnimationRef}
        source={require('@/assets/animations/Fire.json')}
        autoPlay={true}
        loop={true}
        style={styles.flameAnimation}
        resizeMode="contain"
      />
    );
  } else if (Platform.OS === 'web' && DotLottieReact) {
    return (
      <DotLottieReact
        src="https://lottie.host/6e77d5d1-f49d-4ee8-9b98-81c81905eca1/Gw8bwrnNTJ.lottie"
        loop
        autoplay={true}
        style={styles.flameAnimation}
      />
    );
  }
  
  return null;
};

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
            <View style={styles.profileCardSkeleton}>
              <SkeletonItem width="100%" height={160} style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
              <View style={styles.profileInfoSkeleton}>
                <SkeletonItem width={100} height={100} style={[styles.skeletonCircle, { position: 'absolute', top: -50 }]} />
                <SkeletonItem width={180} height={24} style={{ marginTop: 60, marginBottom: 8 }} />
                <SkeletonItem width={140} height={18} style={{ marginBottom: 16 }} />
                <SkeletonItem width="90%" height={16} style={{ marginBottom: 8 }} />
                <SkeletonItem width="80%" height={16} />
              </View>
            </View>
          </View>

          {/* Right Column Skeleton */}
          <View style={styles.rightColumn}>
            <View style={styles.statsGridSkeleton}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.statCardSkeleton}>
                  <SkeletonItem width={40} height={40} style={styles.skeletonCircle} />
                  <SkeletonItem width={60} height={20} style={{ marginTop: 8 }} />
                  <SkeletonItem width={40} height={14} style={{ marginTop: 4 }} />
                </View>
              ))}
            </View>
            
            <SkeletonItem width={120} height={24} style={{ marginTop: 32, marginBottom: 16 }} />
            
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.postSkeleton}>
                <SkeletonItem width="100%" height={80} style={{ marginBottom: 12 }} />
                <View style={styles.postFooterSkeleton}>
                  <SkeletonItem width={120} height={16} />
                  <SkeletonItem width={60} height={16} />
                </View>
              </View>
            ))}
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

      {/* Profile Banner Skeleton */}
      <SkeletonItem width="100%" height={200} style={{ marginBottom: 0 }} />
      
      {/* Profile Info Skeleton */}
      <View style={styles.mobileProfileInfoSkeleton}>
        <SkeletonItem width={100} height={100} style={[styles.skeletonCircle, { position: 'absolute', top: -50 }]} />
        <SkeletonItem width={150} height={24} style={{ marginTop: 60, marginBottom: 8 }} />
        <SkeletonItem width={100} height={16} style={{ marginBottom: 16 }} />
        <SkeletonItem width={200} height={16} style={{ marginBottom: 8 }} />
        <SkeletonItem width={180} height={16} />
      </View>

      {/* Stats Skeleton */}
      <View style={styles.mobileStatsRowSkeleton}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.mobileStatItemSkeleton}>
            <SkeletonItem width={40} height={40} style={styles.skeletonCircle} />
            <SkeletonItem width={40} height={16} style={{ marginTop: 8 }} />
            <SkeletonItem width={30} height={12} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Posts Skeleton */}
      <View style={styles.mobilePostsSection}>
        <SkeletonItem width={120} height={20} style={{ marginBottom: 16 }} />
        {[1, 2].map((item) => (
          <View key={item} style={styles.mobilePostSkeleton}>
            <SkeletonItem width="100%" height={60} style={{ marginBottom: 12 }} />
            <View style={styles.mobilePostFooterSkeleton}>
              <SkeletonItem width={80} height={14} />
              <SkeletonItem width={40} height={14} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Helper function to format member since date
const formatMemberSince = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Desktop Layout Component
const DesktopUserProfile = ({ profile, posts, fireCount, router, navigateToPost }) => {
  const memberSince = formatMemberSince(profile.created_at);
  const userLevel = Math.floor(profile.points / 100) + 1;

  return (
    <ScrollView style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.desktopHeaderRight}>
          <TouchableOpacity style={styles.messageButton}>
            <MessageSquare size={20} color="#ffffff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={20} color="#1ea2b1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Banner */}
      <View style={styles.desktopBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop' }}
          style={styles.desktopBannerImage}
          blurRadius={2}
        />
        <View style={styles.desktopBannerOverlay} />
        
        {/* Profile Info in Banner */}
        <View style={styles.desktopProfileInfo}>
          <View style={styles.desktopProfileAvatarContainer}>
            <Image
              source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.desktopProfileAvatar}
            />
            <View style={styles.desktopActiveBadge} />
          </View>
          
          <View style={styles.desktopProfileTextContainer}>
            <Text style={styles.desktopProfileName}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={styles.desktopProfileUsername}>
              @{profile.first_name.toLowerCase()}_{profile.last_name.toLowerCase()}
            </Text>
            <Text style={styles.desktopProfileTitle}>{profile.selected_title}</Text>
          </View>
        </View>
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopContent}>
        {/* Left Column - Bio and Info */}
        <View style={styles.desktopLeftColumn}>
          {/* Bio Section */}
          <View style={styles.desktopBioCard}>
            <Text style={styles.sectionTitle}>About</Text>
            {profile.bio ? (
              <Text style={styles.desktopBioText}>{profile.bio}</Text>
            ) : (
              <Text style={styles.desktopBioPlaceholder}>
                {profile.first_name} hasn't added a bio yet.
              </Text>
            )}
            
            <View style={styles.desktopInfoGrid}>
              {profile.home && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <MapPin size={16} color="#1ea2b1" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{profile.home}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Calendar size={16} color="#1ea2b1" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{memberSince}</Text>
                </View>
              </View>
              
              {profile.preferred_transport && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Navigation size={16} color="#1ea2b1" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Preferred Transport</Text>
                    <Text style={styles.infoValue}>{profile.preferred_transport}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.desktopStatsCard}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                  <Trophy size={20} color="#fbbf24" />
                </View>
                <View>
                  <Text style={styles.statValue}>{profile.points.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                  <View style={styles.flameAnimationContainer}>
                    <FlameAnimation />
                  </View>
                </View>
                <View>
                  <Text style={styles.statValue}>{fireCount}</Text>
                  <Text style={styles.statLabel}>Flames</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
                  <Award size={20} color="#1ea2b1" />
                </View>
                <View>
                  <Text style={styles.statValue}>{userLevel}</Text>
                  <Text style={styles.statLabel}>Level</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Users size={20} color="#8b5cf6" />
                </View>
                <View>
                  <Text style={styles.statValue}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Posts */}
        <View style={styles.desktopRightColumn}>
          {/* Activity Header */}
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <Text style={styles.activitySubtitle}>{posts.length} posts</Text>
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <MessageSquare size={48} color="#333333" />
              </View>
              <Text style={styles.emptyStateTitle}>No posts yet</Text>
              <Text style={styles.emptyStateText}>
                When {profile.first_name} shares something, it will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.slice(0, 6).map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => navigateToPost(post.id, post.type)}
                >
                  <Text style={styles.postContent} numberOfLines={4}>
                    {post.content}
                  </Text>
                  <View style={styles.postFooter}>
                    <View style={styles.postMeta}>
                      <View style={styles.postLocation}>
                        <MapPin size={12} color="#666666" />
                        <Text style={styles.postLocationText}>
                          {post.location_name}
                        </Text>
                      </View>
                      <Text style={styles.postTime}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                    <View style={styles.postActions}>
                      <View style={styles.postReactions}>
                        <View style={styles.flameIconSmall}>
                          <FlameAnimation />
                        </View>
                        <Text style={styles.postReactionCount}>
                          {post.post_reactions.filter(r => r.reaction_type === 'fire').length}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Mobile Layout Component
const MobileUserProfile = ({ profile, posts, fireCount, router, navigateToPost }) => {
  const memberSince = formatMemberSince(profile.created_at);
  const userLevel = Math.floor(profile.points / 100) + 1;
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [-50, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.mobileHeader,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}>
        <TouchableOpacity style={styles.mobileBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>Profile</Text>
        <View style={styles.mobileHeaderActions}>
          <TouchableOpacity style={styles.mobileMessageButton}>
            <MessageSquare size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileShareButton}>
            <Share2 size={20} color="#1ea2b1" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Banner */}
        <View style={styles.mobileBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop' }}
            style={styles.mobileBannerImage}
            blurRadius={2}
          />
          <View style={styles.mobileBannerOverlay} />
        </View>

        {/* Profile Info */}
        <View style={styles.mobileProfileInfo}>
          <View style={styles.mobileAvatarContainer}>
            <Image
              source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.mobileAvatar}
            />
            <View style={styles.mobileActiveBadge} />
          </View>
          
          <Text style={styles.mobileProfileName}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.mobileProfileUsername}>
            @{profile.first_name.toLowerCase()}_{profile.last_name.toLowerCase()}
          </Text>
          <Text style={styles.mobileProfileTitle}>{profile.selected_title}</Text>
        </View>

        {/* Stats */}
        <View style={styles.mobileStats}>
          <View style={styles.mobileStatsGrid}>
            <View style={styles.mobileStatCard}>
              <Text style={styles.mobileStatValue}>{profile.points.toLocaleString()}</Text>
              <Text style={styles.mobileStatLabel}>Points</Text>
            </View>
            
            <View style={styles.mobileStatCard}>
              <Text style={styles.mobileStatValue}>{fireCount}</Text>
              <Text style={styles.mobileStatLabel}>Flames</Text>
            </View>
            
            <View style={styles.mobileStatCard}>
              <Text style={styles.mobileStatValue}>{userLevel}</Text>
              <Text style={styles.mobileStatLabel}>Level</Text>
            </View>
            
            <View style={styles.mobileStatCard}>
              <Text style={styles.mobileStatValue}>{posts.length}</Text>
              <Text style={styles.mobileStatLabel}>Posts</Text>
            </View>
          </View>
        </View>

        {/* Bio and Info */}
        <View style={styles.mobileBioCard}>
          <Text style={styles.mobileSectionTitle}>About</Text>
          {profile.bio ? (
            <Text style={styles.mobileBioText}>{profile.bio}</Text>
          ) : (
            <Text style={styles.mobileBioPlaceholder}>
              {profile.first_name} hasn't added a bio yet.
            </Text>
          )}
          
          <View style={styles.mobileInfoGrid}>
            {profile.home && (
              <View style={styles.mobileInfoItem}>
                <MapPin size={16} color="#1ea2b1" />
                <Text style={styles.mobileInfoText}>{profile.home}</Text>
              </View>
            )}
            
            <View style={styles.mobileInfoItem}>
              <Calendar size={16} color="#1ea2b1" />
              <Text style={styles.mobileInfoText}>Joined {memberSince}</Text>
            </View>
            
            {profile.preferred_transport && (
              <View style={styles.mobileInfoItem}>
                <Navigation size={16} color="#1ea2b1" />
                <Text style={styles.mobileInfoText}>{profile.preferred_transport}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.mobilePostsSection}>
          <View style={styles.mobileActivityHeader}>
            <Text style={styles.mobileActivityTitle}>Recent Activity</Text>
            {posts.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.mobileViewAllText}>View all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.mobileEmptyState}>
              <MessageSquare size={32} color="#333333" />
              <Text style={styles.mobileEmptyStateTitle}>No posts yet</Text>
              <Text style={styles.mobileEmptyStateText}>
                When {profile.first_name} shares something, it will appear here.
              </Text>
            </View>
          ) : (
            posts.slice(0, 3).map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.mobilePostCard}
                onPress={() => navigateToPost(post.id, post.type)}
              >
                <Text style={styles.mobilePostContent} numberOfLines={3}>
                  {post.content}
                </Text>
                <View style={styles.mobilePostFooter}>
                  <View style={styles.mobilePostMeta}>
                    <View style={styles.mobilePostLocation}>
                      <MapPin size={12} color="#666666" />
                      <Text style={styles.mobilePostLocationText}>
                        {post.location_name}
                      </Text>
                    </View>
                    <Text style={styles.mobilePostTime}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.mobilePostReactions}>
                    <View style={styles.mobileFlameIconSmall}>
                      <FlameAnimation />
                    </View>
                    <Text style={styles.mobilePostReactionCount}>
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
    </View>
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
      const { data: hubPosts, error: hubError } = await supabase
        .from('hub_posts')
        .select(`
          id, content, created_at,
          hubs (name),
          post_reactions (reaction_type)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (hubError) throw hubError;

      const { data: stopPosts, error: stopError } = await supabase
        .from('stop_posts')
        .select(`
          id, content, created_at,
          stops (name),
          post_reactions (reaction_type)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (stopError) throw stopError;

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
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(combinedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadFireCount = async () => {
    try {
      const { data: hubPosts } = await supabase
        .from('hub_posts')
        .select('id')
        .eq('user_id', id);

      const hubPostIds = (hubPosts || []).map(p => p.id);

      const { data: stopPosts } = await supabase
        .from('stop_posts')
        .select('id')
        .eq('user_id', id);

      const stopPostIds = (stopPosts || []).map(p => p.id);

      const { data: fireReactions } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('reaction_type', 'fire')
        .or(`post_hub_id.in.(${hubPostIds.join(',')}),post_stop_id.in.(${stopPostIds.join(',')})`);

      const totalFireCount = fireReactions?.length || 0;
      setFireCount(totalFireCount);
    } catch (error) {
      console.error('Error loading fire count:', error);
    }
  };

  const navigateToPost = (postId: string, postType: 'hub' | 'stop') => {
    router.push(`/post/${postId}?type=${postType}`);
  };

  if (loading || (currentUserId && id === currentUserId)) {
    return <SkeletonLoader />;
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, isDesktop && styles.errorContainerDesktop]}>
        <Text style={[styles.errorText, isDesktop && styles.errorTextDesktop]}>User not found</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
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
  },
  
  // Flame Animation
  flameAnimation: {
    width: 20,
    height: 20,
  },
  flameAnimationContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameIconSmall: {
    width: 16,
    height: 16,
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
  profileCardSkeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileInfoSkeleton: {
    padding: 24,
    alignItems: 'center',
  },
  statsGridSkeleton: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCardSkeleton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  postSkeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  postFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileProfileInfoSkeleton: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: -50,
    borderRadius: 20,
    padding: 24,
    paddingTop: 70,
    alignItems: 'center',
  },
  mobileStatsRowSkeleton: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mobileStatItemSkeleton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  mobilePostsSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mobilePostSkeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mobilePostFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
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
  desktopHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Desktop Banner
  desktopBanner: {
    height: 280,
    position: 'relative',
  },
  desktopBannerImage: {
    width: '100%',
    height: '100%',
  },
  desktopBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  desktopProfileInfo: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
  },
  desktopProfileAvatarContainer: {
    position: 'relative',
  },
  desktopProfileAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  desktopActiveBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#000000',
  },
  desktopProfileTextContainer: {
    flex: 1,
    paddingBottom: 8,
  },
  desktopProfileName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  desktopProfileUsername: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 8,
  },
  desktopProfileTitle: {
    fontSize: 20,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  
  // Desktop Content
  desktopContent: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
    gap: 32,
  },
  desktopLeftColumn: {
    width: '40%',
    minWidth: 0,
  },
  desktopRightColumn: {
    width: '60%',
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
  },
  
  // Desktop Bio Card
  desktopBioCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  desktopBioText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 24,
  },
  desktopBioPlaceholder: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  desktopInfoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Desktop Stats Card
  desktopStatsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  
  // Desktop Posts
  activityHeader: {
    marginBottom: 24,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 300,
  },
  postsGrid: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postContent: {
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
  postMeta: {
    flex: 1,
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postLocationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postReactionCount: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
  },
  
  // Mobile Header
  mobileHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  mobileBackButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mobileHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileMessageButton: {
    backgroundColor: '#1ea2b1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileShareButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Mobile Banner
  mobileBanner: {
    height: 200,
    position: 'relative',
  },
  mobileBannerImage: {
    width: '100%',
    height: '100%',
  },
  mobileBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  // Mobile Profile Info
  mobileProfileInfo: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: -60,
    borderRadius: 20,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  mobileAvatarContainer: {
    position: 'absolute',
    top: -60,
    alignItems: 'center',
  },
  mobileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#1a1a1a',
  },
  mobileActiveBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  mobileProfileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileProfileUsername: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  mobileProfileTitle: {
    fontSize: 18,
    color: '#1ea2b1',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Mobile Stats
  mobileStats: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  mobileStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mobileStatCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  mobileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  mobileStatLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  
  // Mobile Bio Card
  mobileBioCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  mobileSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  mobileBioText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  mobileBioPlaceholder: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  mobileInfoGrid: {
    gap: 12,
  },
  mobileInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  mobileInfoText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  
  // Mobile Posts
  mobilePostsSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mobileActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mobileActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mobileViewAllText: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  mobileEmptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileEmptyStateTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  mobileEmptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  mobilePostCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  mobilePostContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 12,
  },
  mobilePostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobilePostMeta: {
    flex: 1,
  },
  mobilePostLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mobilePostLocationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  mobilePostTime: {
    fontSize: 11,
    color: '#666666',
  },
  mobilePostReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mobileFlameIconSmall: {
    width: 14,
    height: 14,
  },
  mobilePostReactionCount: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '600',
  },
  
  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  bottomSpace: {
    height: 20,
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
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Common Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
});