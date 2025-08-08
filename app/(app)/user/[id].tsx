import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity , Image } from 'react-native';
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
  hubs?: { name: string };
  stops?: { name: string };
  post_reactions: Array<{
    reaction_type: string;
  }>;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [fireCount, setFireCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserProfile();
      loadUserPosts();
      loadFireCount();
    }
  }, [id]);

  const loadUserProfile = async () => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      // Count fire reactions on user's posts
      const { data: fireData } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('reaction_type', 'fire')
        .in('post_hub_id', posts.map(p => p.id));

      const fireCount = fireData?.length || 0;

      setProfile({
        ...profileData,
        fire_count: fireCount,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    setLoading(false);
  };

  const loadUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hub_posts')
        .select(`
          id, content, created_at,
          hubs (name),
          stops (name),
          post_reactions (reaction_type)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadFireCount = async () => {
    try {
      // Count all fire reactions on this user's posts
      const { data, error } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('reaction_type', 'fire')
        .in('post_hub_id', posts.map(p => p.id));

      if (!error) {
        setFireCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading fire count:', error);
    }
  };

  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
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
    <ScrollView style={styles.container}>
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
            <Text style={styles.statValue}>{profile.fire_count || 0}</Text>
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

        {profile.preferred_transport && (
          <View style={styles.transportContainer}>
            <Text style={styles.transportLabel}>Preferred Transport:</Text>
            <Text style={styles.transportValue}>{profile.preferred_transport}</Text>
          </View>
        )}
      </View>

      {/* User Posts */}
      <View style={styles.postsSection}>
        <Text style={styles.postsTitle}>Recent Posts ({posts.length})</Text>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>No posts yet</Text>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postItem}
              onPress={() => navigateToPost(post.id)}
            >
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>
              <View style={styles.postFooter}>
                <View style={styles.postLocation}>
                  <MapPin size={12} color="#666666" />
                  <Text style={styles.postLocationText}>
                    {post.hubs?.name || post.stops?.name || 'Unknown'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
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
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 8,
  },
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