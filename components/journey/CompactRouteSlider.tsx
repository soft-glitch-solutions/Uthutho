import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { MapPin, Users, Circle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';

// Import transport type icons
const TRANSPORT_TYPES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'minibus', label: 'Minibus', icon: require('../../assets/icons/minibus-icon.png') },
  { id: 'bus', label: 'Bus', icon: require('../../assets/icons/bus-icon.png') },
  { id: 'train', label: 'Train', icon: require('../../assets/icons/train-icon.png') },
  { id: 'taxi', label: 'Taxi', icon: require('../../assets/icons/taxi-icon.png') },
];

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
  hasWaitingPassengers?: boolean;
  latitude?: number;
  longitude?: number;
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
  onNavigateToStopDetails?: (stopId: string) => void; // Add this prop
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STOP_CARD_WIDTH = 120; // Reduced from 140
const STOP_CARD_MARGIN = 8; // Reduced from 12

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

  // Find the transport icon based on transportType
  const transportIcon = TRANSPORT_TYPES.find(t => t.id === transportType.toLowerCase())?.icon;

  const getPassengersAtStop = (stopId: string) => {
    return passengers.filter(p => p.stop_id === stopId && p.status === 'waiting');
  };

  const isStopAvailable = (stop: JourneyStop) => {
    if (participantStatus === 'picked_up' || participantStatus === 'arrived') {
      return false;
    }
    // Only upcoming stops should be available for interaction
    return stop.upcoming && !stop.passed;
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
        return <CheckCircle size={12} color="#34d399" />;
      case 'current':
        return <Circle size={14} color="#1ea2b1" fill="#1ea2b1" />;
      case 'upcoming':
        return <Clock size={12} color="#fbbf24" />;
      default:
        return <Circle size={10} color="#666666" />;
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

  // Calculate progress percentage for transport movement
  const getProgressPercentage = () => {
    if (stops.length === 0) return 0;
    return (currentStopSequence / stops.length) * 100;
  };

  // Get transport label for display
  const getTransportLabel = () => {
    const transport = TRANSPORT_TYPES.find(t => t.id === transportType.toLowerCase());
    return transport?.label || transportType;
  };

  // Truncate stop name for small screen
  const truncateStopName = (name: string) => {
    if (name.length > 25) {
      return name.substring(0, 22) + '...';
    }
    return name;
  };

  return (
    <View style={styles.container}>
      {/* Header with transport info and navigation */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MapPin size={14} color="#1ea2b1" />
          <Text style={styles.title}>Route Stops</Text>
        </View>
        
        <View style={styles.navigationControls}>
          <TouchableOpacity
            style={[styles.navButton, currentStopIndex <= 0 && styles.navButtonDisabled]}
            onPress={scrollToPrevious}
            disabled={currentStopIndex <= 0}
          >
            <ChevronLeft size={16} color={currentStopIndex <= 0 ? "#444" : "#1ea2b1"} />
          </TouchableOpacity>
          
          <Text style={styles.stopsCount}>
            {currentStopSequence || 0}/{stops.length}
          </Text>
          
          <TouchableOpacity
            style={[styles.navButton, currentStopIndex >= stops.length - 1 && styles.navButtonDisabled]}
            onPress={scrollToNext}
            disabled={currentStopIndex >= stops.length - 1}
          >
            <ChevronRight size={16} color={currentStopIndex >= stops.length - 1 ? "#444" : "#1ea2b1"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Transport Info Badge */}
      <View style={styles.transportBadgeContainer}>
        <View style={styles.transportBadge}>
          {transportIcon ? (
            <Image 
              source={transportIcon} 
              style={styles.transportIcon}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.transportIconPlaceholder}>
              <Text style={styles.transportIconText}>
                {transportType.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.transportLabel} numberOfLines={1}>
            {getTransportLabel()}
          </Text>
        </View>
        <Text style={styles.progressText}>
          {getProgressPercentage().toFixed(0)}% complete
        </Text>
      </View>

      {/* Current Stop Highlight - Simplified */}
      {currentStopIndex > -1 && stops[currentStopIndex] && (
        <View style={styles.currentStopHighlight}>
          <View style={styles.currentStopBadge}>
            <Text style={styles.currentStopLabel}>
              {participantStatus === 'picked_up' ? '🚕 Picked Up' : '📍 You are here'}
            </Text>
            <Text style={styles.currentStopName} numberOfLines={2}>
              {truncateStopName(stops[currentStopIndex].name)}
            </Text>
          </View>
        </View>
      )}

      {/* Visual Progress Timeline - Simplified */}
      <View style={styles.progressTimeline}>
        <View style={styles.timelineLine} />
        <View 
          style={[
            styles.progressLine,
            { width: `${getProgressPercentage()}%` }
          ]} 
        />
        
        {/* Moving Transport along the timeline */}
        <View 
          style={[
            styles.movingTransportContainer,
            { left: `${getProgressPercentage()}%` }
          ]}
        >
          <View style={styles.transportBubble}>
            {transportIcon ? (
              <Image 
                source={transportIcon} 
                style={styles.timelineTransportIcon}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.timelineTransportPlaceholder}>
                <Text style={styles.timelineTransportText}>
                  {transportType.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Stop markers along the timeline - Show fewer markers on small screen */}
        <View style={styles.stopMarkers}>
          {stops.filter((_, index) => index === 0 || index === stops.length - 1 || index === currentStopIndex).map((stop) => (
            <View 
              key={stop.id}
              style={[
                styles.stopMarker,
                { left: `${(stop.order_number - 1) / Math.max(stops.length - 1, 1) * 100}%` },
                stop.passed && styles.passedStopMarker,
                stop.current && styles.currentStopMarker,
                stop.upcoming && styles.upcomingStopMarker,
              ]}
            >
              <View 
                style={[
                  styles.stopMarkerDot,
                  stop.passed && styles.passedMarkerDot,
                  stop.current && styles.currentMarkerDot,
                  stop.upcoming && styles.upcomingMarkerDot,
                ]} 
              />
              {stop.current && (
                <Text style={styles.stopMarkerText}>#{stop.order_number}</Text>
              )}
            </View>
          ))}
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
            const isPassed = stop.passed;
            
            return (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.stopCard,
                  isCurrent && styles.activeStopCard,
                  status === 'current' && styles.currentStopCard,
                  status === 'passed' && styles.passedStopCard,
                  isPassed && styles.passedCard,
                  !available && !isPassed && styles.disabledCard,
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
                      #{stop.order_number}
                    </Text>
                  </View>
                  
                  {/* Current Stop Indicator */}
                  {isCurrent && (
                    <View style={styles.currentIndicator}>
                      <Text style={styles.currentIndicatorText}>
                        {participantStatus === 'picked_up' ? 'ON BOARD' : 'NOW'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Stop Name */}
                <Text 
                  style={[
                    styles.stopName,
                    isCurrent && styles.activeStopName,
                    isYou && styles.yourStopName,
                    isPassed && styles.passedStopName,
                    !available && !isPassed && styles.disabledText
                  ]}
                  numberOfLines={3}
                >
                  {truncateStopName(stop.name)}
                  {isYou && participantStatus === 'waiting' && (
                    <Text style={styles.youIndicator}> • You</Text>
                  )}
                </Text>

                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  status === 'passed' && styles.passedBadge,
                  status === 'current' && styles.currentBadge,
                  status === 'upcoming' && styles.upcomingBadge,
                  isPassed && styles.passedBadge,
                  !available && !isPassed && styles.disabledBadge,
                ]}>
                  <Text style={styles.statusText}>
                    {status === 'passed' ? 'Passed' : 
                     status === 'current' ? 'Current' : 
                     status === 'upcoming' ? 'Upcoming' : 'Future'}
                  </Text>
                </View>

                {/* Passengers Indicator */}
                {stopPassengers.length > 0 && !isPassed && (
                  <View style={styles.passengersIndicator}>
                    <Users size={10} color="#ffffff" />
                    <Text style={styles.passengersCount}>
                      {stopPassengers.length} waiting
                    </Text>
                  </View>
                )}
                
                {/* Your indicator for picked up */}
                {isYou && participantStatus === 'picked_up' && (
                  <View style={styles.pickedUpIndicator}>
                    <Text style={styles.pickedUpText}>Picked Up</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Progress Dots - Simplified */}
      <View style={styles.progressDotsContainer}>
        {stops.slice(0, 5).map((_, index) => ( // Show only first 5 dots on small screen
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStopIndex && styles.progressDotActive,
              index < currentStopSequence && styles.progressDotPassed,
            ]}
          />
        ))}
        {stops.length > 5 && (
          <Text style={styles.moreDotsText}>+{stops.length - 5}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  transportBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  transportIcon: {
    width: 14,
    height: 14,
  },
  transportIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportIconText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  transportLabel: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  stopsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1ea2b1',
    minWidth: 40,
    textAlign: 'center',
  },
  currentStopHighlight: {
    marginBottom: 10,
  },
  currentStopBadge: {
    backgroundColor: '#1e40af20',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  currentStopLabel: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentStopName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  progressTimeline: {
    height: 20,
    marginBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2a2a2a',
    borderRadius: 1,
  },
  progressLine: {
    position: 'absolute',
    top: 9,
    left: 0,
    height: 2,
    backgroundColor: '#1ea2b1',
    borderRadius: 1,
    zIndex: 1,
  },
  movingTransportContainer: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -10 }],
    zIndex: 3,
    alignItems: 'center',
  },
  transportBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineTransportIcon: {
    width: 12,
    height: 12,
  },
  timelineTransportPlaceholder: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTransportText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  stopMarkers: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 16,
  },
  stopMarker: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -2 }],
    alignItems: 'center',
  },
  stopMarkerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666666',
  },
  stopMarkerText: {
    position: 'absolute',
    top: 6,
    fontSize: 9,
    fontWeight: '600',
    color: '#1ea2b1',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  passedStopMarker: {
    opacity: 0.7,
  },
  passedMarkerDot: {
    backgroundColor: '#34d399',
  },
  currentStopMarker: {
    zIndex: 2,
  },
  currentMarkerDot: {
    backgroundColor: '#1ea2b1',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  upcomingStopMarker: {
    opacity: 0.8,
  },
  upcomingMarkerDot: {
    backgroundColor: '#fbbf24',
  },
  stopsWrapper: {
    marginBottom: 12,
  },
  stopsContainer: {
    marginBottom: 6,
  },
  stopsContent: {
    paddingRight: 8,
    paddingLeft: 4,
  },
  stopCard: {
    width: STOP_CARD_WIDTH,
    marginRight: STOP_CARD_MARGIN,
    padding: 12,
    borderRadius: 10,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  currentStopCard: {
    backgroundColor: '#1e40af15',
  },
  passedStopCard: {
    backgroundColor: '#065f4610',
  },
  passedCard: {
    opacity: 0.5,
  },
  disabledCard: {
    borderColor: '#444444',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentIndicator: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentIndicatorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  stopName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 8,
    minHeight: 32,
  },
  activeStopName: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  passedStopName: {
    color: '#34d399',
  },
  yourStopName: {
    color: '#8b5cf6',
  },
  youIndicator: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 11,
  },
  disabledText: {
    color: '#666666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
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
    fontSize: 9,
    fontWeight: '600',
  },
  passengersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  passengersCount: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  pickedUpIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: '#1ea2b130',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  pickedUpText: {
    color: '#1ea2b1',
    fontSize: 9,
    fontWeight: '600',
  },
  progressDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#333333',
  },
  progressDotActive: {
    backgroundColor: '#1ea2b1',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressDotPassed: {
    backgroundColor: '#34d399',
  },
  moreDotsText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 2,
  },
});