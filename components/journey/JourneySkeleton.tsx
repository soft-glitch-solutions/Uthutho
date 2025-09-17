import React from 'react';
import { View, StyleSheet } from 'react-native';

export const JourneySkeleton = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <View style={[styles.skeleton, { width: 44, height: 44, borderRadius: 22 }]} />
      <View style={[styles.skeleton, { width: 120, height: 24 }]} />
      <View style={{ width: 44 }} />
    </View>
    
    <View style={[styles.journeyCard, { backgroundColor: '#1a1a1a' }]}>
      <View style={[styles.skeleton, { width: '60%', height: 20, marginBottom: 12 }]} />
      <View style={[styles.skeleton, { width: '80%', height: 16, marginBottom: 20 }]} />
      <View style={[styles.skeleton, { width: '100%', height: 8, marginBottom: 20 }]} />
      
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.statItem}>
            <View style={[styles.skeleton, { width: 16, height: 16, marginBottom: 4 }]} />
            <View style={[styles.skeleton, { width: 40, height: 12, marginBottom: 2 }]} />
            <View style={[styles.skeleton, { width: 30, height: 16 }]} />
          </View>
        ))}
      </View>
    </View>
    
    {[1, 2, 3].map(i => (
      <View key={i} style={[styles.stopItem, { marginHorizontal: 20, marginBottom: 8 }]}>
        <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 16, marginRight: 16 }]} />
        <View style={{ flex: 1 }}>
          <View style={[styles.skeleton, { width: '70%', height: 16, marginBottom: 4 }]} />
          <View style={[styles.skeleton, { width: '40%', height: 12 }]} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  journeyCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeleton: {
    backgroundColor: '#333333',
    borderRadius: 4,
  },
});