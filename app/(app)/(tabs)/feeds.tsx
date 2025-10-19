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
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

// Import components directly to avoid import issues
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

export default function FeedsScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const router = useRouter();
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
        await supabase
          .from('post_reactions')
          .delete()
          .eq('user_id', userId)
          .eq('reaction_type', reactionType)
          .eq(post.hub_id ? 'hub_post_id' : 'stop_post_id', postId);
      } else {
        const reactionData: any = {
          user_id: userId,
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

      await loadCommunityPosts(selectedCommunity);
    } catch (error) {
      console.error('Error toggling reaction:', error);
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
        // Use basic alert for mobile for now to avoid import issues
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
      // For now, just share since download requires more setup
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

      // Use setTimeout to ensure this runs after render
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
          />
        )}
        ListHeaderComponent={
          selectedCommunity ? (
            <PostCreation
              newPost={newPost}
              setNewPost={setNewPost}
              createPost={createPost}
              selectedCommunity={selectedCommunity}
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyPosts
            title={selectedCommunity ? "No Posts Yet" : "Select a Community"}
            subtitle={
              selectedCommunity 
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
        contentContainerStyle={styles.postsListContent}
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
});