import React from 'react';
import { View } from 'react-native';
import Shimmer from './Shimmer';

interface HeaderSkeletonProps {
  colors: any;
}

const HeaderSkeleton = ({ colors }: HeaderSkeletonProps) => (
  <View style={styles.header}>
    <View style={styles.firstRow}>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonTitle, { 
          backgroundColor: colors.border,
          width: 150,
          height: 30 
        }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonIcon, { 
          backgroundColor: colors.border,
          width: 30,
          height: 30 
        }]} />
      </Shimmer>
    </View>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonSubtitle, { 
        backgroundColor: colors.border,
        width: 100,
        height: 20,
        marginTop: 8
      }]} />
    </Shimmer>
  </View>
);

const styles = {
  header: {
    marginBottom: 20,
  },
  firstRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
  },
  skeletonTitle: {
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonSubtitle: {
    height: 16,
    borderRadius: 4,
  },
};

export default HeaderSkeleton;