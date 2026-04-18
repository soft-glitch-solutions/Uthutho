import React from 'react';
import { View } from 'react-native';
import Shimmer from './Shimmer';

interface GamificationSkeletonProps {
  colors: any;
}

const GamificationSkeleton = ({ colors }: GamificationSkeletonProps) => (
  <Shimmer colors={colors}>
    <View style={[styles.gamificationCard, { borderColor: colors.border }]}>
      <View style={styles.gamificationHeader}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonTitle, { 
          backgroundColor: colors.border,
          width: 100,
          marginLeft: 8
        }]} />
      </View>
      
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statBox}>
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.border,
              width: 50,
              height: 18,
              marginBottom: 4
            }]} />
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.border,
              width: 40,
              height: 10
            }]} />
          </View>
        ))}
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.skeletonProgress, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonProgressText, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.titleBadge, { backgroundColor: colors.border }]}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.text, opacity: 0.1 }]} />
        <View style={[styles.skeletonText, { 
          backgroundColor: colors.text,
          width: 80,
          marginLeft: 4,
          opacity: 0.1
        }]} />
      </View>
    </View>
  </Shimmer>
);

const styles = {
  gamificationCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  gamificationHeader: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    marginBottom: 16,
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
  statsRow: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center' as 'center',
    flex: 1,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  skeletonProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  skeletonProgressText: {
    width: 60,
    height: 10,
    borderRadius: 4,
    alignSelf: 'center' as 'center',
  },
  titleBadge: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
};

export default GamificationSkeleton;