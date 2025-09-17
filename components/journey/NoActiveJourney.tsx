import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const NoActiveJourney = () => {
  const router = useRouter();

  return (
    <View style={styles.errorContainer}>
      <AlertCircle size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>No Active Journey</Text>
      <Text style={styles.errorText}>
        You don't have an active journey. Mark yourself as waiting at a stop to start tracking your journey.
      </Text>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.backButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});