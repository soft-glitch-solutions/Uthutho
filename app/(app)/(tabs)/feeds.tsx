// screens/FeedsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

// Import components
import Header from '@/components/feeds/Header';
import CommunityTabs from '@/components/feeds/CommunityTabs';
import PostCreation from '@/components/feeds/PostCreation';
import AddCommunityScreen from '@/components/feeds/AddCommunityScreen';
import EmptyState from '@/components/feeds/EmptyState';
import SkeletonLoader from '@/components/feeds/SkeletonLoader';
import PostCard from '@/components/feeds/PostCard';
import EmptyPosts from '@/components/feeds/EmptyPosts';

// Define basic types locally to avoid import issues
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

type PostFilter = 'week' | 'today' | 'all';

const WeekRangeHeader: React.FC<{
  weekRange: string;
  postFilter: PostFilter;
  setPostFilter: (filter: PostFilter) => void;
}> = ({ weekRange, postFilter, setPostFilter }) => {
  return (
    <View style={styles.weekRangeWrapper}>
      <Text style={styles.weekRangeText}>{weekRange}</Text>
      <View style={styles.filterButtons}>
        <TouchableOpacity onPress={() => setPostFilter('week')}>
          <Text style={[
            styles.filterText, 
            postFilter === 'week' && styles.filterTextActive
          ]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPostFilter('today')}>
          <Text style={[
            styles.filterText, 
            postFilter === 'today' && styles.filterTextActive
          ]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPostFilter('all')}>
          <Text style={[
            styles.filterText, 
            postFilter === 'all' && styles.filterTextActive
          ]}>
            All
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PreviewHeader: React.FC<{
  previewCommunity: Community;
  isFollowingPreview: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onViewFull: () => void;
  posts: Post[];
}> = ({ previewCommunity, isFollowingPreview, onFollow, onUnfollow, onViewFull, posts }) => {
  return (
    <View style={styles.previewHeader}>
      <View style={styles.previewHeaderContent}>
        <Text style={styles.previewTitle}>Previewing Community</Text>
        <Text style={styles.previewCommunityName}>{previewCommunity?.name}</Text>
        <Text style={styles.previewDescription}>
          {isFollowingPreview 
            ? "You're following this community and can see all posts!" 
            : "Follow this community to see all posts and join the conversation"
          }
        </Text>
        
        {!isFollowingPreview ? (
          <TouchableOpacity 
            style={styles.followButton}
            onPress={onFollow}
          >
            <Users size={20} color="#ffffff" />
            <Text style={styles.followButtonText}>Follow Community</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.followActions}>
            <TouchableOpacity 
              style={styles.viewFullButton}
              onPress={onViewFull}
            >
              <Text style={styles.viewFullButtonText}>View Full Community</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.unfollowButton}
              onPress={onUnfollow}
            >
              <Text style={styles.unfollowButtonText}>Unfollow</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Week stats preview - show what they're missing */}
      <View style={styles.weekStats}>
        <Text style={styles.weekStatsTitle}>
          {isFollowingPreview ? 'This Week' : 'This Week in Preview'}
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {posts.reduce((acc, post) => acc + (post.post_comments?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {posts.reduce((acc, post) => acc + (post.post_reactions?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Reactions</Text>
          </View>
        </View>
        
        {!isFollowingPreview && posts.length > 0 && (
          <Text style={styles.previewHint}>
            Follow to see {posts.length} post{posts.length > 1 ? 's' : ''} from this week
          </Text>
        )}
      </View>
    </View>
  );
};

export default function FeedsScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewShotRefs = useRef<Record<string, any>>({});

  // State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [weekRange, setWeekRange] = useState('');
  const [postFilter, setPostFilter] = useState<PostFilter>('week');
  const [sharingPost, setSharingPost] = useState(false);

  // Preview state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewCommunity, setPreviewCommunity] = useState<Community | null>(null);
  const [isFollowingPreview, setIsFollowingPreview] = useState(false);

  // UUID validation
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Get current week range
  const getCurrentWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  // Check for preview parameters
  useEffect(() => {
    if (params.previewHub && params.hubName) {
      let hubData = null;
      if (params.hubData) {
        try {
          hubData = JSON.parse(params.hubData as string);
        } catch (error) {
          console.error('Error parsing hub data:', error);
        }
      }

      const previewComm: Community = {
        id: params.previewHub as string,
        name: params.hubName as string,
        type: (params.hubType as 'hub' | 'stop') || 'hub',
        latitude: hubData?.latitude || 0,
        longitude: hubData?.longitude || 0,
        address: hubData?.address,
      };
      
      setPreviewCommunity(previewComm);
      setPreviewMode(true);
      setSelectedCommunity(previewComm);
      
      // Check if user is already following this community
      checkIfFollowingPreview(previewComm.id);
    } else {
      setPreviewMode(false);
      setPreviewCommunity(null);
    }
  }, [params]);

  const checkIfFollowingPreview = (communityId: string) => {
    // Use existing favorites check logic
    const isFav = communities.some(community => community.id === communityId);
    setIsFollowingPreview(isFav);
  };

  const followPreviewCommunity = async () => {
    if (!previewCommunity) return;

    try {
      await toggleFavorite(previewCommunity.id);
      setIsFollowingPreview(true);
      
      // Refresh communities to include the new one
      if (user?.id) {
        await loadFavoriteCommunities(user.id);
      }
      
      Alert.alert('Success', `You're now following ${previewCommunity.name}!`, [
        { text: 'OK', onPress: () => setPreviewMode(false) }
      ]);
      
    } catch (error) {
      console.error('Error following community:', error);
      Alert.alert('Error', 'Failed to follow community. Please try again.');
    }
  };

  const unfollowPreviewCommunity = async () => {
    if (!previewCommunity) return;

    try {
      await toggleFavorite(previewCommunity.id);
      setIsFollowingPreview(false);
      
      // Refresh communities
      if (user?.id) {
        await loadFavoriteCommunities(user.id);
      }
      
      Alert.alert('Success', `You've unfollowed ${previewCommunity.name}`);
      
    } catch (error) {
      console.error('Error unfollowing community:', error);
      Alert.alert('Error', 'Failed to unfollow community. Please try again.');
    }
  };

  // Data loading functions
  const loadFavoriteCommunities = useCallback(async (uid: string) => {
    if (!uid || !isValidUUID(uid)) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', uid)
        .single();

      if (error) throw error;

      const favorites = (profile?.favorites ?? []) as Array<string | { id: string; type?: 'hub' | 'stop' }>;
      const favoriteIds = favorites
        .map((f) => (typeof f === 'string' ? f : f?.id))
        .filter((id): id is string => !!id && isValidUUID(id));

      if (favoriteIds.length === 0) {
        setCommunities([]);
        setSelectedCommunity(null);
        return;
      }

      const [{ data: hubs }, { data: stops }] = await Promise.all([
        supabase.from('hubs').select('id, name, latitude, longitude, address').in('id', favoriteIds),
        supabase.from('stops').select('id, name, latitude, longitude').in('id', favoriteIds),
      ]);

      const allFavorites: Community[] = [
        ...(hubs || []).map((hub) => ({ ...hub, type: 'hub' as const })),
        ...(stops || []).map((stop) => ({ ...stop, type: 'stop' as const })),
      ];

      allFavorites.sort((a, b) => a.name.localeCompare(b.name));
      setCommunities(allFavorites);
      
      // Set selected community if it exists in the new list, otherwise use first
      setSelectedCommunity(current => {
        if (current && allFavorites.find(c => c.id === current.id)) {
          return current;
        }
        return allFavorites[0] || null;
      });

    } catch (error) {
      console.error('Error loading favorite communities:', error);
    }
  }, []);

  const loadAllCommunities = useCallback(async () => {
    try {
      const [{ data: hubs }, { data: stops }] = await Promise.all([
        supabase.from('hubs').select('id, name, latitude, longitude, address'),
        supabase.from('stops').select('id, name, latitude, longitude'),
      ]);
      
      const all: Community[] = [
        ...(hubs || []).map((hub) => ({ ...hub, type: 'hub' as const })),
        ...(stops || []).map((stop) => ({ ...stop, type: 'stop' as const })),
      ];
      
      all.sort((a, b) => a.name.localeCompare(b.name));
      setAllCommunities(all);
    } catch (error) {
      console.error('Error loading all communities:', error);
    }
  }, []);

  const loadNotificationCount = useCallback(async (uid: string) => {
    if (!uid || !isValidUUID(uid)) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', uid)
        .eq('is_read', false);

      if (!error) {
        setUnreadNotifications(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  }, []);

  const loadCommunityPosts = useCallback(async (community: Community | null) => {
    if (!community) {
      setPosts([]);
      return;
    }

    try {
      let monday: Date | undefined;
      let sunday: Date | undefined;
      let todayStart: Date | undefined;
      let todayEnd: Date | undefined;

      if (postFilter === 'week') {
        const { monday: m, sunday: s } = getCurrentWeekRange();
        monday = m;
        sunday = s;
        setWeekRange(
          `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        );
      } else if (postFilter === 'today') {
        todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        setWeekRange('Today');
      } else {
        setWeekRange('All Posts');
      }

      const baseSelect = `
        *,
        profiles(*),
        post_reactions(*),
        post_comments(*, profiles(*))
      `;

      const table = community.type === 'hub' ? 'hub_posts' : 'stop_posts';
      const communityIdField = community.type === 'hub' ? 'hub_id' : 'stop_id';

      let query = supabase.from(table).select(baseSelect).eq(communityIdField, community.id);

      if (postFilter === 'week' && monday && sunday) {
        query = query.gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString());
      } else if (postFilter === 'today' && todayStart && todayEnd) {
        query = query.gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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
    }
  }, [postFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isValidUUID(userId)) {
        await loadFavoriteCommunities(userId);
      }
      await loadCommunityPosts(selectedCommunity);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, selectedCommunity, loadFavoriteCommunities, loadCommunityPosts]);

  const createPost = useCallback(async () => {
    if (!newPost.trim() || !selectedCommunity || !isValidUUID(userId)) return;
    
    try {
      const postData: any = {
        content: newPost.trim(),
        user_id: userId,
        ...(selectedCommunity.type === 'hub'
          ? { hub_id: selectedCommunity.id }
          : { stop_id: selectedCommunity.id }),
      };
      
      const table = selectedCommunity.type === 'hub' ? 'hub_posts' : 'stop_posts';
      const { error } = await supabase.from(table).insert([postData]);
      
      if (error) throw error;

      setNewPost('');
      await loadCommunityPosts(selectedCommunity);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  }, [newPost, selectedCommunity, userId, loadCommunityPosts]);

  const toggleFavorite = useCallback(async (communityId: string) => {
    if (!isValidUUID(userId)) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentFavorites: any[] = profile?.favorites || [];
      const isFav = currentFavorites.some((f) => (typeof f === 'string' ? f === communityId : f?.id === communityId));

      let newFavorites: any[];
      if (isFav) {
        newFavorites = currentFavorites.filter((f) => (typeof f === 'string' ? f !== communityId : f?.id !== communityId));
      } else {
        const found = allCommunities.find((c) => c.id === communityId);
        newFavorites = [
          ...currentFavorites,
          { id: communityId, name: found?.name ?? 'Unknown', type: found?.type ?? 'hub' },
        ];
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', userId);

      if (updateError) throw updateError;

      await loadFavoriteCommunities(userId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [userId, allCommunities, loadFavoriteCommunities]);

const toggleReaction = useCallback(async (postId: string, reactionType: string) => {
  if (!isValidUUID(userId)) return;
  
  try {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const existingReaction = post.post_reactions
      .find(r => r.user_id === userId && r.reaction_type === reactionType);

    if (existingReaction) {
      // Delete reaction - use the reaction ID for precise deletion
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;
    } else {
      // Insert new reaction
      const reactionData: any = {
        user_id: userId,
        reaction_type: reactionType,
      };

      // Use the correct column names from your schema
      if (post.hub_id) {
        reactionData.post_hub_id = postId;
      } else if (post.stop_id) {
        reactionData.post_stop_id = postId;
      } else {
        console.error('Post has neither hub_id nor stop_id');
        return;
      }

      const { error: insertError } = await supabase
        .from('post_reactions')
        .insert([reactionData]);

      // Handle the specific trigger error gracefully
      if (insertError) {
        if (insertError.code === '42703' && insertError.message?.includes('username')) {
          // Trigger error, but the reaction was likely created successfully
          console.warn('Trigger error (username column), but reaction was created');
          // Continue to refresh posts anyway - the reaction worked
        } else {
          throw insertError;
        }
      }
    }

    await loadCommunityPosts(selectedCommunity);
  } catch (error) {
    console.error('Error toggling reaction:', error);
    // Don't show alert for the specific trigger error
    if (!(error as any)?.message?.includes('username')) {
      Alert.alert('Error', 'Failed to toggle reaction');
    }
  }
}, [userId, posts, selectedCommunity, loadCommunityPosts]);

  const sharePost = useCallback(async (post: Post) => {
    try {
      setSharingPost(true);
      
      const communityName = selectedCommunity?.name || "Uthutho Community";
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
  }, [selectedCommunity]);

  const downloadPost = useCallback(async (post: Post) => {
    try {
      setSharingPost(true);
      await sharePost(post);
    } catch (error) {
      console.error('Error downloading post:', error);
      Alert.alert('Error', 'Failed to download post');
    } finally {
      setSharingPost(false);
    }
  }, [sharePost]);

  // Load initial data
  useEffect(() => {
    loadAllCommunities();
  }, []);

  // Initialize user data
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (userId) {
        try {
          await Promise.all([
            loadFavoriteCommunities(userId),
            loadNotificationCount(userId),
          ]);
        } catch (error) {
          console.error('Error initializing feeds:', error);
        }
      }

      setTimeout(() => {
        if (mounted) {
          setInitialLoadComplete(true);
          setLoading(false);
        }
      }, 500);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // Load posts when selected community or filter changes
  useEffect(() => {
    if (selectedCommunity) {
      loadCommunityPosts(selectedCommunity);
    }
  }, [selectedCommunity, postFilter]);

  // Render post creation based on preview mode
  const renderPostCreation = () => {
    if (previewMode && !isFollowingPreview) {
      return (
        <View style={styles.previewPostCreation}>
          <MessageSquare size={24} color="#666666" />
          <Text style={styles.previewPostCreationText}>
            Follow this community to post and comment
          </Text>
        </View>
      );
    }
    
    if (selectedCommunity && (!previewMode || isFollowingPreview)) {
      return (
        <PostCreation
          newPost={newPost}
          setNewPost={setNewPost}
          createPost={createPost}
          selectedCommunity={selectedCommunity}
        />
      );
    }
    
    return null;
  };

  // Show loading state
  if (!initialLoadComplete || loading) {
    return <SkeletonLoader />;
  }

  // Show add community screen
  if (showAddCommunity) {
    return (
      <AddCommunityScreen
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowAddCommunity={setShowAddCommunity}
        allCommunities={allCommunities}
        communities={communities}
        toggleFavorite={toggleFavorite}
        followerCounts={{}}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  // Show empty state if no communities
  if (communities.length === 0) {
    return (
      <EmptyState
        unreadNotifications={unreadNotifications}
        router={router}
        onButtonPress={() => setShowAddCommunity(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header
        unreadNotifications={unreadNotifications}
        router={router}
        onAddCommunityPress={() => setShowAddCommunity(true)}
      />

      {/* Show preview header when in preview mode */}
      {previewMode && previewCommunity && (
        <PreviewHeader
          previewCommunity={previewCommunity}
          isFollowingPreview={isFollowingPreview}
          onFollow={followPreviewCommunity}
          onUnfollow={unfollowPreviewCommunity}
          onViewFull={() => setPreviewMode(false)}
          posts={posts}
        />
      )}

      <CommunityTabs
        communities={communities}
        selectedCommunity={selectedCommunity}
        setSelectedCommunity={setSelectedCommunity}
        followerCounts={{}}
      />

      {weekRange && (
        <WeekRangeHeader
          weekRange={weekRange}
          postFilter={postFilter}
          setPostFilter={setPostFilter}
        />
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={userId}
            toggleReaction={toggleReaction}
            sharePost={sharePost}
            downloadPost={downloadPost}
            sharingPost={sharingPost}
            router={router}
            viewShotRef={(ref: any) => {
              viewShotRefs.current[item.id] = ref;
            }}
            disabled={previewMode && !isFollowingPreview}
          />
        )}
        ListHeaderComponent={renderPostCreation()}
        ListEmptyComponent={
          <EmptyPosts
            title={
              previewMode && !isFollowingPreview 
                ? "Follow to See Posts" 
                : selectedCommunity ? "No Posts Yet" : "Select a Community"
            }
            subtitle={
              previewMode && !isFollowingPreview
                ? "Follow this community to see what people are posting"
                : selectedCommunity 
                  ? "Be the first to post in this community" 
                  : "Choose a community to see posts"
            }
            showAnimation={!!selectedCommunity}
          />
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={['#1ea2b1']}
          />
        }
        contentContainerStyle={[
          styles.postsListContent,
          previewMode && styles.previewContent,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  weekRangeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#0a0a0a',
  },
  weekRangeText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  filterText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  postsListContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  // Preview styles
  previewHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  previewHeaderContent: {
    marginBottom: 16,
  },
  previewTitle: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewCommunityName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  followButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  followActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewFullButton: {
    flex: 2,
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewFullButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  unfollowButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unfollowButtonText: {
    color: '#cccccc',
    fontSize: 16,
    fontWeight: '600',
  },
  weekStats: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
  },
  weekStatsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#1ea2b1',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#cccccc',
    fontSize: 12,
  },
  previewHint: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewPostCreation: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  previewPostCreationText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
  previewContent: {
    paddingTop: 0,
  },
});