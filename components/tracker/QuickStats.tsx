import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { UserCard, CardEntry } from '@/types/tracker';
import { TrendingUp, CreditCard, Calendar, BarChart } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface QuickStatsProps {
  card: UserCard;
  entries: CardEntry[];
  cardTypeConfig?: any;
  isDesktop?: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ 
  card, 
  entries,
  cardTypeConfig,
  isDesktop = false
}) => {
  const totalRides = entries.filter(e => e.action === 'ride').length;
  const totalLoads = entries.filter(e => e.action === 'purchase').length;
  
  // Calculate average rides per month
  const monthsWithData = new Set(entries.map(e => e.date.split('-').slice(0, 2).join('-')));
  const avgRidesPerMonth = monthsWithData.size > 0 ? (totalRides / monthsWithData.size).toFixed(1) : '0';

  if (isDesktop) {
    return (
      <View style={styles.quickStatsDesktop}>
        <View style={styles.quickStatsHeader}>
          <BarChart size={24} color={cardTypeConfig?.color || '#1ea2b1'} />
          <Text style={styles.quickStatsTitleDesktop}>Quick Statistics</Text>
        </View>
        
        <View style={styles.statsGridDesktop}>
          <View style={styles.statCardDesktop}>
            <View style={[styles.statIconContainer, { backgroundColor: `${cardTypeConfig?.color}15` }]}>
              <CreditCard size={20} color={cardTypeConfig?.color || '#1ea2b1'} />
            </View>
            <Text style={styles.statValueDesktop}>R{card.current_balance}</Text>
            <Text style={styles.statLabelDesktop}>Current Balance</Text>
          </View>
          
          <View style={styles.statCardDesktop}>
            <View style={[styles.statIconContainer, { backgroundColor: `${cardTypeConfig?.color}15` }]}>
              <TrendingUp size={20} color={cardTypeConfig?.color || '#1ea2b1'} />
            </View>
            <Text style={styles.statValueDesktop}>{totalRides}</Text>
            <Text style={styles.statLabelDesktop}>Total Rides</Text>
          </View>
          
          <View style={styles.statCardDesktop}>
            <View style={[styles.statIconContainer, { backgroundColor: `${cardTypeConfig?.color}15` }]}>
              <Calendar size={20} color={cardTypeConfig?.color || '#1ea2b1'} />
            </View>
            <Text style={styles.statValueDesktop}>{totalLoads}</Text>
            <Text style={styles.statLabelDesktop}>Times Loaded</Text>
          </View>
          
          <View style={styles.statCardDesktop}>
            <View style={[styles.statIconContainer, { backgroundColor: `${cardTypeConfig?.color}15` }]}>
              <BarChart size={20} color={cardTypeConfig?.color || '#1ea2b1'} />
            </View>
            <Text style={styles.statValueDesktop}>{avgRidesPerMonth}</Text>
            <Text style={styles.statLabelDesktop}>Avg/Month</Text>
          </View>
        </View>
      </View>
    );
  }

  // Mobile version
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
  // Desktop Styles
  quickStatsDesktop: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  quickStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quickStatsTitleDesktop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCardDesktop: {
    width: 'calc(50% - 8px)',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValueDesktop: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabelDesktop: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Mobile Styles
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