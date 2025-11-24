import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MessageSquare, MapPin, Flame, MoreVertical, Trash, User } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { UserPost } from '@/types/profile';
import { PostSkeleton } from './SkeletonComponents';
import { useProfile } from '@/hook/useProfile';

interface PostsTabProps {
  loading: boolean;
  posts: UserPost[];
  onDeletePost: (postId: string, postType: 'hub' | 'stop') => void;
  onNavigateToPost: (postId: string, postType: 'hub' | 'stop') => void;
  formatTimeAgo: (date: string) => string;
}

export const PostsTab: React.FC<PostsTabProps> = ({
  loading,
  posts,
  onDeletePost,
  onNavigateToPost,
  formatTimeAgo
}) => {
  const { colors } = useTheme();
  const { profile: currentUserProfile } = useProfile();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (postId: string) => {
    setActiveMenu(activeMenu === postId ? null : postId);
  };

  // Get latest comment for display (PostCard style)
  const getLatestComment = (post: UserPost) => {
    if (!post.comments || post.comments.length === 0) return null;
    
    const sortedComments = [...post.comments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return sortedComments[0];
  };

  // Check if current user liked the post
  const hasUserLiked = (post: UserPost) => {
    return post.reactions?.some((r: any) => 
      r.reaction_type === 'fire' && r.user_id === currentUserProfile?.id
    ) || false;
  };

  if (loading) {
    return (
      <View style={styles.postsContainer}>
        <PostSkeleton colors={colors} />
        <PostSkeleton colors={colors} />
        <PostSkeleton colors={colors} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.noPosts}>
        <MessageSquare size={48} color={colors.text} opacity={0.5} />
        <Text style={[styles.noPostsText, { color: colors.text }]}>
          No posts yet
        </Text>
        <Text style={[styles.noPostsSubtext, { color: colors.text }]}>
          Start sharing your transportation experiences!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.postsContainer}>
      {posts.map((post) => {
        const latestComment = getLatestComment(post);
        const userHasLiked = hasUserLiked(post);

        return (
          <View key={post.id} style={[styles.postItem, { backgroundColor: colors.card }]}>
            {/* Post Header with User Info (PostCard style) */}
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  {post.user_avatar_url ? (
                    <Image 
                      source={{ uri: post.user_avatar_url }} 
                      style={styles.avatar}
                    />
                  ) : (
                    <User size={16} color={colors.text} />
                  )}
                </View>
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: '#1ea2b1' }]}>
                    {post.user_first_name} {post.user_last_name}
                  </Text>
                  <Text style={[styles.userTitle, { color: colors.text }]}>
                    {post.user_title || 'Traveler'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.headerRight}>
                <Text style={[styles.postTimeAgo, { color: '#666666' }]}>
                  {formatTimeAgo(post.created_at)}
                </Text>
                <TouchableOpacity onPress={() => toggleMenu(post.id)}>
                  <MoreVertical size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete Menu */}
            {activeMenu === post.id && (
              <View style={[styles.postMenu, { backgroundColor: colors.card }]}>
                <TouchableOpacity 
                  style={styles.menuOption}
                  onPress={() => onDeletePost(post.id, post.type)}
                >
                  <Trash size={16} color="#ef4444" />
                  <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
                    Delete Post
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Post Content */}
            <TouchableOpacity 
              style={{flex: 1}} 
              onPress={() => onNavigateToPost(post.id, post.type)}
            >
              <Text style={[styles.postContent, { color: colors.text }]}>
                {post.content}
              </Text>
            </TouchableOpacity>

            {/* Latest Comment (PostCard style) */}
            {latestComment && (
              <View style={styles.latestComment}>
                <Text style={[styles.commentAuthor, { color: '#1ea2b1' }]}>
                  {latestComment.profiles?.first_name}: 
                </Text>
                <Text style={[styles.commentText, { color: colors.text }]} numberOfLines={1}>
                  {latestComment.content}
                </Text>
              </View>
            )}

            {/* Post Footer with Reactions (PostCard style) */}
            <View style={styles.postFooter}>
              <View style={styles.postLocation}>
                <MapPin size={12} color="#666666" />
                <Text style={[styles.postLocationText, { color: colors.text }]}>
                  {post.location_name}
                </Text>
              </View>
              
              <View style={styles.postReactions}>
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => {/* Add like functionality if needed */}}
                >
                  <Flame 
                    size={16} 
                    color={userHasLiked ? "#ff6b35" : "#666666"} 
                    fill={userHasLiked ? "#ff6b35" : "none"}
                  />
                  <Text style={[
                    styles.postReactionCount, 
                    { color: colors.text },
                    userHasLiked && styles.activeReaction
                  ]}>
                    {post.likes_count}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => onNavigateToPost(post.id, post.type)}
                >
                  <MessageSquare size={16} color="#666666" />
                  <Text style={[styles.postReactionCount, { color: colors.text }]}>
                    {post.comments_count}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  postsContainer: {
    padding: 16,
    gap: 16,
  },
  postItem: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userTitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postTimeAgo: {
    fontSize: 12,
  },
  latestComment: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  commentText: {
    fontSize: 14,
    flex: 1,
    color: '#cccccc',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666666',
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  postReactionCount: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeReaction: {
    color: '#ff6b35',
  },
  postMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  menuOptionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  noPosts: {
    alignItems: 'center',
    padding: 40,
  },
  noPostsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noPostsSubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});