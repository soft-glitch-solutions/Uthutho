import React from 'react';
import { View } from 'react-native';
import Shimmer from './Shimmer';

interface HeaderSkeletonProps {
  colors: any;
}

const HeaderSkeleton = ({ colors }: HeaderSkeletonProps) => (
  <View style={styles.header}>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonReady, { backgroundColor: colors.border }]} />
    </Shimmer>
    
    <Shimmer colors={colors}>
      <View style={[styles.skeletonGreeting, { backgroundColor: colors.border }]} />
    </Shimmer>
    
    <Shimmer colors={colors}>
      <View style={[styles.skeletonHeading, { backgroundColor: colors.border }]} />
    </Shimmer>
    
    <Shimmer colors={colors}>
      <View style={[styles.skeletonSearch, { backgroundColor: colors.border }]} />
    </Shimmer>
  </View>
);

const styles = {
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  skeletonReady: {
    width: 100,
    height: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonGreeting: {
    width: 200,
    height: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonHeading: {
    width: 240,
    height: 24,
    borderRadius: 4,
    marginBottom: 28,
  },
  skeletonSearch: {
    width: '100%',
    height: 54,
    borderRadius: 16,
  },
};

export default HeaderSkeleton;