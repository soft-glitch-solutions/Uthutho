// components/journey/JourneySkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

export const JourneySkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.skeleton, styles.headerSkeleton]} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <View style={[styles.skeleton, styles.tabSkeleton]} />
        <View style={[styles.skeleton, styles.tabSkeleton]} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Route Header */}
        <View style={[styles.skeleton, styles.routeHeader]} />
        
        {/* Your Stop */}
        <View style={styles.yourStop}>
          <View style={[styles.skeleton, styles.profile]} />
          <View style={styles.stopInfo}>
            <View style={[styles.skeleton, styles.stopName]} />
            <View style={[styles.skeleton, styles.stopStatus]} />
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.stats}>
          <View style={[styles.skeleton, styles.stat]} />
          <View style={[styles.skeleton, styles.stat]} />
          <View style={[styles.skeleton, styles.stat]} />
        </View>
        
        {/* Route Slider */}
        <View style={[styles.skeleton, styles.routeSlider]} />
        
        {/* Buttons */}
        <View style={styles.buttons}>
          <View style={[styles.skeleton, styles.button]} />
          <View style={[styles.skeleton, styles.button]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSkeleton: {
    height: 32,
    borderRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabSkeleton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 16,
  },
  routeHeader: {
    height: 72,
    borderRadius: 8,
    marginBottom: 12,
  },
  yourStop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  stopStatus: {
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  routeSlider: {
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
  },
  skeleton: {
    backgroundColor: '#333333',
  },
});