// app/(tabs)/planner.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import {
  MapPin,
  ArrowUpDown,
  Clock,
  Route,
  ChevronRight,
  Bus,
  Footprints,
  CheckCircle2,
  X,
  Search,
  Navigation,
  LocateFixed,
  Train,
  Building2,
  AlertCircle,
  Map as MapIcon,
  Compass,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  searchAddresses,
  reverseGeocode,
  type AddressSuggestion,
} from '@/services/addressAutocomplete';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  image_url?: string;
  cost?: number;
}

interface RouteData {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  transport_type: string;
  cost: number;
}

interface TripLeg {
  mode: 'walk' | 'bus' | 'train' | 'taxi';
  description: string;
  duration: number;
  distance: string;
  route?: RouteData;
  fromStop?: Stop;
  toStop?: Stop;
  instructions?: string;
  mapUrl?: string;
}

interface TripPlan {
  totalDuration: number;
  totalDistance: string;
  legs: TripLeg[];
  fare: string;
  departTime: string;
  arriveTime: string;
  hasRoute: boolean;
  nearestFromStop?: Stop | null;
  nearestToStop?: Stop | null;
  walkingInstructions?: string;
}

interface RecentSearch {
  id: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  timestamp: number;
}

// Calculate distance between two coordinates (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Calculate walking time (assume 5 km/h = 83.33 m/min)
const calculateWalkingTime = (distanceKm: number): number => {
  return Math.round(distanceKm / 5 * 60);
};

// Format distance for display
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

// Generate Google Maps walking URL
const getWalkingDirectionsUrl = (fromLat: number, fromLng: number, toLat: number, toLng: number): string => {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}/data=!4m2!4m1!3e2`;
};

// Find the single best (closest) stop to a location
const findClosestStop = async (lat: number, lng: number, radiusKm: number = 10): Promise<Stop | null> => {
  const { data: allStops, error } = await supabase
    .from('stops')
    .select('*');

  if (error || !allStops) return null;

  let closestStop: Stop | null = null;
  let minDistance = radiusKm;

  for (const stop of allStops) {
    const distance = calculateDistance(lat, lng, stop.latitude, stop.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closestStop = { ...stop, distance: distance };
    }
  }

  return closestStop;
};

// Find a route that connects two stops
const findRouteBetweenStops = async (fromStopId: string, toStopId: string): Promise<RouteData | null> => {
  const { data: routeStops, error } = await supabase
    .from('route_stops')
    .select(`
      route_id,
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
    .in('stop_id', [fromStopId, toStopId]);

  if (error || !routeStops) return null;

  const routeMap = new Map<string, { route: RouteData, fromOrder?: number, toOrder?: number }>();

  for (const rs of routeStops) {
    if (rs.routes) {
      const route = rs.routes as RouteData;
      if (!routeMap.has(route.id)) {
        routeMap.set(route.id, { route, fromOrder: undefined, toOrder: undefined });
      }
      const entry = routeMap.get(route.id)!;
      if (rs.stop_id === fromStopId) entry.fromOrder = rs.order_number;
      if (rs.stop_id === toStopId) entry.toOrder = rs.order_number;
    }
  }

  for (const [_, value] of routeMap) {
    if (value.fromOrder !== undefined && value.toOrder !== undefined && value.fromOrder < value.toOrder) {
      return value.route;
    }
  }
  return null;
};

