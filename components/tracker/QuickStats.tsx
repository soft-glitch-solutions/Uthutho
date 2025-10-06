import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserCard, CardEntry } from '@/types/tracker';

interface QuickStatsProps {
  card: UserCard;
  entries: CardEntry[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ card, entries }) => {
  const totalRides = entries.filter(e => e.action === 'ride').length;
  const totalLoads = entries.filter(e => e.action === 'purchase').length;

  return (
    <View style={styles.quickStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{card.current_balance}</Text>
        <Text style={styles.statLabel}>Current Balance</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalRides}</Text>
        <Text style={styles.statLabel}>Total Rides</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalLoads}</Text>
        <Text style={styles.statLabel}>Times Loaded</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default QuickStats;