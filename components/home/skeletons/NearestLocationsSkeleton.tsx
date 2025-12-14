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
            <View style={styles.headerContainer}>
              <View style={styles.favoriteItemSkeleton}>
                <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
                <View style={[styles.skeletonTitle, { 
                  backgroundColor: colors.text,
                  width: 100,
                  marginLeft: 8
                }]} />
              </View>
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.textContainer}>
                <View style={[styles.skeletonText, { 
                  backgroundColor: colors.text,
                  width: '80%',
                  marginBottom: 4
                }]} />
                <View style={[styles.skeletonText, { 
                  backgroundColor: colors.text,
                  width: '60%'
                }]} />
              </View>
              
              <View style={styles.actionContainer}>
                <View style={[styles.skeletonButton, { 
                  backgroundColor: colors.text,
                  height: 40
                }]} />
              </View>
            </View>
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
    gap: 12,
    width: '100%',
  },
  cardContainer: {
    flex: 1,
    minWidth: '48%',
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
    minHeight: 160, // Same as actual component
  },
  headerContainer: {
    marginBottom: 12,
  },
  favoriteItemSkeleton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.3,
  },
  skeletonTitle: {
    height: 18,
    borderRadius: 4,
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between' as 'space-between',
  },
  textContainer: {
    marginBottom: 12,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    opacity: 0.3,
  },
  actionContainer: {
    marginTop: 'auto' as 'auto',
  },
  skeletonButton: {
    width: '100%',
    borderRadius: 4,
    opacity: 0.3,
  },
};

export default NearestLocationsSkeleton;