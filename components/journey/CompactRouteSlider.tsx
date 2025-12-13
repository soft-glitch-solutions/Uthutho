// components/journey/CompactRouteSlider.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { MapPin, Users, Circle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STOP_CARD_WIDTH = 140;
const STOP_CARD_MARGIN = 12;

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
  const scrollViewRef = useRef<ScrollView>(null);
  const currentStopIndex = stops.findIndex(stop => stop.current || stop.order_number === currentStopSequence);

  const getPassengersAtStop = (stopId: string) => {
    return passengers.filter(p => p.stop_id === stopId && p.status === 'waiting');
  };

  const isStopAvailable = (stop: JourneyStop) => {
    if (participantStatus === 'picked_up' || participantStatus === 'arrived') {
      return false;
    }
    return !stop.passed && stop.upcoming;
  };

  const isYourStop = (stopName: string) => {
    return stopName === currentUserStopName && participantStatus === 'waiting';
  };

  const getStopStatus = (stop: JourneyStop) => {
    if (stop.passed) return 'passed';
    if (stop.current) return 'current';
    if (stop.upcoming) return 'upcoming';
    return 'future';
  };

  const getStopIcon = (stop: JourneyStop) => {
    const status = getStopStatus(stop);
    
    switch (status) {
      case 'passed':
        return <CheckCircle size={14} color="#34d399" />;
      case 'current':
        return <Circle size={16} color="#1ea2b1" fill="#1ea2b1" />;
      case 'upcoming':
        return <Clock size={14} color="#fbbf24" />;
      default:
        return <Circle size={12} color="#666666" />;
    }
  };

  const getStopColor = (stop: JourneyStop) => {
    const status = getStopStatus(stop);
    
    switch (status) {
      case 'passed':
        return '#34d399';
      case 'current':
        return '#1ea2b1';
      case 'upcoming':
        return '#fbbf24';
      default:
        return '#666666';
    }
  };

  // Focus on current stop when component loads or stops change
  useEffect(() => {
    if (currentStopIndex > -1 && scrollViewRef.current) {
      const scrollPosition = (currentStopIndex * (STOP_CARD_WIDTH + STOP_CARD_MARGIN)) - (SCREEN_WIDTH / 2) + (STOP_CARD_WIDTH / 2);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }, 300);
    }
  }, [currentStopIndex, stops]);

  const scrollToPrevious = () => {
    if (currentStopIndex > 0 && scrollViewRef.current) {
      const scrollPosition = ((currentStopIndex - 1) * (STOP_CARD_WIDTH + STOP_CARD_MARGIN)) - (SCREEN_WIDTH / 2) + (STOP_CARD_WIDTH / 2);
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: true,
      });
    }
  };

  const scrollToNext = () => {
    if (currentStopIndex < stops.length - 1 && scrollViewRef.current) {
      const scrollPosition = ((currentStopIndex + 1) * (STOP_CARD_WIDTH + STOP_CARD_MARGIN)) - (SCREEN_WIDTH / 2) + (STOP_CARD_WIDTH / 2);
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with navigation arrows */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.title}>Route Stops</Text>
        </View>
        
        <View style={styles.navigationControls}>
          <TouchableOpacity
            style={[styles.navButton, currentStopIndex <= 0 && styles.navButtonDisabled]}
            onPress={scrollToPrevious}
            disabled={currentStopIndex <= 0}
          >
            <ChevronLeft size={18} color={currentStopIndex <= 0 ? "#444" : "#1ea2b1"} />
          </TouchableOpacity>
          
          <Text style={styles.stopsCount}>
            {currentStopSequence || 0} of {stops.length}
          </Text>
          
          <TouchableOpacity
            style={[styles.navButton, currentStopIndex >= stops.length - 1 && styles.navButtonDisabled]}
            onPress={scrollToNext}
            disabled={currentStopIndex >= stops.length - 1}
          >
            <ChevronRight size={18} color={currentStopIndex >= stops.length - 1 ? "#444" : "#1ea2b1"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Stop Highlight */}
      {currentStopIndex > -1 && stops[currentStopIndex] && (
        <View style={styles.currentStopHighlight}>
          <View style={styles.currentStopBadge}>
            <Text style={styles.currentStopLabel}>📍 You are here</Text>
            <Text style={styles.currentStopName} numberOfLines={1}>
              {stops[currentStopIndex].name}
            </Text>
          </View>
        </View>
      )}

      {/* Visual Progress Timeline */}
      <View style={styles.progressTimeline}>
        <View style={styles.timelineLine} />
        <View 
          style={[
            styles.progressLine,
            { width: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%` }
          ]} 
        />
        
        {/* Current Position Marker */}
        <View 
          style={[
            styles.currentPosition,
            { left: `${(currentStopSequence / Math.max(stops.length, 1)) * 100}%` }
          ]}
        >
          <View style={styles.positionPin} />
        </View>
      </View>

      {/* Stops Grid with Scroll Focus */}
      <View style={styles.stopsWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.stopsContainer}
          contentContainerStyle={styles.stopsContent}
          snapToInterval={STOP_CARD_WIDTH + STOP_CARD_MARGIN}
          decelerationRate="fast"
          snapToAlignment="center"
        >
          {stops.map((stop, index) => {
            const stopPassengers = getPassengersAtStop(stop.id);
            const isYou = isYourStop(stop.name);
            const status = getStopStatus(stop);
            const available = isStopAvailable(stop);
            const isCurrent = index === currentStopIndex;
            
            return (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.stopCard,
                  isCurrent && styles.activeStopCard,
                  status === 'current' && styles.currentStopCard,
                  status === 'passed' && styles.passedStopCard,
                  !available && styles.disabledCard,
                ]}
                onPress={() => onStopPress(stop)}
                disabled={!available}
                activeOpacity={available ? 0.7 : 1}
              >
                {/* Stop Number with Indicator */}
                <View style={styles.stopHeader}>
                  <View style={styles.stopIndicator}>
                    {getStopIcon(stop)}
                    <Text style={[
                      styles.stopNumber,
                      { color: getStopColor(stop) }
                    ]}>
                      {stop.order_number}
                    </Text>
                  </View>
                  
                  {/* Current Stop Indicator */}
                  {isCurrent && (
                    <View style={styles.currentIndicator}>
                      <Text style={styles.currentIndicatorText}>NOW</Text>
                    </View>
                  )}
                </View>

                {/* Stop Name */}
                <Text 
                  style={[
                    styles.stopName,
                    isCurrent && styles.activeStopName,
                    isYou && styles.yourStopName,
                    !available && styles.disabledText
                  ]}
                  numberOfLines={2}
                >
                  {stop.name}
                  {isYou && (
                    <Text style={styles.youIndicator}> • You</Text>
                  )}
                </Text>

                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  status === 'passed' && styles.passedBadge,
                  status === 'current' && styles.currentBadge,
                  status === 'upcoming' && styles.upcomingBadge,
                  !available && styles.disabledBadge,
                ]}>
                  <Text style={styles.statusText}>
                    {status === 'passed' ? 'Completed' : 
                     status === 'current' ? 'Current' : 
                     status === 'upcoming' ? 'Next' : 'Upcoming'}
                  </Text>
                </View>

                {/* Passengers Indicator */}
                {stopPassengers.length > 0 && available && (
                  <View style={styles.passengersIndicator}>
                    <Users size={12} color="#ffffff" />
                    <Text style={styles.passengersCount}>
                      {stopPassengers.length} waiting
                    </Text>
                  </View>
                )}
                
                {/* Direction Arrow */}
                {index < stops.length - 1 && (
                  <View style={styles.arrowContainer}>
                    <ChevronRight size={14} color="#444" style={styles.directionArrow} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressIndicator}>
        <View style={styles.progressDots}>
          {stops.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStopIndex && styles.progressDotActive,
                index < currentStopSequence && styles.progressDotPassed,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Scroll to view all stops →
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  stopsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
    minWidth: 50,
    textAlign: 'center',
  },
  currentStopHighlight: {
    marginBottom: 16,
  },
  currentStopBadge: {
    backgroundColor: '#1e40af20',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  currentStopLabel: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentStopName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressTimeline: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
  },
  progressLine: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 3,
    position: 'absolute',
  },
  currentPosition: {
    position: 'absolute',
    top: -4,
    transform: [{ translateX: -6 }],
  },
  positionPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1ea2b1',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  stopsWrapper: {
    marginBottom: 16,
  },
  stopsContainer: {
    marginBottom: 8,
  },
  stopsContent: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  stopCard: {
    width: STOP_CARD_WIDTH,
    marginRight: STOP_CARD_MARGIN,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  activeStopCard: {
    backgroundColor: '#1e40af20',
    borderColor: '#1ea2b1',
    transform: [{ scale: 1.02 }],
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentStopCard: {
    backgroundColor: '#1e40af15',
  },
  passedStopCard: {
    backgroundColor: '#065f4610',
  },
  disabledCard: {
    opacity: 0.5,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentIndicator: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  stopName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
    minHeight: 36,
  },
  activeStopName: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  yourStopName: {
    color: '#8b5cf6',
  },
  youIndicator: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  disabledText: {
    color: '#666666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
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
  disabledBadge: {
    backgroundColor: '#374151',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  passengersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  passengersCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  arrowContainer: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -7,
  },
  directionArrow: {
    opacity: 0.5,
  },
  progressIndicator: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
  },
  progressDotActive: {
    backgroundColor: '#1ea2b1',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotPassed: {
    backgroundColor: '#34d399',
  },
  progressText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '500',
  },
});