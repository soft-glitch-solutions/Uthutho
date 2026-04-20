import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler
} from 'react-native';
import { useRouter } from 'expo-router';
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
  Star,
  Users,
  LocateFixed
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { 
  searchAddresses, 
  reverseGeocode, 
  type AddressSuggestion 
} from '@/services/addressAutocomplete';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const SearchOverlay = ({ visible, onClose, initialY = 160 }: SearchOverlayProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [user, setUser] = useState<any>(null);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});
  const [suggestedRoutes, setSuggestedRoutes] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  
  const anims = useRef({
    opacity: new Animated.Value(0),
    searchBarY: new Animated.Value(initialY),
    contentY: new Animated.Value(100),
    shortcutsY: new Animated.Value(150),
    recentsY: new Animated.Value(200),
    suggestedY: new Animated.Value(250),
  }).current;

  useEffect(() => {
    if (visible) {
      // Start expansion animation
      anims.searchBarY.setValue(initialY);
      anims.contentY.setValue(100);
      anims.opacity.setValue(0);
      
      // Focus instantly for maximum responsiveness
      inputRef.current?.focus();

      Animated.parallel([
        Animated.timing(anims.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(anims.searchBarY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.spring(anims.contentY, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        
        Animated.stagger(60, [
          Animated.spring(anims.shortcutsY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
          Animated.spring(anims.recentsY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
          Animated.spring(anims.suggestedY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
        ])
      ]).start(() => {
        inputRef.current?.focus();
      });

      // Handle Android back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(anims.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(anims.searchBarY, { toValue: initialY, duration: 200, useNativeDriver: true }),
      Animated.timing(anims.contentY, { toValue: 50, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setSearchQuery('');
      setSearchResults([]);
      onClose();
    });
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    })();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const performSearch = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const results: SearchResult[] = [];

    try {
      // 1. Search routes, stops, and addresses in parallel
      const [routesData, stopsData, addresses] = await Promise.all([
        supabase
          .from('routes')
          .select('*')
          .or(`name.ilike.%${trimmed}%,start_point.ilike.%${trimmed}%,end_point.ilike.%${trimmed}%`)
          .limit(5),
        supabase
          .from('stops')
          .select('*')
          .ilike('name', `%${trimmed}%`)
          .limit(5),
        searchAddresses(trimmed, { limit: 5 })
      ]);

      // Process Routes
      if (routesData.data) {
        routesData.data.forEach(route => results.push({ 
          id: route.id, 
          name: route.name, 
          type: 'route', 
          data: route,
          contextTitle: `${route.start_point} to ${route.end_point}`
        }));
      }

      // Process Stops
      if (stopsData.data) {
        stopsData.data.forEach(stop => {
          let distance;
          if (userLocation) distance = calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude);
          results.push({ 
            id: stop.id, 
            name: stop.name, 
            type: 'stop', 
            data: stop, 
            distance,
            coords: { latitude: stop.latitude, longitude: stop.longitude }
          });
        });
      }

      // Process Addresses from Nominatim
      addresses.forEach(addr => {
        results.push({
          id: `addr-${addr.id}`,
          name: addr.label,
          type: 'address',
          data: addr,
          coords: { latitude: addr.latitude, longitude: addr.longitude },
          contextTitle: addr.address
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedRoutes = async () => {
    if (!userLocation) return;
    
    setLoadingSuggestions(true);
    try {
      // 1. Find nearest stops
      const { data: stops } = await supabase
        .from('stops')
        .select('*, routes(*)')
        .limit(50); // Get a reasonable set of stops to filter locally

      if (!stops || stops.length === 0) return;

      // 2. Sort by distance and take the 5 nearest
      const nearestStops = stops
        .map(stop => ({
          ...stop,
          distance: calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // 3. Extract unique routes from these stops
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

      setSuggestedRoutes(Array.from(uniqueRoutes.values()).slice(0, 3));
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

  const handleUseMyLocation = async () => {
    setLocatingUser(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const result = await reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      if (result) {
        handleResultPress({
          id: `curr-${result.id}`,
          name: 'Current Location',
          type: 'address',
          data: result,
          coords: { latitude: result.latitude, longitude: result.longitude }
        });
      }
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocatingUser(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultPress = (result: SearchResult) => {
    handleClose();
    if (result.type === 'stop') {
      router.push(`/stop-details?stopId=${result.id}`);
    } else if (result.type === 'hub') {
      router.push(`/hub/${result.id}`);
    } else if (result.type === 'route') {
      router.push(`/route-details?routeId=${result.id}`);
    } else if (result.type === 'address' && result.coords) {
      router.push({
        pathname: '/Map',
        params: {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          label: result.name
        }
      });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'stop': return <MapPin size={20} color="#1ea2b1" />;
      case 'route': return <Bus size={20} color="#1ea2b1" />;
      case 'hub': return <Navigation size={20} color="#1ea2b1" />;
      case 'address': return <MapPin size={20} color="#f59e0b" />;
      default: return <Search size={20} color="#888888" />;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: anims.opacity }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
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

              {/* Search Input */}
              <View style={styles.searchBarWrapper}>
                <Search size={22} color="#888888" style={styles.searchBarIcon} />
                <TextInput
                  ref={inputRef}
                  style={styles.premiumSearchInput}
                  placeholder="Search destinations, stations"
                  placeholderTextColor="#888888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </Animated.View>

          {searchQuery.length > 0 ? (
            <Animated.View style={[styles.searchResultsWrapper, { transform: [{ translateY: anims.contentY }] }]}>
              {loading ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator color="#1ea2b1" />
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <TouchableOpacity 
                    key={result.id} 
                    style={styles.resultCard}
                    onPress={() => handleResultPress(result)}
                  >
                    <View style={styles.resultIconBox}>
                      {getIconForType(result.type)}
                    </View>
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{result.name}</Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {result.contextTitle || (result.type.toUpperCase() + (result.distance ? ` • ${result.distance.toFixed(1)}km` : ''))}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#444444" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Search size={48} color="#333333" />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <View style={styles.discoveryContent}>
              {/* Shortcuts */}
              <Animated.View style={{ transform: [{ translateY: anims.shortcutsY }] }}>
                <View style={styles.shortcutsGrid}>
                  <TouchableOpacity 
                    style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                    onPress={handleUseMyLocation}
                    disabled={locatingUser}
                  >
                    <View style={[styles.shortcutIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      {locatingUser ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <LocateFixed size={22} color={colors.primary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.shortcutTitle}>NEARBY</Text>
                      <Text style={[styles.shortcutSubtitle, { color: colors.text }]}>Current Location</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.shortcutCard, { backgroundColor: colors.card }]}>
                    <View style={styles.shortcutIconBox}><Home size={22} color={colors.primary} /></View>
                    <View>
                      <Text style={styles.shortcutTitle}>HOME</Text>
                      <Text style={[styles.shortcutSubtitle, { color: colors.text }]}>Set address</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Recents */}
              <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.recentsY }] }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Destinations</Text>
                  <TouchableOpacity><Text style={styles.clearAllText}>Clear all</Text></TouchableOpacity>
                </View>
                {[
                  { id: 'rec1', title: 'Cape Town Airport', sub: 'Matroosfontein' },
                  { id: 'rec2', title: 'V&A Waterfront', sub: 'Breakwater Blvd' }
                ].map((item) => (
                  <TouchableOpacity key={item.id} style={styles.recentItem}>
                    <View style={styles.recentIconBox}><History size={18} color="#888888" /></View>
                    <View style={styles.recentTextContainer}>
                      <Text style={styles.recentTitle}>{item.title}</Text>
                      <Text style={styles.recentSubtitle}>{item.sub}</Text>
                    </View>
                    <ChevronRight size={18} color="#444444" />
                  </TouchableOpacity>
                ))}
              </Animated.View>

              {/* Suggested */}
              <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.suggestedY }] }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested for You</Text>
                
                {loadingSuggestions ? (
                  <View style={styles.suggestionLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Finding nearby routes...</Text>
                  </View>
                ) : suggestedRoutes.length > 0 ? (
                  suggestedRoutes.map((route) => (
                    <TouchableOpacity 
                      key={route.id} 
                      style={[styles.suggestedCard, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/route-details?routeId=${route.id}`)}
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
                        Nearest stop: {route.nearestStopName} ({route.distanceToStop.toFixed(1)}km)
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
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D1E',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
  },
  searchBarIcon: {
    marginRight: 12,
  },
  premiumSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  discoveryContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  shortcutCard: {
    backgroundColor: '#1A1D1E',
    borderRadius: 20,
    padding: 20,
    width: '48%',
  },
  shortcutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  shortcutSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
  },
  clearAllText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
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
  searchResultsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D1E',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    color: '#888888',
    fontSize: 12,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  suggestionLoading: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888888',
    fontSize: 14,
  }
});

export default SearchOverlay;
