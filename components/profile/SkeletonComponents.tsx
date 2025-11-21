import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ShimmerProps {
  children: React.ReactNode;
  colors: any;
}

export const Shimmer: React.FC<ShimmerProps> = ({ children, colors }) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmerAnimation());
    };

    shimmerAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          right: '-100%',
          bottom: 0,
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

interface SkeletonProps {
  colors: any;
}

export const ProfileHeaderSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <View style={[styles.header, { backgroundColor: colors.card }]}>
    <Shimmer colors={colors}>
      <View style={[styles.avatar, { backgroundColor: colors.border }]} />
    </Shimmer>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
    </Shimmer>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
    </Shimmer>
  </View>
);

export const PostSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.postItem, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonPostContent, { backgroundColor: colors.border }]} />
      <View style={styles.postFooter}>
        <View style={[styles.skeletonPostLocation, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonPostReactions, { backgroundColor: colors.border }]} />
      </View>
    </View>
  </Shimmer>
);

export const MenuItemSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.menuItem, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
      <View style={styles.menuText}>
        <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonSubtext, { backgroundColor: colors.border }]} />
      </View>
    </View>
  </Shimmer>
);

export const AchievementBannerSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.achievementBanner, { backgroundColor: colors.border }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
      <View style={styles.achievementText}>
        <View style={[styles.skeletonText, { backgroundColor: colors.text }]} />
        <View style={[styles.skeletonSubtext, { backgroundColor: colors.text }]} />
      </View>
    </View>
  </Shimmer>
);

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  skeletonName: {
    width: 200,
    height: 30,
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
  },
  postItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonPostContent: {
    height: 60,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPostLocation: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  skeletonPostReactions: {
    width: 40,
    height: 14,
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 15,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  menuText: {
    flex: 1,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
    width: '70%',
  },
  skeletonSubtext: {
    height: 14,
    borderRadius: 4,
    width: '90%',
  },
  achievementBanner: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  achievementText: {
    flex: 1,
    marginLeft: 12,
  },
});