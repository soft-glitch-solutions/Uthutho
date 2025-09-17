import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, Timer, Clock, Users, MapPin } from 'lucide-react-native';

interface JourneyOverviewProps {
  routeName: string;
  transportType: string;
  startPoint: string;
  endPoint: string;
  progressPercentage: number;
  waitingTime: string;
  estimatedArrival: string;
  passengerCount: number;
  currentStop: number;
  totalStops: number;
}

export const JourneyOverview = ({
  routeName,
  transportType,
  startPoint,
  endPoint,
  progressPercentage,
  waitingTime,
  estimatedArrival,
  passengerCount,
  currentStop,
  totalStops
}: JourneyOverviewProps) => {
  return (
    <View style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <Navigation size={24} color="#1ea2b1" />
        
        <View style={styles.journeyInfo}>
          <Text style={styles.routeName}>{routeName}</Text>
          <Text style={styles.routeType}>{transportType}</Text>
        </View>
      </View>
      
      <Text style={styles.routeDestination}>
        {startPoint} → {endPoint}
      </Text>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>
      
      {/* Journey Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Timer size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Waiting</Text>
          <Text style={styles.statValue}>{waitingTime}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>ETA</Text>
          <Text style={styles.statValue}>{estimatedArrival}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Users size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Passengers</Text>
          <Text style={styles.statValue}>{passengerCount}</Text>
        </View>
        
        <View style={styles.statItem}>
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Stop</Text>
          <Text style={styles.statValue}>
            {currentStop}/{totalStops}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  journeyCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  routeType: {
    fontSize: 14,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '500',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});