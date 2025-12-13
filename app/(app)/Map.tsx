// app/map.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Navigation,
  Users,
  Clock,
  Car,
  Target,
  Maximize2,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';

import { useJourney } from '@/hook/useJourney';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Since we're on web, we'll use a simulated map with SVG visualization
const MapVisualization = ({ stops, currentStopIndex, userLocation }) => {
  const getStopColor = (stop, index) => {
    if (stop.current) return '#1ea2b1';
    if (index < currentStopIndex) return '#34d399';
    if (index > currentStopIndex) return '#fbbf24';
    return '#666666';
  };

  const getStopSize = (index) => {
    if (index === currentStopIndex) return 24;
    if (index < currentStopIndex) return 16;
    return 20;
  };

  // Calculate positions for visualization
  const calculateStopPosition = (index, total) => {
    const padding = 40;
    const availableWidth = SCREEN_WIDTH - (padding * 2);
    const x = padding + (availableWidth * (index / (total - 1)));
    const yBase = 100;
    const y = yBase + (Math.sin(index * 0.8) * 40); // Wave pattern
    return { x, y };
  };

  return (
    <View style={styles.mapContainer}>
      {/* Route Line */}
      <View style={styles.routeLineContainer}>
        {stops.map((_, index) => {
          if (index === 0) return null;
          const prevPos = calculateStopPosition(index - 1, stops.length);
          const currentPos = calculateStopPosition(index, stops.length);
          
          return (
            <View
              key={`line-${index}`}
              style={[
                styles.routeSegment,
                {
                  position: 'absolute',
                  left: prevPos.x,
                  top: prevPos.y,
                  width: Math.sqrt(
                    Math.pow(currentPos.x - prevPos.x, 2) + 
                    Math.pow(currentPos.y - prevPos.y, 2)
                  ),
                  transform: [{
                    rotate: `${Math.atan2(
                      currentPos.y - prevPos.y,
                      currentPos.x - prevPos.x
                    )}rad`
                  }],
                  backgroundColor: index <= currentStopIndex ? '#1ea2b1' : '#333333',
                }
              ]}
            />
          );
        })}
      </View>

      {/* Stop Markers */}
      {stops.map((stop, index) => {
        const position = calculateStopPosition(index, stops.length);
        const size = getStopSize(index);
        const color = getStopColor(stop, index);
        
        return (
          <View
            key={stop.id}
            style={[
              styles.stopMarker,
              {
                left: position.x - size / 2,
                top: position.y - size / 2,
                width: size,
                height: size,
                backgroundColor: color,
                borderColor: '#1a1a1a',
                borderWidth: index === currentStopIndex ? 3 : 2,
                zIndex: index === currentStopIndex ? 10 : 5,
              }
            ]}
          >
            <Text style={[
              styles.markerText,
              { fontSize: index === currentStopIndex ? 12 : 10 }
            ]}>
              {stop.order_number}
            </Text>
            
            {/* Current Stop Indicator */}
            {stop.current && (
              <View style={styles.currentStopIndicator}>
                <Text style={styles.currentStopText}>NOW</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* User Location Marker */}
      <View style={styles.userMarker}>
        <View style={styles.userMarkerInner}>
          <Navigation size={16} color="#ffffff" />
        </View>
        <View style={styles.userMarkerPulse} />
      </View>

      {/* Legend */}
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1ea2b1' }]} />
          <Text style={styles.legendText}>Current Stop</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34d399' }]} />
          <Text style={styles.legendText}>Passed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
      </View>
    </View>
  );
};

export default function JourneyMapScreen() {
  const router = useRouter();
  const { activeJourney } = useJourney();
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const panelAnim = useState(new Animated.Value(SCREEN_HEIGHT * 0.3))[0];
  
  const [stops, setStops] = useState([
    {
      id: '1',
      name: 'Cape Town Station',
      lat: -33.9249,
      lng: 18.4241,
      order_number: 1,
      passengers: 3,
      current: false,
      passed: true,
    },
    {
      id: '2',
      name: 'Gqeberha Central',
      lat: -33.9850,
      lng: 25.6173,
      order_number: 2,
      passengers: 2,
      current: false,
      passed: true,
    },
    {
      id: '3',
      name: 'Durban Terminal',
      lat: -29.8587,
      lng: 31.0218,
      order_number: 3,
      passengers: 5,
      current: true,
      passed: false,
    },
    {
      id: '4',
      name: 'Johannesburg Hub',
      lat: -26.2041,
      lng: 28.0473,
      order_number: 4,
      passengers: 0,
      current: false,
      passed: false,
    },
  ]);
  const [showControls, setShowControls] = useState(true);
  const [showStopPanel, setShowStopPanel] = useState(false);
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [estimatedArrival, setEstimatedArrival] = useState('45 min');
  const [passengerCount, setPassengerCount] = useState(10);

  const currentStopIndex = stops.findIndex(stop => stop.current) || 2;
  const userLocation = { lat: -29.8587, lng: 31.0218 };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (activeJourney) {
      loadJourneyStops();
    }
  }, [activeJourney]);

  const loadJourneyStops = async () => {
    try {
      if (!activeJourney) return;
      
      const { data: routeStops, error } = await supabase
        .from('route_stops')
        .select(`
          order_number,
          stops (
            id,
            name,
            latitude,
            longitude
          )
        `)
        .eq('route_id', activeJourney.route_id)
        .order('order_number', { ascending: true });

      if (routeStops && routeStops.length > 0) {
        const processedStops = routeStops
          .filter(rs => rs.stops?.latitude && rs.stops?.longitude)
          .map((rs, index) => ({
            id: rs.stops.id,
            name: rs.stops.name,
            lat: rs.stops.latitude,
            lng: rs.stops.longitude,
            order_number: rs.order_number,
            passengers: Math.floor(Math.random() * 5),
            current: rs.order_number === (activeJourney.current_stop_sequence || 0),
            passed: rs.order_number < (activeJourney.current_stop_sequence || 0),
          }));

        setStops(processedStops);
        setPassengerCount(processedStops.reduce((sum, stop) => sum + (stop.passengers || 0), 0));
      }
    } catch (error) {
      console.error('Error loading journey stops:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const openStopDetails = (stop: any) => {
    setSelectedStop(stop);
    setShowStopPanel(true);
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeStopPanel = () => {
    Animated.spring(panelAnim, {
      toValue: SCREEN_HEIGHT * 0.3,
      useNativeDriver: true,
    }).start(() => {
      setShowStopPanel(false);
    });
  };

  const getStopStatus = (stop: any) => {
    if (stop.passed) return { text: 'Completed', color: '#34d399', icon: '✅' };
    if (stop.current) return { text: 'Current Stop', color: '#1ea2b1', icon: '📍' };
    return { text: 'Upcoming', color: '#fbbf24', icon: '⏱️' };
  };

  const zoomToCurrentStop = () => {
    const currentStop = stops.find(stop => stop.current) || stops[0];
    setSelectedStop(currentStop);
    setShowStopPanel(true);
  };

  const renderStopPanel = () => (
    <Animated.View 
      style={[
        styles.stopPanel,
        { transform: [{ translateY: panelAnim }] }
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Stop Details</Text>
        <TouchableOpacity onPress={closeStopPanel} style={styles.closePanelButton}>
          <X size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {selectedStop && (
        <ScrollView style={styles.stopDetails}>
          <View style={styles.stopHeader}>
            <View style={[
              styles.stopIconContainer,
              { backgroundColor: getStopStatus(selectedStop).color + '20' }
            ]}>
              <Text style={styles.stopIconLarge}>
                {getStopStatus(selectedStop).icon}
              </Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopNameLarge}>{selectedStop.name}</Text>
              <Text style={styles.stopNumber}>Stop {selectedStop.order_number} of {stops.length}</Text>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStopStatus(selectedStop).color }]}>
                <Text style={styles.statusText}>{getStopStatus(selectedStop).text}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passengers Waiting</Text>
              <View style={styles.passengersRow}>
                <Users size={16} color="#1ea2b1" />
                <Text style={styles.detailValue}>{selectedStop.passengers || 0}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coordinates</Text>
              <Text style={styles.detailValue}>
                {selectedStop.lat.toFixed(4)}, {selectedStop.lng.toFixed(4)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Route Progress</Text>
              <Text style={styles.detailValue}>
                {Math.round((selectedStop.order_number / stops.length) * 100)}%
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // You can add navigation logic here
              closeStopPanel();
            }}
          >
            <MapPin size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Set as My Stop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              // Share stop location
              closeStopPanel();
            }}
          >
            <Navigation size={20} color="#1ea2b1" />
            <Text style={styles.secondaryButtonText}>Share Stop Location</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Animated.View>
  );

  const renderControls = () => (
    <Animated.View 
      style={[
        styles.controlsContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Journey Info Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoContent}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName} numberOfLines={1}>
              {activeJourney?.routes?.name || 'Route 101'}
            </Text>
            <View style={styles.transportBadge}>
              <Car size={14} color="#1ea2b1" />
              <Text style={styles.transportText}>
                {activeJourney?.routes?.transport_type || 'Bus'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color="#ffffff" />
              <Text style={styles.statText}>{passengerCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#ffffff" />
              <Text style={styles.statText}>{estimatedArrival}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={zoomToCurrentStop}
        >
          <Target size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {
            // Fit to route action
          }}
        >
          <Maximize2 size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleControls}
        >
          {showControls ? (
            <EyeOff size={20} color="#ffffff" />
          ) : (
            <Eye size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Stops List */}
      <View style={styles.stopsList}>
        <Text style={styles.stopsTitle}>Route Stops</Text>
        <ScrollView style={styles.stopsScroll}>
          {stops.map((stop) => {
            const status = getStopStatus(stop);
            return (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.stopCard,
                  stop.current && styles.currentStopCard,
                ]}
                onPress={() => openStopDetails(stop)}
              >
                <View style={styles.stopCardContent}>
                  <View style={styles.stopCardHeader}>
                    <Text style={styles.stopCardIcon}>{status.icon}</Text>
                    <View style={styles.stopCardInfo}>
                      <Text 
                        style={styles.stopCardName}
                        numberOfLines={1}
                      >
                        {stop.name}
                      </Text>
                      <Text style={styles.stopCardNumber}>
                        Stop {stop.order_number} • {status.text}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stopCardRight}>
                    {stop.passengers > 0 && (
                      <View style={styles.passengersBadge}>
                        <Users size={12} color="#ffffff" />
                        <Text style={styles.passengersCount}>{stop.passengers}</Text>
                      </View>
                    )}
                    <ChevronRight size={16} color="#666" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronRight size={24} color="#ffffff" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journey Map</Text>
          <View style={{ width: 40 }} /> {/* Spacer for alignment */}
        </View>
        
        {/* Map Visualization */}
        <MapVisualization 
          stops={stops}
          currentStopIndex={currentStopIndex}
          userLocation={userLocation}
        />

        {/* Bottom Controls */}
        {showControls && renderControls()}
        
        {/* Show Controls Button (when hidden) */}
        {!showControls && (
          <TouchableOpacity 
            style={styles.showControlsButton}
            onPress={toggleControls}
          >
            <Eye size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        {/* Stop Details Panel */}
        {showStopPanel && renderStopPanel()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    overflow: 'hidden',
  },
  routeLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  routeSegment: {
    height: 4,
    borderRadius: 2,
    transformOrigin: '0% 50%',
  },
  stopMarker: {
    position: 'absolute',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  currentStopIndicator: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentStopText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  userMarker: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 16,
    top: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf630',
    borderWidth: 2,
    borderColor: '#8b5cf660',
  },
  mapLegend: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    color: '#cccccc',
    fontSize: 12,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  transportText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  stopsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stopsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stopsScroll: {
    maxHeight: 200,
  },
  stopCard: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currentStopCard: {
    backgroundColor: '#1e40af20',
    borderColor: '#1ea2b1',
  },
  stopCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stopCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  stopCardInfo: {
    flex: 1,
  },
  stopCardName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stopCardNumber: {
    color: '#666666',
    fontSize: 12,
  },
  stopCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passengersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  passengersCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  showControlsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closePanelButton: {
    padding: 4,
  },
  stopDetails: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stopIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopIconLarge: {
    fontSize: 28,
  },
  stopInfo: {
    flex: 1,
  },
  stopNameLarge: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stopNumber: {
    color: '#666666',
    fontSize: 14,
  },
  detailSection: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#cccccc',
    fontSize: 14,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  secondaryButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
});