import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ width = 100, height = 16 }) => {
  const { colors } = useTheme();
  return <View style={[styles.skeletonText, { width, height, backgroundColor: colors.border }]} />;
};

interface SkeletonButtonProps {
  width?: number | string;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({ width = '100%' }) => {
  const { colors } = useTheme();
  return <View style={[styles.skeletonButton, { width, backgroundColor: colors.border }]} />;
};

export const SkeletonAvatar = () => {
  const { colors } = useTheme();
  return <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />;
};

export const TransportDetailsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.skeletonNavButton, { backgroundColor: colors.card, borderColor: colors.border }]} />
        <View style={[styles.skeletonNavButton, { backgroundColor: colors.card, borderColor: colors.border }]} />
      </View>

      <View style={styles.scrollContainer}>
        {/* Info Header Skeleton */}
        <View style={styles.skeletonInfoHeader}>
          <View style={[styles.skeletonIconBox, { backgroundColor: colors.card, borderColor: colors.border }]} />
          <View style={styles.skeletonTextCol}>
            <SkeletonText width="70%" height={26} />
            <SkeletonText width="40%" height={16} />
          </View>
        </View>

        {/* Banner Skeleton */}
        <View style={[styles.skeletonBanner, { backgroundColor: colors.card, borderColor: colors.border }]} />

        {/* Stats Skeleton */}
        <View style={styles.skeletonStatsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonStatCard, { backgroundColor: colors.card, borderColor: colors.border }]} />
          ))}
        </View>

        {/* Content Skeletons */}
        <View style={[styles.skeletonSection, { backgroundColor: colors.card, borderColor: colors.border }]} />
        <View style={[styles.skeletonSection, { backgroundColor: colors.card, borderColor: colors.border }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skeletonNavButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
  },
  skeletonInfoHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  skeletonIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
  },
  skeletonTextCol: {
    flex: 1,
    gap: 8,
  },
  skeletonBanner: {
    height: 100,
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  skeletonStatCard: {
    flex: 1,
    height: 90,
    borderRadius: 24,
    borderWidth: 1,
  },
  skeletonSection: {
    height: 160,
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  skeletonText: {
    borderRadius: 8,
  },
  skeletonButton: {
    height: 56,
    borderRadius: 16,
  },
  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
});