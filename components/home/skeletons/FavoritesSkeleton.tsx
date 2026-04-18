import React from 'react';
import { View } from 'react-native';
import Shimmer from './Shimmer';

interface FavoritesSkeletonProps {
  colors: any;
}

const FavoritesSkeleton = ({ colors }: FavoritesSkeletonProps) => (
  <View style={styles.list}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={[styles.card, { 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }]}>
        <Shimmer colors={colors}>
          <View style={styles.contentRow}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={styles.textColumn}>
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '60%' }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '40%', height: 10 }]} />
            </View>
            <View style={[styles.skeletonButton, { backgroundColor: colors.border }]} />
          </View>
        </Shimmer>
      </View>
    ))}
  </View>
);

const styles = {
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    gap: 12,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textColumn: {
    flex: 1,
    gap: 6,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
  },
  skeletonButton: {
    width: 70,
    height: 32,
    borderRadius: 16,
  },
};

export default FavoritesSkeleton;