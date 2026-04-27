// components/journey/JourneySkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const JourneySkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <Animated.View style={[styles.skeleton, styles.headerText, { opacity }]} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Card */}
        <Animated.View style={[styles.skeleton, styles.statusCard, { opacity }]} />
        
        {/* Profile/Stop Info Row */}
        <View style={styles.profileRow}>
          <Animated.View style={[styles.skeleton, styles.profileCircle, { opacity }]} />
          <View style={styles.textStack}>
            <Animated.View style={[styles.skeleton, styles.shortLine, { opacity }]} />
            <Animated.View style={[styles.skeleton, styles.tinyLine, { opacity }]} />
          </View>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View style={[styles.skeleton, styles.statBox, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.statBox, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.statBox, { opacity }]} />
        </View>
        
        {/* Timeline Area */}
        <Animated.View style={[styles.skeleton, styles.timelineCard, { opacity }]} />
        
        {/* Large Action Buttons */}
        <View style={styles.buttonRow}>
          <Animated.View style={[styles.skeleton, styles.largeButton, { opacity }]} />
          <Animated.View style={[styles.skeleton, styles.largeButton, { opacity }]} />
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
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerText: {
    height: 32,
    width: '70%',
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 24,
  },
  statusCard: {
    height: 80,
    borderRadius: 24,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  textStack: {
    gap: 8,
    flex: 1,
  },
  shortLine: {
    height: 16,
    width: '60%',
    borderRadius: 4,
  },
  tinyLine: {
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: 80,
    borderRadius: 20,
  },
  timelineCard: {
    height: 200,
    borderRadius: 32,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  largeButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
  },
  skeleton: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
});