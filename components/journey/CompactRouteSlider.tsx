// components/journey/CompactRouteSlider.tsx
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

  return (
    <View style={styles.container}>
      {/* Header with transport info and navigation */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.title}>Route Stops</Text>
          
          {/* Transport Type Badge */}
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
            <Text style={styles.transportLabel}>
              {getTransportLabel()}
            </Text>
          </View>
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
            <View style={styles.currentStopHeader}>
              <View>
                <Text style={styles.currentStopLabel}>
                  {participantStatus === 'picked_up' ? '🚕 Picked Up' : '📍 You are here'}
                </Text>
                <Text style={styles.currentStopName} numberOfLines={1}>
                  {stops[currentStopIndex].name}
                </Text>
              </View>
              
              {/* Transport Icon Animation */}
              <View style={styles.transportAnimationContainer}>
                <View style={styles.movingTransport}>
                  {transportIcon ? (
                    <Image 
                      source={transportIcon} 
                      style={styles.movingTransportIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.movingTransportPlaceholder}>
                      <Text style={styles.movingTransportText}>
                        {transportType.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Visual Progress Timeline with Moving Transport */}
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
          
          {/* Connecting line to timeline */}
          <View style={styles.transportConnector} />
        </View>
        
        {/* Stop markers along the timeline */}
        <View style={styles.stopMarkers}>
          {stops.map((stop, index) => (
            <View 
              key={stop.id}
              style={[
                styles.stopMarker,
                { left: `${(index / Math.max(stops.length - 1, 1)) * 100}%` },
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
                  isPassed && styles.passedCard, // Only passed stops get disabled style
                  !available && !isPassed && styles.disabledCard, // Other unavailable stops (not passed)
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
                  
                  {/* Transport Indicator */}
                  {isCurrent && participantStatus === 'waiting' && (
                    <View style={styles.transportAtStop}>
                      {transportIcon ? (
                        <Image 
                          source={transportIcon} 
                          style={styles.stopTransportIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.stopTransportPlaceholder}>
                          <Text style={styles.stopTransportText}>
                            {transportType.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
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
                  numberOfLines={2}
                >
                  {stop.name}
                  {isYou && participantStatus === 'waiting' && (
                    <Text style={styles.youIndicator}> • You</Text>
                  )}
                  {isYou && participantStatus === 'picked_up' && (
                    <Text style={styles.pickedUpIndicator}> • Picked Up</Text>
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
                     status === 'upcoming' ? 'Next' : 'Upcoming'}
                  </Text>
                </View>

                {/* Passengers Indicator - Only show for active stops */}
                {stopPassengers.length > 0 && !isPassed && available && (
                  <View style={styles.passengersIndicator}>
                    <Users size={12} color="#ffffff" />
                    <Text style={styles.passengersCount}>
                      {stopPassengers.length} waiting
                    </Text>
                  </View>
                )}
                
                {/* Direction Arrow */}
                {index < stops.length - 1 && !isPassed && (
                  <View style={styles.arrowContainer}>
                    <ChevronRight size={14} color="#444" style={styles.directionArrow} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transport Progress Indicator */}
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
        
        <View style={styles.transportProgressInfo}>
          <View style={styles.transportInfoRow}>
            {transportIcon && (
              <Image 
                source={transportIcon} 
                style={styles.smallTransportIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.transportProgressText}>
              {getTransportLabel()} moving to stop {currentStopSequence + 1}
              {participantStatus === 'picked_up' && ' (You are on board)'}
            </Text>
          </View>
          <Text style={styles.progressHint}>
            Scroll to view all stops →
          </Text>
        </View>
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
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  transportIcon: {
    width: 16,
    height: 16,
  },
  transportIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportIconText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  transportLabel: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  currentStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  transportAnimationContainer: {
    alignItems: 'center',
  },
  movingTransport: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingTransportIcon: {
    width: 24,
    height: 24,
  },
  movingTransportPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingTransportText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressTimeline: {
    height: 24,
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 1.5,
  },
  progressLine: {
    position: 'absolute',
    top: 11,
    left: 0,
    height: 3,
    backgroundColor: '#1ea2b1',
    borderRadius: 1.5,
    zIndex: 1,
  },
  movingTransportContainer: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -12 }],
    zIndex: 3,
    alignItems: 'center',
  },
  transportBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  timelineTransportIcon: {
    width: 14,
    height: 14,
  },
  timelineTransportPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTransportText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  transportConnector: {
    width: 2,
    height: 8,
    backgroundColor: '#1ea2b1',
    marginTop: 1,
  },
  stopMarkers: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 16,
  },
  stopMarker: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -3 }],
    alignItems: 'center',
  },
  stopMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  upcomingStopMarker: {
    opacity: 0.8,
  },
  upcomingMarkerDot: {
    backgroundColor: '#fbbf24',
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
  passedCard: {
    opacity: 0.5, // Only passed stops get opacity reduction
  },
  disabledCard: {
    // Current and upcoming stops don't get disabled styling
    borderColor: '#444444',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
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
  transportAtStop: {
    position: 'absolute',
    left: '50%',
    top: -8,
    transform: [{ translateX: -10 }],
  },
  stopTransportIcon: {
    width: 20,
    height: 20,
  },
  stopTransportPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopTransportText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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
  passedStopName: {
    color: '#34d399',
  },
  yourStopName: {
    color: '#8b5cf6',
  },
  youIndicator: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  pickedUpIndicator: {
    color: '#1ea2b1',
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
  transportProgressInfo: {
    alignItems: 'center',
  },
  transportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  smallTransportIcon: {
    width: 16,
    height: 16,
  },
  transportProgressText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  progressHint: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '500',
  },
});