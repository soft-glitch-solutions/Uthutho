// components/feeds/PostList.tsx
import React from 'react';
import { FlatList, View, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Post } from '@/types/feeds';
import { Community } from '@/types/feeds';
import PostCreation from './PostCreation';
import PostCard from './PostCard';
import EmptyPosts from './EmptyPosts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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
  isDesktop?: boolean;
  viewShotRefs?: Record<string, any>;
  previewMode?: boolean;
  isFollowingPreview?: boolean;
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
  isDesktop: propIsDesktop = false,
  viewShotRefs = {},
  previewMode = false,
  isFollowingPreview = false,
}) => {
  const desktopMode = isDesktop || propIsDesktop;

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
          viewShotRef={(ref: any) => {
            viewShotRefs[item.id] = ref;
          }}
          disabled={previewMode && !isFollowingPreview}
          isDesktop={desktopMode}
        />
      )}
      ListHeaderComponent={
        selectedCommunity ? (
          <PostCreation
            newPost={newPost}
            setNewPost={setNewPost}
            createPost={createPost}
            selectedCommunity={selectedCommunity}
            isDesktop={desktopMode}
          />
        ) : null
      }
      ListEmptyComponent={
        <EmptyPosts
          title={
            previewMode && !isFollowingPreview 
              ? "Follow to See Posts" 
              : selectedCommunity ? "No Posts Yet" : "Select a Community"
          }
          subtitle={
            previewMode && !isFollowingPreview
              ? "Follow this community to see what people are posting"
              : selectedCommunity 
                ? "Be the first to post in this community" 
                : "Choose a community to see posts"
          }
          showAnimation={!!selectedCommunity && (!previewMode || isFollowingPreview)}
          isDesktop={desktopMode}
        />
      }
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#1ea2b1"
          colors={['#1ea2b1']}
        />
      }
      contentContainerStyle={[
        styles.contentContainer,
        desktopMode && styles.contentContainerDesktop
      ]}
      showsVerticalScrollIndicator={false}
      numColumns={desktopMode ? 2 : 1}
      columnWrapperStyle={desktopMode && styles.columnWrapper}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contentContainerDesktop: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
});

export default PostList;