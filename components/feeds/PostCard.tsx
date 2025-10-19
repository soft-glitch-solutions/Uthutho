// components/feeds/PostCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Flame, MessageCircle, Download, Share } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import { PostCardProps } from '@/types';

const PostCard: React.FC<PostCardProps> = ({
  post,
  userId,
  toggleReaction,
  sharePost,
  downloadPost,
  sharingPost,
  router,
  viewShotRef,
}) => {
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

  return (
    <ViewShot 
      ref={viewShotRef}
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
            style={styles.actionItem}
            onPress={() => toggleReaction(post.id, 'fire')}
          >
            <Flame 
              size={18} 
              color={hasUserFired ? '#ff7b25' : '#666'} 
              fill={hasUserFired ? '#ff7b25' : 'none'} 
            />
            <Text style={[
              styles.actionCount, 
              hasUserFired && { color: '#ff7b25' }
            ]}>
              {fireCount}
            </Text>
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
            onPress={() => downloadPost(post)}
            disabled={sharingPost}
          >
            <Download size={18} color="#666" />
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
            <Text style={styles.commentAuthor}>
              {latestComment.profiles.first_name}: 
            </Text>
            <Text style={styles.commentText} numberOfLines={1}>
              {latestComment.content}
            </Text>
          </View>
        )}
      </Pressable>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
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
    marginLeft: 4,
  },
});

export default PostCard;