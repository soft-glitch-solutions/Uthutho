import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SkeletonProps {
  style?: object;
}

const Skeleton = ({ style }: SkeletonProps) => {
  return (
    <View style={[styles.skeleton, style]}>
      <View style={styles.shimmer} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: '#f5f5f5',
    height: '100%',
    width: '100%',
  },
});

export default Skeleton;