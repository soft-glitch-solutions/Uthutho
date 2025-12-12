// components/feeds/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SkeletonLoaderProps } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

const SkeletonItem: React.FC<{ 
  width: number | string; 
  height: number; 
  style?: any;
  isDesktop?: boolean;
}> = ({ width, height, style = {}, isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
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
    <View style={[styles.skeletonItem, { width, height }, desktopMode && styles.skeletonItemDesktop, style]}>
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

const SkeletonLoader: React.FC<SkeletonLoaderProps & { isDesktop?: boolean }> = ({ 
  type = 'feed', 
  count = 3,
  isDesktop: propIsDesktop = false
}) => {
  const desktopMode = isDesktop || propIsDesktop;

  if (type === 'communities') {
    return <CommunitiesSkeleton isDesktop={desktopMode} />;
  }

  return (
    <View style={[styles.container, desktopMode && styles.containerDesktop]}>
      {desktopMode ? (
        // Desktop layout
        <View style={styles.desktopLayout}>
          {/* Left sidebar */}
          <View style={styles.desktopSidebar}>
            <SkeletonItem width="100%" height={20} style={{ marginBottom: 16 }} />
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.desktopCommunityItemSkeleton}>
                <View style={styles.desktopCommunityInfoSkeleton}>
                  <SkeletonItem width={24} height={24} style={{ borderRadius: 12, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonItem width="80%" height={14} style={{ marginBottom: 4 }} />
                    <SkeletonItem width="60%" height={12} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Main feed */}
          <View style={styles.desktopMain}>
            {/* Header */}
            <View style={styles.headerDesktop}>
              <SkeletonItem width={150} height={24} />
              <View style={styles.headerRight}>
                <SkeletonItem width={40} height={40} style={styles.skeletonCircleDesktop} />
                <SkeletonItem width={40} height={40} style={styles.skeletonCircleDesktop} />
              </View>
            </View>

            {/* Week filter */}
            <View style={styles.weekFilterSkeleton}>
              <SkeletonItem width={100} height={16} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonItem key={i} width={60} height={16} />
                ))}
              </View>
            </View>

            {/* Post input */}
            <View style={styles.postCreationContainerDesktop}>
              <SkeletonItem width="100%" height={80} style={{ marginBottom: 8 }} />
              <SkeletonItem width={70} height={30} style={{ alignSelf: 'flex-end' }} />
            </View>

            {/* Posts - 2 columns on desktop */}
            <View style={styles.postsGridDesktop}>
              {Array.from({ length: Math.ceil(count / 2) * 2 }).map((_, index) => (
                <View key={index} style={styles.postCardDesktop}>
                  <View style={styles.postHeader}>
                    <View style={styles.userInfoSkeleton}>
                      <SkeletonItem width={36} height={36} style={styles.skeletonCircleDesktop} />
                      <View>
                        <SkeletonItem width={100} height={14} style={{ marginBottom: 4 }} />
                        <SkeletonItem width={70} height={11} />
                      </View>
                    </View>
                    <SkeletonItem width={50} height={11} />
                  </View>
                  <SkeletonItem width="100%" height={50} style={{ marginBottom: 8 }} />
                  <SkeletonItem width="40%" height={16} />
                </View>
              ))}
            </View>
          </View>

          {/* Right sidebar */}
          <View style={styles.desktopSidebarRight}>
            <SkeletonItem width="100%" height={20} style={{ marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.trendingPostSkeleton}>
                <SkeletonItem width={20} height={20} style={{ marginRight: 8 }} />
                <SkeletonItem width="80%" height={32} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        // Mobile layout
        <>
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
        </>
      )}
    </View>
  );
};

const CommunitiesSkeleton: React.FC<{ isDesktop?: boolean }> = ({ isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
  
  return (
    <View style={[styles.container, desktopMode && styles.containerDesktop]}>
      {/* Header Skeleton */}
      <View style={[styles.header, desktopMode && styles.headerDesktop]}>
        <SkeletonItem width={150} height={24} />
        <View style={styles.headerRight}>
          <SkeletonItem width={desktopMode ? 40 : 44} height={desktopMode ? 40 : 44} style={desktopMode ? styles.skeletonCircleDesktop : styles.skeletonCircle} />
          <SkeletonItem width={desktopMode ? 40 : 44} height={desktopMode ? 40 : 44} style={desktopMode ? styles.skeletonCircleDesktop : styles.skeletonCircle} />
        </View>
      </View>

      {/* Search Skeleton */}
      <View style={[styles.searchContainer, desktopMode && styles.searchContainerDesktop]}>
        <SkeletonItem width="100%" height={desktopMode ? 40 : 50} />
      </View>

      {/* Community List Skeleton */}
      <View style={[styles.communitiesList, desktopMode && styles.communitiesListDesktop]}>
        {desktopMode ? (
          // Desktop grid layout
          <View style={styles.communitiesGridDesktop}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View key={item} style={styles.communityItemSkeletonDesktop}>
                <View style={styles.communityInfoSkeleton}>
                  <SkeletonItem width={140} height={18} style={{ marginBottom: 6 }} />
                  <SkeletonItem width={100} height={14} />
                </View>
                <SkeletonItem width={70} height={28} style={{ borderRadius: 14 }} />
              </View>
            ))}
          </View>
        ) : (
          // Mobile list layout
          <>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.communityItemSkeleton}>
                <View style={styles.communityInfoSkeleton}>
                  <SkeletonItem width={180} height={20} style={{ marginBottom: 8 }} />
                  <SkeletonItem width={120} height={16} />
                </View>
                <SkeletonItem width={80} height={32} style={{ borderRadius: 16 }} />
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  containerDesktop: {
    width: '100%',
    alignItems: 'center',
  },
  
  // Desktop layout
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000',
    width: '100%',
    maxWidth: 1400,
  },
  desktopSidebar: {
    width: 280,
    paddingRight: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  desktopMain: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    maxWidth: 680,
    backgroundColor: '#000000',
  },
  desktopSidebarRight: {
    width: 300,
    paddingLeft: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#000000',
    borderLeftWidth: 1,
    borderLeftColor: '#333333',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
    width: '100%',
  },
  headerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#000000',
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
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
  skeletonItemDesktop: {
    backgroundColor: '#1a1a1a',
  },
  
  skeletonCircle: {
    borderRadius: 9999,
    marginRight: 8,
  },
  skeletonCircleDesktop: {
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
  
  weekFilterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#000000',
    width: '100%',
  },
  
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
    width: '100%',
  },
  
  communityTabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#000000',
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
  postCreationContainerDesktop: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
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
  postCardDesktop: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
  },
  
  postsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    backgroundColor: '#000000',
    width: '100%',
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
    width: '100%',
    backgroundColor: '#000000',
  },
  searchContainerDesktop: {
    marginHorizontal: 24,
    marginVertical: 12,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  
  communitiesList: {
    padding: 16,
    backgroundColor: '#000000',
    width: '100%',
    flex: 1,
  },
  communitiesListDesktop: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  
  communitiesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#000000',
    width: '100%',
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
    width: '100%',
  },
  communityItemSkeletonDesktop: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  
  communityInfoSkeleton: {
    flex: 1,
    marginRight: 12,
  },
  
  desktopCommunityItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    width: '100%',
  },
  
  desktopCommunityInfoSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  trendingPostSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
});

export default SkeletonLoader;