// components/feeds/PostList.tsx
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Post } from '@/types/feeds';
import { Community } from '@/types/feeds';
import PostCreation from './PostCreation';
import PostCard from './PostCard';
import EmptyPosts from './EmptyPosts';

interface PostListProps {
  posts: Post[];
  selectedCommunity: Community | null;
  newPost: string;
  setNewPost: (text: string) => void;
  createPost: () => void;
  toggleReaction: (postId: string, reactionType: string) => void;
  sharePost: (post: Post) => void;
  downloadPost: (post: Post) => void;
  sharingPost: boolean;
  userId: string;
  router: any;
  refreshing: boolean;
  onRefresh: () => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  selectedCommunity,
  newPost,
  setNewPost,
  createPost,
  toggleReaction,
  sharePost,
  downloadPost,
  sharingPost,
  userId,
  router,
  refreshing,
  onRefresh,
}) => {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          userId={userId}
          toggleReaction={toggleReaction}
          sharePost={sharePost}
          downloadPost={downloadPost}
          sharingPost={sharingPost}
          router={router}
        />
      )}
      ListHeaderComponent={
        selectedCommunity ? (
          <PostCreation
            newPost={newPost}
            setNewPost={setNewPost}
            createPost={createPost}
          />
        ) : null
      }
      ListEmptyComponent={<EmptyPosts />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
};

const styles = StyleSheet.create({
  // Add any necessary styles
});

export default PostList;