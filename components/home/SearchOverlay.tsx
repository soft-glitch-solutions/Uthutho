import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Modal,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import {
  Search,
  ArrowLeft,
  Home,
  Briefcase,
  History,
  Settings,
  ChevronRight,
  Bus,
  Zap,
  MapPin,
  Navigation,
  LocateFixed,
  AlertCircle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { reverseGeocode, type AddressSuggestion } from '@/services/addressAutocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// South Africa only - restrict to ZA
const SOUTH_AFRICA_REGION_CODE = 'za';
const SOUTH_AFRICA_BIAS = {
  circle: {
    center: {
      latitude: -28.4795,
      longitude: 24.6726,
    },
    radius: 50000,
  },
};

// Use environment variable with fallback
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('Google API Key loaded:', GOOGLE_PLACES_API_KEY ? 'Yes (length: ' + GOOGLE_PLACES_API_KEY.length + ')' : 'No');

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  initialY?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub' | 'nearby_spot' | 'address';
  data: any;
  distance?: number;
  coords?: { latitude: number; longitude: number };
  contextTitle?: string;
}

interface SavedAddress {
  id: string;
  type: 'home' | 'work';
  address: string;
  latitude: number;
  longitude: number;
  label?: string;
}

const SearchOverlay = ({ visible, onClose, initialY = 160 }: SearchOverlayProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [user, setUser] = useState<any>(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [homeAddress, setHomeAddress] = useState<SavedAddress | null>(null);
  const [workAddress, setWorkAddress] = useState<SavedAddress | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const placesRef = useRef<any>(null);

  const anims = useRef({
    opacity: new Animated.Value(0),
    searchBarY: new Animated.Value(initialY),
    contentY: new Animated.Value(100),
    shortcutsY: new Animated.Value(150),
    recentsY: new Animated.Value(200),
    suggestedY: new Animated.Value(250),
  }).current;

  // Get current user and load profile data
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('home, work')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Parse home address if it exists
      if (profile?.home && typeof profile.home === 'string') {
        try {
          const homeData = JSON.parse(profile.home);
          setHomeAddress({
            id: 'home',
            type: 'home',
            address: homeData.address || homeData.label,
            latitude: homeData.latitude,
            longitude: homeData.longitude,
            label: homeData.label
          });
        } catch (e) {
          console.error('Error parsing home address:', e);
        }
      }

      // Parse work address if it exists
      if (profile?.work && typeof profile.work === 'string') {
        try {
          const workData = JSON.parse(profile.work);
          setWorkAddress({
            id: 'work',
            type: 'work',
            address: workData.address || workData.label,
            latitude: workData.latitude,
            longitude: workData.longitude,
            label: workData.label
          });
        } catch (e) {
          console.error('Error parsing work address:', e);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user]);

  // Get user's current location
  const getUserLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setIsGettingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error('Error getting user location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // Load recent searches
  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem('recent_searches');
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(async (result: SearchResult) => {
    try {
      const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, [recentSearches]);

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

  // Navigate directly to search results with coordinates
  const navigateToSearchResults = (latitude: number, longitude: number, name: string, fullAddress: string) => {
    console.log('Navigating to search results with:', { latitude, longitude, name, fullAddress });

    handleClose();

    setTimeout(() => {
      router.push({
        pathname: '/search-results',
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          address: name,
          fullAddress: fullAddress,
        },
      });
    }, 300);
  };

  // Handle place selection from Google Places
  const handlePlaceSelected = async (place: any) => {
    console.log('Selected place:', place);

    let placeId = null;

    if (place.placeId) {
      placeId = place.placeId;
    } else if (place.place) {
      if (typeof place.place === 'string') {
        const match = place.place.match(/places\/(.+)/);
        if (match && match[1]) {
          placeId = match[1];
        }
      } else if (place.place.placeId) {
        placeId = place.place.placeId;
      }
    } else if (place.id) {
      placeId = place.id;
    }

    if (!placeId) {
      let addressText = '';
      if (place.text?.text) {
        addressText = place.text.text;
      } else if (place.structuredFormat?.mainText?.text && place.structuredFormat?.secondaryText?.text) {
        addressText = `${place.structuredFormat.mainText.text}, ${place.structuredFormat.secondaryText.text}`;
      } else if (place.description) {
        addressText = place.description;
      }

      if (addressText) {
        await geocodeAddressText(addressText);
      } else {
        setSuccessMessage('Could not get location information');
        setShowSuccessModal(true);
      }
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;

        let shortName = formattedAddress.split(',')[0];
        if (data.results[0].address_components) {
          const streetNumber = data.results[0].address_components.find((comp: any) =>
            comp.types.includes('street_number')
          );
          const route = data.results[0].address_components.find((comp: any) =>
            comp.types.includes('route')
          );
          if (streetNumber && route) {
            shortName = `${streetNumber.long_name} ${route.long_name}`;
          } else if (route) {
            shortName = route.long_name;
          }
        }

        const searchResult: SearchResult = {
          id: `addr-${placeId}`,
          name: shortName,
          type: 'address',
          data: { latitude: location.lat, longitude: location.lng, address: formattedAddress },
          coords: { latitude: location.lat, longitude: location.lng },
          contextTitle: formattedAddress
        };

        await saveRecentSearch(searchResult);
        navigateToSearchResults(location.lat, location.lng, shortName, formattedAddress);
      } else {
        setSuccessMessage('Could not get coordinates for this location');
        setShowSuccessModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuccessMessage('Failed to get location coordinates');
      setShowSuccessModal(true);
      setLoading(false);
    }
  };

  // Fallback geocoding using address text
  const geocodeAddressText = async (address: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}&region=za`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        const placeId = data.results[0].place_id;

        let shortName = formattedAddress.split(',')[0];

        const searchResult: SearchResult = {
          id: `addr-${placeId}`,
          name: shortName,
          type: 'address',
          data: { latitude: location.lat, longitude: location.lng, address: formattedAddress },
          coords: { latitude: location.lat, longitude: location.lng },
          contextTitle: formattedAddress
        };

        await saveRecentSearch(searchResult);
        navigateToSearchResults(location.lat, location.lng, shortName, formattedAddress);
      } else {
        setSuccessMessage('Could not find location. Please try a different address.');
        setShowSuccessModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuccessMessage('Failed to get location coordinates');
      setShowSuccessModal(true);
      setLoading(false);
    }
  };

  // Handle recent search press
  const handleRecentSearchPress = (result: SearchResult) => {
    if (result.coords) {
      navigateToSearchResults(
        result.coords.latitude,
        result.coords.longitude,
        result.name,
        result.contextTitle || result.name
      );
    }
  };

  // Handle saved address press (Home or Work)
  const handleSavedAddressPress = (address: SavedAddress) => {
    navigateToSearchResults(
      address.latitude,
      address.longitude,
      address.type === 'home' ? 'Home' : 'Work',
      address.address
    );
  };

  // Handle use my location
  const handleUseMyLocation = async () => {
    setLocatingUser(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSuccessMessage('Please enable location permissions to use this feature');
        setShowSuccessModal(true);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const result = await reverseGeocode(location.coords.latitude, location.coords.longitude);

      navigateToSearchResults(
        location.coords.latitude,
        location.coords.longitude,
        result?.label || 'Current Location',
        result?.label || 'Current Location'
      );
    } catch (e) {
      console.error('Location error:', e);
      setSuccessMessage('Could not get your location');
      setShowSuccessModal(true);
    } finally {
      setLocatingUser(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(anims.opacity, { toValue: 0, duration: 200 }),
      Animated.timing(anims.searchBarY, { toValue: initialY, duration: 200 }),
    ]).start(() => {
      setSearchQuery('');
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      getUserLocation();
      Animated.parallel([
        Animated.timing(anims.opacity, { toValue: 1, duration: 250 }),
        Animated.spring(anims.searchBarY, { toValue: 0, tension: 50, friction: 9 }),
        Animated.spring(anims.contentY, { toValue: 0, tension: 40, friction: 8 }),
        Animated.stagger(60, [
          Animated.spring(anims.shortcutsY, { toValue: 0, tension: 35, friction: 8 }),
          Animated.spring(anims.recentsY, { toValue: 0, tension: 35, friction: 8 }),
          Animated.spring(anims.suggestedY, { toValue: 0, tension: 35, friction: 8 }),
        ])
      ]).start();

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });

      loadRecentSearches();
      loadUserProfile();

      return () => backHandler.remove();
    }
  }, [visible, user]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    })();
  }, []);

  const fetchSuggestedRoutes = async () => {
    if (!userLocation) return;
    setLoadingSuggestions(true);
    try {
      const { data: stops } = await supabase
        .from('stops')
        .select('*, routes(*)')
        .limit(50);
      if (!stops || stops.length === 0) return;
      const nearestStops = stops
        .map(stop => ({
          ...stop,
          distance: calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      const uniqueRoutes = new Map();
      nearestStops.forEach(stop => {
        if (stop.routes && !uniqueRoutes.has(stop.routes.id)) {
          uniqueRoutes.set(stop.routes.id, {
            ...stop.routes,
            distanceToStop: stop.distance,
            nearestStopName: stop.name
          });
        }
      });
      const routeArray = Array.from(uniqueRoutes.values());
      setSuggestedRoutes(routeArray.slice(0, 3));
    } catch (error) {
      console.error('Error fetching suggested routes:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (visible && userLocation) {
      fetchSuggestedRoutes();
    }
  }, [visible, userLocation]);

  // Success Modal Component
  const SuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.successModalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.successIcon, { backgroundColor: `${colors.primary}15` }]}>
            <AlertCircle size={48} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Notice</Text>
          <Text style={[styles.successMessage, { color: colors.text, opacity: 0.7 }]}>
            {successMessage}
          </Text>
          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.successButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!visible) return null;

  // Rest of your JSX remains the same...
  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: anims.opacity }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ transform: [{ translateY: anims.searchBarY }] }}>
              <View style={styles.customHeader}>
                <View style={styles.headerRow}>
                  <TouchableOpacity onPress={handleClose} style={styles.backIconButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.largeTitle}>Where to?</Text>
                  <TouchableOpacity style={styles.settingsButton}>
                    <Settings size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchWrapper}>
                  <GooglePlacesTextInput
                    ref={placesRef}
                    apiKey={GOOGLE_PLACES_API_KEY}
                    placeholder={isGettingLocation ? "Detecting your location..." : "Search in South Africa..."}
                    onPlaceSelect={handlePlaceSelected}
                    fetchDetails={false}
                    showLoadingIndicator={true}
                    showClearButton={true}
                    debounceDelay={300}
                    minCharsToFetch={2}
                    languageCode="en"
                    includedRegionCodes={[SOUTH_AFRICA_REGION_CODE]}
                    locationBias={SOUTH_AFRICA_BIAS}
                    types={['geocode', 'establishment']}
                    enableDebug={__DEV__}
                    style={{
                      container: { zIndex: 100 },
                      inputContainer: {
                        backgroundColor: '#1A1D1E',
                        borderRadius: 16,
                        height: 54,
                        paddingHorizontal: 16,
                        borderWidth: 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                      input: {
                        color: '#FFFFFF',
                        fontSize: 16,
                        flex: 1,
                        marginLeft: 12,
                      },
                      suggestionsContainer: {
                        backgroundColor: '#1A1D1E',
                        borderRadius: 16,
                        marginTop: 8,
                        maxHeight: 300,
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                      suggestionItem: {
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: '#2A2D2E',
                      },
                      suggestionText: {
                        main: { color: '#FFFFFF', fontSize: 14 },
                        secondary: { color: '#888888', fontSize: 12, marginTop: 2 },
                      },
                      loadingIndicator: { color: '#1ea2b1' },
                      placeholder: { color: '#888888' },
                    }}
                  />
                  <View style={styles.searchIconOverlay}>
                    <Search size={20} color="#888888" />
                  </View>
                </View>

                <View style={styles.countryIndicator}>
                  <MapPin size={12} color="#1ea2b1" />
                  <Text style={styles.countryIndicatorText}>Searching in South Africa</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.discoveryContent}>
              {/* 3-Column Shortcuts */}
              <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.shortcutsY }] }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.threeColumnGrid}>
                  <TouchableOpacity
                    style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                    onPress={() => homeAddress && handleSavedAddressPress(homeAddress)}
                  >
                    <View style={[styles.shortcutIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      <Home size={24} color={homeAddress ? colors.primary : '#888888'} />
                    </View>
                    <Text style={[styles.shortcutTitle, { color: homeAddress ? colors.text : '#888888' }]}>Home</Text>
                    {homeAddress ? (
                      <Text style={styles.shortcutAddress} numberOfLines={1}>
                        {homeAddress.address.split(',')[0]}
                      </Text>
                    ) : (
                      <Text style={styles.shortcutEmpty}>Not set</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                    onPress={() => workAddress && handleSavedAddressPress(workAddress)}
                  >
                    <View style={[styles.shortcutIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      <Briefcase size={24} color={workAddress ? colors.primary : '#888888'} />
                    </View>
                    <Text style={[styles.shortcutTitle, { color: workAddress ? colors.text : '#888888' }]}>Work</Text>
                    {workAddress ? (
                      <Text style={styles.shortcutAddress} numberOfLines={1}>
                        {workAddress.address.split(',')[0]}
                      </Text>
                    ) : (
                      <Text style={styles.shortcutEmpty}>Not set</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                    onPress={handleUseMyLocation}
                    disabled={locatingUser}
                  >
                    <View style={[styles.shortcutIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      {locatingUser ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <LocateFixed size={24} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.shortcutTitle, { color: colors.text }]}>Nearby</Text>
                    <Text style={styles.shortcutAddress} numberOfLines={1}>
                      Find stops near you
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.recentsY }] }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearAllText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.recentItem}
                      onPress={() => handleRecentSearchPress(item)}
                    >
                      <View style={styles.recentIconBox}>
                        <History size={18} color="#888888" />
                      </View>
                      <View style={styles.recentTextContainer}>
                        <Text style={styles.recentTitle}>{item.name}</Text>
                        <Text style={styles.recentSubtitle}>{item.contextTitle || item.type.toUpperCase()}</Text>
                      </View>
                      <ChevronRight size={18} color="#444444" />
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              {/* Suggested Routes */}
              <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.suggestedY }] }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested for You</Text>
                {loadingSuggestions ? (
                  <View style={styles.suggestionLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Finding nearby routes...</Text>
                  </View>
                ) : suggestedRoutes.length > 0 ? (
                  suggestedRoutes.map((route, index) => (
                    <TouchableOpacity
                      key={route.id}
                      style={[
                        styles.suggestedCard,
                        { backgroundColor: colors.card },
                        index < suggestedRoutes.length - 1 && styles.suggestedCardWithMargin
                      ]}
                      onPress={() => {
                        handleClose();
                        setTimeout(() => {
                          router.push(`/route-details?routeId=${route.id}`);
                        }, 300);
                      }}
                    >
                      <View style={styles.suggestedHeader}>
                        <View style={[styles.fastestBadge, { backgroundColor: `${colors.primary}15` }]}>
                          <Zap size={10} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.fastestText, { color: colors.primary }]}>NEARBY</Text>
                        </View>
                        <Bus size={22} color={colors.text} />
                      </View>
                      <Text style={[styles.suggestedTitle, { color: colors.text }]}>{route.name}</Text>
                      <Text style={styles.suggestedSubtitle}>
                        Nearest stop: {route.nearestStopName} ({route.distanceToStop.toFixed(1)}km away)
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={[styles.suggestedCard, { backgroundColor: colors.card }]}>
                    <Text style={styles.suggestedSubtitle}>No routes found nearby. Try searching for a destination.</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>

      <SuccessModal />
    </>
  );
};

const styles = StyleSheet.create({
  // ... (keep all your existing styles)
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  customHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  searchIconOverlay: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 101,
  },
  countryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    gap: 6,
  },
  countryIndicatorText: {
    color: '#1ea2b1',
    fontSize: 12,
  },
  discoveryContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionWrapper: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  clearAllText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  threeColumnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#1A1D1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  shortcutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  shortcutAddress: {
    color: '#888888',
    fontSize: 11,
    textAlign: 'center',
  },
  shortcutEmpty: {
    color: '#555555',
    fontSize: 11,
    fontStyle: 'italic',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1D1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  recentSubtitle: {
    color: '#888888',
    fontSize: 14,
  },
  suggestedCard: {
    backgroundColor: '#1A1D1E',
    borderRadius: 24,
    padding: 24,
  },
  suggestedCardWithMargin: {
    marginBottom: 16,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fastestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fastestText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  suggestedTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestedSubtitle: {
    color: '#888888',
    fontSize: 15,
  },
  loadingText: {
    color: '#888888',
    fontSize: 14,
  },
  suggestionLoading: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchOverlay;