import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';

interface ApplyButtonProps {
  transport: SchoolTransport;
  hasApplied: boolean;
  onApply: () => void;
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  transport,
  hasApplied,
  onApply,
}) => {
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;

  if (hasApplied) {
    return (
      <View style={styles.applyContainer}>
        <TouchableOpacity style={[styles.applyButton, styles.appliedButton]} disabled>
          <CheckCircle size={20} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Application Submitted</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFull) {
    return (
      <View style={styles.applyContainer}>
        <TouchableOpacity style={[styles.applyButton, styles.fullButton]} disabled>
          <AlertCircle size={20} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>No Seats Available</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.applyContainer}>
      <TouchableOpacity 
        style={styles.applyButton}
        onPress={onApply}
        activeOpacity={0.9}
      >
        <Text style={styles.applyButtonText}>
          {transport.price_per_month > 0 
            ? `Apply Now - ${formatToRands(transport.price_per_month)}/month`
            : 'Apply Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  applyButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  fullButton: {
    backgroundColor: '#EF4444',
  },
});