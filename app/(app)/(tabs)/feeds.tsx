import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MessageSquare, Heart, Flame, Send, MapPin, User, Plus, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  post_type: 'hub' | 'stop';
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  hubs?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  stops?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  post_reactions: Array<{
    id: string;
    user_id: string;
    reaction_type: string;
  }>;
  post_comments: Array<{
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  }>;
}

export default function FeedsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{id: string, name: string, type: 'hub' | 'stop'} | null>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    getCurrentUser();
    loadPosts();
    loadLocations();
    requestLocationPermission();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
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
        longitude: location.coords.longitude
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
        supabase.from('stops').select('id, name, latitude, longitude')
      ]);

      if (hubsData.data) setHubs(hubsData.data);
      if (stopsData.data) setStops(stopsData.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const findNearestLocation = () => {
    if (!userLocation || (hubs.length === 0 && stops.length === 0)) return null;

    let nearestLocation: {id: string, name: string, type: 'hub' | 'stop'} | null = null;
    let minDistance = Infinity;

    // Check hubs
    hubs.forEach(hub => {
      if (hub.latitude && hub.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hub.latitude,
          hub.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = {
            id: hub.id,
            name: hub.name,
            type: 'hub'
          };
        }
      }
    });

    // Check stops
    stops.forEach(stop => {
      if (stop.latitude && stop.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          stop.latitude,
          stop.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = {
            id: stop.id,
            name: stop.name,
            type: 'stop'
          };
        }
      }
    });

    return nearestLocation;
  };

  const openCreatePost = () => {
    const nearest = findNearestLocation();
    if (nearest) {
      setSelectedLocation(nearest);
    }
    setShowLocationModal(true);
  };

