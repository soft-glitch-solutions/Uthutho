import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';

interface AvailabilityBannerProps {
  transport: SchoolTransport;
}

export const AvailabilityBanner: React.FC<AvailabilityBannerProps> = ({ transport }) => {
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;

  return (
    <View style={[
      styles.availabilityBanner,
      isFull ? styles.fullBanner : styles.availableBanner
    ]}>
      <View style={styles.availabilityContent}>
        <Users size={20} color={isFull ? '#EF4444' : '#10B981'} />
        <View style={styles.availabilityText}>
          <Text style={[
            styles.availabilityStatus,
            { color: isFull ? '#EF4444' : '#10B981' }
          ]}>
            {isFull ? 'FULL' : 'AVAILABLE'}
          </Text>
          <Text style={styles.availabilitySeats}>
            {availableSeats} of {transport.capacity} seats available
          </Text>
        </View>
      </View>
      {!isFull && transport.price_per_month > 0 && (
        <Text style={styles.availabilityPrice}>
          {formatToRands(transport.price_per_month)}/month
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  availabilityBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  fullBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    marginLeft: 12,
  },
  availabilityStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  availabilitySeats: {
    fontSize: 12,
    color: '#888888',
  },
  availabilityPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});