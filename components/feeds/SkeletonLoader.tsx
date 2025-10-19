// components/feeds/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { SkeletonLoaderProps } from '@/types';

const SkeletonItem: React.FC<{ width: number | string; height: number; style?: any }> = ({ 
  width, 
  height, 
  style = {} 
}) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'feed', 
  count = 3 
}) => {
  if (type === 'communities') {
    return <CommunitiesSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonItem width={150} height={24} />
        <View style={styles.headerRight}>
          <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
          <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
        </View>
      </View>

      {/* Tabs Skeleton */}
      <View style={styles.tabsWrapper}>
        <View style={styles.communityTabsContent}>
          {[1, 2, 3].map((i) => (
            <SkeletonItem 
              key={i} 
              width={100} 
              height={36} 
              style={styles.communityTabSkeleton} 
            />
          ))}
        </View>
      </View>

      {/* Post Input Skeleton */}
      <View style={styles.postCreationContainer}>
        <SkeletonItem width="100%" height={80} style={{ marginBottom: 12 }} />
        <SkeletonItem width={80} height={40} style={{ alignSelf: 'flex-end' }} />
      </View>

      {/* Posts Skeleton */}
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.userInfoSkeleton}>
              <SkeletonItem width={40} height={40} style={styles.skeletonCircle} />
              <View>
                <SkeletonItem width={120} height={16} style={{ marginBottom: 4 }} />
                <SkeletonItem width={80} height={12} />
              </View>
            </View>
            <SkeletonItem width={60} height={12} />
          </View>
          <SkeletonItem width="100%" height={60} style={{ marginBottom: 12 }} />
          <SkeletonItem width="40%" height={20} />
        </View>
      ))}
    </View>
  );
};

const CommunitiesSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <SkeletonItem width={150} height={24} />
      <View style={styles.headerRight}>
        <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
        <SkeletonItem width={44} height={44} style={styles.skeletonCircle} />
      </View>
    </View>

    {/* Search Skeleton */}
    <View style={styles.searchContainer}>
      <SkeletonItem width="100%" height={50} />
    </View>

    {/* Community List Skeleton */}
    <View style={styles.communitiesList}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.communityItemSkeleton}>
          <View style={styles.communityInfoSkeleton}>
            <SkeletonItem width={180} height={20} style={{ marginBottom: 8 }} />
            <SkeletonItem width={120} height={16} />
          </View>
          <SkeletonItem width={80} height={32} style={{ borderRadius: 16 }} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonCircle: {
    borderRadius: 9999,
    marginRight: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
  },
  communityTabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  communityTabSkeleton: {
    marginHorizontal: 4,
    borderRadius: 18,
  },
  postCreationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
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
  userInfoSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchContainer: {
    margin: 16,
  },
  communitiesList: {
    padding: 16,
  },
  communityItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  communityInfoSkeleton: {
    flex: 1,
    marginRight: 12,
  },
});

export default SkeletonLoader;