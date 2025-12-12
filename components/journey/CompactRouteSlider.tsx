// components/journey/CompactRouteSlider.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Users } from 'lucide-react-native';

interface Passenger {
  id: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  stop_id?: string;
  status?: 'waiting' | 'picked_up' | 'arrived';
}

interface JourneyStop {
  id: string;
  name: string;
  order_number: number;
  passed: boolean;
  current: boolean;
  upcoming: boolean;
}

interface CompactRouteSliderProps {
  stops: JourneyStop[];
  currentUserStopName: string;
  currentUserId: string;
  passengers: Passenger[];
  transportType: string;
  currentStopSequence: number;
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  onStopPress: (stop: JourneyStop) => void;
}

export const CompactRouteSlider: React.FC<CompactRouteSliderProps> = ({
  stops,
  currentUserStopName,
  currentUserId,
  passengers,
  transportType,
  currentStopSequence,
  participantStatus,
  onStopPress,
}) => {
  const getPassengersAtStop = (stopId: string) => {
    return passengers.filter(p => p.stop_id === stopId && p.status === 'waiting');
  };

  const isStopClosed = (stop: JourneyStop) => {
    if (participantStatus === 'picked_up' || participantStatus === 'arrived') {
      return stop.order_number < currentStopSequence;
    }
    return stop.passed;
  };

  const isYourStop = (stopName: string) => {
    return stopName === currentUserStopName && participantStatus === 'waiting';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Stops</Text>
      
      {/* Compact Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%` }
          ]} 
        />
        
        {/* Vehicle Indicator */}
        <View 
          style={[
            styles.vehicleIndicator,
            { left: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%` }
          ]}
        >
          <View style={styles.vehicleDot} />
        </View>
      </View>

      {/* Compact Stops List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.stopsScroll}
        contentContainerStyle={styles.stopsContent}
      >
        {stops.map((stop) => {
          const stopPassengers = getPassengersAtStop(stop.id);
          const isYou = isYourStop(stop.name);
          const closed = isStopClosed(stop);
          
          return (
            <TouchableOpacity
              key={stop.id}
              style={[
                styles.stopItem,
                stop.current && styles.currentStop,
                closed && styles.closedStop,
              ]}
              onPress={() => onStopPress(stop)}
              disabled={closed}
            >
              <View style={styles.stopMarkerRow}>
                <View style={[
                  styles.stopDot,
                  stop.passed && styles.passedDot,
                  stop.current && styles.currentDot,
                  stop.upcoming && styles.upcomingDot,
                  closed && styles.closedDot,
                  isYou && styles.yourStopDot,
                ]}>
                  {isYou && <View style={styles.youDot} />}
                </View>
                
                <Text style={[
                  styles.stopNumber,
                  closed && styles.closedText
                ]}>
                  {stop.order_number}
                </Text>
              </View>
              
              <Text 
                style={[
                  styles.stopName,
                  closed && styles.closedText
                ]}
                numberOfLines={1}
              >
                {stop.name}
              </Text>
              
              {stopPassengers.length > 0 && !closed && (
                <View style={styles.passengerBadge}>
                  <Users size={10} color="#ffffff" />
                  <Text style={styles.passengerCount}>{stopPassengers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Compact Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.currentLegend]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.youLegend]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.closedLegend]} />
          <Text style={styles.legendText}>Closed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 20,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 2,
    position: 'absolute',
  },
  vehicleIndicator: {
    position: 'absolute',
    top: -4,
    transform: [{ translateX: -8 }],
  },
  vehicleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1ea2b1',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  stopsScroll: {
    marginBottom: 12,
  },
  stopsContent: {
    paddingRight: 16,
  },
  stopItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222222',
  },
  currentStop: {
    backgroundColor: '#1e40af20',
  },
  closedStop: {
    backgroundColor: '#333333',
    opacity: 0.6,
  },
  stopMarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#666666',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passedDot: {
    backgroundColor: '#4ade80',
  },
  currentDot: {
    backgroundColor: '#1ea2b1',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  upcomingDot: {
    backgroundColor: '#fbbf24',
  },
  closedDot: {
    backgroundColor: '#6b7280',
  },
  yourStopDot: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  youDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b5cf6',
  },
  stopNumber: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '500',
  },
  stopName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  closedText: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  passengerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  passengerCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentLegend: {
    backgroundColor: '#1ea2b1',
  },
  youLegend: {
    backgroundColor: '#8b5cf6',
  },
  closedLegend: {
    backgroundColor: '#6b7280',
  },
  legendText: {
    color: '#666666',
    fontSize: 10,
  },
});