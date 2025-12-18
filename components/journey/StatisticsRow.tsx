// components/journey/StatisticsRow.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Clock, Users, Car } from 'lucide-react-native';

interface StatisticsRowProps {
  waitingTime: number;
  onlineCount: number;
  estimatedArrival: string;
}

export const StatisticsRow: React.FC<StatisticsRowProps> = ({
  waitingTime,
  onlineCount,
  estimatedArrival
}) => {
  const formatWaitingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Clock size={14} color="#666666" />
        <Text style={styles.statNumber}>{formatWaitingTime(waitingTime)}</Text>
        <Text style={styles.statLabel}>Waiting</Text>
      </View>
      
      <View style={styles.statItem}>
        <Users size={14} color="#666666" />
        <Text style={styles.statNumber}>{onlineCount}</Text>
        <Text style={styles.statLabel}>Online</Text>
      </View>
      
      <View style={styles.statItem}>
        <Car size={14} color="#666666" />
        <Text style={styles.statNumber}>{estimatedArrival}</Text>
        <Text style={styles.statLabel}>ETA</Text>
      </View>
    </View>
  );
};

const styles = {
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
};