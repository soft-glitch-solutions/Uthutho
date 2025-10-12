import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Navigation, Clock, MapPin, ArrowRight, TramFront, Repeat, Bus, Train, Car, Footprints } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface RouteStep {
  instruction: string;
  transport_type: string;
  duration: string;
  distance?: number;
  cost?: number;
  stopName?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  entityId?: string;
  entityType?: 'stop' | 'hub' | 'route';
  navigationLink?: string;
}

interface RouteInstructionsProps {
  fromLocation: string;
  toLocation: string;
  steps: RouteStep[];
  totalDuration: string;
  totalDistance: number;
  totalCost: number;
  isMultiModal?: boolean;
  routes?: Array<{
    routeId: string;
    routeName: string;
    transportType: string;
    navigationLink: string;
  }>;
  hasValidRoute: boolean;
  message?: string;
}

// Safe number formatting utility
const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return decimals === 0 ? '0' : '0.' + '0'.repeat(decimals);
  }
  return value.toFixed(decimals);
};

export default function RouteInstructions({
  fromLocation,
  toLocation,
  steps = [],
  totalDuration,
  totalDistance,
  totalCost,
  isMultiModal = false,
  routes = [],
  hasValidRoute = true,
  message
}: RouteInstructionsProps) {
  const router = useRouter();

  const formatDistance = (km: number | undefined) => {
    // Handle undefined, null, or NaN values
    if (km === undefined || km === null || isNaN(km)) {
      return 'N/A';
    }
    
    if (km < 1) {
      return `${safeToFixed(km * 1000, 0)}m`;
    }
    return `${safeToFixed(km, 1)}km`;
  };

  const getTransportIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('walk')) return '🚶';
    if (lowerType.includes('taxi')) return '🚕';
    if (lowerType.includes('bus')) return '🚌';
    if (lowerType.includes('train')) return '🚆';
    if (lowerType.includes('metro')) return '🚇';
    if (lowerType.includes('connect')) return '🔄';
    return '🚗';
  };

  const getTransportIconComponent = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('walk')) return <Footprints size={16} color="#1ea2b1" />;
    if (lowerType.includes('taxi')) return <Car size={16} color="#1ea2b1" />;
    if (lowerType.includes('bus')) return <Bus size={16} color="#1ea2b1" />;
    if (lowerType.includes('train')) return <Train size={16} color="#1ea2b1" />;
    return <TramFront size={16} color="#1ea2b1" />;
  };

  const handleEntityPress = (step: RouteStep) => {
    if (step.navigationLink && step.entityId) {
      router.push(step.navigationLink);
    }
  };

  const renderClickableStop = (step: RouteStep) => {
    if (!step.stopName) return null;

    const isClickable = step.navigationLink && step.entityId;

    return (
      <TouchableOpacity 
        onPress={() => handleEntityPress(step)}
        disabled={!isClickable}
        style={styles.stopContainer}
      >
        <View style={[
          styles.stopInfo,
          isClickable && styles.clickableStopInfo
        ]}>
          <MapPin size={14} color={isClickable ? "#1ea2b1" : "#666666"} />
          <Text style={[
            styles.stopName,
            isClickable && styles.clickableStopName
          ]}>
            {step.stopName}
          </Text>
          {isClickable && (
            <Text style={styles.navigationHint}> → Tap for details</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderClickableRoute = (route: {
    routeId: string;
    routeName: string;
    transportType: string;
    navigationLink: string;
  }) => {
    return (
      <TouchableOpacity 
        key={route.routeId}
        onPress={() => router.push(route.navigationLink)}
        style={styles.routeTag}
      >
        {getTransportIconComponent(route.transportType)}
        <Text style={styles.routeTagText}>
          {route.routeName} ({route.transportType})
        </Text>
        <Text style={styles.navigationHint}>→</Text>
      </TouchableOpacity>
    );
  };

  const getStepColor = (transportType: string) => {
    const lowerType = transportType.toLowerCase();
    if (lowerType.includes('walk')) return '#10b981';
    if (lowerType.includes('taxi')) return '#f59e0b';
    if (lowerType.includes('bus')) return '#3b82f6';
    if (lowerType.includes('train')) return '#ef4444';
    if (lowerType.includes('metro')) return '#8b5cf6';
    if (lowerType.includes('connect')) return '#6b7280';
    return '#1ea2b1';
  };

  // Check if we have valid route data
  const hasValidData = hasValidRoute && steps && steps.length > 0;

  // Handle case when no valid route is found or data is undefined
  if (!hasValidData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Navigation size={24} color="#666666" />
          <Text style={styles.title}>Route Information</Text>
        </View>

        <View style={styles.noRouteContainer}>
          <Text style={styles.noRouteIcon}>❓</Text>
          <Text style={styles.noRouteTitle}>Route Unknown</Text>
          <Text style={styles.noRouteMessage}>
            {message || "We don't have information about this route in our system."}
          </Text>
          
          <View style={styles.routeOverview}>
            <View style={styles.routePath}>
              <View style={styles.locationContainer}>
                <Text style={styles.locationLabel}>From</Text>
                <Text style={styles.locationText}>{fromLocation || 'Starting point'}</Text>
              </View>
              <ArrowRight size={20} color="#666666" style={styles.arrowIcon} />
              <View style={styles.locationContainer}>
                <Text style={styles.locationLabel}>To</Text>
                <Text style={styles.locationText}>{toLocation || 'Destination'}</Text>
              </View>
            </View>
            
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <MapPin size={18} color="#666666" />
                <Text style={[styles.statText, { color: '#666666' }]}>
                  {totalDistance ? formatDistance(totalDistance) : 'Distance unknown'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>Why this might be:</Text>
            <Text style={styles.suggestionText}>• This route isn't in our current database</Text>
            <Text style={styles.suggestionText}>• We may not serve this area yet</Text>
            <Text style={styles.suggestionText}>• The route might be very new</Text>
            <Text style={styles.suggestionText}>• Try checking our available routes</Text>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Help us improve:</Text>
            <Text style={styles.helpText}>
              Let us know about this route so we can consider adding it to our system.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render normal route instructions when a valid route is found
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Navigation size={24} color="#1ea2b1" />
        <Text style={styles.title}>Route Instructions</Text>
        {isMultiModal && (
          <View style={styles.multiModalBadge}>
            <Repeat size={14} color="#fbbf24" />
            <Text style={styles.multiModalText}>Multi-Modal</Text>
          </View>
        )}
      </View>

      <View style={styles.routeOverview}>
        <View style={styles.routePath}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationText}>{fromLocation}</Text>
          </View>
          <ArrowRight size={20} color="#1ea2b1" style={styles.arrowIcon} />
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationText}>{toLocation}</Text>
          </View>
        </View>
        
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Clock size={18} color="#1ea2b1" />
            <Text style={styles.statText}>{totalDuration}</Text>
          </View>
          <View style={styles.statItem}>
            <MapPin size={18} color="#1ea2b1" />
            <Text style={styles.statText}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.costText}>R {safeToFixed(totalCost, 0)}</Text>
          </View>
        </View>
      </View>

      {routes.length > 0 && (
        <View style={styles.routesUsed}>
          <Text style={styles.routesUsedTitle}>Routes Used:</Text>
          <View style={styles.routesList}>
            {routes.map(renderClickableRoute)}
          </View>
        </View>
      )}

      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {steps.map((step, index) => {
          const stepColor = getStepColor(step.transport_type);
          return (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepNumber, { backgroundColor: stepColor }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {index < steps.length - 1 && (
                  <View style={[styles.stepConnector, { backgroundColor: stepColor }]} />
                )}
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTransportIcon}>
                    {getTransportIcon(step.transport_type)}
                  </Text>
                  <View style={styles.stepInstructionContainer}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    <View style={styles.stepDetails}>
                      <View style={[styles.transportTypeBadge, { backgroundColor: stepColor + '20' }]}>
                        <Text style={[styles.transportType, { color: stepColor }]}>
                          {step.transport_type}
                        </Text>
                      </View>
                      <View style={styles.stepMetrics}>
                        <Clock size={12} color="#666666" />
                        <Text style={styles.stepDuration}>{step.duration}</Text>
                        {step.distance !== undefined && step.distance > 0 && (
                          <>
                            <MapPin size={12} color="#666666" style={{ marginLeft: 8 }} />
                            <Text style={styles.stepDistance}>
                              {formatDistance(step.distance)}
                            </Text>
                          </>
                        )}
                        {step.cost !== undefined && step.cost > 0 && (
                          <Text style={styles.stepCost}>• R {safeToFixed(step.cost, 0)}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {renderClickableStop(step)}

                {step.coordinates && (
                  <Text style={styles.coordinates}>
                    📍 {safeToFixed(step.coordinates.lat, 6)}, {safeToFixed(step.coordinates.lon, 6)}
                  </Text>
                )}

                {step.entityType === 'route' && step.navigationLink && (
                  <TouchableOpacity 
                    style={[styles.detailsButton, { borderColor: stepColor }]}
                    onPress={() => handleEntityPress(step)}
                  >
                    <Text style={[styles.detailsButtonText, { color: stepColor }]}>
                      View Route Details →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tip: Tap on stops, hubs, or routes for more details and real-time information
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  multiModalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2420',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf2440',
  },
  multiModalText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  routeOverview: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  arrowIcon: {
    marginHorizontal: 12,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  costText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routesUsed: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  routesUsedTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  routesList: {
    gap: 8,
  },
  routeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b115',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1ea2b130',
  },
  routeTagText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  navigationHint: {
    color: '#666666',
    fontSize: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  stepsContainer: {
    maxHeight: 500,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepConnector: {
    width: 3,
    flex: 1,
    marginTop: 8,
    minHeight: 20,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepTransportIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  stepInstructionContainer: {
    flex: 1,
  },
  stepInstruction: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 8,
  },
  stepDetails: {
    gap: 8,
  },
  transportTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transportType: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stepDuration: {
    color: '#cccccc',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  stepDistance: {
    color: '#cccccc',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  stepCost: {
    color: '#1ea2b1',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clickableStopInfo: {
    backgroundColor: '#1ea2b115',
    borderWidth: 1,
    borderColor: '#1ea2b130',
  },
  stopName: {
    color: '#cccccc',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  clickableStopName: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  coordinates: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  detailsButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // No Route Styles
  noRouteContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRouteIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noRouteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  noRouteMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  suggestionBox: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    marginTop: 16,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
    lineHeight: 20,
  },
  helpBox: {
    backgroundColor: '#1ea2b115',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1ea2b130',
    width: '100%',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
});