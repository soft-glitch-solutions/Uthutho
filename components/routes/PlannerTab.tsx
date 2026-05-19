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
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  searchAddresses,
  reverseGeocode,
  type AddressSuggestion,
} from '@/services/addressAutocomplete';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  transport_type: string;
  cost: number;
}

interface RouteStop {
  route_id: string;
  stop_id: string;
  order_number: number;
}

interface TripLeg {
  mode: 'walk' | 'bus' | 'train' | 'taxi';
  description: string;
  duration: number;
  distance: string;
  route?: Route;
  fromStop?: Stop;
  toStop?: Stop;
}

interface TripPlan {
  totalDuration: number;
  totalDistance: string;
  legs: TripLeg[];
  fare: string;
  departTime: string;
  arriveTime: string;
}

// Calculate distance between two coordinates
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

// Find nearest stops to a location
const findNearestStops = async (lat: number, lng: number, limit: number = 5): Promise<Stop[]> => {
  const { data: allStops, error } = await supabase
    .from('stops')
    .select('*');

  if (error) throw error;
  if (!allStops) return [];

  const stopsWithDistance = allStops.map(stop => ({
    ...stop,
    distance: calculateDistance(lat, lng, stop.latitude, stop.longitude)
  }));

  stopsWithDistance.sort((a, b) => a.distance - b.distance);

  return stopsWithDistance.slice(0, limit);
};

// Find routes between stops
const findRoutesBetweenStops = async (fromStopId: string, toStopId: string): Promise<Route | null> => {
  // Get route_stops for both stops
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

  // Group by route_id
  const routeMap = new Map<string, { route: Route, orderNumbers: number[] }>();

  routeStops.forEach(rs => {
    if (rs.routes) {
      const route = rs.routes as Route;
      if (!routeMap.has(route.id)) {
        routeMap.set(route.id, { route, orderNumbers: [] });
      }
      routeMap.get(route.id)!.orderNumbers.push(rs.order_number);
    }
  });

  // Find routes where both stops exist and from order < to order (same direction)
  for (const [_, value] of routeMap) {
    const orders = value.orderNumbers;
    if (orders.length === 2 && orders[0] < orders[1]) {
      return value.route;
    }
  }

  return null;
};

