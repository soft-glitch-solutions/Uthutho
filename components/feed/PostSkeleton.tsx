// components/PostSkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';

interface PostSkeletonProps {
  colors: {
    card: string;
    border: string;
  };
}

const PostSkeleton: React.FC<PostSkeletonProps> = ({ colors }) => {
  return (
    <Shimmer colors={colors}>
      <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
        <View style={styles.postHeader}>
          <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonHeaderContent}>
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '40%' }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '20%' }]} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '100%' }]} />
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '80%' }]} />
        </View>
        <View style={styles.postActions}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.skeletonAction, { backgroundColor: colors.border }]}
            />
          ))}
        </View>
      </View>
    </Shimmer>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  skeletonHeaderContent: {
    flex: 1,
    gap: 8,
  },
  skeletonText: {
    height: 12,
    borderRadius: 4,
    marginVertical: 4,
  },
  skeletonContent: {
    marginVertical: 12,
    gap: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  skeletonAction: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
});

export default PostSkeleton;