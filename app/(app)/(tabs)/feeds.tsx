import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image,
  Platform, ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MessageSquare, Heart, Flame, Send, MapPin, Bell, User, Plus, X, MoreVertical } from 'lucide-react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

interface ProfileLite {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface HubLite {
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface StopLite {
  id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
  post_hub_id?: string;
  post_stop_id?: string;
}

interface CommentItem {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  hub_post?: string;
  stop_post?: string;
  profiles: ProfileLite;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  post_type: 'hub' | 'stop';
  profiles: ProfileLite;
  hubs?: HubLite | null;
  stops?: StopLite | null;
  post_reactions: Reaction[];
  post_comments: CommentItem[];
}

export default function FeedsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string; type: 'hub' | 'stop' } | null>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // 3-dot menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Report modal state
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    getCurrentUser();
    loadPosts();
    loadLocations();
    requestLocationPermission();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  // ---- Utilities ----
  const timeAgo = (isoString: string) => {
    const now = new Date().getTime();
    const then = new Date(isoString).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000)); // seconds
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 4) return `${w}w ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(d / 365);
    return `${y}y ago`;
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
    setLocationLoading(false);
  };

  const loadLocations = async () => {
    try {
      const [hubsData, stopsData] = await Promise.all([
        supabase.from('hubs').select('id, name, latitude, longitude'),
        supabase.from('stops').select('id, name, latitude, longitude'),
      ]);

      if (hubsData.data) setHubs(hubsData.data);
      if (stopsData.data) setStops(stopsData.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const findNearestLocation = () => {
    if (!userLocation || (hubs.length === 0 && stops.length === 0)) return null;

    let nearest: { id: string; name: string; type: 'hub' | 'stop' } | null = null;
    let minD = Infinity;

    hubs.forEach((hub) => {
      if (hub.latitude && hub.longitude) {
        const d = calculateDistance(userLocation.latitude, userLocation.longitude, hub.latitude, hub.longitude);
        if (d < minD) {
          minD = d;
          nearest = { id: hub.id, name: hub.name, type: 'hub' };
        }
      }
    });

    stops.forEach((stop) => {
      if (stop.latitude && stop.longitude) {
        const d = calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude);
        if (d < minD) {
          minD = d;
          nearest = { id: stop.id, name: stop.name, type: 'stop' };
        }
      }
    });

    return nearest;
  };

  const openCreatePost = () => {
    const nearest = findNearestLocation();
    if (nearest) setSelectedLocation(nearest);
    setShowLocationModal(true);
  };

  // ---- Data fetch & combine ----
  const loadPosts = async () => {
    setLoading(true);
    try {
      const [
        { data: hubPostsData, error: hubErr },
        { data: stopPostsData, error: stopErr },
      ] = await Promise.all([
        supabase.from('hub_posts').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('stop_posts').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      if (hubErr || stopErr) throw hubErr || stopErr;

      const allPostsRaw = [
        ...(hubPostsData || []).map((p: any) => ({ ...p, post_type: 'hub' as const })),
        ...(stopPostsData || []).map((p: any) => ({ ...p, post_type: 'stop' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (allPostsRaw.length === 0) {
        setPosts([]);
        return;
      }

      // Profiles for authors
      const authorIds = Array.from(new Set(allPostsRaw.map((p) => p.user_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds);

      // Hubs & stops
      const hubIds = allPostsRaw.filter((p) => p.hub_id).map((p) => p.hub_id);
      const stopIds = allPostsRaw.filter((p) => p.stop_id).map((p) => p.stop_id);
      const [{ data: hubsData = [] }, { data: stopsData = [] }] = await Promise.all([
        hubIds.length ? supabase.from('hubs').select('id, name, latitude, longitude').in('id', hubIds) : Promise.resolve({ data: [] }),
        stopIds.length ? supabase.from('stops').select('id, name, latitude, longitude').in('id', stopIds) : Promise.resolve({ data: [] }),
      ]);

      // Reactions
      const hubPostIds = allPostsRaw.filter((p) => p.post_type === 'hub').map((p) => p.id);
      const stopPostIds = allPostsRaw.filter((p) => p.post_type === 'stop').map((p) => p.id);

      let reactionsData: Reaction[] = [];
      if (hubPostIds.length || stopPostIds.length) {
        const orParts: string[] = [];
        if (hubPostIds.length) orParts.push(`post_hub_id.in.(${hubPostIds.join(',')})`);
        if (stopPostIds.length) orParts.push(`post_stop_id.in.(${stopPostIds.join(',')})`);
        const { data = [] } = await supabase.from('post_reactions').select('*').or(orParts.join(','));
        reactionsData = data as Reaction[];
      }

      // Comments
      let commentsData: CommentItem[] = [];
      if (hubPostIds.length || stopPostIds.length) {
        const orParts: string[] = [];
        if (hubPostIds.length) orParts.push(`hub_post.in.(${hubPostIds.join(',')})`);
        if (stopPostIds.length) orParts.push(`stop_post.in.(${stopPostIds.join(',')})`);
        const { data = [] } = await supabase
          .from('post_comments')
          .select('id, content, user_id, created_at, hub_post, stop_post')
          .or(orParts.join(','));
        commentsData = data as CommentItem[];
      }

      // Commenter profiles
      const commenterIds = Array.from(new Set(commentsData.map((c) => c.user_id)));
      const { data: commenterProfiles = [] } =
        commenterIds.length
          ? await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', commenterIds)
          : { data: [] };

      const combined: Post[] = allPostsRaw.map((post: any) => {
        const author = profilesData?.find((p: any) => p.id === post.user_id) || {};
        const hub = post.hub_id ? (hubsData as any[]).find((h) => h.id === post.hub_id) : null;
        const stop = post.stop_id ? (stopsData as any[]).find((s) => s.id === post.stop_id) : null;
        const reactions = reactionsData.filter((r) =>
          post.post_type === 'hub' ? r.post_hub_id === post.id : r.post_stop_id === post.id
        );
        const postComments = commentsData
          .filter((c) => (post.post_type === 'hub' ? c.hub_post === post.id : c.stop_post === post.id))
          .map((c) => ({
            ...c,
            profiles: commenterProfiles.find((cp: any) => cp.id === c.user_id) || {},
          })) as CommentItem[];

        return {
          ...post,
          profiles: author as ProfileLite,
          hubs: hub,
          stops: stop,
          post_reactions: reactions,
          post_comments: postComments,
        };
      });

      setPosts(combined);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // ---- Create post ----
  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      const nearestLocation = findNearestLocation();
      const location = selectedLocation || nearestLocation;

      const baseData: any = { content: newPost, user_id: currentUserId };
      let table = 'hub_posts';

      if (location) {
        if (location.type === 'hub') {
          baseData.hub_id = location.id;
          table = 'hub_posts';
        } else {
          baseData.stop_id = location.id;
          table = 'stop_posts';
        }
      }

      const { data, error } = await supabase.from(table).insert(baseData).select().single();
      if (error) throw error;

      // Award points
      await awardPoints(1);
      setNewPost('');
      setSelectedLocation(null);
      setShowLocationModal(false);

      if (data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', currentUserId)
          .single();

        setPosts((prev) => [
          {
            ...data,
            post_type: location?.type === 'stop' ? 'stop' : 'hub',
            profiles: (profile as ProfileLite) || { first_name: '', last_name: '', avatar_url: '' },
            hubs: location?.type === 'hub' ? hubs.find((h) => h.id === location.id) : null,
            stops: location?.type === 'stop' ? stops.find((s) => s.id === location.id) : null,
            post_reactions: [],
            post_comments: [],
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  // ---- Reactions ----
  const getReactionCount = (post: Post, reactionType: string) =>
    post.post_reactions.filter((r) => r.reaction_type === reactionType).length;

  const hasUserReacted = (post: Post, reactionType: string) =>
    post.post_reactions.some((r) => r.user_id === currentUserId && r.reaction_type === reactionType);

  const toggleReaction = async (postId: string, reactionType: string, postType: 'hub' | 'stop') => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const existing = post.post_reactions.find(
        (r) => r.user_id === currentUserId && r.reaction_type === reactionType
      );

      if (existing) {
        await supabase.from('post_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('post_reactions').insert([
          {
            [postType === 'hub' ? 'post_hub_id' : 'post_stop_id']: postId,
            user_id: currentUserId,
            reaction_type: reactionType,
          },
        ]);
      }
      loadPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // ---- Comments ----
  const addComment = async (postId: string, postType: 'hub' | 'stop') => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    try {
      const payload: any = {
        user_id: currentUserId,
        content: comment,
      };
      if (postType === 'hub') payload.hub_post = postId;
      else payload.stop_post = postId;

      const { error } = await supabase.from('post_comments').insert([payload]);
      if (!error) {
        await awardPoints(1);
        setCommentInputs({ ...commentInputs, [postId]: '' });
        loadPosts();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // ---- Points ----
  const awardPoints = async (points: number) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', currentUserId).single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + points })
          .eq('id', currentUserId);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // ---- Menu: Delete / Report ----
  const handleMenuPress = (post: Post) => {
    setSelectedPost(post);
    setMenuVisible(true);
  };

  const deletePost = async (postId: string, postType: 'hub' | 'stop') => {
    try {
      const table = postType === 'hub' ? 'hub_posts' : 'stop_posts';
      const { error } = await supabase.from(table).delete().eq('id', postId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    if (selectedPost.user_id !== currentUserId) {
      Alert.alert('Not allowed', 'You can only delete your own post.');
      setMenuVisible(false);
      return;
    }

    const ok = await deletePost(selectedPost.id, selectedPost.post_type);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      Alert.alert('Deleted', 'Your post was deleted.');
    } else {
      Alert.alert('Error', 'Failed to delete post.');
    }
    setMenuVisible(false);
  };

  const reportPost = async (postId: string, postType: 'hub' | 'stop', reason: string) => {
    try {
      const { error } = await supabase.from('post_reports').insert({
        post_id: postId,
        post_type: postType,
        reporter_id: currentUserId,
        reason,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Report error:', err);
      return false;
    }
  };

  const openReportModal = () => {
    setReportReason('');
    setReportVisible(true);
  };

  const submitReport = async () => {
    if (!selectedPost) return;
    if (!reportReason.trim()) {
      Alert.alert('Missing info', 'Please add a short reason.');
      return;
    }
    const ok = await reportPost(selectedPost.id, selectedPost.post_type, reportReason.trim());
    setReportVisible(false);
    setMenuVisible(false);
    if (ok) Alert.alert('Thanks', 'Your report was submitted.');
    else Alert.alert('Error', 'Could not submit report.');
  };

  // ---- Navigation helpers ----
  const navigateToPost = (postId: string) => router.push(`/post/${postId}`);
  const navigateToUserProfile = (userId: string) => router.push(`/user/${userId}`);

  // ---- UI ----
  const PostSkeleton = () => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, styles.skeletonBg]} />
          <View>
            <View style={[styles.skeletonLine, { width: 100, height: 14 }]} />
            <View style={[styles.skeletonLine, { width: 80, height: 12, marginTop: 4 }]} />
          </View>
        </View>
        <View style={[styles.skeletonLine, { width: 60, height: 10 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: '100%', height: 16, marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '90%', height: 16, marginBottom: 8 }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 16, marginBottom: 16 }]} />
      <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
    </View>
  );

  const nearest = findNearestLocation();

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />

      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Community Feeds</Text>
          <Text style={styles.subtitle}>Share your transport experiences</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notification')}
        >
          <Bell size={24} color="#cccccc" />
        </TouchableOpacity>
      </View>


      {/* Create Post */}
      <View style={styles.createPostCard}>
        <TextInput
          style={styles.postInput}
          placeholder="Share your transport experience..."
          placeholderTextColor="#666666"
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={500}
        />
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.locationButton} onPress={openCreatePost}>
            <MapPin size={20} color="#1ea2b1" />
            <Text style={styles.locationButtonText}>
              {selectedLocation?.name || nearest?.name || 'Select location'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
            onPress={createPost}
            disabled={!newPost.trim()}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Selection Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.locationList}>
              <Text style={styles.locationSectionTitle}>Transport Hubs</Text>
              {hubs.map((hub) => (
                <TouchableOpacity
                  key={hub.id}
                  style={[styles.locationItem, selectedLocation?.id === hub.id && styles.selectedLocationItem]}
                  onPress={() => {
                    setSelectedLocation({ id: hub.id, name: hub.name, type: 'hub' });
                    setShowLocationModal(false);
                  }}
                >
                  <MapPin size={20} color="#1ea2b1" />
                  <Text style={styles.locationName}>{hub.name}</Text>
                  {userLocation && hub.latitude && hub.longitude && (
                    <Text style={styles.locationDistance}>
                      {calculateDistance(userLocation.latitude, userLocation.longitude, hub.latitude, hub.longitude).toFixed(1)} km
                    </Text>
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.locationSectionTitle}>Stops</Text>
              {stops.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[styles.locationItem, selectedLocation?.id === stop.id && styles.selectedLocationItem]}
                  onPress={() => {
                    setSelectedLocation({ id: stop.id, name: stop.name, type: 'stop' });
                    setShowLocationModal(false);
                  }}
                >
                  <MapPin size={20} color="#666666" />
                  <Text style={styles.locationName}>{stop.name}</Text>
                  {userLocation && stop.latitude && stop.longitude && (
                    <Text style={styles.locationDistance}>
                      {calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude).toFixed(1)} km
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Posts */}
      <View style={styles.feedContainer}>
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </>
        ) : posts.length === 0 ? (
          <Text style={styles.noPostsText}>No posts yet. Be the first to share!</Text>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Header */}
              <View style={styles.postHeader}>
                <TouchableOpacity style={styles.userInfo} onPress={() => navigateToUserProfile(post.user_id)}>
                  <View style={styles.avatar}>
                    <Image
                      source={{ uri: post.profiles?.avatar_url || 'https://via.placeholder.com/50' }}
                      style={styles.avatar}
                    />
                  </View>
                  <View>
                    <Text style={styles.userName}>
                      {post.profiles?.first_name} {post.profiles?.last_name}
                    </Text>
                    <View style={styles.locationInfo}>
                      <MapPin size={12} color="#666666" />
                      <Text style={styles.locationText}>
                        {post.hubs?.name || post.stops?.name || 'Unknown Location'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                  <TouchableOpacity onPress={() => handleMenuPress(post)} style={{ padding: 6 }}>
                    <MoreVertical size={18} color="#cccccc" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content */}
              <TouchableOpacity onPress={() => navigateToPost(post.id)}>
                <Text style={styles.postContent}>{post.content}</Text>
              </TouchableOpacity>

              {/* Latest comment preview */}
              {post.post_comments.length > 0 && (
                <View style={styles.latestComment}>
                  <Text style={styles.latestCommentAuthor}>
                    {post.post_comments[0].profiles?.first_name}:
                  </Text>
                  <Text style={styles.latestCommentText} numberOfLines={1}>
                    {post.post_comments[0].content}
                  </Text>
                </View>
              )}

              {/* Reactions */}
              <View style={styles.reactionsContainer}>
                <TouchableOpacity
                  style={[styles.reactionButton, hasUserReacted(post, 'fire') && styles.reactionActive]}
                  onPress={() => toggleReaction(post.id, 'fire', post.post_type)}
                >
                  <Flame size={20} color={hasUserReacted(post, 'fire') ? '#ff6b35' : '#666666'} />
                  <Text
                    style={[
                      styles.reactionCount,
                      hasUserReacted(post, 'fire') && styles.reactionCountActive,
                    ]}
                  >
                    {getReactionCount(post, 'fire')}
                  </Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <View style={styles.commentToggle}>
                  <MessageSquare size={20} color="#666666" />
                  <Text style={styles.commentCount}>{post.post_comments.length}</Text>
                </View>
              </View>

              {/* Add comment */}
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666666"
                  value={commentInputs[post.id] || ''}
                  onChangeText={(t) => setCommentInputs({ ...commentInputs, [post.id]: t })}
                />
                <TouchableOpacity
                  style={styles.commentButton}
                  onPress={() => addComment(post.id, post.post_type)}
                >
                  <Send size={16} color="#1ea2b1" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 3-dot Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.menuOverlay}>
          <View style={styles.menuCard}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Post Options</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {selectedPost?.user_id === currentUserId ? (
              <TouchableOpacity style={styles.menuItem} onPress={handleDeletePost}>
                <Text style={styles.menuItemText}>Delete post</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.menuItem} onPress={openReportModal}>
                <Text style={styles.menuItemText}>Report post</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Report Reason Modal */}
      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Post</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.reportHint}>Tell us briefly what’s wrong with this post.</Text>
            <TextInput
              style={styles.reportInput}
              placeholder="Reason..."
              placeholderTextColor="#777"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              maxLength={300}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity style={[styles.reportBtn, { backgroundColor: '#333' }]} onPress={() => setReportVisible(false)}>
                <Text style={styles.reportBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.reportBtn, { backgroundColor: '#1ea2b1', marginLeft: 8 }]} onPress={submitReport}>
                <Text style={[styles.reportBtnText, { color: '#000' }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#ffffff' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#cccccc', 
    marginTop: 4 
  },
  notificationButton: {
    padding: 8,
    marginLeft: 16,
  },


  createPostCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postInput: { color: '#ffffff', fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: '#0a0a0a' },
  locationButtonText: { color: '#1ea2b1', fontSize: 14, marginLeft: 8 },
  postButton: { backgroundColor: '#1ea2b1', borderRadius: 12, padding: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  postButtonDisabled: { backgroundColor: '#333333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  locationModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  locationList: { maxHeight: 400 },
  locationSectionTitle: { fontSize: 16, fontWeight: '600', color: '#1ea2b1', marginBottom: 12, marginTop: 8 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedLocationItem: { borderColor: '#1ea2b1', backgroundColor: '#1ea2b120' },
  locationName: { color: '#ffffff', fontSize: 16, marginLeft: 12, flex: 1 },
  locationDistance: { color: '#666666', fontSize: 14 },

  feedContainer: { paddingHorizontal: 20 },
  noPostsText: { color: '#666666', fontSize: 16, textAlign: 'center', paddingVertical: 40 },

  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userName: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  locationInfo: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#666666', marginLeft: 4 },
  postTime: { fontSize: 12, color: '#666666' },
  postContent: { fontSize: 16, color: '#ffffff', lineHeight: 24, marginBottom: 16 },

  latestComment: { backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row' },
  latestCommentAuthor: { fontSize: 14, fontWeight: '500', color: '#1ea2b1', marginRight: 6 },
  latestCommentText: { fontSize: 14, color: '#cccccc', flex: 1 },

  reactionsContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#333333', marginBottom: 12 },
  reactionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 16 },
  reactionActive: { backgroundColor: '#ff6b3520' },
  reactionCount: { color: '#666666', fontSize: 14, marginLeft: 6 },
  reactionCountActive: { color: '#ff6b35' },
  commentToggle: { flexDirection: 'row', alignItems: 'center' },
  commentCount: { color: '#666666', fontSize: 14, marginLeft: 6 },

  addCommentContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  commentInput: { flex: 1, color: '#ffffff', fontSize: 14, paddingVertical: 4 },
  commentButton: { padding: 4 },

  // Skeleton
  skeletonBg: { backgroundColor: '#2a2a2a' },
  skeletonLine: { backgroundColor: '#2a2a2a', borderRadius: 6, marginBottom: 4 },

  // 3-dot menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menuCard: { width: '80%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, borderColor: '#333', borderWidth: 1 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  menuTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  menuItem: { paddingVertical: 12 },
  menuItemText: { color: '#fff', fontSize: 16 },

  // Report modal
  reportModal: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginHorizontal: 20, width: '90%', borderWidth: 1, borderColor: '#333' },
  reportHint: { color: '#ccc', marginBottom: 8 },
  reportInput: { minHeight: 90, borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 12, color: '#fff' },
  reportBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  reportBtnText: { color: '#fff', fontWeight: '600' },

  bottomSpace: { height: 20 },
});
