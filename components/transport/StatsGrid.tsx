import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign, Clock, Car } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { formatToRands } from '@/utils/formatUtils';

interface StatsGridProps {
  transport: SchoolTransport;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ transport }) => {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <DollarSign size={20} color="#1ea2b1" />
        <Text style={styles.statValue}>
          {transport.price_per_month > 0 ? formatToRands(transport.price_per_month) : 'N/A'}
        </Text>
        <Text style={styles.statLabel}>Per Month</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Clock size={20} color="#1ea2b1" />
        <Text style={styles.statValue}>{transport.pickup_times.length}</Text>
        <Text style={styles.statLabel}>Pickup Times</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Car size={20} color="#1ea2b1" />
        <Text style={styles.statValue}>{transport.vehicle_type}</Text>
        <Text style={styles.statLabel}>Vehicle Type</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333333',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
});