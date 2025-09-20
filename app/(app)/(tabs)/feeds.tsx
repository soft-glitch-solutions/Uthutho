import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, MessageCircle, Plus, Search, MapPin, Bell, ArrowLeft, Share } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTranslation } from '@/hook/useTranslation';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface Community {
  id: string;
  name: string;
  type: 'hub' | 'stop';
  latitude: number;
  longitude: number;
  address?: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  profiles: {
    first_name: string;
    last_name: string;
    selected_title: string;
    avatar_url?: string;
  };
  post_reactions: Array<{
    reaction_type: string;
    user_id: string;
  }>;
  post_comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  }>;
}

// Skeleton Loader Components
const SkeletonLoader = () => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <View style={[styles.skeleton, {width: 150, height: 24}]} />
      <View style={styles.headerRight}>
        <View style={[styles.skeleton, {width: 44, height: 44, borderRadius: 22, marginRight: 8}]} />
        <View style={[styles.skeleton, {width: 44, height: 44, borderRadius: 22}]} />
      </View>
    </View>

    {/* Tabs Skeleton */}
    <View style={styles.tabsWrapper}>
      <View style={styles.communityTabsContent}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeleton, styles.communityTabSkeleton]} />
        ))}
      </View>
    </View>

    {/* Post Input Skeleton */}
    <View style={styles.postCreationContainer}>
      <View style={[styles.skeleton, {height: 80, marginBottom: 12}]} />
      <View style={[styles.skeleton, {width: 80, height: 40, alignSelf: 'flex-end'}]} />
    </View>

    {/* Posts Skeleton */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View>
            <View style={[styles.skeleton, {width: 120, height: 16, marginBottom: 4}]} />
            <View style={[styles.skeleton, {width: 80, height: 12}]} />
          </View>
          <View style={[styles.skeleton, {width: 60, height: 12}]} />
        </View>
        <View style={[styles.skeleton, {height: 60, marginBottom: 12}]} />
        <View style={[styles.skeleton, {height: 20, width: '40%'}]} />
      </View>
    ))}
  </View>
);

const CommunityTabSkeleton = () => (
  <View style={[styles.communityTab, styles.skeleton]} />
);

// Communities Skeleton Loader
const CommunitiesSkeletonLoader = () => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <View style={[styles.skeleton, {width: 150, height: 24}]} />
      <View style={styles.headerRight}>
        <View style={[styles.skeleton, {width: 44, height: 44, borderRadius: 22, marginRight: 8}]} />
        <View style={[styles.skeleton, {width: 44, height: 44, borderRadius: 22}]} />
      </View>
    </View>

    {/* Empty State Skeleton */}
    <View style={styles.emptyState}>
      <View style={[styles.skeleton, {width: 200, height: 24, marginBottom: 12}]} />
      <View style={[styles.skeleton, {width: 250, height: 16, marginBottom: 24}]} />
      <View style={[styles.skeleton, {width: 160, height: 48, borderRadius: 12}]} />
    </View>
  </View>
);

