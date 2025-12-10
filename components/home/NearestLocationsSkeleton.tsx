import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface NearestLocationsSkeletonProps {
  colors: any;
}

const NearestLocationsSkeleton: React.FC<NearestLocationsSkeletonProps> = ({ colors }) => {
  return (
    <View style={styles.grid}>
      {[1, 2].map((item) => (
        <View 
          key={item} 
          style={[styles.cardSkeleton, { backgroundColor: colors.border }]}
        >
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonDistance, { backgroundColor: colors.border }]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardSkeleton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    minWidth: '48%',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  skeletonTitle: {
    height: 20,
    width: 100,
    borderRadius: 4,
  },
  skeletonText: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDistance: {
    height: 14,
    width: '40%',
    borderRadius: 4,
  },
});

export default NearestLocationsSkeleton;