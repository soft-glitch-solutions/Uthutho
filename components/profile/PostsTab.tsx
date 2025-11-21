import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageSquare, MapPin, Flame, MoreVertical, Trash } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { UserPost } from '@/types/profile';
import { PostSkeleton } from './SkeletonComponents';

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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (postId: string) => {
    setActiveMenu(activeMenu === postId ? null : postId);
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
      {posts.map((post) => (
        <View key={post.id} style={[styles.postItem, { backgroundColor: colors.card }]}>
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={{flex: 1}} 
              onPress={() => onNavigateToPost(post.id, post.type)}
            >
              <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
                {post.content}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleMenu(post.id)}>
              <MoreVertical size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
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
          
          <Text style={[styles.postTimeAgo, { color: colors.text }]}>
            {formatTimeAgo(post.created_at)}
          </Text>
          
          <View style={styles.postFooter}>
            <View style={styles.postLocation}>
              <MapPin size={12} color="#666666" />
              <Text style={[styles.postLocationText, { color: colors.text }]}>
                {post.location_name}
              </Text>
            </View>
            <View style={styles.postReactions}>
              <Flame size={14} color="#ff6b35" />
              <Text style={[styles.postReactionCount, { color: colors.text }]}>
                {post.likes_count}
              </Text>
              <MessageSquare size={14} color="#666666" style={{ marginLeft: 12 }} />
              <Text style={[styles.postReactionCount, { color: colors.text }]}>
                {post.comments_count}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  postsContainer: {
    padding: 20,
    gap: 15,
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
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  postTimeAgo: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postReactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  postMenu: {
    position: 'absolute',
    top: 40,
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