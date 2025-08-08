import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert , Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Heart, Flame, Send, MapPin, User, Clock } from 'lucide-react-native';
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getCurrentUser();
      loadPost();
    }
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadPost = async () => {
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
            profiles (first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (!error) {
        setPost(data);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
    setLoading(false);
  };

    const PostSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonCommentBlock} />
      <View style={styles.skeletonCommentBlock} />
    </View>
  );

  const toggleReaction = async (reactionType: string) => {
    if (!post) return;

    try {
      const existingReaction = post.post_reactions
        .find(r => r.user_id === currentUserId && r.reaction_type === reactionType);

      if (existingReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('post_reactions')
          .insert([{
            post_hub_id: post.id,
            user_id: currentUserId,
            reaction_type: reactionType,
          }]);
      }

      loadPost();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !post) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{
          hub_post: post.id,
          user_id: currentUserId,
          content: newComment,
        }]);

      if (!error) {
        // Award 1 point for commenting
        await awardPoints(1);
        setNewComment('');
        loadPost();
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

  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const getReactionCount = (reactionType: string) => {
    if (!post) return 0;
    return post.post_reactions.filter(r => r.reaction_type === reactionType).length;
  };

  const hasUserReacted = (reactionType: string) => {
    if (!post) return false;
    return post.post_reactions.some(r => r.user_id === currentUserId && r.reaction_type === reactionType);
  };

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="light" backgroundColor="#000000" />
        <PostSkeleton />
      </ScrollView>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
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
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Post Content */}
      <View style={styles.postCard}>
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

        {/* Reactions */}
        <View style={styles.reactionsContainer}>
          <TouchableOpacity
            style={[styles.reactionButton, hasUserReacted('fire') && styles.reactionActive]}
            onPress={() => toggleReaction('fire')}
          >
            <Flame size={24} color={hasUserReacted('fire') ? '#ff6b35' : '#666666'} />
            <Text style={[styles.reactionCount, hasUserReacted('fire') && styles.reactionCountActive]}>
              {getReactionCount('fire')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments ({post.post_comments.length})</Text>
        
        {post.post_comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <TouchableOpacity 
              style={styles.commentHeader}
              onPress={() => navigateToUserProfile(comment.user_id)}
            >
              <View style={styles.commentAvatar}>
                    <Image
                      source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                      style={styles.avatar}
                    />
              </View>
              <Text style={styles.commentAuthor}>
                {comment.profiles.first_name} {comment.profiles.last_name}
              </Text>
              <Text style={styles.commentTime}>
                {new Date(comment.created_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        ))}

        {/* Add Comment */}
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#666666"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={[styles.commentButton, !newComment.trim() && styles.commentButtonDisabled]}
            onPress={addComment}
            disabled={!newComment.trim()}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
  postCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reactionActive: {
    backgroundColor: '#ff6b3520',
  },
  reactionCount: {
    color: '#666666',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  reactionCountActive: {
    color: '#ff6b35',
  },
  commentsSection: {
    paddingHorizontal: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
    flex: 1,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
  },
  commentContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 4,
  },
  commentButton: {
    backgroundColor: '#1ea2b1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentButtonDisabled: {
    backgroundColor: '#333333',
  },
  bottomSpace: {
    height: 20,
  },

  // 💀 Skeleton styles
  skeletonContainer: {
    padding: 20,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: '60%',
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonCommentBlock: {
    height: 60,
    backgroundColor: '#222',
    borderRadius: 12,
    marginTop: 12,
  },
});