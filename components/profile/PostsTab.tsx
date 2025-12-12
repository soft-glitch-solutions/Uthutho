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
  isDesktop?: boolean;
}

export const PostsTab: React.FC<PostsTabProps> = ({
  loading,
  posts,
  onDeletePost,
  onNavigateToPost,
  formatTimeAgo,
  isDesktop = false
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
      <View style={[styles.postsContainer, isDesktop && styles.postsContainerDesktop]}>
        <PostSkeleton colors={colors} isDesktop={isDesktop} />
        <PostSkeleton colors={colors} isDesktop={isDesktop} />
        <PostSkeleton colors={colors} isDesktop={isDesktop} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={[styles.noPosts, isDesktop && styles.noPostsDesktop]}>
        <MessageSquare size={isDesktop ? 56 : 48} color={colors.text} opacity={0.5} />
        <Text style={[styles.noPostsText, { color: colors.text }, isDesktop && styles.noPostsTextDesktop]}>
          No posts yet
        </Text>
        <Text style={[styles.noPostsSubtext, { color: colors.text }, isDesktop && styles.noPostsSubtextDesktop]}>
          Start sharing your transportation experiences!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.postsContainer, isDesktop && styles.postsContainerDesktop]}>
      {posts.map((post) => {
        const latestComment = getLatestComment(post);
        const userHasLiked = hasUserLiked(post);

        return (
          <View key={post.id} style={[
            styles.postItem, 
            { backgroundColor: colors.card }, 
            isDesktop && styles.postItemDesktop
          ]}>
            {/* Post Header with User Info (PostCard style) */}
            <View style={[styles.postHeader, isDesktop && styles.postHeaderDesktop]}>
              <View style={[styles.userInfo, isDesktop && styles.userInfoDesktop]}>
                <View style={[styles.avatarContainer, isDesktop && styles.avatarContainerDesktop]}>
                  {post.user_avatar_url ? (
                    <Image 
                      source={{ uri: post.user_avatar_url }} 
                      style={[styles.avatar, isDesktop && styles.avatarDesktop]}
                    />
                  ) : (
                    <User size={isDesktop ? 18 : 16} color={colors.text} />
                  )}
                </View>
                <View style={[styles.userDetails, isDesktop && styles.userDetailsDesktop]}>
                  <Text style={[styles.userName, { color: '#1ea2b1' }, isDesktop && styles.userNameDesktop]}>
                    {post.user_first_name} {post.user_last_name}
                  </Text>
                  <Text style={[styles.userTitle, { color: colors.text }, isDesktop && styles.userTitleDesktop]}>
                    {post.user_title || 'Traveler'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.headerRight, isDesktop && styles.headerRightDesktop]}>
                <Text style={[styles.postTimeAgo, { color: '#666666' }, isDesktop && styles.postTimeAgoDesktop]}>
                  {formatTimeAgo(post.created_at)}
                </Text>
                <TouchableOpacity onPress={() => toggleMenu(post.id)}>
                  <MoreVertical size={isDesktop ? 18 : 20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete Menu */}
            {activeMenu === post.id && (
              <View style={[
                styles.postMenu, 
                { backgroundColor: colors.card },
                isDesktop && styles.postMenuDesktop
              ]}>
                <TouchableOpacity 
                  style={[styles.menuOption, isDesktop && styles.menuOptionDesktop]}
                  onPress={() => onDeletePost(post.id, post.type)}
                >
                  <Trash size={isDesktop ? 14 : 16} color="#ef4444" />
                  <Text style={[
                    styles.menuOptionText, 
                    { color: '#ef4444' },
                    isDesktop && styles.menuOptionTextDesktop
                  ]}>
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
              <Text style={[styles.postContent, { color: colors.text }, isDesktop && styles.postContentDesktop]}>
                {post.content}
              </Text>
            </TouchableOpacity>

            {/* Latest Comment (PostCard style) */}
            {latestComment && (
              <View style={[styles.latestComment, isDesktop && styles.latestCommentDesktop]}>
                <Text style={[
                  styles.commentAuthor, 
                  { color: '#1ea2b1' },
                  isDesktop && styles.commentAuthorDesktop
                ]}>
                  {latestComment.profiles?.first_name}: 
                </Text>
                <Text style={[
                  styles.commentText, 
                  { color: colors.text },
                  isDesktop && styles.commentTextDesktop
                ]} numberOfLines={isDesktop ? 2 : 1}>
                  {latestComment.content}
                </Text>
              </View>
            )}

            {/* Post Footer with Reactions (PostCard style) */}
            <View style={[styles.postFooter, isDesktop && styles.postFooterDesktop]}>
              <View style={[styles.postLocation, isDesktop && styles.postLocationDesktop]}>
                <MapPin size={isDesktop ? 11 : 12} color="#666666" />
                <Text style={[
                  styles.postLocationText, 
                  { color: colors.text },
                  isDesktop && styles.postLocationTextDesktop
                ]}>
                  {post.location_name}
                </Text>
              </View>
              
              <View style={[styles.postReactions, isDesktop && styles.postReactionsDesktop]}>
                <TouchableOpacity 
                  style={[styles.reactionButton, isDesktop && styles.reactionButtonDesktop]}
                  onPress={() => {/* Add like functionality if needed */}}
                >
                  <Flame 
                    size={isDesktop ? 15 : 16} 
                    color={userHasLiked ? "#ff6b35" : "#666666"} 
                    fill={userHasLiked ? "#ff6b35" : "none"}
                  />
                  <Text style={[
                    styles.postReactionCount, 
                    { color: colors.text },
                    userHasLiked && styles.activeReaction,
                    isDesktop && styles.postReactionCountDesktop
                  ]}>
                    {post.likes_count}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.reactionButton, isDesktop && styles.reactionButtonDesktop]}
                  onPress={() => onNavigateToPost(post.id, post.type)}
                >
                  <MessageSquare size={isDesktop ? 15 : 16} color="#666666" />
                  <Text style={[
                    styles.postReactionCount, 
                    { color: colors.text },
                    isDesktop && styles.postReactionCountDesktop
                  ]}>
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
    backgroundColor: '#000000',
  },
  postsContainerDesktop: {
    padding: 0,
    gap: 20,
  },
  postItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#111111',
  },
  postItemDesktop: {
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 0,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postHeaderDesktop: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoDesktop: {
    alignItems: 'center',
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
  avatarContainerDesktop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarDesktop: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userDetails: {
    flex: 1,
  },
  userDetailsDesktop: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  userNameDesktop: {
    fontSize: 17,
  },
  userTitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  userTitleDesktop: {
    fontSize: 11,
    marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  headerRightDesktop: {
    gap: 10,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: '#FFFFFF',
  },
  postContentDesktop: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postTimeAgo: {
    fontSize: 12,
    color: '#666666',
  },
  postTimeAgoDesktop: {
    fontSize: 11,
  },
  latestComment: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  latestCommentDesktop: {
    marginBottom: 16,
    paddingTop: 14,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
    color: '#1ea2b1',
  },
  commentAuthorDesktop: {
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
    flex: 1,
    color: '#cccccc',
  },
  commentTextDesktop: {
    fontSize: 13,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  postFooterDesktop: {
    paddingTop: 14,
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationDesktop: {
    flex: 1,
  },
  postLocationText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666666',
  },
  postLocationTextDesktop: {
    fontSize: 11,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postReactionsDesktop: {
    gap: 20,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  reactionButtonDesktop: {
    paddingHorizontal: 10,
  },
  postReactionCount: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  postReactionCountDesktop: {
    fontSize: 13,
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
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
  },
  postMenuDesktop: {
    top: 55,
    right: 20,
    padding: 10,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  menuOptionDesktop: {
    padding: 8,
  },
  menuOptionText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#ef4444',
  },
  menuOptionTextDesktop: {
    fontSize: 13,
  },
  noPosts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000000',
  },
  noPostsDesktop: {
    padding: 60,
  },
  noPostsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  noPostsTextDesktop: {
    fontSize: 20,
  },
  noPostsSubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    color: '#CCCCCC',
  },
  noPostsSubtextDesktop: {
    fontSize: 15,
  },
});