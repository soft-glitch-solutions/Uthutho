// components/journey/RouteSlider.tsx - Updated
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { MapPin, Users, Car, Train, Bus, User, Lock } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  latitude?: number;
  longitude?: number;
}

interface RouteSliderProps {
  stops: JourneyStop[];
  currentUserStopName: string;
  currentUserId: string;
  passengers: Passenger[];
  transportType: string;
  currentStopSequence: number;
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  onStopPress: (stop: JourneyStop) => void;
}

export const RouteSlider: React.FC<RouteSliderProps> = ({
  stops,
  currentUserStopName,
  currentUserId,
  passengers,
  transportType,
  currentStopSequence,
  participantStatus,
  onStopPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  const getTransportIcon = () => {
    switch (transportType.toLowerCase()) {
      case 'train':
        return <Train size={24} color="#1ea2b1" />;
      case 'bus':
        return <Bus size={24} color="#1ea2b1" />;
      default:
        return <Car size={24} color="#1ea2b1" />;
    }
  };

  const getPassengersAtStop = (stopId: string) => {
    return passengers.filter(p => p.stop_id === stopId && p.status === 'waiting');
  };

  const getStopStatus = (stop: JourneyStop) => {
    if (stop.passed) return 'passed';
    if (stop.current) return 'current';
    if (stop.upcoming) return 'upcoming';
    return 'future';
  };

  const isYourStop = (stopName: string) => {
    return stopName === currentUserStopName && participantStatus === 'waiting';
  };

  const isStopClosed = (stop: JourneyStop) => {
    // If user is picked up, all stops before current position are closed
    if (participantStatus === 'picked_up' || participantStatus === 'arrived') {
      return stop.order_number < currentStopSequence;
    }
    
    // Stops are closed if they've been passed
    return stop.passed;
  };

  const canJoinStop = (stop: JourneyStop) => {
    // Can't join closed stops
    if (isStopClosed(stop)) return false;
    
    // Can't join if you're already picked up or arrived
    if (participantStatus === 'picked_up' || participantStatus === 'arrived') return false;
    
    // Can only join upcoming stops (not passed ones)
    return stop.upcoming || stop.current;
  };

  const scrollToCurrentStop = () => {
    const currentIndex = stops.findIndex(s => s.current || s.order_number === currentStopSequence);
    if (currentIndex > -1 && scrollViewRef.current) {
      const offset = (currentIndex * 180) - (SCREEN_WIDTH / 2) + 90;
      scrollViewRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }
  };

  React.useEffect(() => {
    scrollToCurrentStop();
  }, [stops, currentStopSequence]);

  const handleStopPress = (stop: JourneyStop) => {
    if (isStopClosed(stop)) {
      Alert.alert(
        'Stop Closed',
        `This stop (${stop.name}) has already been passed. You cannot join from here.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    if (!canJoinStop(stop)) {
      Alert.alert(
        'Cannot Join',
        participantStatus === 'picked_up' 
          ? 'You have already been picked up and cannot change stops.' 
          : 'You cannot join this stop at this time.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    onStopPress(stop);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Stops</Text>
        <View style={styles.transportHeader}>
          {getTransportIcon()}
          <Text style={styles.transportTitle}>{transportType}</Text>
        </View>
      </View>

      {/* Status Indicator */}
      {participantStatus === 'picked_up' && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>
            ✓ You've been picked up. Stops before your position are closed.
          </Text>
        </View>
      )}

      {/* Route Line */}
      <View style={styles.routeLineContainer}>
        <View style={styles.routeLine} />
        <View 
          style={[
            styles.progressLine,
            { width: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%` }
          ]} 
        />
        
        {/* Moving Vehicle */}
        <Animated.View 
          style={[
            styles.vehicleMarker,
            { 
              left: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%`,
              transform: [{ translateX: -12 }]
            }
          ]}
        >
          {getTransportIcon()}
        </Animated.View>
      </View>

      {/* Stops Slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stopsContainer}
        contentContainerStyle={styles.stopsContent}
      >
        {stops.map((stop, index) => {
          const status = getStopStatus(stop);
          const stopPassengers = getPassengersAtStop(stop.id);
          const isYou = isYourStop(stop.name);
          const closed = isStopClosed(stop);
          const canJoin = canJoinStop(stop);
          
          return (
            <TouchableOpacity
              key={stop.id}
              style={[
                styles.stopCard,
                closed && styles.closedCard,
                !canJoin && styles.disabledCard
              ]}
              onPress={() => handleStopPress(stop)}
              disabled={closed || !canJoin}
            >
              {/* Stop Marker */}
              <View style={styles.stopMarkerContainer}>
                <View style={[
                  styles.stopMarker,
                  status === 'passed' && styles.passedMarker,
                  status === 'current' && styles.currentMarker,
                  status === 'upcoming' && styles.upcomingMarker,
                  isYou && styles.yourStopMarker,
                  closed && styles.closedMarker,
                ]}>
                  {isYou && (
                    <View style={styles.youIndicator}>
                      <User size={12} color="#ffffff" />
                    </View>
                  )}
                  
                  {closed && (
                    <View style={styles.closedIndicator}>
                      <Lock size={10} color="#ffffff" />
                    </View>
                  )}
                </View>
                
                {/* Stop Number */}
                <Text style={[
                  styles.stopNumber,
                  closed && styles.closedText
                ]}>
                  {stop.order_number}
                  {closed && ' ✗'}
                </Text>
              </View>

              {/* Stop Info */}
              <View style={styles.stopInfo}>
                <Text 
                  style={[
                    styles.stopName,
                    isYou && styles.yourStopName,
                    status === 'current' && styles.currentStopName,
                    closed && styles.closedText
                  ]}
                  numberOfLines={1}
                >
                  {stop.name}
                  {isYou && ' (You)'}
                  {closed && ' (Closed)'}
                </Text>
                
                {/* Passenger Avatars - Only show if not closed and there are waiting passengers */}
                {!closed && stopPassengers.length > 0 && (
                  <View style={styles.passengerAvatars}>
                    <Users size={14} color="#666666" />
                    <Text style={styles.passengerCount}>
                      {stopPassengers.length} waiting
                    </Text>
                    
                    <View style={styles.avatarContainer}>
                      {stopPassengers.slice(0, 3).map((passenger, idx) => (
                        <View 
                          key={passenger.id} 
                          style={[
                            styles.avatar,
                            { marginLeft: idx > 0 ? -8 : 0 }
                          ]}
                        >
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                              {passenger.profiles?.first_name?.[0] || 'U'}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {stopPassengers.length > 3 && (
                        <View style={styles.moreAvatar}>
                          <Text style={styles.moreText}>
                            +{stopPassengers.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                
                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  status === 'passed' && styles.passedBadge,
                  status === 'current' && styles.currentBadge,
                  status === 'upcoming' && styles.upcomingBadge,
                  closed && styles.closedBadge,
                ]}>
                  {closed ? (
                    <Lock size={10} color="#ffffff" />
                  ) : (
                    <Text style={styles.statusText}>
                      {status === 'passed' ? '✓ Passed' : 
                       status === 'current' ? '● Current' : 
                       status === 'upcoming' ? '↑ Upcoming' : '○ Future'}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendCurrent]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendYou]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendClosed]} />
          <Text style={styles.legendText}>Closed</Text>
        </View>
        <View style={styles.legendItem}>
          <Users size={14} color="#666666" />
          <Text style={styles.legendText}>Waiting</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  transportTitle: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBanner: {
    backgroundColor: '#065f46',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBannerText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  routeLineContainer: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 40,
    position: 'relative',
  },
  routeLine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  progressLine: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 2,
    position: 'absolute',
  },
  vehicleMarker: {
    position: 'absolute',
    top: -22,
    backgroundColor: '#1a1a1a',
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopsContainer: {
    marginBottom: 20,
  },
  stopsContent: {
    paddingRight: 20,
  },
  stopCard: {
    width: 160,
    marginRight: 20,
    alignItems: 'center',
    opacity: 1,
  },
  closedCard: {
    opacity: 0.6,
  },
  disabledCard: {
    opacity: 0.7,
  },
  stopMarkerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#666666',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  passedMarker: {
    backgroundColor: '#4ade80',
  },
  currentMarker: {
    backgroundColor: '#1ea2b1',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  upcomingMarker: {
    backgroundColor: '#fbbf24',
  },
  yourStopMarker: {
    borderColor: '#8b5cf6',
    borderWidth: 4,
  },
  closedMarker: {
    backgroundColor: '#6b7280',
    borderColor: '#4b5563',
  },
  youIndicator: {
    backgroundColor: '#8b5cf6',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  closedIndicator: {
    backgroundColor: '#6b7280',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  stopNumber: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  closedText: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  stopInfo: {
    alignItems: 'center',
  },
  stopName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  yourStopName: {
    color: '#8b5cf6',
  },
  currentStopName: {
    color: '#1ea2b1',
  },
  passengerAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  passengerCount: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passedBadge: {
    backgroundColor: '#065f46',
  },
  currentBadge: {
    backgroundColor: '#1e40af',
  },
  upcomingBadge: {
    backgroundColor: '#78350f',
  },
  closedBadge: {
    backgroundColor: '#4b5563',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCurrent: {
    backgroundColor: '#1ea2b1',
  },
  legendYou: {
    backgroundColor: '#8b5cf6',
  },
  legendClosed: {
    backgroundColor: '#6b7280',
  },
  legendText: {
    color: '#666666',
    fontSize: 12,
  },
});