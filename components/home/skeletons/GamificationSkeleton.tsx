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
              width: 60,
              height: 20,
              marginBottom: 4
            }]} />
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.border,
              width: 40,
              height: 12
            }]} />
          </View>
        ))}
      </View>

      <View style={[styles.titleBadge, { backgroundColor: colors.border }]}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
        <View style={[styles.skeletonText, { 
          backgroundColor: colors.text,
          width: 80,
          marginLeft: 4
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