export default function PlannerTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSelected, setFromSelected] = useState<AddressSuggestion | null>(null);
  const [toSelected, setToSelected] = useState<AddressSuggestion | null>(null);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [planning, setPlanning] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showMap, setShowMap] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = activeField === 'from' ? fromQuery : toQuery;

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recent_planner_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
        console.log('📜 Loaded recent searches:', parsed.length);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async () => {
    if (!fromSelected || !toSelected) return;

    try {
      const newSearch: RecentSearch = {
        id: `${Date.now()}`,
        from: fromSelected.label,
        to: toSelected.label,
        fromCoords: { lat: fromSelected.latitude, lng: fromSelected.longitude },
        toCoords: { lat: toSelected.latitude, lng: toSelected.longitude },
        timestamp: Date.now(),
      };

      const updated = [newSearch, ...recentSearches.filter(s => s.from !== fromSelected.label || s.to !== toSelected.label)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_planner_searches', JSON.stringify(updated));
      console.log('💾 Saved recent search');
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const loadRecentSearch = (search: RecentSearch) => {
    const fromAddr: AddressSuggestion = {
      id: `recent-${search.from}`,
      label: search.from,
      address: search.from,
      city: '',
      latitude: search.fromCoords.lat,
      longitude: search.fromCoords.lng,
      type: 'address',
    };
    const toAddr: AddressSuggestion = {
      id: `recent-${search.to}`,
      label: search.to,
      address: search.to,
      city: '',
      latitude: search.toCoords.lat,
      longitude: search.toCoords.lng,
      type: 'address',
    };

    setFromSelected(fromAddr);
    setFromQuery(search.from);
    setToSelected(toAddr);
    setToQuery(search.to);
    setActiveField(null);
    setSuggestions([]);
  };

  const clearRecentSearches = async () => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setRecentSearches([]);
            await AsyncStorage.removeItem('recent_planner_searches');
          }
        }
      ]
    );
  };

  // Debounced address search
  const fetchSuggestions = useCallback(async (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(text, { limit: 8 });
        setSuggestions(results);
      } catch (e) {
        console.error('Search error:', e);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (activeField) fetchSuggestions(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeField]);

  const handleSelect = (item: AddressSuggestion) => {
    if (activeField === 'from') {
      setFromSelected(item);
      setFromQuery(item.label);
    } else {
      setToSelected(item);
      setToQuery(item.label);
    }
    setActiveField(null);
    setSuggestions([]);
    setTripPlan(null);
    setError(null);
  };

  const handleUseMyLocation = async () => {
    setLocatingUser(true);
    try {
      let coords;
      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable location permissions');
          setLocatingUser(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        coords = location.coords;
      }
      const result = await reverseGeocode(coords.latitude, coords.longitude);
      if (result) {
        if (activeField === 'from') {
          setFromSelected(result);
          setFromQuery(result.label);
        } else {
          setToSelected(result);
          setToQuery(result.label);
        }
        setActiveField(null);
        setSuggestions([]);
        setTripPlan(null);
        setError(null);
      }
    } catch (e) {
      console.error('Location error:', e);
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLocatingUser(false);
    }
  };

  const handleSwap = () => {
    const ts = fromSelected; const tq = fromQuery;
    setFromSelected(toSelected); setFromQuery(toQuery);
    setToSelected(ts); setToQuery(tq);
    setTripPlan(null);
    setError(null);
  };

  const handleStopPress = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  const planJourney = async () => {
    if (!fromSelected || !toSelected) return;

    setPlanning(true);
    setTripPlan(null);
    setError(null);
    setShowMap(false);
    fadeAnim.setValue(0);

    try {
      const fromLat = fromSelected.latitude;
      const fromLng = fromSelected.longitude;
      const toLat = toSelected.latitude;
      const toLng = toSelected.longitude;

      const fromStop = await findClosestStop(fromLat, fromLng, 10);
      const toStop = await findClosestStop(toLat, toLng, 10);
      const route = fromStop && toStop ? await findRouteBetweenStops(fromStop.id, toStop.id) : null;

      const now = new Date();
      const departStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Save to recent searches
      await saveRecentSearch();

      if (route && fromStop && toStop) {
        const walkToStopTime = calculateWalkingTime(fromStop.distance!);
        const walkFromStopTime = calculateWalkingTime(toStop.distance!);
        const busTime = 30;
        const totalDuration = walkToStopTime + busTime + walkFromStopTime;
        const arrive = new Date(now.getTime() + totalDuration * 60 * 1000);
        const arriveStr = arrive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const totalDistance = (fromStop.distance! + toStop.distance! + 15).toFixed(1);

        const legs: TripLeg[] = [
          {
            mode: 'walk',
            description: `Walk to ${fromStop.name}`,
            duration: walkToStopTime,
            distance: formatDistance(fromStop.distance!),
            fromStop: fromStop,
            instructions: `🚶 Walk ${formatDistance(fromStop.distance!)} to ${fromStop.name}`,
            mapUrl: getWalkingDirectionsUrl(fromLat, fromLng, fromStop.latitude, fromStop.longitude),
          },
          {
            mode: route.transport_type === 'bus' ? 'bus' : 'train',
            description: `Take ${route.transport_type?.toUpperCase() || 'Bus'} ${route.name}`,
            duration: busTime,
            distance: '~15 km',
            route: route,
            instructions: `🚌 Take ${route.name} from ${route.start_point} to ${route.end_point}`,
          },
          {
            mode: 'walk',
            description: `Walk to ${toSelected.label.split(',')[0]}`,
            duration: walkFromStopTime,
            distance: formatDistance(toStop.distance!),
            toStop: toStop,
            instructions: `🚶 Walk ${formatDistance(toStop.distance!)} to your destination`,
            mapUrl: getWalkingDirectionsUrl(toStop.latitude, toStop.longitude, toLat, toLng),
          },
        ];

        setTripPlan({
          totalDuration: totalDuration,
          totalDistance: `${totalDistance} km`,
          fare: `R${route.cost?.toFixed(2) || '15.00'}`,
          departTime: departStr,
          arriveTime: arriveStr,
          legs: legs,
          hasRoute: true,
          nearestFromStop: fromStop,
          nearestToStop: toStop,
          walkingInstructions: `🚶 First, walk ${formatDistance(fromStop.distance!)} to ${fromStop.name}`,
        });
      } else {
        // No route - walking only with stop info
        const walkingDistance = calculateDistance(fromLat, fromLng, toLat, toLng);
        const walkingTime = calculateWalkingTime(walkingDistance);
        const arrive = new Date(now.getTime() + walkingTime * 60 * 1000);
        const arriveStr = arrive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setTripPlan({
          totalDuration: walkingTime,
          totalDistance: formatDistance(walkingDistance),
          fare: 'No route available',
          departTime: departStr,
          arriveTime: arriveStr,
          legs: [{
            mode: 'walk',
            description: `Walk to destination`,
            duration: walkingTime,
            distance: formatDistance(walkingDistance),
            instructions: `🚶 Walk ${formatDistance(walkingDistance)} to your destination`,
            mapUrl: getWalkingDirectionsUrl(fromLat, fromLng, toLat, toLng),
          }],
          hasRoute: false,
          nearestFromStop: fromStop,
          nearestToStop: toStop,
          walkingInstructions: fromStop ? `🚶 Walk ${formatDistance(fromStop.distance!)} to ${fromStop.name} (nearest stop)` : 'No nearby stops found',
        });
      }

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();

      // Auto-show map after planning
      setTimeout(() => setShowMap(true), 500);
    } catch (err) {
      console.error('Planning error:', err);
      setError('Failed to plan journey. Please try again.');
    } finally {
      setPlanning(false);
    }
  };

  const handlePlan = () => planJourney();

  const getTypeIcon = (type: AddressSuggestion['type']) => {
    switch (type) {
      case 'transport': return <Bus size={13} color={colors.primary || '#1ea2b1'} />;
      case 'poi': return <Building2 size={13} color="#f59e0b" />;
      default: return <MapPin size={13} color={colors.primary || '#1ea2b1'} />;
    }
  };

  const getLegIcon = (mode: string) => {
    switch (mode) {
      case 'bus': return <Bus size={14} color={colors.primary || '#1ea2b1'} />;
      case 'train': return <Train size={14} color={colors.primary || '#1ea2b1'} />;
      case 'walk': return <Footprints size={14} color="#888" />;
      default: return <Bus size={14} color={colors.primary || '#1ea2b1'} />;
    }
  };

  const openMaps = (url?: string) => {
    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Linking.openURL(url);
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Search Inputs Section - Hide when map is showing */}
      {!showMap && (
        <>
          {/* From / To inputs */}
          <View style={[styles.inputCard, { backgroundColor: colors.card || '#1A1D1E' }]}>
            <View style={styles.inputRow}>
              <View style={styles.dotFilled} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Where from? Search any address…"
                placeholderTextColor="#555"
                value={fromQuery}
                onChangeText={(t) => { setFromQuery(t); setFromSelected(null); setTripPlan(null); setError(null); setShowMap(false); }}
                onFocus={() => { setActiveField('from'); setSuggestions([]); }}
              />
              {fromSelected && <CheckCircle2 size={16} color={colors.primary || '#1ea2b1'} />}
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border || '#222' }]} />

            <View style={styles.inputRow}>
              <View style={[styles.dotOutline, { borderColor: colors.primary || '#1ea2b1' }]} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Where to? Search any address…"
                placeholderTextColor="#555"
                value={toQuery}
                onChangeText={(t) => { setToQuery(t); setToSelected(null); setTripPlan(null); setError(null); setShowMap(false); }}
                onFocus={() => { setActiveField('to'); setSuggestions([]); }}
              />
              {toSelected && <CheckCircle2 size={16} color={colors.primary || '#1ea2b1'} />}
            </View>

            {(fromQuery.length > 0 || toQuery.length > 0) && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={handleSwap} style={styles.actionBtn}>
                  <ArrowUpDown size={14} color={colors.primary || '#1ea2b1'} />
                  <Text style={[styles.actionText, { color: colors.primary || '#1ea2b1' }]}>Swap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setFromQuery(''); setToQuery(''); setFromSelected(null); setToSelected(null); setTripPlan(null); setActiveField(null); setSuggestions([]); setError(null); setShowMap(false); }}
                  style={styles.actionBtn}
                >
                  <X size={14} color="#666" />
                  <Text style={[styles.actionText, { color: '#666' }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Searches */}
          {!activeField && recentSearches.length > 0 && !tripPlan && (
            <View style={[styles.recentContainer, { backgroundColor: colors.card || '#1A1D1E' }]}>
              <View style={styles.recentHeader}>
                <Clock size={14} color="#666" />
                <Text style={styles.recentTitle}>Recent Journeys</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search) => (
                <TouchableOpacity
                  key={search.id}
                  style={styles.recentItem}
                  onPress={() => loadRecentSearch(search)}
                >
                  <MapPin size={14} color={colors.primary || '#1ea2b1'} />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentFrom, { color: colors.text }]} numberOfLines={1}>{search.from}</Text>
                    <ChevronRight size={12} color="#666" />
                    <Text style={[styles.recentTo, { color: colors.text }]} numberOfLines={1}>{search.to}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Use My Location button */}
          {activeField && (
            <TouchableOpacity
              style={[styles.locationBtn, { backgroundColor: colors.card || '#1A1D1E' }]}
              onPress={handleUseMyLocation}
              disabled={locatingUser}
            >
              {locatingUser ? (
                <ActivityIndicator size="small" color={colors.primary || '#1ea2b1'} />
              ) : (
                <LocateFixed size={18} color={colors.primary || '#1ea2b1'} />
              )}
              <Text style={[styles.locationBtnText, { color: colors.primary || '#1ea2b1' }]}>
                {locatingUser ? 'Getting location…' : 'Use my current location'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Address Suggestions */}
          {activeField && (loadingSuggestions || suggestions.length > 0) && (
            <View style={[styles.suggestions, { backgroundColor: colors.card || '#1A1D1E' }]}>
              <View style={styles.suggestionsHeader}>
                <Search size={13} color="#666" />
                <Text style={styles.suggestionsTitle}>
                  {loadingSuggestions ? 'Searching addresses…' : `${suggestions.length} result${suggestions.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
              {suggestions.map((item) => (
                <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => handleSelect(item)}>
                  <View style={[styles.suggestionDot, { backgroundColor: `${colors.primary || '#1ea2b1'}20` }]}>
                    {getTypeIcon(item.type)}
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={[styles.suggestionLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.suggestionAddr} numberOfLines={1}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Plan button */}
          <TouchableOpacity
            style={[
              styles.planBtn,
              { backgroundColor: colors.primary || '#1ea2b1' },
              (!fromSelected || !toSelected || planning) && styles.planBtnDisabled,
            ]}
            onPress={handlePlan}
            disabled={!fromSelected || !toSelected || planning}
          >
            {planning ? <ActivityIndicator size="small" color="#fff" /> : <Route size={18} color="#fff" />}
            <Text style={styles.planBtnText}>{planning ? 'Finding route…' : 'Plan Journey'}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Results with Map */}
      {tripPlan && (
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Map View - Show walking instructions */}
          <View style={styles.mapSection}>
            <View style={[styles.mapHeader, { backgroundColor: colors.card || '#1A1D1E' }]}>
              <Compass size={20} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.mapTitle, { color: colors.text }]}>Walking Instructions</Text>
              <TouchableOpacity onPress={() => setShowMap(!showMap)}>
                <MapIcon size={20} color={colors.primary || '#1ea2b1'} />
              </TouchableOpacity>
            </View>

            {showMap && tripPlan.legs[0]?.mapUrl && (
              <View style={styles.mapContainer}>
                <Text style={styles.instructionText}>
                  {tripPlan.legs[0].instructions}
                </Text>
                <TouchableOpacity
                  style={[styles.openMapsBtn, { backgroundColor: colors.primary || '#1ea2b1' }]}
                  onPress={() => openMaps(tripPlan.legs[0]?.mapUrl)}
                >
                  <Navigation size={16} color="#fff" />
                  <Text style={styles.openMapsText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Journey Details */}
          <View style={[styles.result, { backgroundColor: colors.card || '#1A1D1E' }]}>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Depart</Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>{tripPlan.departTime}</Text>
              </View>
              <ChevronRight size={18} color="#555" />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Arrive</Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>{tripPlan.arriveTime}</Text>
              </View>
            </View>

            <View style={[styles.metaRow, { borderColor: colors.border || '#222' }]}>
              <View style={styles.metaItem}>
                <Clock size={13} color={colors.primary || '#1ea2b1'} />
                <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.totalDuration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.primary || '#1ea2b1'} />
                <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.totalDistance}</Text>
              </View>
              <View style={styles.metaItem}>
                <Bus size={13} color={colors.primary || '#1ea2b1'} />
                <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.fare}</Text>
              </View>
            </View>

            {/* Journey Steps */}
            {tripPlan.legs.map((leg, i) => (
              <View key={i} style={styles.leg}>
                <View style={styles.legTrack}>
                  <View style={[styles.legDot, { backgroundColor: colors.primary || '#1ea2b1' }]} />
                  {i < tripPlan.legs.length - 1 && <View style={styles.legLine} />}
                </View>
                <View style={styles.legInfo}>
                  <View style={styles.legTop}>
                    {getLegIcon(leg.mode)}
                    <Text style={[styles.legDesc, { color: colors.text }]}>{leg.description}</Text>
                  </View>
                  <Text style={styles.legMeta}>{leg.duration} min · {leg.distance}</Text>
                  {leg.instructions && (
                    <Text style={styles.legInstructions}>{leg.instructions}</Text>
                  )}
                  {leg.route && (
                    <Text style={styles.legRoute}>
                      {leg.route.name} • {leg.route.cost ? `R${leg.route.cost.toFixed(2)}` : 'Free'}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Nearest Stops Section */}
            {(tripPlan.nearestFromStop || tripPlan.nearestToStop) && (
              <View style={styles.stopsInResults}>
                <Text style={[styles.stopsTitle, { color: colors.text }]}>📍 Nearest Stops</Text>
                {tripPlan.nearestFromStop && (
                  <TouchableOpacity
                    style={styles.stopCard}
                    onPress={() => handleStopPress(tripPlan.nearestFromStop!.id)}
                  >
                    <View style={styles.stopCardContent}>
                      <View style={[styles.stopIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Bus size={18} color={colors.primary || '#1ea2b1'} />
                      </View>
                      <View style={styles.stopInfo}>
                        <Text style={[styles.stopName, { color: colors.text }]}>{tripPlan.nearestFromStop.name}</Text>
                        <Text style={styles.stopDistance}>
                          {formatDistance(tripPlan.nearestFromStop.distance!)} from start
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#666" />
                    </View>
                  </TouchableOpacity>
                )}
                {tripPlan.nearestToStop && (
                  <TouchableOpacity
                    style={styles.stopCard}
                    onPress={() => handleStopPress(tripPlan.nearestToStop!.id)}
                  >
                    <View style={styles.stopCardContent}>
                      <View style={[styles.stopIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <MapPin size={18} color={colors.primary || '#1ea2b1'} />
                      </View>
                      <View style={styles.stopInfo}>
                        <Text style={[styles.stopName, { color: colors.text }]}>{tripPlan.nearestToStop.name}</Text>
                        <Text style={styles.stopDistance}>
                          {formatDistance(tripPlan.nearestToStop.distance!)} from destination
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#666" />
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={styles.stopHint}>Tap on any stop to see more details</Text>
              </View>
            )}

            {!tripPlan.hasRoute && (
              <View style={styles.noRouteContainer}>
                <AlertCircle size={20} color="#f59e0b" />
                <Text style={styles.noRouteText}>
                  No direct public transport route found. You can walk to the nearest stop or tap on the stop above for more details.
                </Text>
              </View>
            )}

            {/* New Plan Button */}
            <TouchableOpacity
              style={[styles.newPlanBtn, { borderColor: colors.primary || '#1ea2b1' }]}
              onPress={() => {
                setShowMap(false);
                setTripPlan(null);
                setError(null);
                Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start();
              }}
            >
              <Route size={16} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.newPlanText, { color: colors.primary || '#1ea2b1' }]}>Plan Another Journey</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Error message */}
      {error && !tripPlan && (
        <View style={[styles.errorContainer, { backgroundColor: colors.card || '#1A1D1E' }]}>
          <AlertCircle size={20} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },

  inputCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1ea2b1' },
  dotOutline: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  separator: { height: 1, marginHorizontal: 16 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },

  recentContainer: { borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  recentTitle: { fontSize: 12, color: '#666', fontWeight: '500', flex: 1 },
  clearText: { fontSize: 12, color: '#ff4444', fontWeight: '500' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  recentInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentFrom: { fontSize: 13, fontWeight: '500', flex: 1 },
  recentTo: { fontSize: 13, fontWeight: '500', flex: 1 },

  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  locationBtnText: { fontSize: 14, fontWeight: '600' },

  suggestions: { borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  suggestionsTitle: { fontSize: 12, color: '#666', fontWeight: '500' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 10 },
  suggestionDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  suggestionAddr: { fontSize: 12, color: '#666' },

  planBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, marginBottom: 20 },
  planBtnDisabled: { opacity: 0.35 },
  planBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  resultContainer: { flex: 1 },
  mapSection: { marginBottom: 12 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, marginBottom: 8 },
  mapTitle: { fontSize: 14, fontWeight: '600', flex: 1, marginLeft: 10 },
  mapContainer: { backgroundColor: 'rgba(30, 162, 177, 0.1)', borderRadius: 14, padding: 16, marginBottom: 12 },
  instructionText: { fontSize: 14, color: '#fff', marginBottom: 12, lineHeight: 20 },
  openMapsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  openMapsText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  result: { borderRadius: 16, overflow: 'hidden' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  timeBlock: { alignItems: 'center', gap: 2 },
  timeLabel: { fontSize: 12, color: '#888' },
  timeValue: { fontSize: 20, fontWeight: '700' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontWeight: '600' },

  leg: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  legTrack: { alignItems: 'center', marginRight: 12, paddingTop: 4, width: 12 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legLine: { width: 2, flex: 1, backgroundColor: 'rgba(30,162,177,0.2)', marginTop: 4 },
  legInfo: { flex: 1, paddingBottom: 8 },
  legTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  legDesc: { fontSize: 14, fontWeight: '500' },
  legMeta: { fontSize: 12, color: '#888' },
  legInstructions: { fontSize: 11, color: '#1ea2b1', marginTop: 2 },
  legRoute: { fontSize: 11, color: '#1ea2b1', marginTop: 2 },

  stopsInResults: { padding: 16, borderTopWidth: 1, borderTopColor: '#222', marginTop: 8 },
  stopsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  stopCard: { backgroundColor: 'rgba(30, 162, 177, 0.05)', borderRadius: 12, marginBottom: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(30, 162, 177, 0.2)' },
  stopCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stopDistance: { fontSize: 12, color: '#888' },
  stopHint: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  noRouteContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', marginTop: 8, marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  noRouteText: { flex: 1, fontSize: 12, color: '#f59e0b' },

  newPlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginHorizontal: 16, marginVertical: 16, borderRadius: 12, borderWidth: 1, backgroundColor: 'transparent' },
  newPlanText: { fontSize: 14, fontWeight: '600' },

  errorContainer: { borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  errorText: { color: '#ff4444', fontSize: 13, flex: 1 },
});