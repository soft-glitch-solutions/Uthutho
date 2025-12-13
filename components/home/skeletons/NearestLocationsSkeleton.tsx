import React from 'react';
import { View, Dimensions } from 'react-native';
import Shimmer from './Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NearestLocationsSkeletonProps {
  colors: any;
}

const NearestLocationsSkeleton = ({ colors }: NearestLocationsSkeletonProps) => (
  <View style={styles.grid}>
    {[1, 2].map((i) => (
      <View key={i} style={styles.cardContainer}>
        <Shimmer colors={colors}>
          <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <View style={styles.favoriteItemSkeleton}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
              <View style={[styles.skeletonTitle, { 
                backgroundColor: colors.text,
                width: 100,
                marginLeft: 8
              }]} />
            </View>
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.text,
              width: '80%',
              marginTop: 8
            }]} />
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.text,
              width: '60%',
              marginTop: 8
            }]} />
            <View style={{ height: 40, marginTop: 12 }} />
          </View>
        </Shimmer>
      </View>
    ))}
  </View>
);

const styles = {
  grid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    justifyContent: 'space-between' as 'space-between',
    width: '100%',
  },
  cardContainer: {
    width: '48%', // Fixed width approach
    marginBottom: 12,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    aspectRatio: 1.2, // Maintain aspect ratio
  },
  favoriteItemSkeleton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonTitle: {
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
};

export default NearestLocationsSkeleton;