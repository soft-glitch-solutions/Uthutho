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
  Dimensions,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, BookmarkCheck, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useFavorites } from '@/hook/useFavorites';
import PostCard from '@/components/feeds/PostCard';
import SkeletonLoader from '@/components/feeds/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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

// Desktop Skeleton Loader
const DesktopSkeletonLoader = () => (
  <View style={[styles.container, styles.containerDesktop]}>
    <View style={styles.desktopWrapper}>
      {/* Left Column - Community Info */}
      <View style={styles.desktopLeftColumn}>
        {/* Header Skeleton */}
        <View style={styles.headerDesktop}>
          <View style={[styles.skeletonCircle, styles.skeleton]} />
          <View style={[styles.skeletonHeaderTitle, styles.skeleton]} />
          <View style={[styles.skeletonCircle, styles.skeleton]} />
        </View>

        {/* Community Info Skeleton */}
        <View style={styles.skeletonCommunityInfo}>
          <View style={[styles.skeletonTextLarge, styles.skeleton]} />
          <View style={[styles.skeletonTextMedium, styles.skeleton]} />
          <View style={[styles.skeletonBadge, styles.skeleton]} />
        </View>

        {/* Preview Notice Skeleton */}
        <View style={[styles.skeletonPreviewNotice, styles.skeleton]} />
      </View>

      {/* Right Column - Posts */}
      <View style={styles.desktopRightColumn}>
        {/* Posts Skeleton */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeletonPost, styles.skeleton]}>
            <View style={styles.skeletonPostHeader}>
              <View style={[styles.skeletonCircle, styles.skeleton]} />
              <View>
                <View style={[styles.skeletonTextMedium, styles.skeleton]} />
                <View style={[styles.skeletonTextSmall, styles.skeleton]} />
              </View>
            </View>
            <View style={[styles.skeletonTextLarge, styles.skeleton]} />
            <View style={[styles.skeletonTextMedium, styles.skeleton]} />
          </View>
        ))}
      </View>
    </View>
  </View>
);

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
    return isDesktop ? <DesktopSkeletonLoader /> : <SkeletonLoader />;
  }

  // Desktop Layout
  if (isDesktop) {
    return (
      <View style={[styles.container, styles.containerDesktop]}>
        <View style={styles.desktopWrapper}>
          {/* Left Column - Community Info */}
          <View style={styles.desktopLeftColumn}>
            {/* Header */}
            <View style={styles.headerDesktop}>
              <TouchableOpacity style={[styles.backButton, styles.backButtonDesktop]} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.headerTitleDesktop}>
                <Text style={styles.headerTitleTextDesktop}>Community Preview</Text>
              </View>

              <TouchableOpacity style={[styles.followButton, styles.followButtonDesktop]} onPress={toggleFollow}>
                {isFollowing ? (
                  <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
                ) : (
                  <Bookmark size={24} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Community Info */}
            <View style={[styles.communityInfo, styles.communityInfoDesktop]}>
              <Text style={[styles.communityName, styles.communityNameDesktop]}>
                {community?.name || communityName}
              </Text>
              <Text style={[styles.communityType, styles.communityTypeDesktop]}>
                {communityType === 'hub' ? 'Transport Hub' : 'Bus Stop'}
              </Text>
              
              <View style={[styles.followerContainer, styles.followerContainerDesktop]}>
                <Users size={16} color="#1ea2b1" />
                <Text style={[styles.followerText, styles.followerTextDesktop]}>
                  {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                </Text>
              </View>
            </View>

            {/* Preview Notice */}
            <View style={[styles.previewNotice, styles.previewNoticeDesktop]}>
              <Text style={[styles.previewNoticeText, styles.previewNoticeTextDesktop]}>
                👀 You're previewing this community. Join to post and comment.
              </Text>
            </View>

            {/* Join Community CTA */}
            {!isFollowing && (
              <View style={styles.joinCTADesktop}>
                <TouchableOpacity 
                  style={[styles.joinButton, styles.joinButtonDesktop]}
                  onPress={toggleFollow}
                >
                  <Bookmark size={20} color="#ffffff" />
                  <Text style={[styles.joinButtonText, styles.joinButtonTextDesktop]}>Join Community</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Right Column - Posts */}
          <View style={styles.desktopRightColumn}>
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
                  disabled={!isFollowing}
                  isDesktop={isDesktop}
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
                <View style={[styles.emptyState, styles.emptyStateDesktop]}>
                  <Text style={[styles.emptyStateText, styles.emptyStateTextDesktop]}>No posts yet</Text>
                  <Text style={[styles.emptyStateSubtext, styles.emptyStateSubtextDesktop]}>
                    Be the first to post in this community
                  </Text>
                </View>
              }
              contentContainerStyle={[styles.postsList, styles.postsListDesktop]}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    );
  }

  // Mobile Layout
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
            disabled={!isFollowing}
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
  containerDesktop: {
    width: '100%',
  },
  
  // Desktop layout
  desktopWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  },
  desktopLeftColumn: {
    width: '30%',
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  desktopRightColumn: {
    width: '70%',
    paddingLeft: 24,
    height: '100%',
  },
  
  // Header
  headerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitleDesktop: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleTextDesktop: {
    fontSize: 20,
  },
  
  // Community Info
  communityInfoDesktop: {
    padding: 0,
    alignItems: 'flex-start',
    borderBottomWidth: 0,
    marginBottom: 24,
  },
  communityNameDesktop: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'left',
  },
  communityTypeDesktop: {
    fontSize: 18,
    marginBottom: 16,
  },
  
  // Follower container
  followerContainerDesktop: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  followerTextDesktop: {
    fontSize: 15,
    marginLeft: 6,
  },
  
  // Preview Notice
  previewNoticeDesktop: {
    margin: 0,
    marginBottom: 24,
    padding: 16,
    borderRadius: 10,
  },
  previewNoticeTextDesktop: {
    fontSize: 15,
    textAlign: 'left',
  },
  
  // Join CTA
  joinCTADesktop: {
    position: 'relative',
    bottom: 'auto',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: 0,
    borderTopWidth: 0,
    marginBottom: 24,
  },
  joinButtonDesktop: {
    width: '100%',
  },
  joinButtonTextDesktop: {
    fontSize: 15,
  },
  
  // Posts List
  postsListDesktop: {
    paddingBottom: 40,
  },
  
  // Empty State
  emptyStateDesktop: {
    paddingVertical: 80,
  },
  emptyStateTextDesktop: {
    fontSize: 18,
  },
  emptyStateSubtextDesktop: {
    fontSize: 15,
  },
  
  // Skeleton styles
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonHeaderTitle: {
    height: 24,
    width: '60%',
  },
  skeletonCommunityInfo: {
    marginBottom: 24,
  },
  skeletonTextLarge: {
    height: 28,
    width: '80%',
    marginBottom: 12,
  },
  skeletonTextMedium: {
    height: 16,
    width: '60%',
    marginBottom: 8,
  },
  skeletonTextSmall: {
    height: 12,
    width: '40%',
    marginBottom: 4,
  },
  skeletonBadge: {
    height: 32,
    width: 120,
    borderRadius: 16,
  },
  skeletonPreviewNotice: {
    height: 60,
    marginBottom: 24,
  },
  skeletonPost: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  skeletonPostHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  
  // Keep all existing mobile styles below
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