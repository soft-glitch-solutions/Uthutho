import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  type: 'stop' | 'route' | 'hub';
}

export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        {type === 'stop' || type === 'hub' ? (
          <>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonInfo}>
              <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
              <View style={[styles.skeletonLine, { width: '90%', height: 12 }]} />
              <View style={[styles.skeletonLine, { width: type === 'stop' ? '40%' : '30%', height: 12 }]} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.skeletonInfo}>
              <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
              <View style={[styles.skeletonLine, { width: '30%', height: 12 }]} />
            </View>
            <View style={[styles.skeletonLine, { width: '20%', height: 24 }]} />
          </>
        )}
      </View>
      <View style={styles.skeletonFooter}>
        {type === 'route' ? (
          <>
            <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
            <View style={[styles.skeletonLine, { width: '20%', height: 14 }]} />
          </>
        ) : (
          <View style={[styles.skeletonLine, { width: type === 'stop' ? '60%' : '50%', height: 12 }]} />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonCard key={`${type}-skeleton-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLine: {
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 12,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
});