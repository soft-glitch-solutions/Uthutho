// app/search-results.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Bus,
  Navigation,
  Clock,
  ChevronRight,
  Star,
  Users,
  Zap,
  DollarSign,
  Train,
  Car,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image_url: string;
  cost: number;
  order_number: number;
}

interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  transport_type: string;
  cost: number;
  instructions?: string;
  hub_id?: string;
  organisation_id?: string;
  image_url?: string;
}

interface NearbyStop {
  stop: Stop;
  distance: number;
  routes: Route[];
}

interface PlaceImage {
  url: string;
  attribution?: string;
}

// Skeleton Loader Component with web support
const SkeletonLoader = () => {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const SkeletonItem = ({ style }: { style: any }) => (
    <Animated.View style={[style, { opacity, backgroundColor: '#222' }]} />
  );

  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.header, styles.skeletonHeader]}>
        <View style={{ width: 40 }} />
        <SkeletonItem style={styles.skeletonHeaderTitle} />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.skeletonAddressCard}>
        <SkeletonItem style={styles.skeletonAddressIcon} />
        <View style={styles.skeletonAddressInfo}>
          <SkeletonItem style={styles.skeletonAddressLabel} />
          <SkeletonItem style={styles.skeletonAddressText} />
          <SkeletonItem style={styles.skeletonAddressCoords} />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <SkeletonItem style={styles.skeletonSummary} />
      </View>

      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.skeletonStopCard}>
          <View style={styles.skeletonStopHeader}>
            <SkeletonItem style={styles.skeletonStopIcon} />
            <View style={styles.skeletonStopInfo}>
              <SkeletonItem style={styles.skeletonStopName} />
              <SkeletonItem style={styles.skeletonDistance} />
            </View>
          </View>
          <View style={styles.skeletonRoutesContainer}>
            <SkeletonItem style={styles.skeletonRoutesLabel} />
            <View style={styles.skeletonRoutesList}>
              <SkeletonItem style={styles.skeletonRouteBadge} />
              <SkeletonItem style={styles.skeletonRouteBadge} />
            </View>
          </View>
        </View>
      ))}
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
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [addressImage, setAddressImage] = useState<PlaceImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse coordinates with validation
  const addressLat = parseFloat(params.latitude as string);
  const addressLng = parseFloat(params.longitude as string);

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

  // Function to get place image from Google Places API
  const getPlaceImage = async (lat: number, lng: number, placeName: string): Promise<PlaceImage | null> => {
    const apiKey = Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY
      : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn('Google Places API key missing');
      return null;
    }

    try {
      // First, search for the place by name and location
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&location=${lat},${lng}&radius=500&key=${apiKey}`;

      let response;
      if (Platform.OS === 'web') {
        // For web, use the proxy or direct fetch (might need proxy)
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`;
        response = await fetch(proxyUrl);
      } else {
        response = await fetch(searchUrl);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const place = data.results[0];
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference;
          const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photo_reference=${photoReference}&key=${apiKey}`;

          return {
            url: imageUrl,
            attribution: place.photos[0].html_attributions?.[0]
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching place image:', error);
      return null;
    }
  };

  const findNearbyStopsWithRoutes = async (latitude: number, longitude: number, radiusKm: number = 10) => {
    try {
      // Get all stops
      const { data: allStops, error: stopsError } = await supabase
        .from('stops')
        .select('*');

      if (stopsError) throw stopsError;

      if (!allStops || allStops.length === 0) return [];

      // Calculate distances and sort to get top 5 nearest stops
      const stopsWithDistance = allStops.map(stop => ({
        ...stop,
        distance: calculateDistance(latitude, longitude, stop.latitude, stop.longitude)
      })).filter(stop => stop.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // For each nearby stop, fetch its routes via route_stops
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
                cost,
                instructions,
                hub_id,
                organisation_id,
                image_url
              )
            `)
            .eq('stop_id', stop.id)
            .order('order_number');

          if (routeStopError) {
            console.error(`Error fetching routes for stop ${stop.id}:`, routeStopError);
            return { stop, distance: stop.distance, routes: [] };
          }

          const routes = routeStops
            .filter(rs => rs.routes)
            .map(rs => ({
              ...rs.routes,
              order_number: rs.order_number
            }));

          return { stop, distance: stop.distance, routes };
        })
      );

      return nearbyStopsWithRoutes;
    } catch (error) {
      console.error('Error finding nearby stops with routes:', error);
      throw error;
    }
  };

  // Function to get address name from coordinates (for web fallback)
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const apiKey = Platform.OS === 'web'
        ? process.env.EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY
        : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

      if (apiKey) {
        // Use Google Geocoding API for better results
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

        let response;
        if (Platform.OS === 'web') {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(geocodeUrl)}`;
          response = await fetch(proxyUrl);
        } else {
          response = await fetch(geocodeUrl);
        }

        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results[0]) {
          return data.results[0].formatted_address;
        }
      }

      // Fallback to Nominatim
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
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  useEffect(() => {
    const loadSearchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // Handle address name - decode if it was encoded
        let address = params.address as string || 'Selected Location';
        let fullAddress = params.fullAddress as string || address;

        try {
          address = decodeURIComponent(address);
          fullAddress = decodeURIComponent(fullAddress);
        } catch (e) {
          // If decoding fails, use as is
        }

        setAddressName(address);

        // If coordinates are valid, try to get a better address name and image
        if (!isNaN(addressLat) && !isNaN(addressLng) && addressLat && addressLng) {
          if (address === 'Selected Location' || address === fullAddress) {
            const detailedAddress = await getAddressFromCoords(addressLat, addressLng);
            setAddressName(detailedAddress);
          }

          // Fetch place image
          const image = await getPlaceImage(addressLat, addressLng, address);
          if (image) {
            setAddressImage(image);
          }
        }

        setAddressDetails({
          label: address,
          latitude: addressLat,
          longitude: addressLng
        });

        const nearby = await findNearbyStopsWithRoutes(addressLat, addressLng);
        setNearbyStops(nearby);
      } catch (error) {
        console.error('Error loading search results:', error);
        setError('Failed to load nearby stops. Please check your connection and try again.');
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'Failed to load nearby stops');
        }
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    if (!isNaN(addressLat) && !isNaN(addressLng) && addressLat && addressLng) {
      loadSearchResults();
    } else {
      setLoading(false);
      setAddressName('Invalid Location');
      setError('The selected location coordinates are invalid. Please try searching again.');
    }
  }, [addressLat, addressLng, params.address, params.fullAddress]);

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
        return <Bus size={14} color="#1ea2b1" />;
      case 'train':
        return <Train size={14} color="#1ea2b1" />;
      case 'taxi':
      case 'car':
        return <Car size={14} color="#1ea2b1" />;
      default:
        return <Bus size={14} color="#1ea2b1" />;
    }
  };

  const handleStopPress = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  const handleRoutePress = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  const handleRetry = () => {
    if (!isNaN(addressLat) && !isNaN(addressLng) && addressLat && addressLng) {
      setLoading(true);
      setError(null);
      findNearbyStopsWithRoutes(addressLat, addressLng)
        .then(setNearbyStops)
        .catch((err) => {
          console.error('Retry error:', err);
          setError('Failed to load nearby stops. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Stops</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Address Header with Image */}
        <View style={styles.addressHeader}>
          {addressImage ? (
            <Image
              source={{ uri: addressImage.url }}
              style={styles.addressImage}
              onError={() => setAddressImage(null)}
            />
          ) : (
            <View style={styles.addressIconContainer}>
              <MapPin size={24} color="#1ea2b1" />
            </View>
          )}
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Selected Location</Text>
            <Text style={styles.addressText}>{addressName}</Text>
            {addressDetails?.latitude && addressDetails?.longitude && (
              <Text style={styles.addressCoordinates}>
                {addressDetails.latitude.toFixed(6)}, {addressDetails.longitude.toFixed(6)}
              </Text>
            )}
            {addressImage?.attribution && (
              <Text style={styles.imageAttribution} numberOfLines={1}>
                {addressImage.attribution.replace(/<[^>]*>/g, '')}
              </Text>
            )}
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#ff4444" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Summary */}
        {!error && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Found {nearbyStops.length} stop{nearbyStops.length !== 1 ? 's' : ''} nearby
            </Text>
            {nearbyStops.length > 0 && (
              <Text style={styles.summarySubtext}>
                Showing the 5 closest stops to your location
              </Text>
            )}
          </View>
        )}

        {/* Nearby Stops List */}
        {!error && nearbyStops.length > 0 ? (
          nearbyStops.map((item, index) => (
            <TouchableOpacity
              key={item.stop.id}
              style={[styles.stopCard, { backgroundColor: '#111' }]}
              onPress={() => handleStopPress(item.stop.id)}
              activeOpacity={0.7}
            >
              <View style={styles.stopHeader}>
                <View style={styles.stopIconContainer}>
                  <MapPin size={20} color="#1ea2b1" />
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{item.stop.name}</Text>
                  <View style={styles.distanceContainer}>
                    <Navigation size={12} color="#1ea2b1" />
                    <Text style={styles.distanceText}>{getDistanceDisplay(item.distance)}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#444" />
              </View>

              {/* Routes served by this stop */}
              {item.routes.length > 0 ? (
                <View style={styles.routesContainer}>
                  <Text style={styles.routesLabel}>Routes served:</Text>
                  <View style={styles.routesList}>
                    {item.routes.slice(0, 3).map((route) => (
                      <TouchableOpacity
                        key={route.id}
                        style={styles.routeBadge}
                        onPress={() => handleRoutePress(route.id)}
                        activeOpacity={0.7}
                      >
                        {getTransportIcon(route.transport_type)}
                        <Text style={styles.routeName} numberOfLines={1}>
                          {route.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {item.routes.length > 3 && (
                      <Text style={styles.moreRoutes}>+{item.routes.length - 3} more</Text>
                    )}
                  </View>

                  {/* Show route details for the first route */}
                  {item.routes[0] && (
                    <View style={styles.routeDetails}>
                      <View style={styles.routeDetailItem}>
                        <Bus size={12} color="#666" />
                        <Text style={styles.routeDetailText}>
                          {item.routes[0].start_point} → {item.routes[0].end_point}
                        </Text>
                      </View>
                      {item.routes[0].cost > 0 && (
                        <View style={styles.routeDetailItem}>
                          <DollarSign size={12} color="#666" />
                          <Text style={styles.routeDetailText}>
                            {formatCurrency(item.routes[0].cost)}
                          </Text>
                        </View>
                      )}
                      {item.routes[0].transport_type && (
                        <View style={styles.routeDetailItem}>
                          {getTransportIcon(item.routes[0].transport_type)}
                          <Text style={styles.routeDetailText}>
                            {item.routes[0].transport_type.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noRoutesContainer}>
                  <AlertCircle size={16} color="#666" />
                  <Text style={styles.noRoutesText}>
                    No routes are currently linked to this stop
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : !error && (
          <View style={styles.emptyContainer}>
            <MapPin size={64} color="#333" />
            <Text style={styles.emptyTitle}>No stops found nearby</Text>
            <Text style={styles.emptyText}>
              Try searching for a different location or check back later
            </Text>
          </View>
        )}

        {/* Help Section */}
        {!error && (
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need help finding a stop?</Text>
            <Text style={styles.helpText}>
              You can also search for specific route names or browse the map to find stops near you.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  addressImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#222',
  },
  addressIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressCoordinates: {
    color: '#666',
    fontSize: 12,
  },
  imageAttribution: {
    color: '#555',
    fontSize: 9,
    marginTop: 4,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  summarySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  stopCard: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    color: '#1ea2b1',
    fontSize: 12,
  },
  routesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  routesLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  routeName: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 150,
  },
  moreRoutes: {
    color: '#666',
    fontSize: 12,
    alignSelf: 'center',
  },
  routeDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 6,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDetailText: {
    color: '#888',
    fontSize: 11,
    flex: 1,
  },
  noRoutesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 8,
  },
  noRoutesText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: '#111',
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  helpTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    marginTop: 20,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  skeletonHeader: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  skeletonHeaderTitle: {
    width: 120,
    height: 22,
    borderRadius: 4,
  },
  skeletonAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  skeletonAddressIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  skeletonAddressInfo: {
    flex: 1,
    gap: 8,
  },
  skeletonAddressLabel: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  skeletonAddressText: {
    width: 200,
    height: 18,
    borderRadius: 4,
  },
  skeletonAddressCoords: {
    width: 150,
    height: 12,
    borderRadius: 4,
  },
  skeletonSummary: {
    width: 150,
    height: 16,
    borderRadius: 4,
  },
  skeletonStopCard: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  skeletonStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonStopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonStopInfo: {
    flex: 1,
    gap: 6,
  },
  skeletonStopName: {
    width: 150,
    height: 18,
    borderRadius: 4,
  },
  skeletonDistance: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  skeletonRoutesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 8,
  },
  skeletonRoutesLabel: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
  skeletonRoutesList: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonRouteBadge: {
    width: 80,
    height: 28,
    borderRadius: 8,
  },
});