export default function FeedsScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { t } = useTranslation();
  const router = useRouter();
  const viewShotRefs = useRef({});

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingFavorites, setCheckingFavorites] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [weekRange, setWeekRange] = useState<string>('');
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [sharingPost, setSharingPost] = useState(false);

  // UUID validation function
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday...
    const diffToMonday = (day + 6) % 7; // convert so Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  // Share post function
  const sharePost = async (post: Post) => {
    try {
      setSharingPost(true);
      
      // Capture the specific post card view
      const uri = await viewShotRefs.current[post.id].capture();
      
      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Post',
          UTI: 'image/png'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setSharingPost(false);
    }
  };

  // ---- Data loaders ------------------------------------------------------
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

      // Keep a stable order by name
      allFavorites.sort((a, b) => a.name.localeCompare(b.name));

      setCommunities(allFavorites);
      setSelectedCommunity((cur) => cur && allFavorites.find((c) => c.id === cur.id) ? cur : allFavorites[0] ?? null);
    } catch (e) {
      console.error('Error loading favorite communities:', e);
    } finally {
      setLoading(false);
      setCheckingFavorites(false);
      setInitialLoadComplete(true);
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
    } catch (e) {
      console.error('Error loading all communities:', e);
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
    } catch (e) {
      console.error('Error loading notification count:', e);
    }
  }, []);

  const loadCommunityPosts = useCallback(
    async (community: Community | null) => {
      if (!community) return;

      try {
        let monday: Date | undefined;
        let sunday: Date | undefined;

        if (!showAllPosts) {
          const { monday: m, sunday: s } = getCurrentWeekRange();
          monday = m;
          sunday = s;
          setWeekRange(
            `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
          );
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

        if (!showAllPosts && monday && sunday) {
          query = query.gte('created_at', monday.toISOString()).lte('created_at', sunday.toISOString());
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        console.log('Posts fetched:', data, 'Error:', error);

        if (error) throw error;

        const postsWithProfiles = (data || []).map((post: any) => ({
          ...post,
          profiles: post.profiles || {
            first_name: 'Unknown',
            last_name: '',
            selected_title: '',
            avatar_url: 'https://example.com/default-avatar.png',
          },
          post_comments: (post.post_comments || []).map((comment: any) => ({
            ...comment,
            profiles: comment.profiles || {
              first_name: 'Unknown',
              last_name: '',
              avatar_url: 'https://example.com/default-avatar.png',
            },
          })),
        }));

        setPosts(postsWithProfiles);
      } catch (e) {
        console.error('Error loading posts:', e);
        setPosts([]);
      }
    },
    [showAllPosts]
  );

  // ---- Effects -----------------------------------------------------------
  useEffect(() => {
    // Load everything up-front so UI like favorites toggle has the data it needs
    loadAllCommunities();
  }, [loadAllCommunities]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (isValidUUID(userId)) {
        await Promise.all([
          loadFavoriteCommunities(userId),
          loadNotificationCount(userId),
        ]);
      }

      // ✅ enforce skeleton for at least 500ms
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
  }, [userId, loadFavoriteCommunities, loadNotificationCount]);

  useEffect(() => {
    if (selectedCommunity) {
      loadCommunityPosts(selectedCommunity);
    } else {
      setPosts([]);
    }
  }, [selectedCommunity, loadCommunityPosts]);

  // ---- Handlers ----------------------------------------------------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isValidUUID(userId)) await loadFavoriteCommunities(userId);
    await loadCommunityPosts(selectedCommunity);
    setRefreshing(false);
  }, [userId, selectedCommunity, loadCommunityPosts, loadFavoriteCommunities]);

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
    } catch (e) {
      console.error('Error creating post:', e);
      Alert.alert('Error', 'Failed to create post');
    }
  }, [newPost, selectedCommunity, userId, loadCommunityPosts]);

  const toggleFavorite = useCallback(
    async (communityId: string) => {
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

        const { error: upErr } = await supabase
          .from('profiles')
          .update({ favorites: newFavorites })
          .eq('id', userId);
        if (upErr) throw upErr;

        await loadFavoriteCommunities(userId);
      } catch (e) {
        console.error('Error toggling favorite:', e);
      }
    },
    [userId, allCommunities, loadFavoriteCommunities]
  );

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
          .eq(post.hub_id ? 'post_hub_id' : 'post_stop_id', postId);
      } else {
        const reactionData: any = {
          user_id: userId,
          reaction_type: reactionType,
        };

        if (post.hub_id) {
          reactionData.post_hub_id = postId;
        } else {
          reactionData.post_stop_id = postId;
        }

        await supabase
          .from('post_reactions')
          .insert([reactionData]);
      }

      // Reload posts to show updated reactions
      await loadCommunityPosts(selectedCommunity);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }, [userId, posts, selectedCommunity, loadCommunityPosts]);

  // ---- Derived -----------------------------------------------------------
  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return allCommunities;
    const q = searchQuery.toLowerCase();
    return allCommunities.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCommunities, searchQuery]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return `${diffInMinutes}${t('minutesAgo')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}${t('hoursAgo')}`;
    return `${Math.floor(diffInMinutes / 1440)}${t('daysAgo')}`;
  };

  // ---- Renderers ---------------------------------------------------------
  const renderCommunityTab = ({ item }: { item: Community }) => {
    const selected = selectedCommunity?.id === item.id;
    return (
      <Pressable
        onPress={() => setSelectedCommunity(item)}
        android_ripple={{ color: '#0f3e45', borderless: false }}
        style={[styles.communityTab, selected && styles.selectedTab]}
      >
        <Text style={[styles.communityTabText, selected && styles.selectedTabText]} numberOfLines={1}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const fireCount = post.post_reactions.filter((r) => r.reaction_type === 'fire').length;
    const hasUserFired = post.post_reactions.some((r) => r.reaction_type === 'fire' && r.user_id === userId);
    const latestComment = post.post_comments[post.post_comments.length - 1];

    return (
      <ViewShot 
        ref={ref => viewShotRefs.current[post.id] = ref} 
        options={{ format: 'png', quality: 0.9 }}
        style={styles.postCard}
      >
        <Pressable
          onPress={() => router.push(`/post/${post.id}`)}
          android_ripple={{ color: '#0f0f0f' }}
        >
          <View style={styles.postHeader}>
            <Pressable 
              onPress={() => router.push(`/user/${post.user_id}`)}
              style={styles.userInfoContainer}
            >
              <View style={styles.profilePicture}>
                <Image
                  source={{ uri: post.profiles.avatar_url || 'https://example.com/default-avatar.png' }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              </View>
              <View>
                <Text style={styles.userName}>
                  {post.profiles.first_name} {post.profiles.last_name}
                </Text>
                <Text style={styles.userTitle}>{post.profiles.selected_title}</Text>
              </View>
            </Pressable>
            <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => toggleReaction(post.id, 'fire')}
            >
              <Flame size={18} color={hasUserFired ? '#ff7b25' : '#666'} fill={hasUserFired ? '#ff7b25' : 'none'} />
              <Text style={[styles.actionCount, hasUserFired && { color: '#ff7b25' }]}>{fireCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <MessageCircle size={18} color="#666" />
              <Text style={styles.actionCount}>{post.post_comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => sharePost(post)}
              disabled={sharingPost}
            >
              <Share size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {latestComment && (
            <View style={styles.latestComment}>
              <Text style={styles.commentAuthor}>{latestComment.profiles.first_name}: </Text>
              <Text style={styles.commentText} numberOfLines={1}>
                {latestComment.content}
              </Text>
            </View>
          )}
        </Pressable>
      </ViewShot>
    );
  };

  // ---- Screens -----------------------------------------------------------
  if (!initialLoadComplete || loading) {
    return <SkeletonLoader />;
  }

  if (showAddCommunity) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAddCommunity(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('addCommunity')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchCommunities')}
            value={searchQuery}
            onChangeText={(v) => setSearchQuery(v)}
          />
        </View>

        <FlatList
          data={filteredCommunities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.communitiesListContent}
          renderItem={({ item: community }) => {
            const isFavorite = communities.some((c) => c.id === community.id);
            return (
              <Pressable
                style={[styles.communityItem, isFavorite && styles.favoriteItem]}
                onPress={() => toggleFavorite(community.id)}
                android_ripple={{ color: '#0f3e45' }}
              >
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <View style={styles.communityMeta}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.communityType}>
                      {community.type === 'hub' ? t('hub') : t('stop')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}>
                  <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
                    {isFavorite ? t('joined') : t('join')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </View>
    );
  }

  if (communities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('communities')}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}  onPress={() => router.push('/notification')}>
              <Bell size={24} color="#ffffff" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.addIconButton} onPress={() => setShowAddCommunity(true)}>
              <Plus size={24} color="#1ea2b1" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('noCommunities')}</Text>
          <Text style={styles.emptySubtitle}>{t('joinCommunitiesToSeeFeeds')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddCommunity(true)}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>{t('Add Community')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('Communities')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton }  onPress={() => router.push('/notification')}>
            <Bell size={24} color="#ffffff" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addIconButton} onPress={() => setShowAddCommunity(true)}>
            <Plus size={24} color="#1ea2b1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs: switch to FlatList to control height and touch target size */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={communities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityTab}
          contentContainerStyle={styles.communityTabsContent}
          getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
        />
      </View>

      {weekRange && (
        <View style={styles.weekRangeWrapper}>
          <Text style={styles.weekRangeText}>{weekRange}</Text>
          <TouchableOpacity onPress={() => setShowAllPosts(!showAllPosts)}>
            <Text style={styles.toggleText}>
              {showAllPosts ? 'Show This Week' : 'Show All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post composer + feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          selectedCommunity ? (
            <View style={styles.postCreationContainer}>
              <TextInput
                style={styles.postInput}
                placeholder={t('whatsHappening')}
                placeholderTextColor="#777"
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
                onPress={createPost}
                disabled={!newPost.trim()}
              >
                <Text style={styles.postButtonText}>{t('Post')}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyPostsText}>{t('NoPostsYet')}</Text>
            <Text style={styles.emptyPostsSubtext}>{t('BeFirstToPost')}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addIconButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 44,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  weekRangeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  weekRangeText: {
    color: '#cccccc',
    fontSize: 14,
  },
  toggleText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
  },
  communityTabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  communityTab: {
    minHeight: 36,
    maxHeight: 36,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  communityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cccccc',
    maxWidth: 160,
  },
  selectedTabText: {
    color: '#ffffff',
  },
  postCreationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    borderWidth: 1,
    borderColor: '#333333',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
  },
  postButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  userTitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  latestComment: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  commentText: {
    fontSize: 14,
    color: '#cccccc',
    flex: 1,
  },
  communitiesListContent: {
    padding: 16,
    backgroundColor: '#000000',
  },
  communityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  favoriteItem: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b120',
  },
  communityInfo: {},
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityType: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  favoriteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  favoriteButtonActive: {
    backgroundColor: '#1ea2b1',
  },
  favoriteButtonText: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  favoriteButtonTextActive: {
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000000',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  emptyPosts: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyPostsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 40,
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  communityTabSkeleton: {
    minHeight: 36,
    width: 100,
    marginHorizontal: 4,
  },
  // Share post styles
  shareContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: 300,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#1ea2b1',
  },
  shareUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  shareUserTitle: {
    fontSize: 14,
    color: '#666666',
  },
  shareContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 16,
  },
  shareComment: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  shareCommentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  shareCommentText: {
    fontSize: 14,
    color: '#333333',
  },
  shareFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  shareFooterText: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '600',
    textAlign: 'center',
  },
});