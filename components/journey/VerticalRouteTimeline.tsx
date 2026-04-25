import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CheckCircle, Clock, Bus, Train, Navigation as Taxi, Users, HeartPulse } from 'lucide-react-native';
import { JourneyStop, Passenger } from '@/types/journey';

interface VerticalRouteTimelineProps {
  stops: JourneyStop[];
  currentUserStopName: string;
  currentUserId: string;
  passengers: Passenger[];
  transportType: string;
  currentStopSequence: number;
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  onStopPress: (stop: JourneyStop) => void;
  onNavigateToStopDetails?: (stopId: string) => void;
}

export const VerticalRouteTimeline: React.FC<VerticalRouteTimelineProps> = ({
  stops,
  currentUserStopName,
  currentUserId,
  passengers,
  transportType,
  currentStopSequence,
  participantStatus,
  onStopPress,
}) => {

  const getTransportIcon = (size: number, color: string) => {
    switch (transportType.toLowerCase()) {
      case 'train': return <Train size={size} color={color} />;
      case 'taxi': return <Taxi size={size} color={color} />;
      case 'bus':
      case 'minibus':
      default:
        return <Bus size={size} color={color} />;
    }
  };

  const getPassengersAtStop = (stopId: string) => {
    return passengers.filter(p => p.stop_id === stopId);
  };

  // Upstream Pulse Metrics
  const upstreamPickedUpCount = passengers.filter(p => p.status === 'picked_up' || p.status === 'arrived').length;
  // Assume generic capacity metric or use logic
  const capacityPercent = Math.min(100, Math.max(10, (upstreamPickedUpCount / Math.max(passengers.length, 5)) * 100));

  return (
    <View style={styles.container}>
      {/* Route Timeline Content */}
      <View style={styles.timelineWrapper}>
        {/* Continuous Track Line (dimmed) */}
        <View style={styles.trackLineBase} />
        {/* Bright blue active trace line covering passed stops up to current */}
        {stops.length > 0 && currentStopSequence > 0 && (
          <View style={[
            styles.trackLineActive, 
            { height: `${Math.min(100, (currentStopSequence / Math.max(1, stops.length - 1)) * 100)}%` }
          ]} />
        )}

        {stops.map((stop, index) => {
          const isPassed = stop.order_number < currentStopSequence || stop.passed;
          const isCurrent = stop.order_number === currentStopSequence || stop.current;
          const isUpcoming = stop.order_number > currentStopSequence;
          
          const timeEstimateMinutes = Math.max(1, (stop.order_number - Math.max(1, currentStopSequence)) * 4);
          const isNextStop = stop.order_number === currentStopSequence + 1;
          const stopPassengers = getPassengersAtStop(stop.id);
          const hasWaiting = stopPassengers.some(p => p.status === 'waiting');
          const hasPickedUp = stopPassengers.some(p => p.status === 'picked_up');

          return (
            <TouchableOpacity 
              key={stop.id} 
              style={styles.stopRow}
              activeOpacity={0.7}
              onPress={() => onStopPress(stop)}
            >
              <View style={styles.markerContainer}>
                {isPassed ? (
                  <View style={styles.dimDot} />
                ) : isCurrent ? (
                  <View style={styles.currentGlowMarker}>
                    {getTransportIcon(14, '#ffffff')}
                  </View>
                ) : (
                  <View style={styles.futureDot} />
                )}
              </View>

              <View style={styles.contentContainer}>
                {isCurrent ? (
                  <View style={styles.currentPositionCard}>
                    <Text style={styles.currentPositionLabel}>CURRENT POSITION</Text>
                    <Text style={styles.currentPositionName}>{stop.name}</Text>
                    
                    <Text style={styles.currentPositionSubtext}>
                      {hasPickedUp ? `Picked up ${stopPassengers.length} commuters here` : 'Estimated dwell: 45s'}
                    </Text>
                  </View>
                ) : isPassed ? (
                  <View style={styles.passedStopCard}>
                    <Text style={styles.passedLabel}>PASSED</Text>
                    <Text style={styles.passedStopName}>{stop.name}</Text>
                  </View>
                ) : (
                  <View style={styles.futureStopCard}>
                    <Text style={styles.futureLabel}>
                      {isNextStop ? `NEXT STOP • ${timeEstimateMinutes} MIN` : `${timeEstimateMinutes} MIN`}
                    </Text>
                    <Text style={styles.futureStopName}>{stop.name}</Text>
                    
                    {/* Shows commuters waiting upstream from this view */}
                    {hasWaiting && (
                      <View style={styles.waitingCommuterPill}>
                        <Users size={12} color="#1ea2b1" />
                        <Text style={styles.waitingCommuterText}>
                          {stopPassengers.filter(p => p.status === 'waiting').length} waiting
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Upstream Pulse Module */}
      <View style={styles.upstreamPulseCard}>
        <View style={styles.pulseHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <HeartPulse size={16} color="#1ea2b1" />
            <Text style={styles.pulseTitle}>UPSTREAM PULSE</Text>
          </View>
          <Users size={20} color="#333333" />
        </View>

        <Text style={styles.pulseInfo}>
          {upstreamPickedUpCount} commuters boarded earlier
        </Text>
        
        <View style={styles.pulseBarContainer}>
          <View style={[styles.pulseBarFill, { width: `${capacityPercent}%`}]} />
          <Text style={styles.pulsePercent}>{capacityPercent.toFixed(0)}% Full</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 24,
    marginBottom: 24,
  },
  trackLineBase: {
    position: 'absolute',
    left: 36, // Adjusting line placement to align with marker center
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#333333',
    zIndex: 1,
  },
  trackLineActive: {
    position: 'absolute',
    left: 36,
    top: 20,
    width: 2,
    backgroundColor: '#1ea2b1',
    zIndex: 2,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    marginBottom: 16,
    zIndex: 3,
  },
  markerContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  dimDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444444',
  },
  futureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  currentGlowMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  contentContainer: {
    flex: 1,
  },
  currentPositionCard: {
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.4)',
    borderRadius: 12,
    padding: 16,
  },
  currentPositionLabel: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  currentPositionName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentPositionSubtext: {
    color: '#888888',
    fontSize: 12,
  },
  passedStopCard: {
    paddingVertical: 10,
  },
  passedLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  passedStopName: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  futureStopCard: {
    paddingVertical: 10,
  },
  futureLabel: {
    color: '#a3a3a3',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  futureStopName: {
    color: '#eaeaea',
    fontSize: 16,
    fontWeight: '500',
  },
  waitingCommuterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  waitingCommuterText: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: '600',
  },
  upstreamPulseCard: {
    backgroundColor: '#151515',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#222222',
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseTitle: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pulseInfo: {
    color: '#dddddd',
    fontSize: 14,
    marginBottom: 16,
  },
  pulseBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseBarFill: {
    height: 4,
    backgroundColor: '#1ea2b1',
    borderRadius: 2,
    flex: 1,
    marginRight: 10,
  },
  pulsePercent: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  }
});
