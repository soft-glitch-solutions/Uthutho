import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Navigation, MapPin, Bell } from 'lucide-react-native';

interface JourneyStop {
  id: string;
  name: string;
  order_number: number;
  passed: boolean;
  current: boolean;
  upcoming: boolean;
}

interface RouteProgressProps {
  stops: JourneyStop[];
  onPingPassengers: () => void;
}

export const RouteProgress = ({ stops, onPingPassengers }: RouteProgressProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Route Progress</Text>
      
      {stops.map((stop) => (
        <View key={stop.id} style={styles.stopItem}>
          <View style={[
            styles.stopIndicator,
            stop.passed && styles.stopPassed,
            stop.current && styles.stopCurrent,
            stop.upcoming && styles.stopUpcoming,
          ]}>
            {stop.passed && <CheckCircle size={16} color="#4ade80" />}
            {stop.current && <Navigation size={16} color="#1ea2b1" />}
            {stop.upcoming && <MapPin size={16} color="#666666" />}
          </View>
          
          <View style={styles.stopInfo}>
            <Text style={[
              styles.stopName,
              stop.current && styles.currentStopName,
              stop.passed && styles.passedStopName,
            ]}>
              {stop.name}
            </Text>
            <Text style={styles.stopNumber}>Stop {stop.order_number}</Text>
          </View>
          
          {stop.current && (
            <TouchableOpacity 
              style={styles.pingButton} 
              onPress={onPingPassengers}
            >
              <Bell size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stopIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopPassed: {
    backgroundColor: '#4ade8020',
  },
  stopCurrent: {
    backgroundColor: '#1ea2b120',
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  stopUpcoming: {
    backgroundColor: '#333333',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 2,
  },
  currentStopName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  passedStopName: {
    color: '#4ade80',
  },
  stopNumber: {
    fontSize: 12,
    color: '#666666',
  },
  pingButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});