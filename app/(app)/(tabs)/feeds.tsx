import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MessageSquare, Heart, Flame, Send, MapPin, User, Plus, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

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
    avatar_url: string;

  };
  hubs?: {
    name: string;
  };
  stops?: {
    name: string;
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

  useEffect(() => {
    getCurrentUser();
    loadPosts();
    loadLocations();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadLocations = async () => {
    try {
      const [hubsData, stopsData] = await Promise.all([
        supabase.from('hubs').select('id, name').limit(10),
        supabase.from('stops').select('id, name').limit(10)
      ]);

      if (hubsData.data) setHubs(hubsData.data);
      if (stopsData.data) setStops(stopsData.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const openCreatePost = () => {
    setShowLocationModal(true);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hub_posts')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url),
          hubs (name),
          post_reactions (id, user_id, reaction_type),
          post_comments (
            id, content, user_id, created_at,
            profiles (first_name, last_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
    setLoading(false);
  };

  const createPost = async (location: {id: string, name: string, type: 'hub' | 'stop'}) => {
    if (!newPost.trim() || !location) return;

    try {
      const postData: any = {
        content: newPost,
        user_id: currentUserId,
      };

      if (location.type === 'hub') {
        postData.hub_id = location.id;
      } else {
        postData.stop_id = location.id;
      }

      const { error } = await supabase
        .from('hub_posts')
        .insert([postData]);

      if (!error) {
        // Award 1 point for posting
        await awardPoints(1);
        setNewPost('');
        setSelectedLocation(null);
        setShowLocationModal(false);
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const toggleReaction = async (postId: string, reactionType: string) => {
    try {
      // Check if user already reacted
      const existingReaction = posts
        .find(p => p.id === postId)
        ?.post_reactions
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
            post_hub_id: postId,
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
        <TouchableOpacity
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={openCreatePost}
          disabled={!newPost.trim()}
        >
          <Send size={20} color="#ffffff" />
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
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
                  style={styles.locationItem}
                  onPress={() => createPost({id: hub.id, name: hub.name, type: 'hub'})}
                >
                  <MapPin size={20} color="#1ea2b1" />
                  <Text style={styles.locationName}>{hub.name}</Text>
                </TouchableOpacity>
              ))}
              
              <Text style={styles.locationSectionTitle}>Stops</Text>
              {stops.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={styles.locationItem}
                  onPress={() => createPost({id: stop.id, name: stop.name, type: 'stop'})}
                >
                  <MapPin size={20} color="#666666" />
                  <Text style={styles.locationName}>{stop.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Posts Feed */}
      <View style={styles.feedContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Loading posts...</Text>
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
                    <User size={20} color="#1ea2b1" />
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
                  onPress={() => toggleReaction(post.id, 'fire')}
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
                  onPress={() => addComment(post.id)}
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
    paddingTop: 60,
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
  postButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  locationName: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
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