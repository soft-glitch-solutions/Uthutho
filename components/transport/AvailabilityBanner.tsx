import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, Banknote } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';
import { useTheme } from '@/context/ThemeContext';

interface AvailabilityBannerProps {
  transport: SchoolTransport;
}

export const AvailabilityBanner: React.FC<AvailabilityBannerProps> = ({ transport }) => {
  const { colors } = useTheme();
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, 
        borderColor: colors.border
      }
    ]}>
      <View style={styles.content}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: isFull ? '#EF4444' : '#10B981' }
        ]}>
          <Users size={14} color="#FFF" />
          <Text style={styles.statusLabel}>
            {isFull ? 'FULL' : 'AVAILABLE'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Seats</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {availableSeats}<Text style={{ opacity: 0.4 }}>/{transport.capacity}</Text>
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Monthly</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {formatToRands(transport.price_per_month)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  content: {
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 20,
  },
});