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
              <View style={styles.gradientOverlay}>
                <View style={styles.cardHeader}>
                  <View style={[styles.skeletonIcon, { backgroundColor: colors.text, opacity: 0.1 }]} />
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={[styles.skeletonLabel, { backgroundColor: colors.text, opacity: 0.1 }]} />
                  <View style={[styles.skeletonArrow, { backgroundColor: colors.text, opacity: 0.1 }]} />
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
    paddingVertical: 20,
  },
  skeletonTitle: {
    width: 100,
    height: 20,
    borderRadius: 4,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  skeletonIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonLabel: {
    width: '60%',
    height: 16,
    borderRadius: 4,
  },
  skeletonArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default ServicesSkeleton;
