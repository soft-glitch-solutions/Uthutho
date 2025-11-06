// components/feeds/PostCard.tsx
import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Flame, MessageCircle, Download, Share } from 'lucide-react-native';
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

interface PostCardProps {
  post: Post;
  userId: string;
  toggleReaction: (postId: string, reactionType: string) => void;
  sharePost: (post: Post) => void;
  downloadPost: (post: Post) => void;
  sharingPost: boolean;
  router: any;
  viewShotRef: (ref: any) => void;
  disabled?: boolean;
}

const PostCard = forwardRef<View, PostCardProps>((props, ref) => {
  const {
    post,
    userId,
    toggleReaction,
    sharePost,
    downloadPost,
    sharingPost,
    router,
    viewShotRef,
    disabled = false
  } = props;

  const fireCount = post.post_reactions.filter((r) => r.reaction_type === 'fire').length;
  const hasUserFired = post.post_reactions.some((r) => r.reaction_type === 'fire' && r.user_id === userId);
  const latestComment = post.post_comments[post.post_comments.length - 1];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleReaction = (reactionType: string) => {
    if (disabled) return;
    toggleReaction(post.id, reactionType);
  };

  const handleShare = () => {
    if (disabled) return;
    sharePost(post);
  };

  const handleDownload = () => {
    if (disabled) return;
    downloadPost(post);
  };

  const handlePostPress = () => {
    if (disabled) return;
    router.push(`/post/${post.id}`);
  };

  const handleUserPress = () => {
    if (disabled) return;
    router.push(`/user/${post.user_id}`);
  };

  // Only show download option on native platforms (not web)
  const showDownloadOption = Platform.OS !== 'web';

  return (
    <ViewShot 
      ref={viewShotRef}
      options={{ format: 'png', quality: 0.9 }}
      style={[styles.container, disabled && styles.disabledCard]}
    >
      <Pressable
        onPress={handlePostPress}
        android_ripple={{ color: '#0f0f0f' }}
        disabled={disabled}
      >
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Pressable 
              onPress={handleUserPress}
              style={styles.userInfoContainer}
              disabled={disabled}
            >
              <View style={styles.profilePicture}>
                <Image
                  source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/40x40/333333/ffffff?text=U' }}
                  style={styles.profileImage}
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
              style={[styles.actionItem, disabled && styles.disabledAction]}
              onPress={() => handleReaction('fire')}
              disabled={disabled}
            >
              <Flame 
                size={18} 
                color={hasUserFired ? '#ff7b25' : '#666'} 
                fill={hasUserFired ? '#ff7b25' : 'none'} 
              />
              <Text style={[
                styles.actionCount, 
                hasUserFired && { color: '#ff7b25' },
                disabled && styles.disabledText
              ]}>
                {fireCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionItem, disabled && styles.disabledAction]}
              onPress={handlePostPress}
              disabled={disabled}
            >
              <MessageCircle size={18} color="#666" />
              <Text style={[styles.actionCount, disabled && styles.disabledText]}>
                {post.post_comments.length}
              </Text>
            </TouchableOpacity>
            
            {/* Only show download button on native platforms */}
            {showDownloadOption && (
              <TouchableOpacity
                style={[styles.actionItem, disabled && styles.disabledAction]}
                onPress={handleDownload}
                disabled={disabled || sharingPost}
              >
                <Download size={18} color="#666" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionItem, disabled && styles.disabledAction]}
              onPress={handleShare}
              disabled={disabled || sharingPost}
            >
              <Share size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {latestComment && (
            <View style={styles.latestComment}>
              <Text style={styles.commentAuthor}>
                {latestComment.profiles.first_name}: 
              </Text>
              <Text style={[styles.commentText, disabled && styles.disabledText]} numberOfLines={1}>
                {latestComment.content}
              </Text>
            </View>
          )}

          {disabled && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>Follow to interact</Text>
            </View>
          )}
        </View>
      </Pressable>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.7,
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
    overflow: 'hidden',
  },
  profileImage: {
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
  disabledAction: {
    opacity: 0.5,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  disabledText: {
    color: '#444444',
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
    marginLeft: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

PostCard.displayName = 'PostCard';

export default PostCard;