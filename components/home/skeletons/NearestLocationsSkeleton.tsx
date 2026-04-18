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
          <View style={[styles.card, { backgroundColor: colors.border }]}>
            <View style={styles.contentOverlay}>
              <View style={styles.headerContainer}>
                <View style={styles.typeBadgeSkeleton}>
                  <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
                  <View style={[styles.skeletonLabel, { backgroundColor: colors.text }]} />
                </View>
              </View>

              <View style={styles.contentBottom}>
                <View style={styles.textContainer}>
                  <View style={[styles.skeletonTitle, { backgroundColor: colors.text }]} />
                  <View style={[styles.skeletonSubtitle, { backgroundColor: colors.text }]} />
                </View>
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
    minHeight: 180,
    borderRadius: 12,
  },
  contentOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between' as 'space-between',
  },
  headerContainer: {
    marginBottom: 12,
  },
  typeBadgeSkeleton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as 'flex-start',
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.3,
  },
  skeletonLabel: {
    width: 80,
    height: 12,
    borderRadius: 4,
    marginLeft: 6,
    opacity: 0.3,
  },
  contentBottom: {
    flex: 1,
    justifyContent: 'flex-end' as 'flex-end',
  },
  textContainer: {
    marginBottom: 12,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
    opacity: 0.3,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    opacity: 0.3,
  },
};

export default NearestLocationsSkeleton;