// Get walking directions between coordinates
const getWalkingLeg = async (fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<TripLeg> => {
  const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
  const duration = calculateWalkingTime(distance);

  return {
    mode: 'walk',
    description: `Walk ${distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}`,
    duration: duration,
    distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
  };
};

export default function PlannerTab() {
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = activeField === 'from' ? fromQuery : toQuery;

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

  // Trigger search when query changes
  useEffect(() => {
    if (activeField) {
      fetchSuggestions(query);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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
        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable location permissions to use this feature');
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
        } else if (activeField === 'to') {
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

  const planJourney = async () => {
    if (!fromSelected || !toSelected) return;

    console.log('Planning journey from:', fromSelected, 'to:', toSelected);
    setPlanning(true);
    setTripPlan(null);
    setError(null);
    fadeAnim.setValue(0);

    try {
      const fromLat = fromSelected.latitude;
      const fromLng = fromSelected.longitude;
      const toLat = toSelected.latitude;
      const toLng = toSelected.longitude;

      // Find nearest stops to origin and destination
      const [nearbyFromStops, nearbyToStops] = await Promise.all([
        findNearestStops(fromLat, fromLng, 5),
        findNearestStops(toLat, toLng, 5)
      ]);

      console.log('Nearby from stops:', nearbyFromStops.length);
      console.log('Nearby to stops:', nearbyToStops.length);

      if (nearbyFromStops.length === 0 || nearbyToStops.length === 0) {
        setError('No public transport stops found near your locations. Try a different area.');
        setPlanning(false);
        return;
      }

      // Try to find a direct route between any from-stop and to-stop
      let bestRoute: { route: Route, fromStop: Stop, toStop: Stop, walkToStop: number, walkFromStop: number } | null = null;
      let minTotalTime = Infinity;

      for (const fromStop of nearbyFromStops) {
        for (const toStop of nearbyToStops) {
          const route = await findRoutesBetweenStops(fromStop.id, toStop.id);
          if (route) {
            const walkToStopTime = calculateWalkingTime(fromStop.distance);
            const walkFromStopTime = calculateWalkingTime(toStop.distance);
            const totalTime = walkToStopTime + walkFromStopTime + 30; // Assume bus takes ~30 min as base
            if (totalTime < minTotalTime) {
              minTotalTime = totalTime;
              bestRoute = { route, fromStop, toStop, walkToStop: walkToStopTime, walkFromStop: walkFromStopTime };
            }
          }
        }
      }

      if (bestRoute) {
        // Build trip plan with the found route
        const now = new Date();
        const departStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const totalDuration = bestRoute.walkToStop + 30 + bestRoute.walkFromStop;
        const arrive = new Date(now.getTime() + totalDuration * 60 * 1000);
        const arriveStr = arrive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const legs: TripLeg[] = [
          {
            mode: 'walk',
            description: `Walk to ${bestRoute.fromStop.name}`,
            duration: bestRoute.walkToStop,
            distance: bestRoute.fromStop.distance < 1
              ? `${Math.round(bestRoute.fromStop.distance * 1000)}m`
              : `${bestRoute.fromStop.distance.toFixed(1)}km`,
          },
          {
            mode: bestRoute.route.transport_type === 'bus' ? 'bus' : 'train',
            description: `${bestRoute.route.transport_type?.toUpperCase() || 'Bus'} ${bestRoute.route.name} toward ${bestRoute.route.end_point}`,
            duration: 30,
            distance: '~15 km',
            route: bestRoute.route,
            fromStop: bestRoute.fromStop,
            toStop: bestRoute.toStop,
          },
          {
            mode: 'walk',
            description: `Walk to destination`,
            duration: bestRoute.walkFromStop,
            distance: bestRoute.toStop.distance < 1
              ? `${Math.round(bestRoute.toStop.distance * 1000)}m`
              : `${bestRoute.toStop.distance.toFixed(1)}km`,
          },
        ];

        const totalDistance = (bestRoute.fromStop.distance + bestRoute.toStop.distance + 15).toFixed(1);

        setTripPlan({
          totalDuration: totalDuration,
          totalDistance: `${totalDistance} km`,
          fare: `R${bestRoute.route.cost?.toFixed(2) || '15.00'}`,
          departTime: departStr,
          arriveTime: arriveStr,
          legs: legs,
        });
      } else {
        // No direct route found, create a walking-only plan
        const walkingDistance = calculateDistance(fromLat, fromLng, toLat, toLng);
        const walkingTime = calculateWalkingTime(walkingDistance);
        const now = new Date();
        const departStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const arrive = new Date(now.getTime() + walkingTime * 60 * 1000);
        const arriveStr = arrive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setTripPlan({
          totalDuration: walkingTime,
          totalDistance: walkingDistance < 1
            ? `${Math.round(walkingDistance * 1000)}m`
            : `${walkingDistance.toFixed(1)} km`,
          fare: 'R0.00 (Walking)',
          departTime: departStr,
          arriveTime: arriveStr,
          legs: [{
            mode: 'walk',
            description: `Walk to destination`,
            duration: walkingTime,
            distance: walkingDistance < 1
              ? `${Math.round(walkingDistance * 1000)}m`
              : `${walkingDistance.toFixed(1)} km`,
          }],
        });

        if (walkingDistance > 10) {
          setError('No public transport routes found. The walking distance is significant.');
        }
      }

      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err) {
      console.error('Planning error:', err);
      setError('Failed to plan journey. Please try again.');
    } finally {
      setPlanning(false);
    }
  };

  const handlePlan = () => {
    planJourney();
  };

  const getTypeIcon = (type: AddressSuggestion['type']) => {
    switch (type) {
      case 'transport':
        return <Bus size={13} color={colors.primary || '#1ea2b1'} />;
      case 'poi':
        return <Building2 size={13} color="#f59e0b" />;
      default:
        return <MapPin size={13} color={colors.primary || '#1ea2b1'} />;
    }
  };

  const getTypeBadgeColor = (type: AddressSuggestion['type']) => {
    switch (type) {
      case 'transport':
        return { bg: `${colors.primary || '#1ea2b1'}15`, text: colors.primary || '#1ea2b1' };
      case 'poi':
        return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
      default:
        return { bg: `${colors.primary || '#1ea2b1'}15`, text: colors.primary || '#1ea2b1' };
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* From / To inputs */}
      <View style={[styles.inputCard, { backgroundColor: colors.card || '#1A1D1E' }]}>
        <View style={styles.inputRow}>
          <View style={styles.dotFilled} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Where from? Search any address…"
            placeholderTextColor="#555"
            value={fromQuery}
            onChangeText={(t) => { setFromQuery(t); setFromSelected(null); setTripPlan(null); setError(null); }}
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
            onChangeText={(t) => { setToQuery(t); setToSelected(null); setTripPlan(null); setError(null); }}
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
              onPress={() => { setFromQuery(''); setToQuery(''); setFromSelected(null); setToSelected(null); setTripPlan(null); setActiveField(null); setSuggestions([]); setError(null); }}
              style={styles.actionBtn}
            >
              <X size={14} color="#666" />
              <Text style={[styles.actionText, { color: '#666' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
              {loadingSuggestions
                ? 'Searching addresses…'
                : query.length >= 2
                  ? `${suggestions.length} result${suggestions.length !== 1 ? 's' : ''} for "${query}"`
                  : 'Type to search addresses'}
            </Text>
          </View>

          {loadingSuggestions && suggestions.length === 0 && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary || '#1ea2b1'} />
            </View>
          )}

          {suggestions.map((item) => {
            const badgeColors = getTypeBadgeColor(item.type);
            return (
              <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => handleSelect(item)}>
                <View style={[styles.suggestionDot, { backgroundColor: `${colors.primary || '#1ea2b1'}20` }]}>
                  {getTypeIcon(item.type)}
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={[styles.suggestionLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.suggestionAddr} numberOfLines={1}>{item.address}</Text>
                </View>
                {item.distance && (
                  <View style={[styles.distanceBadge, { backgroundColor: badgeColors.bg }]}>
                    <Text style={[styles.distanceText, { color: badgeColors.text }]}>
                      {item.distance < 1
                        ? `${Math.round(item.distance * 1000)}m`
                        : `${item.distance.toFixed(1)}km`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* No results */}
      {activeField && query.length >= 2 && !loadingSuggestions && suggestions.length === 0 && (
        <View style={[styles.noResults, { backgroundColor: colors.card || '#1A1D1E' }]}>
          <Search size={16} color="#555" />
          <Text style={styles.noResultsText}>No addresses found for "{query}"</Text>
        </View>
      )}

      {/* Error message */}
      {error && !tripPlan && (
        <View style={[styles.errorContainer, { backgroundColor: colors.card || '#1A1D1E' }]}>
          <AlertCircle size={20} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
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
        activeOpacity={0.8}
      >
        {planning ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Route size={18} color="#fff" />
        )}
        <Text style={styles.planBtnText}>{planning ? 'Finding route…' : 'Plan Journey'}</Text>
      </TouchableOpacity>

      {/* Results */}
      {tripPlan && (
        <Animated.View style={[styles.result, { backgroundColor: colors.card || '#1A1D1E', opacity: fadeAnim }]}>
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
                {leg.route && (
                  <Text style={styles.legRoute}>
                    {leg.route.name} • {leg.route.cost ? `R${leg.route.cost.toFixed(2)}` : 'Free'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </Animated.View>
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

  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  locationBtnText: { fontSize: 14, fontWeight: '600' },

  suggestions: { borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  suggestionsTitle: { fontSize: 12, color: '#666', fontWeight: '500' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 10 },
  suggestionDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  suggestionAddr: { fontSize: 12, color: '#666' },
  distanceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  distanceText: { fontSize: 11, fontWeight: '600' },
  loadingRow: { paddingVertical: 20, alignItems: 'center' },

  noResults: { borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  noResultsText: { color: '#555', fontSize: 14 },

  errorContainer: { borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  errorText: { color: '#ff4444', fontSize: 13, flex: 1 },

  planBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, marginBottom: 20 },
  planBtnDisabled: { opacity: 0.35 },
  planBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

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
  legRoute: { fontSize: 11, color: '#1ea2b1', marginTop: 2 },
});