const loadPosts = async () => {
  setLoading(true);
  try {
    // Fetch both hub_posts and stop_posts
    const [
      { data: hubPostsData, error: hubPostsError },
      { data: stopPostsData, error: stopPostsError }
    ] = await Promise.all([
      supabase
        .from('hub_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('stop_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (hubPostsError || stopPostsError) throw hubPostsError || stopPostsError;

    // Combine all posts
    const allPosts = [
      ...(hubPostsData || []).map(p => ({ ...p, post_type: 'hub' })),
      ...(stopPostsData || []).map(p => ({ ...p, post_type: 'stop' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Then get all the related data in separate queries
    if (allPosts.length > 0) {
      // Get user profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', allPosts.map(p => p.user_id));

      // Get hubs data
      const hubIds = allPosts.filter(p => p.hub_id).map(p => p.hub_id);
      const { data: hubsData } = hubIds.length > 0 ? await supabase
        .from('hubs')
        .select('id, name, latitude, longitude')
        .in('id', hubIds) : { data: [] };

      // Get stops data
      const stopIds = allPosts.filter(p => p.stop_id).map(p => p.stop_id);
      const { data: stopsData } = stopIds.length > 0 ? await supabase
        .from('stops')
        .select('id, name, latitude, longitude')
        .in('id', stopIds) : { data: [] };

      // Get reactions for both types of posts
      const { data: reactionsData } = await supabase
        .from('post_reactions')
        .select('*')
        .or(`post_hub_id.in.(${allPosts.filter(p => p.post_type === 'hub').map(p => p.id).join(',')}),post_stop_id.in.(${allPosts.filter(p => p.post_type === 'stop').map(p => p.id).join(',')})`);

      // Get comments for both types of posts
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('id, content, user_id, created_at, hub_post, stop_post')
        .or(`hub_post.in.(${allPosts.filter(p => p.post_type === 'hub').map(p => p.id).join(',')}),stop_post.in.(${allPosts.filter(p => p.post_type === 'stop').map(p => p.id).join(',')})`);

      // Get commenter profiles
      const commenterIds = commentsData?.map(c => c.user_id) || [];
      const { data: commenterProfiles } = commenterIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', commenterIds) : { data: [] };

      // Combine all the data
      const combinedPosts = allPosts.map(post => ({
        ...post,
        profiles: profilesData?.find(p => p.id === post.user_id) || {},
        hubs: hubsData?.find(h => h.id === post.hub_id) || null,
        stops: stopsData?.find(s => s.id === post.stop_id) || null,
        post_reactions: reactionsData?.filter(r => 
          (post.post_type === 'hub' && r.post_hub_id === post.id) ||
          (post.post_type === 'stop' && r.post_stop_id === post.id)
        ) || [],
        post_comments: commentsData
          ?.filter(c => 
            (post.post_type === 'hub' && c.hub_post === post.id) ||
            (post.post_type === 'stop' && c.stop_post === post.id)
          )
          .map(comment => ({
            ...comment,
            profiles: commenterProfiles?.find(p => p.id === comment.user_id) || {}
          })) || []
      }));

      setPosts(combinedPosts);
    } else {
      setPosts([]);
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    Alert.alert('Error', 'Failed to load posts');
  } finally {
    setLoading(false);
  }
};

const createPost = async () => {
  if (!newPost.trim()) return;

  try {
    const nearestLocation = findNearestLocation();
    
    const postData: any = {
      content: newPost,
      user_id: currentUserId,
    };

    // Determine which table to insert into based on location type
    const location = selectedLocation || nearestLocation;
    let tableName = 'hub_posts'; // default
    
    if (location) {
      if (location.type === 'hub') {
        postData.hub_id = location.id;
        tableName = 'hub_posts';
      } else if (location.type === 'stop') {
        postData.stop_id = location.id;
        tableName = 'stop_posts';
      }
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(postData)
      .select()
      .single();

    if (error) throw error;

    // Award points and refresh
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

      setPosts(prev => [{
        ...data,
        post_type: location?.type === 'stop' ? 'stop' : 'hub',
        profiles: profile || {},
        hubs: location?.type === 'hub' ? 
          hubs.find(h => h.id === location.id) : null,
        stops: location?.type === 'stop' ? 
          stops.find(s => s.id === location.id) : null,
        post_reactions: [],
        post_comments: []
      }, ...prev]);
    }
  } catch (error) {
    console.error('Error creating post:', error);
    Alert.alert('Error', 'Failed to create post');
  }
};
  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

const toggleReaction = async (postId: string, reactionType: string, postType: 'hub' | 'stop') => {
  try {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Check if user already reacted
    const existingReaction = post.post_reactions
      .find(r => r.user_id === currentUserId && r.reaction_type === reactionType);

    if (existingReaction) {
      // Remove reaction
      await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      // Add reaction
      await supabase
        .from('post_reactions')
        .insert([{
          [postType === 'hub' ? 'post_hub_id' : 'post_stop_id']: postId,
          user_id: currentUserId,
          reaction_type: reactionType,
        }]);
    }

    loadPosts();
  } catch (error) {
    console.error('Error toggling reaction:', error);
  }
};

  const addComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{
          hub_post: postId,
          user_id: currentUserId,
          content: comment,
        }]);

      if (!error) {
        // Award 1 point for commenting
        await awardPoints(1);
        setCommentInputs({ ...commentInputs, [postId]: '' });
        loadPosts();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const awardPoints = async (points: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', currentUserId)
        .single();

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

  const getReactionCount = (post: Post, reactionType: string) => {
    return post.post_reactions.filter(r => r.reaction_type === reactionType).length;
  };

  const hasUserReacted = (post: Post, reactionType: string) => {
    return post.post_reactions.some(r => r.user_id === currentUserId && r.reaction_type === reactionType);
  };

  // Skeleton component
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

  const nearestLocation = findNearestLocation();

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Community Feeds</Text>
        <Text style={styles.subtitle}>Share your transport experiences</Text>
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
          <TouchableOpacity
            style={styles.locationButton}
            onPress={openCreatePost}
          >
            <MapPin size={20} color="#1ea2b1" />
            <Text style={styles.locationButtonText}>
              {selectedLocation?.name || nearestLocation?.name || 'Select location'}
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
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
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
                  style={[
                    styles.locationItem,
                    selectedLocation?.id === hub.id && styles.selectedLocationItem
                  ]}
                  onPress={() => {
                    setSelectedLocation({
                      id: hub.id,
                      name: hub.name,
                      type: 'hub'
                    });
                    setShowLocationModal(false);
                  }}
                >
                  <MapPin size={20} color="#1ea2b1" />
                  <Text style={styles.locationName}>{hub.name}</Text>
                  {userLocation && hub.latitude && hub.longitude && (
                    <Text style={styles.locationDistance}>
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        hub.latitude,
                        hub.longitude
                      ).toFixed(1)} km
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              
              <Text style={styles.locationSectionTitle}>Stops</Text>
              {stops.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    styles.locationItem,
                    selectedLocation?.id === stop.id && styles.selectedLocationItem
                  ]}
                  onPress={() => {
                    setSelectedLocation({
                      id: stop.id,
                      name: stop.name,
                      type: 'stop'
                    });
                    setShowLocationModal(false);
                  }}
                >
                  <MapPin size={20} color="#666666" />
                  <Text style={styles.locationName}>{stop.name}</Text>
                  {userLocation && stop.latitude && stop.longitude && (
                    <Text style={styles.locationDistance}>
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        stop.latitude,
                        stop.longitude
                      ).toFixed(1)} km
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Posts Feed */}
      <View style={styles.feedContainer}>
        {loading ? (
          <>
            {[...Array(3)].map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </>
        ) : posts.length === 0 ? (
          <Text style={styles.noPostsText}>No posts yet. Be the first to share!</Text>
        ) : (
          posts.map((post) => (
            <TouchableOpacity 
              key={post.id} 
              style={styles.postCard}
              onPress={() => navigateToPost(post.id)}
            >
              {/* Post Header */}
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={() => navigateToUserProfile(post.user_id)}
                >
                  <View style={styles.avatar}>
                    <Image
                      source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                      style={styles.avatar}
                    />
                  </View>
                  <View>
                    <Text style={styles.userName}>
                      {post.profiles.first_name} {post.profiles.last_name}
                    </Text>
                    <View style={styles.locationInfo}>
                      <MapPin size={12} color="#666666" />
                      <Text style={styles.locationText}>
                        {post.hubs?.name || post.stops?.name || 'Unknown Location'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.postTime}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Post Content */}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Latest Comment Preview */}
              {post.post_comments.length > 0 && (
                <View style={styles.latestComment}>
                  <Text style={styles.latestCommentAuthor}>
                    {post.post_comments[0].profiles.first_name}: 
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
                  <Text style={[styles.reactionCount, hasUserReacted(post, 'fire') && styles.reactionCountActive]}>
                    {getReactionCount(post, 'fire')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.commentToggle}>
                  <MessageSquare size={20} color="#666666" />
                  <Text style={styles.commentCount}>{post.post_comments.length}</Text>
                </TouchableOpacity>
              </View>

              {/* Add Comment */}
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666666"
                  value={commentInputs[post.id] || ''}
                  onChangeText={(text) => setCommentInputs({ ...commentInputs, [post.id]: text })}
                />
                <TouchableOpacity
                  style={styles.commentButton}
                    onPress={() => addComment(post.id, post.post_type)}
                >
                  <Send size={16} color="#1ea2b1" />
                </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
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
  postInput: {
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
  },
  locationButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
    marginLeft: 8,
  },
  postButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    padding: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonBg: {
    backgroundColor: '#2a2a2a',
  },
  skeletonLine: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    marginBottom: 4,
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  locationList: {
    maxHeight: 400,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 12,
    marginTop: 8,
  },
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
  selectedLocationItem: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b120',
  },
  locationName: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  locationDistance: {
    color: '#666666',
    fontSize: 14,
  },
  feedContainer: {
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 40,
  },
  noPostsText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 40,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
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
    color: '#ffffff',
    marginBottom: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postContent: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 16,
  },
  latestComment: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },
  latestCommentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
  },
  latestCommentText: {
    fontSize: 14,
    color: '#cccccc',
    flex: 1,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginBottom: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
  },
  reactionActive: {
    backgroundColor: '#ff6b3520',
  },
  reactionCount: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 6,
  },
  reactionCountActive: {
    color: '#ff6b35',
  },
  commentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 6,
  },
  commentsSection: {
    marginBottom: 12,
  },
  comment: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 4,
  },
  commentButton: {
    padding: 4,
  },
  bottomSpace: {
    height: 20,
  },
});