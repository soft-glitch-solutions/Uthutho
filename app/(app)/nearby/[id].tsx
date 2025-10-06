import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function NearbySpotDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Spot Details</Text>
      <Text style={styles.subtitle}>Spot ID: {id}</Text>
      {/* Add your nearby spot details content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888888',
    fontSize: 16,
    marginTop: 8,
  },
});