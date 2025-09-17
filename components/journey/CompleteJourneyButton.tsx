import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface CompleteJourneyButtonProps {
  onPress: () => void;
}

export const CompleteJourneyButton = ({ onPress }: CompleteJourneyButtonProps) => {
  return (
    <View style={styles.actionContainer}>
      <TouchableOpacity 
        style={styles.completeButton} 
        onPress={onPress}
      >
        <CheckCircle size={20} color="#ffffff" />
        <Text style={styles.completeButtonText}>I've Arrived</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});