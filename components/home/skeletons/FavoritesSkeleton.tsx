import React from 'react';
import { View } from 'react-native';
import Shimmer from './Shimmer';

interface FavoritesSkeletonProps {
  colors: any;
}

const FavoritesSkeleton = ({ colors }: FavoritesSkeletonProps) => (
  <View style={styles.grid}>
    {[1, 2].map((i) => (
      <Shimmer key={i} colors={colors}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.favoriteItemSkeleton}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '70%' }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '50%', marginTop: 4 }]} />
            </View>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          </View>
        </View>
      </Shimmer>
    ))}
  </View>
);

const styles = {
  grid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: '48%',
  },
  favoriteItemSkeleton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 8,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
};

export default FavoritesSkeleton;