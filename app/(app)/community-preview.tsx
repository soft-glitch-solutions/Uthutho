import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, BookmarkCheck, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useFavorites } from '@/hook/useFavorites';
import PostCard from '@/components/feeds/PostCard';
import SkeletonLoader from '@/components/feeds/SkeletonLoader';

interface Community {
  id: string;
  name: string;
  type: 'hub' | 'stop';
  latitude: number;
  longitude: number;
  address?: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  selected_title: string;
  avatar_url?: string;
}

interface PostReaction {
  reaction_type: string;
  user_id: string;
}

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: UserProfile;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  profiles: UserProfile;
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

export default function CommunityPreviewScreen() {
  const { communityId, communityType, communityName } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [sharingPost, setSharingPost] = useState(false);
  const viewShotRefs = React.useRef<Record<string, any>>({});

  useEffect(() => {
    if (communityId && communityType) {
      loadCommunityDetails();
      loadCommunityPosts();
      loadFollowerCount();
      checkIfFollowing();
    }
  }, [communityId, communityType]);

  const loadCommunityDetails = async () => {
    try {
      const table = communityType === 'hub' ? 'hubs' : 'stops';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', communityId)
        .single();

      if (error) throw error;
      
      setCommunity({
        ...data,
        type: communityType as 'hub' | 'stop'
      });
    } catch (error) {
      console.error('Error loading community details:', error);
    }
  };

  const loadFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', communityType)
        .eq('entity_id', communityId);

      if (!error) {
        setFollowerCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const checkIfFollowing = async () => {
    try {
      if (!user) return;
      
      const isFav = isFavorite(communityId as string);
      setIsFollowing(isFav);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const loadCommunityPosts = async () => {
    try {
      const table = communityType === 'hub' ? 'hub_posts' : 'stop_posts';
      const communityIdField = communityType === 'hub' ? 'hub_id' : 'stop_id';

      const { data, error } = await supabase
        .from(table)
        .select(`
          *,
          profiles(*),
          post_reactions(*),
          post_comments(*, profiles(*))
        `)
        .eq(communityIdField, communityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithProfiles = (data || []).map((post: any) => ({
        ...post,
        profiles: post.profiles || {
          first_name: 'Unknown',
          last_name: '',
          selected_title: '',
          avatar_url: 'https://via.placeholder.com/40x40/333333/ffffff?text=U',
        },
        post_comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          profiles: comment.profiles || {
            first_name: 'Unknown',
            last_name: '',
            avatar_url: 'https://via.placeholder.com/40x40/333333/ffffff?text=U',
          },
        })),
      }));

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCommunityPosts(),
        loadFollowerCount(),
        checkIfFollowing()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFollow = async () => {
    try {
      if (!user) {
        Alert.alert('Login Required', 'Please login to follow this community.');
        return;
      }

      if (!community) return;

      const entityType = community.type;
      const entityId = community.id;
      const isCurrentlyFollowing = isFollowing;
      const delta = isCurrentlyFollowing ? -1 : 1;

      // Optimistic UI update
      setIsFollowing(!isCurrentlyFollowing);
      setFollowerCount(prev => Math.max(0, prev + delta));

      try {
        if (isCurrentlyFollowing) {
          const { error: favErr } = await supabase.rpc('remove_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          await removeFromFavorites(entityId);
        } else {
          const { error: favErr } = await supabase.rpc('add_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          await addToFavorites({ 
            id: entityId, 
            type: entityType, 
            name: community.name, 
            data: community 
          });
        }
      } catch (e) {
        // Revert optimistic change on error
        setIsFollowing(isCurrentlyFollowing);
        setFollowerCount(prev => Math.max(0, prev - delta));
        console.error('Follow toggle failed:', e);
        Alert.alert('Error', 'Could not update follow status. Please try again.');
      }
    } catch (error) {
      console.error('Error in toggleFollow:', error);
    }
  };

  const toggleReaction = async (postId: string, reactionType: string) => {
    try {
      if (!user) {
        Alert.alert('Login Required', 'Please login to react to posts.');
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const existingReaction = post.post_reactions
        .find(r => r.user_id === user.id && r.reaction_type === reactionType);

      if (existingReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType)
          .eq(post.hub_id ? 'hub_post_id' : 'stop_post_id', postId);
      } else {
        const reactionData: any = {
          user_id: user.id,
          reaction_type: reactionType,
        };

        if (post.hub_id) {
          reactionData.hub_post_id = postId;
        } else {
          reactionData.stop_post_id = postId;
        }

        await supabase
          .from('post_reactions')
          .insert([reactionData]);
      }

      await loadCommunityPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const sharePost = async (post: Post) => {
    try {
      setSharingPost(true);
      
      const communityName = community?.name || "Uthutho Community";
      const userName = `${post.profiles.first_name} ${post.profiles.last_name}`;
      const shareUrl = `https://mobile.uthutho.co.za/post/${post.id}`;

      const message = `Check out ${userName}'s post in ${communityName} on Uthutho`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Post from ${communityName}`,
            text: message,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          Alert.alert('Link copied', 'Post link has been copied to your clipboard');
        }
      } else {
        Alert.alert('Share Post', `Share this post: ${shareUrl}`);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setSharingPost(false);
    }
  };

  const downloadPost = async (post: Post) => {
    try {
      setSharingPost(true);
      // For now, just share since download requires more setup
      await sharePost(post);
    } catch (error) {
      console.error('Error downloading post:', error);
      Alert.alert('Error', 'Failed to download post');
    } finally {
      setSharingPost(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Community Preview</Text>
        </View>

        <TouchableOpacity style={styles.followButton} onPress={toggleFollow}>
          {isFollowing ? (
            <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
          ) : (
            <Bookmark size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Community Info */}
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>
          {community?.name || communityName}
        </Text>
        <Text style={styles.communityType}>
          {communityType === 'hub' ? 'Transport Hub' : 'Bus Stop'}
        </Text>
        
        <View style={styles.followerContainer}>
          <Users size={16} color="#1ea2b1" />
          <Text style={styles.followerText}>
            {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
          </Text>
        </View>
      </View>

      {/* Preview Notice */}
      <View style={styles.previewNotice}>
        <Text style={styles.previewNoticeText}>
          👀 You're previewing this community. Join to post and comment.
        </Text>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={user?.id || ''}
            toggleReaction={toggleReaction}
            sharePost={sharePost}
            downloadPost={downloadPost}
            sharingPost={sharingPost}
            router={router}
            viewShotRef={(ref: any) => {
              viewShotRefs.current[item.id] = ref;
            }}
            disabled={!isFollowing} // Disable interactions if not following
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={['#1ea2b1']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to post in this community
            </Text>
          </View>
        }
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Join Community CTA */}
      {!isFollowing && (
        <View style={styles.joinCTA}>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={toggleFollow}
          >
            <Bookmark size={20} color="#ffffff" />
            <Text style={styles.joinButtonText}>Join Community</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  communityName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  communityType: {
    color: '#1ea2b1',
    fontSize: 16,
    marginBottom: 12,
  },
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
  previewNotice: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1ea2b1',
  },
  previewNoticeText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
  },
  postsList: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
  joinCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  joinButton: {
    backgroundColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});