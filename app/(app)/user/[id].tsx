import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, Flame, MapPin, Calendar, Award, Trophy } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [fireCount, setFireCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserData();
    }
  }, [id]);

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
       .slice(0, 10); // Limit to 10 most recent posts

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

      if (hubPostError || stopPostError) {
        console.error('Error fetching user stop post IDs:', stopPostError);
        return;
      }
      const stopPostIds = (stopPosts || []).map(p => p.id);

      const { data: fireReactions, error: fireError } = await supabase
        .from('post_reactions')
        .select('id') // Just need the count, so selecting 'id' is sufficient
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
        // Optionally, you might want to update the database as well
        // const { error: updateError } = await supabase
        //   .from('profiles')
        //   .update({ fire_count: totalFireCount })
        //   .eq('id', id);
        // if (updateError) {
        //   console.error('Error updating profile fire count:', updateError);
        // }
      }
    } catch (error) {
      console.error('Error loading fire count:', error);
    }
  };

  const navigateToPost = (postId: string, postType: 'hub' | 'stop') => {
    if (postType === 'hub') {
      router.push(`/hub-post-details?postId=${postId}`);
    } else {
      router.push(`/stop-post-details?postId=${postId}`);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <ScrollView>
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
      </ScrollView>
      <View style={styles.bottomSpace} />
 </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1, // Ensure header is above scrolling content
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
  // Profile Card Styles
  profileCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginTop: 20, // Overlap with the bottom of the header for a smoother look
    borderColor: '#333333',
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
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 8,
  },
  transportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  // Posts Section Styles
  postsSection: {
    paddingHorizontal: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  noPostsText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  postItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 12,
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
  bottomSpace: {
    height: 20,
  },
});