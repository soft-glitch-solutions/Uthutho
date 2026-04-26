import React from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

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
          backgroundColor: '#FFF',
          opacity: 0.05,
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
  <View style={styles.headerSkeleton}>
    <Shimmer colors={colors}>
      <View style={styles.skeletonAvatar} />
    </Shimmer>
    <View style={{ marginLeft: 16 }}>
      <Shimmer colors={colors}>
        <View style={styles.skeletonTextMedium} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={styles.skeletonTextLarge} />
      </Shimmer>
    </View>
  </View>
);

export const EarningsSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <View style={styles.skeletonContainer}>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonCard, { height: 180, marginBottom: 16 }]} />
    </Shimmer>
    <View style={styles.skeletonRow}>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonCard, { width: (Dimensions.get('window').width - 44) / 3, height: 80 }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonCard, { width: (Dimensions.get('window').width - 44) / 3, height: 80 }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonCard, { width: (Dimensions.get('window').width - 44) / 3, height: 80 }]} />
      </Shimmer>
    </View>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonCard, { height: 220, marginTop: 16 }]} />
    </Shimmer>
  </View>
);

export const RequestsSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((i) => (
      <Shimmer key={i} colors={colors}>
        <View style={[styles.skeletonCard, { height: 140, marginBottom: 16 }]} />
      </Shimmer>
    ))}
  </View>
);

export const PostSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={styles.skeletonCardLarge}>
      <View style={styles.skeletonTextFull} />
      <View style={[styles.skeletonTextFull, { width: '80%' }]} />
      <View style={styles.skeletonRowSpace}>
        <View style={styles.skeletonTextSmall} />
        <View style={styles.skeletonTextSmall} />
      </View>
    </View>
  </Shimmer>
);

export const MenuItemSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={styles.skeletonMenuItem}>
      <View style={styles.skeletonIcon} />
      <View style={styles.menuText}>
        <View style={styles.skeletonTextMedium} />
        <View style={styles.skeletonTextSmall} />
      </View>
    </View>
  </Shimmer>
);

export const AchievementBannerSkeleton: React.FC<SkeletonProps> = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={styles.skeletonAchievement}>
      <View style={styles.skeletonIcon} />
      <View style={styles.achievementText}>
        <View style={styles.skeletonTextMedium} />
        <View style={styles.skeletonTextFull} />
      </View>
    </View>
  </Shimmer>
);

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  skeletonCardLarge: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  skeletonRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111',
  },
  skeletonTextSmall: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  skeletonTextMedium: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#222',
    marginBottom: 8,
  },
  skeletonTextLarge: {
    width: 180,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  skeletonTextFull: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#222',
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  skeletonMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
  },
  skeletonAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
  },
  menuText: {
    flex: 1,
  },
  achievementText: {
    flex: 1,
    marginLeft: 12,
  },
});