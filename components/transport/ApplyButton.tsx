import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {hasApplied ? (
        <View style={[styles.button, styles.appliedButton]}>
          <CheckCircle2 size={20} color="#FFF" />
          <Text style={styles.buttonText}>Application Submitted</Text>
        </View>
      ) : isFull ? (
        <View style={[styles.button, styles.fullButton]}>
          <AlertCircle size={20} color="#FFF" />
          <Text style={styles.buttonText}>No Seats Available</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onApply}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Apply for Transport
          </Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {transport.price_per_month > 0 ? formatToRands(transport.price_per_month) : 'Fix'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  button: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  fullButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  priceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  priceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});