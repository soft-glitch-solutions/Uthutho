import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonTextProps {
  width?: number | string;
  height?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ width = 100, height = 16 }) => (
  <View style={[styles.skeletonText, { width, height }]} />
);

interface SkeletonButtonProps {
  width?: number | string;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({ width = '100%' }) => (
  <View style={[styles.skeletonButton, { width }]} />
);

export const SkeletonAvatar = () => (
  <View style={styles.skeletonAvatar}>
    <View style={styles.skeletonInner} />
  </View>
);

export const TransportDetailsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.skeletonBackButton} />
        <View style={styles.skeletonShareButton} />
      </View>

      <View style={styles.scrollContainer}>
        {/* Header Section Skeleton */}
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonSchoolInfo}>
            <View style={styles.skeletonSchoolIcon} />
            <View style={styles.skeletonSchoolText}>
              <SkeletonText width={200} height={24} />
              <View style={{ marginTop: 8 }}>
                <SkeletonText width={150} height={14} />
              </View>
            </View>
          </View>
          <View style={styles.skeletonBadge}>
            <SkeletonText width={80} height={20} />
          </View>
        </View>

        {/* Stats Grid Skeleton */}
        <View style={styles.skeletonStatsGrid}>
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <View style={styles.skeletonStatItem}>
                <View style={styles.skeletonStatIcon} />
                <SkeletonText width={40} height={18} />
                <View style={{ marginTop: 4 }}>
                  <SkeletonText width={60} height={12} />
                </View>
              </View>
              {i < 3 && <View style={styles.skeletonStatDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skeletonBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  skeletonShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 80,
  },
  skeletonHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skeletonSchoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  skeletonSchoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginRight: 12,
  },
  skeletonSchoolText: {
    flex: 1,
    gap: 8,
  },
  skeletonBadge: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skeletonStatsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  skeletonStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  skeletonStatIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  skeletonStatDivider: {
    width: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.7)',
  },
  skeletonText: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    height: 48,
    borderRadius: 8,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    overflow: 'hidden',
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
  },
});