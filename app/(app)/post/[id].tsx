import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Image,
  Platform,
  Share 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Flame, MessageCircle, Send, MapPin, Download, Share as ShareIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '@/hook/useAuth';
import ViewShot from 'react-native-view-shot';

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
  post_type: 'hub' | 'stop';
  profiles: UserProfile;
  hubs?: {
    name: string;
  };
  stops?: {
    name: string;
  };
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<View>(null);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      // First try to load as hub post
      let { data, error } = await supabase
        .from('hub_posts')
        .select(`
          *,
          profiles (first_name, last_name, selected_title, avatar_url),
          hubs (name),
          post_reactions (id, user_id, reaction_type),
          post_comments (
            id, content, user_id, created_at,
            profiles (first_name, last_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        // If not found as hub post, try as stop post
        const stopPostResponse = await supabase
          .from('stop_posts')
          .select(`
            *,
            profiles (first_name, last_name, selected_title, avatar_url),
            stops (name),
            post_reactions (id, user_id, reaction_type),
            post_comments (
              id, content, user_id, created_at,
              profiles (first_name, last_name, avatar_url)
            )
          `)
          .eq('id', id)
          .single();

        if (stopPostResponse.error) throw stopPostResponse.error;
        
        data = {
          ...stopPostResponse.data,
          post_type: 'stop'
        };
      } else {
        data = {
          ...data,
          post_type: 'hub'
        };
      }

      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
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
    if (!post || !currentUserId) return;

    try {
      const existingReaction = post.post_reactions
        .find(r => r.user_id === currentUserId && r.reaction_type === reactionType);

      if (existingReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        const reactionData: any = {
          user_id: currentUserId,
          reaction_type: reactionType,
        };

        if (post.post_type === 'hub') {
          reactionData.post_hub_id = post.id;
        } else {
          reactionData.post_stop_id = post.id;
        }

        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert([reactionData]);

        if (insertError) {
          // Handle trigger error gracefully
          if (insertError.code === '42703' && insertError.message?.includes('username')) {
            console.warn('Trigger error, but reaction was created');
          } else {
            throw insertError;
          }
        }
      }

      loadPost();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !post || !currentUserId) return;

    try {
      const commentData: any = {
        user_id: currentUserId,
        content: newComment.trim(),
      };

      if (post.post_type === 'hub') {
        commentData.hub_post = post.id;
      } else {
        commentData.stop_post = post.id;
      }

      const { error } = await supabase
        .from('post_comments')
        .insert([commentData]);

      if (!error) {
        await awardPoints(1);
        setNewComment('');
        loadPost();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
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

  const sharePost = async () => {
    if (!post) return;

    try {
      setSharing(true);
      
      const communityName = post.post_type === 'hub' ? post.hubs?.name : post.stops?.name || "Uthutho Community";
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
      setSharing(false);
    }
  };

  const downloadPost = async () => {
    if (!post || !viewShotRef.current) return;

    // Don't do anything on web since the button is hidden
    if (Platform.OS === 'web') {
      return;
    }

    try {
      setSharing(true);
      
      // Capture the post as an image
      const uri = await captureRef(viewShotRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Request permissions for media library (iOS/Android)
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
      setSharing(false);
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
    if (!post || !currentUserId) return false;
    return post.post_reactions.some(r => r.user_id === currentUserId && r.reaction_type === reactionType);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Only show download option on native platforms (not web)
  const showDownloadOption = Platform.OS !== 'web';

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

  const fireCount = getReactionCount('fire');
  const commentCount = post.post_comments.length;

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
      <ViewShot 
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.9 }}
        style={styles.viewShotContainer}
      >
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
                  style={styles.avatarImage}
                />
              </View>
              <View>
                <Text style={styles.userName}>
                  {post.profiles.first_name} {post.profiles.last_name}
                </Text>
                <Text style={styles.userTitle}>{post.profiles.selected_title}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.postTime}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <MapPin size={14} color="#666666" />
            <Text style={styles.locationText}>
              {post.post_type === 'hub' ? post.hubs?.name : post.stops?.name || 'Unknown Location'}
            </Text>
          </View>

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Actions - Same as feed */}
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[styles.actionItem, hasUserReacted('fire') && styles.actionActive]}
              onPress={() => toggleReaction('fire')}
            >
              <Flame 
                size={18} 
                color={hasUserReacted('fire') ? '#ff7b25' : '#666'} 
                fill={hasUserReacted('fire') ? '#ff7b25' : 'none'} 
              />
              <Text style={[
                styles.actionCount, 
                hasUserReacted('fire') && { color: '#ff7b25' }
              ]}>
                {fireCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
            >
              <MessageCircle size={18} color="#666" />
              <Text style={styles.actionCount}>
                {commentCount}
              </Text>
            </TouchableOpacity>
            
            {/* Only show download button on native platforms */}
            {showDownloadOption && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={downloadPost}
                disabled={sharing}
              >
                <Download size={18} color="#666" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={sharePost}
              disabled={sharing}
            >
              <ShareIcon size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ViewShot>

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
                  source={{ uri: comment.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.commentUserInfo}>
                <Text style={styles.commentAuthor}>
                  {comment.profiles.first_name} {comment.profiles.last_name}
                </Text>
                <Text style={styles.commentTime}>
                  {formatTimeAgo(comment.created_at)}
                </Text>
              </View>
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
  viewShotContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    paddingBottom: 16,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
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
  actionActive: {
    // Active state styling if needed
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  commentsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
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
    marginRight: 12,
    overflow: 'hidden',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
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

  // Skeleton styles
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