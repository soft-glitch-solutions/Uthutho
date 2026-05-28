// app/search-results.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Bus,
  Navigation,
  ChevronRight,
  DollarSign,
  Train,
  Car,
  AlertCircle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image_url: string;
}

interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  transport_type: string;
  cost: number;
}

interface NearbyStop {
  stop: Stop;
  distance: number;
  routes: Route[];
}

// Skeleton Loader
const SkeletonLoader = ({ colors }: { colors: any }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.skeletonHeader, { backgroundColor: colors.card }]}>
        <View style={styles.skeletonHeaderActions}>
          <View style={[styles.skeletonIconButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        </View>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
            <View style={styles.skeletonTextContainer}>
              <View style={[styles.skeletonTextSmall, { backgroundColor: colors.border, width: '40%' }]} />
              <View style={[styles.skeletonTextLarge, { backgroundColor: colors.border, width: '70%' }]} />
            </View>
          </View>
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={[styles.skeletonStopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.skeletonStopHeader}>
                <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
                <View style={styles.skeletonStopInfo}>
                  <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border, width: '60%' }]} />
                  <View style={[styles.skeletonTextSmall, { backgroundColor: colors.border, width: '40%' }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [addressName, setAddressName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const addressLat = parseFloat(params.latitude as string);
  const addressLng = parseFloat(params.longitude as string);

  const HEADER_MAX_HEIGHT = 100;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 70 : 60;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const findNearbyStopsWithRoutes = async (latitude: number, longitude: number, radiusKm: number = 10) => {
    try {
      const { data: allStops, error: stopsError } = await supabase
        .from('stops')
        .select('*');

      if (stopsError) throw stopsError;
      if (!allStops || allStops.length === 0) return [];

      const stopsWithDistance = allStops.map(stop => ({
        ...stop,
        distance: calculateDistance(latitude, longitude, stop.latitude, stop.longitude)
      })).filter(stop => stop.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      const nearbyStopsWithRoutes = await Promise.all(
        stopsWithDistance.map(async (stop) => {
          const { data: routeStops, error: routeStopError } = await supabase
            .from('route_stops')
            .select(`
              order_number,
              routes (
                id,
                name,
                start_point,
                end_point,
                transport_type,
                cost
              )
            `)
            .eq('stop_id', stop.id);

          if (routeStopError) {
            return { stop, distance: stop.distance, routes: [] };
          }

          const routes = routeStops
            .filter(rs => rs.routes)
            .map(rs => rs.routes);

          return { stop, distance: stop.distance, routes };
        })
      );

      return nearbyStopsWithRoutes;
    } catch (error) {
      console.error('Error finding nearby stops:', error);
      throw error;
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'UthuthoApp/1.0'
          }
        }
      );
      const data = await response.json();
      // Get a clean address without coordinates
      if (data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
        if (parts.length > 0) return parts.join(', ');
      }
      return data.display_name?.split(',')[0] || 'Selected Location';
    } catch (error) {
      return 'Selected Location';
    }
  };

  useEffect(() => {
    const loadSearchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        let address = params.address as string || 'Selected Location';

        try {
          address = decodeURIComponent(address);
        } catch (e) { }

        if (!isNaN(addressLat) && !isNaN(addressLng) && addressLat && addressLng) {
          if (address === 'Selected Location') {
            const detailedAddress = await getAddressFromCoords(addressLat, addressLng);
            setAddressName(detailedAddress);
          } else {
            setAddressName(address);
          }

          const nearby = await findNearbyStopsWithRoutes(addressLat, addressLng);
          setNearbyStops(nearby);
        } else {
          setError('Invalid location');
        }
      } catch (error) {
        console.error('Error loading search results:', error);
        setError('Failed to load nearby stops');
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(addressLat) && !isNaN(addressLng)) {
      loadSearchResults();
    } else {
      setLoading(false);
      setError('Invalid location coordinates');
    }
  }, [addressLat, addressLng, params.address]);

  const getDistanceDisplay = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return 'Price not set';
    return `R${amount.toFixed(2)}`;
  };

  const getTransportIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bus':
        return <Bus size={14} color={colors.primary} />;
      case 'train':
        return <Train size={14} color={colors.primary} />;
      case 'taxi':
      case 'car':
        return <Car size={14} color={colors.primary} />;
      default:
        return <Bus size={14} color={colors.primary} />;
    }
  };

  const handleStopPress = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  const handleRoutePress = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  if (loading) {
    return <SkeletonLoader colors={colors} />;
  }

  // Desktop Layout
  if (isDesktop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.desktopHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.desktopHeaderContent}>
            <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.desktopHeaderTitle, { color: colors.text }]}>Search Results</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.desktopContentContainer}>
          <View style={styles.desktopWrapper}>
            {/* Left Column - Location Info */}
            <View style={styles.desktopLeftColumn}>
              <View style={[styles.locationCardDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.locationIconDesktop, { backgroundColor: `${colors.primary}15` }]}>
                  <MapPin size={24} color={colors.primary} />
                </View>
                <View style={styles.locationInfoDesktop}>
                  <Text style={[styles.locationLabelDesktop, { color: colors.primary }]}>Selected Location</Text>
                  <Text style={[styles.locationNameDesktop, { color: colors.text }]}>{addressName}</Text>
                </View>
              </View>

              <View style={styles.summaryCardDesktop}>
                <Text style={[styles.summaryCountDesktop, { color: colors.primary }]}>
                  {nearbyStops.length}
                </Text>
                <Text style={[styles.summaryTextDesktop, { color: colors.text }]}>
                  stop{nearbyStops.length !== 1 ? 's' : ''} nearby
                </Text>
              </View>
            </View>

            {/* Right Column - Stops List */}
            <View style={styles.desktopRightColumn}>
              <Text style={[styles.sectionTitleDesktop, { color: colors.text }]}>Nearby Stops</Text>

              {error ? (
                <View style={[styles.errorCardDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <AlertCircle size={48} color="#ff4444" />
                  <Text style={[styles.errorTextDesktop, { color: colors.text }]}>{error}</Text>
                  <TouchableOpacity style={[styles.retryButtonDesktop, { backgroundColor: colors.primary }]} onPress={() => window.location.reload()}>
                    <Text style={styles.retryButtonTextDesktop}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : nearbyStops.length > 0 ? (
                nearbyStops.map((item) => (
                  <TouchableOpacity
                    key={item.stop.id}
                    style={[styles.stopCardDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleStopPress(item.stop.id)}
                  >
                    <View style={styles.stopCardHeaderDesktop}>
                      <View style={[styles.stopIconDesktop, { backgroundColor: `${colors.primary}10` }]}>
                        <MapPin size={20} color={colors.primary} />
                      </View>
                      <View style={styles.stopInfoDesktop}>
                        <Text style={[styles.stopNameDesktop, { color: colors.text }]}>{item.stop.name}</Text>
                        <View style={styles.distanceRowDesktop}>
                          <Navigation size={12} color={colors.primary} />
                          <Text style={[styles.distanceTextDesktop, { color: colors.primary }]}>{getDistanceDisplay(item.distance)}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={colors.text} />
                    </View>

                    {item.routes.length > 0 && (
                      <View style={styles.routesSectionDesktop}>
                        <Text style={[styles.routesLabelDesktop, { color: colors.text }]}>Routes at this stop:</Text>
                        <View style={styles.routesListDesktop}>
                          {item.routes.slice(0, 3).map((route) => (
                            <TouchableOpacity
                              key={route.id}
                              style={[styles.routeBadgeDesktop, { backgroundColor: `${colors.primary}10` }]}
                              onPress={() => handleRoutePress(route.id)}
                            >
                              {getTransportIcon(route.transport_type)}
                              <Text style={[styles.routeNameDesktop, { color: colors.primary }]}>{route.name}</Text>
                            </TouchableOpacity>
                          ))}
                          {item.routes.length > 3 && (
                            <Text style={[styles.moreRoutesDesktop, { color: colors.text }]}>+{item.routes.length - 3} more</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.emptyCardDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MapPin size={48} color={colors.text} />
                  <Text style={[styles.emptyTextDesktop, { color: colors.text }]}>No stops found nearby</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile Layout
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ marginTop: HEADER_MAX_HEIGHT }}>
          <View style={styles.content}>
            {/* Location Card */}
            <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.locationIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MapPin size={24} color={colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: colors.primary }]}>Selected Location</Text>
                <Text style={[styles.locationName, { color: colors.text }]}>{addressName}</Text>
              </View>
            </View>

            {/* Results Summary */}
            <View style={styles.summarySection}>
              <Text style={[styles.summaryCount, { color: colors.primary }]}>{nearbyStops.length}</Text>
              <Text style={[styles.summaryText, { color: colors.text }]}>nearby stops found</Text>
            </View>

            {/* Error State */}
            {error ? (
              <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <AlertCircle size={48} color="#ff4444" />
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
                  <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            ) : nearbyStops.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Stops</Text>
                {nearbyStops.map((item) => (
                  <TouchableOpacity
                    key={item.stop.id}
                    style={[styles.stopCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleStopPress(item.stop.id)}
                  >
                    <View style={styles.stopCardHeader}>
                      <View style={[styles.stopIcon, { backgroundColor: `${colors.primary}10` }]}>
                        <MapPin size={20} color={colors.primary} />
                      </View>
                      <View style={styles.stopInfo}>
                        <Text style={[styles.stopName, { color: colors.text }]}>{item.stop.name}</Text>
                        <View style={styles.distanceRow}>
                          <Navigation size={12} color={colors.primary} />
                          <Text style={[styles.distanceText, { color: colors.primary }]}>{getDistanceDisplay(item.distance)}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={colors.text} />
                    </View>

                    {item.routes.length > 0 && (
                      <View style={styles.routesSection}>
                        <Text style={[styles.routesLabel, { color: colors.text }]}>Routes:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routesScroll}>
                          {item.routes.map((route) => (
                            <TouchableOpacity
                              key={route.id}
                              style={[styles.routeBadge, { backgroundColor: `${colors.primary}10` }]}
                              onPress={() => handleRoutePress(route.id)}
                            >
                              {getTransportIcon(route.transport_type)}
                              <Text style={[styles.routeName, { color: colors.primary }]}>{route.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MapPin size={48} color={colors.text} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No stops found nearby</Text>
                <Text style={[styles.emptySubtext, { color: colors.text }]}>Try searching for a different location</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            height: HEADER_MAX_HEIGHT,
            transform: [{ translateY: headerTranslateY }],
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.headerContent, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search Results</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.stickySubtitle, { opacity: headerOpacity }]}>
          <Text style={[styles.stickySubtitleText, { color: colors.text }]}>
            {nearbyStops.length} stop{nearbyStops.length !== 1 ? 's' : ''} found
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  // Header
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stickySubtitle: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stickySubtitleText: {
    fontSize: 13,
  },

  // Location Card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Summary Section
  summarySection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
    gap: 8,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 16,
  },

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Stop Card
  stopCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
  },
  routesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  routesLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  routesScroll: {
    flexDirection: 'row',
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginRight: 8,
  },
  routeName: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Error & Empty States
  errorCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Desktop Layout
  desktopHeader: {
    borderBottomWidth: 1,
  },
  desktopHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  desktopBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  desktopContentContainer: {
    paddingBottom: 40,
  },
  desktopWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: 32,
  },
  desktopLeftColumn: {
    width: '35%',
  },
  desktopRightColumn: {
    width: '65%',
  },

  // Desktop Location Card
  locationCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  locationIconDesktop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationInfoDesktop: {
    flex: 1,
  },
  locationLabelDesktop: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  locationNameDesktop: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Desktop Summary Card
  summaryCardDesktop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
    gap: 8,
  },
  summaryCountDesktop: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  summaryTextDesktop: {
    fontSize: 16,
  },

  // Desktop Section Title
  sectionTitleDesktop: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  // Desktop Stop Card
  stopCardDesktop: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  stopCardHeaderDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIconDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopInfoDesktop: {
    flex: 1,
  },
  stopNameDesktop: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  distanceRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceTextDesktop: {
    fontSize: 13,
  },
  routesSectionDesktop: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  routesLabelDesktop: {
    fontSize: 13,
    marginBottom: 10,
  },
  routesListDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  routeBadgeDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  routeNameDesktop: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreRoutesDesktop: {
    fontSize: 13,
    alignSelf: 'center',
  },

  // Desktop Error & Empty
  errorCardDesktop: {
    alignItems: 'center',
    padding: 60,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorTextDesktop: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  retryButtonDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonTextDesktop: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCardDesktop: {
    alignItems: 'center',
    padding: 60,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTextDesktop: {
    fontSize: 16,
    marginTop: 20,
  },

  // Skeleton Styles
  skeletonHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
  },
  skeletonHeaderActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    left: 20,
  },
  skeletonIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  skeletonTextContainer: {
    flex: 1,
    gap: 8,
  },
  skeletonTextLarge: {
    height: 20,
    borderRadius: 4,
  },
  skeletonTextMedium: {
    height: 16,
    borderRadius: 4,
  },
  skeletonTextSmall: {
    height: 12,
    borderRadius: 4,
  },
  skeletonStopCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  skeletonStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  skeletonStopInfo: {
    flex: 1,
    gap: 6,
  },
});