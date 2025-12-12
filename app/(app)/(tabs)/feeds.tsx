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
  Share,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

// Import components (Remove AddCommunityScreen import)
import Header from '@/components/feeds/Header';
import CommunityTabs from '@/components/feeds/CommunityTabs';
import PostCreation from '@/components/feeds/PostCreation';
import EmptyState from '@/components/feeds/EmptyState';
import SkeletonLoader from '@/components/feeds/SkeletonLoader';
import PostCard from '@/components/feeds/PostCard';
import EmptyPosts from '@/components/feeds/EmptyPosts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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
  id: string;
  reaction_type: string;
  user_id: string;
  post_hub_id?: string;
  post_stop_id?: string;
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
  isDesktop?: boolean;
}> = ({ weekRange, postFilter, setPostFilter, isDesktop = false }) => {
  return (
    <View style={[styles.weekRangeWrapper, isDesktop && styles.weekRangeWrapperDesktop]}>
      <Text style={[styles.weekRangeText, isDesktop && styles.weekRangeTextDesktop]}>{weekRange}</Text>
      <View style={[styles.filterButtons, isDesktop && styles.filterButtonsDesktop]}>
        <TouchableOpacity onPress={() => setPostFilter('week')}>
          <Text style={[
            styles.filterText, 
            isDesktop && styles.filterTextDesktop,
            postFilter === 'week' && styles.filterTextActive
          ]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPostFilter('today')}>
          <Text style={[
            styles.filterText, 
            isDesktop && styles.filterTextDesktop,
            postFilter === 'today' && styles.filterTextActive
          ]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPostFilter('all')}>
          <Text style={[
            styles.filterText, 
            isDesktop && styles.filterTextDesktop,
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
  isDesktop?: boolean;
}> = ({ previewCommunity, isFollowingPreview, onFollow, onUnfollow, onViewFull, posts, isDesktop = false }) => {
  return (
    <View style={[styles.previewHeader, isDesktop && styles.previewHeaderDesktop]}>
      <View style={[styles.previewHeaderContent, isDesktop && styles.previewHeaderContentDesktop]}>
        <Text style={[styles.previewTitle, isDesktop && styles.previewTitleDesktop]}>Previewing Community</Text>
        <Text style={[styles.previewCommunityName, isDesktop && styles.previewCommunityNameDesktop]}>{previewCommunity?.name}</Text>
        <Text style={[styles.previewDescription, isDesktop && styles.previewDescriptionDesktop]}>
          {isFollowingPreview 
            ? "You're following this community and can see all posts!" 
            : "Follow this community to see all posts and join the conversation"
          }
        </Text>
        
        {!isFollowingPreview ? (
          <TouchableOpacity 
            style={[styles.followButton, isDesktop && styles.followButtonDesktop]}
            onPress={onFollow}
          >
            <Users size={isDesktop ? 18 : 20} color="#ffffff" />
            <Text style={[styles.followButtonText, isDesktop && styles.followButtonTextDesktop]}>Follow Community</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.followActions, isDesktop && styles.followActionsDesktop]}>
            <TouchableOpacity 
              style={[styles.viewFullButton, isDesktop && styles.viewFullButtonDesktop]}
              onPress={onViewFull}
            >
              <Text style={[styles.viewFullButtonText, isDesktop && styles.viewFullButtonTextDesktop]}>View Full Community</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.unfollowButton, isDesktop && styles.unfollowButtonDesktop]}
              onPress={onUnfollow}
            >
              <Text style={[styles.unfollowButtonText, isDesktop && styles.unfollowButtonTextDesktop]}>Unfollow</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Week stats preview - show what they're missing */}
      <View style={[styles.weekStats, isDesktop && styles.weekStatsDesktop]}>
        <Text style={[styles.weekStatsTitle, isDesktop && styles.weekStatsTitleDesktop]}>
          {isFollowingPreview ? 'This Week' : 'This Week in Preview'}
        </Text>
        <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
          <View style={[styles.statItem, isDesktop && styles.statItemDesktop]}>
            <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>{posts.length}</Text>
            <Text style={[styles.statLabel, isDesktop && styles.statLabelDesktop]}>Posts</Text>
          </View>
          <View style={[styles.statItem, isDesktop && styles.statItemDesktop]}>
            <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>
              {posts.reduce((acc, post) => acc + (post.post_comments?.length || 0), 0)}
            </Text>
            <Text style={[styles.statLabel, isDesktop && styles.statLabelDesktop]}>Comments</Text>
          </View>
          <View style={[styles.statItem, isDesktop && styles.statItemDesktop]}>
            <Text style={[styles.statNumber, isDesktop && styles.statNumberDesktop]}>
              {posts.reduce((acc, post) => acc + (post.post_reactions?.length || 0), 0)}
            </Text>
            <Text style={[styles.statLabel, isDesktop && styles.statLabelDesktop]}>Reactions</Text>
          </View>
        </View>
        
        {!isFollowingPreview && posts.length > 0 && (
          <Text style={[styles.previewHint, isDesktop && styles.previewHintDesktop]}>
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

  // State (Remove showAddCommunity state)
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Remove: const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  // Remove: const [searchQuery, setSearchQuery] = useState('');
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
        post_reactions: (post.post_reactions || []).map((reaction: any) => ({
          id: reaction.id,
          reaction_type: reaction.reaction_type,
          user_id: reaction.user_id,
          post_hub_id: reaction.post_hub_id,
          post_stop_id: reaction.post_stop_id,
        })),
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

      const message = `Check out ${userName}'s post in ${communityName} on Uthutho:\n\n"${post.content}"\n\n${shareUrl}`;

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
        // Use React Native's Share API for mobile
        try {
          const result = await Share.share({
            message: message,
            title: `Post from ${communityName}`,
          });
          
          if (result.action === Share.sharedAction) {
            console.log('Post shared successfully');
          } else if (result.action === Share.dismissedAction) {
            console.log('Share dismissed');
          }
        } catch (shareError) {
          console.error('Error sharing:', shareError);
          // Fallback to alert if sharing fails
          Alert.alert(
            'Share Post', 
            `${message}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setSharingPost(false);
    }
  }, [selectedCommunity]);

  const downloadPost = useCallback(async (post: Post) => {
    try {
      setSharingPost(true);
      
      // Get the viewShot ref for this post
      const viewShotRef = viewShotRefs.current[post.id];
      
      if (!viewShotRef) {
        throw new Error('Could not capture post for download');
      }

      // Capture the post as an image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Request permissions for media library (iOS/Android)
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          throw new Error('Media library permissions required to save image');
        }

        // Save to photo library
        const asset = await MediaLibrary.createAssetAsync(uri);
        
        // Create album if needed (optional)
        const album = await MediaLibrary.getAlbumAsync('Uthutho');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Uthutho', asset, false);
        }

        Alert.alert('Success', 'Post saved to your photo gallery!');
      } else {
        // Web fallback - create download link
        const link = document.createElement('a');
        link.href = uri;
        link.download = `uthutho-post-${post.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Success', 'Post image downloaded!');
      }

    } catch (error) {
      console.error('Error downloading post:', error);
      
      if (error.message.includes('permissions')) {
        Alert.alert(
          'Permission Required', 
          'Please grant photo library access to save posts.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Download Failed', 
          'Could not save post image. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSharingPost(false);
    }
  }, []);

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
        <View style={[styles.previewPostCreation, isDesktop && styles.previewPostCreationDesktop]}>
          <MessageSquare size={isDesktop ? 20 : 24} color="#666666" />
          <Text style={[styles.previewPostCreationText, isDesktop && styles.previewPostCreationTextDesktop]}>
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
          isDesktop={isDesktop}
        />
      );
    }
    
    return null;
  };

  // Show loading state
  if (!initialLoadComplete || loading) {
    return <SkeletonLoader isDesktop={isDesktop} />;
  }

  // Show empty state if no communities
  if (communities.length === 0) {
    return (
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <EmptyState
          unreadNotifications={unreadNotifications}
          router={router}
          isDesktop={isDesktop}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <Header
        unreadNotifications={unreadNotifications}
        router={router}
        isDesktop={isDesktop}
      />

      {/* Desktop layout wrapper */}
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          {/* Left sidebar - Community tabs */}
          <View style={styles.desktopSidebar}>
            <CommunityTabs
              communities={communities}
              selectedCommunity={selectedCommunity}
              setSelectedCommunity={setSelectedCommunity}
              followerCounts={{}}
              isDesktop={isDesktop}
            />
            
            {/* Desktop community stats */}
            <View style={styles.communityStats}>
              <Text style={styles.communityStatsTitle}>Community Stats</Text>
              <View style={styles.communityStatItem}>
                <Text style={styles.communityStatNumber}>{posts.length}</Text>
                <Text style={styles.communityStatLabel}>Posts This Week</Text>
              </View>
              <View style={styles.communityStatItem}>
                <Text style={styles.communityStatNumber}>
                  {posts.reduce((acc, post) => acc + (post.post_reactions?.length || 0), 0)}
                </Text>
                <Text style={styles.communityStatLabel}>Reactions</Text>
              </View>
            </View>
          </View>

          {/* Main feed area */}
          <View style={styles.desktopMain}>
            {/* Show preview header when in preview mode */}
            {previewMode && previewCommunity && (
              <PreviewHeader
                previewCommunity={previewCommunity}
                isFollowingPreview={isFollowingPreview}
                onFollow={followPreviewCommunity}
                onUnfollow={unfollowPreviewCommunity}
                onViewFull={() => setPreviewMode(false)}
                posts={posts}
                isDesktop={isDesktop}
              />
            )}

            {weekRange && (
              <WeekRangeHeader
                weekRange={weekRange}
                postFilter={postFilter}
                setPostFilter={setPostFilter}
                isDesktop={isDesktop}
              />
            )}

            {renderPostCreation()}

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
                  isDesktop={isDesktop}
                />
              )}
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
                  isDesktop={isDesktop}
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
                styles.desktopPostsListContent,
                previewMode && styles.previewContent,
              ]}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Right sidebar - Trending/Recent activity */}
          <View style={styles.desktopSidebarRight}>
            <View style={styles.trendingSection}>
              <Text style={styles.trendingTitle}>Trending Posts</Text>
              {posts.slice(0, 3).map((post, index) => (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.trendingPost}
                  onPress={() => router.push(`/post/${post.id}`)}
                >
                  <Text style={styles.trendingPostIndex}>#{index + 1}</Text>
                  <View style={styles.trendingPostContent}>
                    <Text style={styles.trendingPostText} numberOfLines={2}>
                      {post.content}
                    </Text>
                    <Text style={styles.trendingPostReactions}>
                      🔥 {post.post_reactions.filter(r => r.reaction_type === 'fire').length}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        // Mobile layout
        <>
          {/* Show preview header when in preview mode */}
          {previewMode && previewCommunity && (
            <PreviewHeader
              previewCommunity={previewCommunity}
              isFollowingPreview={isFollowingPreview}
              onFollow={followPreviewCommunity}
              onUnfollow={unfollowPreviewCommunity}
              onViewFull={() => setPreviewMode(false)}
              posts={posts}
              isDesktop={false}
            />
          )}

          <CommunityTabs
            communities={communities}
            selectedCommunity={selectedCommunity}
            setSelectedCommunity={setSelectedCommunity}
            followerCounts={{}}
            isDesktop={false}
          />

          {weekRange && (
            <WeekRangeHeader
              weekRange={weekRange}
              postFilter={postFilter}
              setPostFilter={setPostFilter}
              isDesktop={false}
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
                isDesktop={false}
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
                isDesktop={false}
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
        </>
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
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  desktopSidebar: {
    width: 280,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  desktopMain: {
    flex: 1,
    paddingHorizontal: 24,
    maxWidth: 680,
  },
  desktopSidebarRight: {
    width: 300,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#333333',
  },
  communityStats: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  communityStatsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  communityStatItem: {
    marginBottom: 12,
  },
  communityStatNumber: {
    color: '#1ea2b1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  communityStatLabel: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 2,
  },
  trendingSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  trendingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  trendingPost: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  trendingPostIndex: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 24,
  },
  trendingPostContent: {
    flex: 1,
  },
  trendingPostText: {
    color: '#cccccc',
    fontSize: 12,
    lineHeight: 16,
  },
  trendingPostReactions: {
    color: '#ff7b25',
    fontSize: 11,
    marginTop: 4,
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
  weekRangeWrapperDesktop: {
    paddingHorizontal: 0,
    marginBottom: 16,
    borderRadius: 8,
  },
  weekRangeText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
  weekRangeTextDesktop: {
    fontSize: 13,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  filterButtonsDesktop: {
    gap: 12,
  },
  filterText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextDesktop: {
    fontSize: 13,
  },
  filterTextActive: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  postsListContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  desktopPostsListContent: {
    paddingBottom: 32,
  },
  // Preview styles
  previewHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  previewHeaderDesktop: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewHeaderContent: {
    marginBottom: 16,
  },
  previewHeaderContentDesktop: {
    marginBottom: 12,
  },
  previewTitle: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewTitleDesktop: {
    fontSize: 13,
  },
  previewCommunityName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewCommunityNameDesktop: {
    fontSize: 18,
  },
  previewDescription: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  previewDescriptionDesktop: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
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
  followButtonDesktop: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  followButtonTextDesktop: {
    fontSize: 14,
  },
  followActions: {
    flexDirection: 'row',
    gap: 12,
  },
  followActionsDesktop: {
    gap: 10,
  },
  viewFullButton: {
    flex: 2,
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewFullButtonDesktop: {
    borderRadius: 8,
    paddingVertical: 10,
  },
  viewFullButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewFullButtonTextDesktop: {
    fontSize: 14,
  },
  unfollowButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unfollowButtonDesktop: {
    borderRadius: 8,
    paddingVertical: 10,
  },
  unfollowButtonText: {
    color: '#cccccc',
    fontSize: 16,
    fontWeight: '600',
  },
  unfollowButtonTextDesktop: {
    fontSize: 14,
  },
  weekStats: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
  },
  weekStatsDesktop: {
    padding: 12,
  },
  weekStatsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  weekStatsTitleDesktop: {
    fontSize: 14,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statsGridDesktop: {
    marginBottom: 6,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemDesktop: {
    paddingHorizontal: 8,
  },
  statNumber: {
    color: '#1ea2b1',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statNumberDesktop: {
    fontSize: 18,
  },
  statLabel: {
    color: '#cccccc',
    fontSize: 12,
  },
  statLabelDesktop: {
    fontSize: 11,
  },
  previewHint: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewHintDesktop: {
    fontSize: 11,
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
  previewPostCreationDesktop: {
    marginHorizontal: 0,
    marginBottom: 12,
    padding: 12,
  },
  previewPostCreationText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
  },
  previewPostCreationTextDesktop: {
    fontSize: 13,
  },
  previewContent: {
    paddingTop: 0,
  },
});