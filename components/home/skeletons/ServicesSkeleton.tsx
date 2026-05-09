import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';

interface ServicesSkeletonProps {
  colors: any;
}

const ServicesSkeleton = ({ colors }: ServicesSkeletonProps) => (
  <View style={styles.container}>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
    </Shimmer>
    
    <View style={styles.servicesGrid}>
      {[1, 2].map((i) => (
        <View key={i} style={styles.cardContainer}>
          <Shimmer colors={colors}>
            <View style={[styles.card, { backgroundColor: colors.border }]}>
              <View style={styles.cardContent}>
                <View style={[styles.skeletonLabel, { backgroundColor: colors.text, opacity: 0.1 }]} />
                <View style={[styles.skeletonLabel, { backgroundColor: colors.text, opacity: 0.1, width: '40%', marginTop: 8 }]} />
                
                <View style={styles.iconWrapper}>
                  <View style={[styles.skeletonIcon, { backgroundColor: colors.text, opacity: 0.1 }]} />
                </View>
              </View>
            </View>
          </Shimmer>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  skeletonTitle: {
    width: 140,
    height: 32,
    borderRadius: 8,
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  skeletonLabel: {
    width: '80%',
    height: 24,
    borderRadius: 6,
  },
  iconWrapper: {
    alignSelf: 'flex-end',
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
});

export default ServicesSkeleton;
