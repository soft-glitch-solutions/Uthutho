import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CreditCard, Clock, Truck } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';
import { useTheme } from '@/context/ThemeContext';

interface StatsGridProps {
  transport: SchoolTransport;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ transport }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CreditCard size={18} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {transport.price_per_month > 0 ? formatToRands(transport.price_per_month) : 'Fix'}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text }]}>Monthly</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Clock size={18} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {transport.pickup_times.length}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text }]}>Slots</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Truck size={18} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
          {transport.vehicle_type}
        </Text>
        <Text style={[styles.statLabel, { color: colors.text }]}>Vehicle</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});