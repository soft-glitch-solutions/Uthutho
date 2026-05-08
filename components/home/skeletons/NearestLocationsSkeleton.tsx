import React from 'react';
import { View, ScrollView } from 'react-native';
import Shimmer from './Shimmer';

interface NearestLocationsSkeletonProps {
  colors: any;
}

const NearestLocationsSkeleton = ({ colors }: NearestLocationsSkeletonProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.carouselContainer}
  >
    {[1, 2].map((i) => (
      <View key={i} style={styles.cardContainer}>
        <Shimmer colors={colors}>
          <View style={[styles.card, { backgroundColor: '#004d40' }]}>
            <View style={styles.contentOverlay}>
              <View style={styles.leftContent}>
                <View style={[styles.skeletonPin, { backgroundColor: colors.text }]} />
                
                <View style={styles.textContainer}>
                  <View style={[styles.skeletonTitle, { backgroundColor: colors.text }]} />
                  <View style={[styles.skeletonSubtitle, { backgroundColor: colors.text }]} />
                </View>
              </View>

              <View style={styles.rightContent}>
                <View style={[styles.skeletonButton, { backgroundColor: colors.text }]} />
              </View>
            </View>
          </View>
        </Shimmer>
      </View>
    ))}
  </ScrollView>
);

const styles = {
  carouselContainer: {
    gap: 12,
    paddingRight: 16,
  },
  cardContainer: {
    width: 260,
    borderRadius: 12,
    overflow: 'hidden' as 'hidden',
  },
  card: {
    width: '100%',
    minHeight: 140,
    borderRadius: 16,
  },
  contentOverlay: {
    flex: 1,
    padding: 16,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'space-between' as 'space-between',
    height: '100%',
    paddingRight: 12,
  },
  rightContent: {
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  skeletonPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.2,
    marginBottom: 8,
  },
  skeletonButton: {
    width: 70,
    height: 80,
    borderRadius: 14,
    opacity: 0.2,
  },
  textContainer: {
    marginTop: 'auto' as 'auto',
  },
  skeletonTitle: {
    width: '90%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.2,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    opacity: 0.2,
  },

};

export default NearestLocationsSkeleton;