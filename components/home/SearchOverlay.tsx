// app/components/SearchOverlay.tsx
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
  TextInput as RNTextInput,
  Alert,
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
  LocateFixed,
  AlertCircle,
  Save,
  X,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { searchAddresses, reverseGeocode, type AddressSuggestion } from '@/services/addressAutocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

console.log('📱 Screen dimensions:', { width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

// Conditionally import GooglePlacesTextInput only for native
let GooglePlacesTextInput: any = null;
if (Platform.OS !== 'web') {
  GooglePlacesTextInput = require('react-native-google-places-textinput').default;
}

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

// Use different API keys based on platform
const GOOGLE_PLACES_API_KEY = Platform.OS === 'web'
  ? process.env.EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY
  : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('🔑 Platform:', Platform.OS);
console.log('🔑 API Key configured:', GOOGLE_PLACES_API_KEY ? 'Yes' : 'No');

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
  fullAddress?: string;
}

interface SavedAddress {
  id: string;
  type: 'home' | 'work';
  address: string;
  latitude: number;
  longitude: number;
  label?: string;
  fullAddress?: string;
}

// Save Address Modal Component
const SaveAddressModal = ({
  visible,
  onClose,
  onSave,
  addressName,
  addressDetails,
  colors
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (type: 'home' | 'work') => void;
  addressName: string;
  addressDetails: string;
  colors: any;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.saveModalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.saveModalHeader}>
            <Text style={[styles.saveModalTitle, { color: colors.text }]}>Save Address</Text>
            <TouchableOpacity onPress={onClose} style={styles.saveModalClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.saveModalAddressInfo}>
            <MapPin size={20} color="#1ea2b1" />
            <View style={styles.saveModalAddressText}>
              <Text style={[styles.saveModalAddressName, { color: colors.text }]}>{addressName}</Text>
              <Text style={[styles.saveModalAddressDetails, { color: colors.text, opacity: 0.7 }]}>
                {addressDetails}
              </Text>
            </View>
          </View>

          <View style={styles.saveModalButtons}>
            <TouchableOpacity
              style={[styles.saveModalButton, styles.saveModalHomeButton]}
              onPress={() => onSave('home')}
            >
              <Home size={20} color="#FFF" />
              <Text style={styles.saveModalButtonText}>Save as Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveModalButton, styles.saveModalWorkButton]}
              onPress={() => onSave('work')}
            >
              <Briefcase size={20} color="#FFF" />
              <Text style={styles.saveModalButtonText}>Save as Work</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveModalCancel}
            onPress={onClose}
          >
            <Text style={[styles.saveModalCancelText, { color: colors.text, opacity: 0.6 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Web Address Search Component
const WebAddressSearch = ({
  onAddressSelect,
  placeholder,
  onTextChange,
  userLat,
  userLon,
  onFocusChange,
}: any) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<RNTextInput>(null);

  const searchAddressesAPI = async (searchText: string) => {
    console.log('🔍 Searching for:', searchText);
    if (!searchText.trim() || searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchAddresses(searchText, {
        limit: 8,
        userLat: userLat,
        userLon: userLon,
      });
      console.log('📊 Search results count:', results.length);
      setSuggestions(results);
    } catch (error) {
      console.error('❌ Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    console.log('✏️ Text changed:', text);
    setQuery(text);
    if (onTextChange) onTextChange(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchAddressesAPI(text);
    }, 300);
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    console.log('📍 Selected address:', suggestion.label);
    setQuery(suggestion.label);
    setSuggestions([]);
    setIsFocused(false);
    onFocusChange?.(false);

    onAddressSelect({
      id: suggestion.id,
      name: suggestion.label,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address,
      fullAddress: `${suggestion.label}, ${suggestion.address}`,
      distance: suggestion.distance,
    });
  };

  const handleFocus = () => {
    console.log('🔽 Input focused');
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    console.log('🔼 Input blurred');
    setTimeout(() => {
      setIsFocused(false);
      onFocusChange?.(false);
    }, 200);
  };

  const hasSuggestions = (isFocused || query.length > 0) && (suggestions.length > 0 || loading);

  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      <View style={{ position: 'relative' }}>
        <RNTextInput
          ref={inputRef}
          style={styles.webInput}
          placeholder={placeholder}
          placeholderTextColor="#888888"
          value={query}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <View style={styles.searchIconOverlay}>
          <Search size={20} color="#888888" />
        </View>
      </View>

      {hasSuggestions && (
        <View style={styles.webSuggestionsContainer}>
          <ScrollView
            style={{ maxHeight: 300 }}
            keyboardShouldPersistTaps="handled"
          >
            {loading && (
              <View style={styles.webSuggestionLoading}>
                <ActivityIndicator size="small" color="#1ea2b1" />
                <Text style={styles.webSuggestionLoadingText}>Searching...</Text>
              </View>
            )}
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.id}
                style={[
                  styles.webSuggestionItem,
                  index === suggestions.length - 1 && styles.webSuggestionItemLast
                ]}
                onPress={() => handleSelectAddress(suggestion)}
              >
                <View style={styles.webSuggestionContent}>
                  <View style={styles.webSuggestionTextContainer}>
                    <Text style={styles.webSuggestionMain}>{suggestion.label}</Text>
                    <Text style={styles.webSuggestionSecondary}>{suggestion.address}</Text>
                  </View>
                  {suggestion.distance && (
                    <Text style={styles.webSuggestionDistance}>
                      {suggestion.distance < 1
                        ? `${Math.round(suggestion.distance * 1000)}m`
                        : `${suggestion.distance.toFixed(1)}km`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Recent Search Item with Save button
const RecentSearchItem = ({
  item,
  onPress,
  onSave,
  colors
}: {
  item: SearchResult;
  onPress: () => void;
  onSave: () => void;
  colors: any;
}) => {
  return (
    <View style={styles.recentItemContainer}>
      <TouchableOpacity
        style={styles.recentItemContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.recentIconBox}>
          <History size={18} color="#888888" />
        </View>
        <View style={styles.recentTextContainer}>
          <Text style={styles.recentTitle}>{item.name}</Text>
          <Text style={styles.recentSubtitle}>{item.contextTitle || item.type.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.recentSaveButton}
        onPress={onSave}
      >
        <Save size={18} color="#1ea2b1" />
      </TouchableOpacity>
    </View>
  );
};

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Save address modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    fullAddress: string;
  } | null>(null);

  const placesRef = useRef<any>(null);

  const anims = useRef({
    opacity: new Animated.Value(0),
    searchBarY: new Animated.Value(initialY),
    contentY: new Animated.Value(100),
    shortcutsY: new Animated.Value(150),
    recentsY: new Animated.Value(200),
    suggestedY: new Animated.Value(250),
  }).current;

  console.log('🎨 SearchOverlay visible:', visible, 'isSearchFocused:', isSearchFocused);

  // Get current user and load profile data
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;

    console.log('👤 Loading user profile for:', user.id);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('home, work')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.home && typeof profile.home === 'string') {
        try {
          const homeData = JSON.parse(profile.home);
          setHomeAddress({
            id: 'home',
            type: 'home',
            address: homeData.address || homeData.label,
            latitude: homeData.latitude,
            longitude: homeData.longitude,
            label: homeData.label,
            fullAddress: homeData.fullAddress || homeData.address
          });
          console.log('🏠 Home address loaded');
        } catch (e) {
          console.error('Error parsing home address:', e);
        }
      } else {
        setHomeAddress(null);
      }

      if (profile?.work && typeof profile.work === 'string') {
        try {
          const workData = JSON.parse(profile.work);
          setWorkAddress({
            id: 'work',
            type: 'work',
            address: workData.address || workData.label,
            latitude: workData.latitude,
            longitude: workData.longitude,
            label: workData.label,
            fullAddress: workData.fullAddress || workData.address
          });
          console.log('💼 Work address loaded');
        } catch (e) {
          console.error('Error parsing work address:', e);
        }
      } else {
        setWorkAddress(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user]);

  const getUserLocation = useCallback(async () => {
    console.log('📍 Getting user location...');
    setIsGettingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: null,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          });
          console.log('📍 Web location obtained:', position.coords.latitude, position.coords.longitude);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          setIsGettingLocation(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        console.log('📍 Native location obtained:', location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const loadRecentSearches = useCallback(async () => {
    console.log('📜 Loading recent searches...');
    try {
      const stored = await AsyncStorage.getItem('recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
        console.log('📜 Recent searches loaded:', parsed.length);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  const clearRecentSearches = useCallback(() => {
    console.log('🗑️ Clearing recent searches...');
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setRecentSearches([]);
            AsyncStorage.removeItem('recent_searches');
            console.log('🗑️ Recent searches cleared');
          }
        }
      ]
    );
  }, []);

  const saveRecentSearch = useCallback(async (result: SearchResult) => {
    console.log('💾 Saving recent search:', result.name);
    try {
      const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
      console.log('💾 Recent search saved, total:', updated.length);
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

  const navigateToSearchResults = (latitude: number, longitude: number, name: string, fullAddress: string) => {
    console.log('🚀 Navigating to search results:', { latitude, longitude, name, fullAddress });

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

  // Save address to user profile
  const saveAddressToProfile = async (type: 'home' | 'work') => {
    if (!selectedAddress) return;
    if (!user?.id) {
      setSuccessMessage('Please login to save addresses');
      setShowSuccessModal(true);
      return;
    }

    console.log('💾 Saving address to profile:', { type, address: selectedAddress.name });
    setLoading(true);
    try {
      const addressData = {
        label: selectedAddress.name,
        address: selectedAddress.fullAddress,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        fullAddress: selectedAddress.fullAddress,
        savedAt: new Date().toISOString(),
      };

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('home, work')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const updateData: any = {};
      if (type === 'home') {
        updateData.home = JSON.stringify(addressData);
        setHomeAddress({
          id: 'home',
          type: 'home',
          address: selectedAddress.name,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          label: selectedAddress.name,
          fullAddress: selectedAddress.fullAddress,
        });
      } else {
        updateData.work = JSON.stringify(addressData);
        setWorkAddress({
          id: 'work',
          type: 'work',
          address: selectedAddress.name,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          label: selectedAddress.name,
          fullAddress: selectedAddress.fullAddress,
        });
      }

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, ...updateData }]);

        if (insertError) throw insertError;
      }

      setSuccessMessage(`${type === 'home' ? 'Home' : 'Work'} address saved successfully!`);
      setShowSuccessModal(true);
      setShowSaveModal(false);
      setSelectedAddress(null);
      console.log('💾 Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      setSuccessMessage('Failed to save address. Please try again.');
      setShowSuccessModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle address selection from search - DIRECT NAVIGATION
  const handleAddressSelect = (address: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    fullAddress: string;
    distance?: number;
  }) => {
    console.log('📍 Address selected:', address.name);
    const searchResult: SearchResult = {
      id: `addr-${address.id}`,
      name: address.name,
      type: 'address',
      data: {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.fullAddress
      },
      coords: {
        latitude: address.latitude,
        longitude: address.longitude
      },
      contextTitle: address.fullAddress,
      fullAddress: address.fullAddress
    };

    saveRecentSearch(searchResult);
    navigateToSearchResults(address.latitude, address.longitude, address.name, address.fullAddress);
  };

  // Save address from recent search
  const handleSaveRecentAddress = (result: SearchResult) => {
    console.log('💾 Saving recent address:', result.name);
    if (result.coords) {
      setSelectedAddress({
        id: result.id,
        name: result.name,
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        fullAddress: result.contextTitle || result.fullAddress || result.name,
      });
      setShowSaveModal(true);
    }
  };

  // Handle recent search press - navigate without API call
  const handleRecentSearchPress = (result: SearchResult) => {
    console.log('📜 Recent search pressed:', result.name);
    if (result.coords) {
      navigateToSearchResults(
        result.coords.latitude,
        result.coords.longitude,
        result.name,
        result.contextTitle || result.name
      );
    }
  };

  // Handle saved address press
  const handleSavedAddressPress = (address: SavedAddress) => {
    console.log('🏠 Saved address pressed:', address.type);
    navigateToSearchResults(
      address.latitude,
      address.longitude,
      address.type === 'home' ? 'Home' : 'Work',
      address.fullAddress || address.address
    );
  };

  // Handle empty home/work - show add address option
  const handleAddHomeAddress = () => {
    console.log('➕ Add address pressed');
    setSuccessMessage('Search for an address and select it, then you can save it as Home or Work');
    setShowSuccessModal(true);
  };

  const handleUseMyLocation = async () => {
    console.log('📍 Use my location pressed');
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
          setSuccessMessage('Please enable location permissions to use this feature');
          setShowSuccessModal(true);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        coords = location.coords;
      }

      const result = await reverseGeocode(coords.latitude, coords.longitude);

      const searchResult: SearchResult = {
        id: `current-location-${Date.now()}`,
        name: result?.label || 'Current Location',
        type: 'address',
        data: { latitude: coords.latitude, longitude: coords.longitude, address: result?.label || 'Current Location' },
        coords: { latitude: coords.latitude, longitude: coords.longitude },
        contextTitle: result?.label || 'Current Location',
        fullAddress: result?.label || 'Current Location'
      };

      saveRecentSearch(searchResult);
      navigateToSearchResults(coords.latitude, coords.longitude, result?.label || 'Current Location', result?.label || 'Current Location');
    } catch (e) {
      console.error('Location error:', e);
      setSuccessMessage('Could not get your location');
      setShowSuccessModal(true);
    } finally {
      setLocatingUser(false);
    }
  };

  const handleClose = () => {
    console.log('❌ Closing search overlay');
    setIsSearchFocused(false);
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
      console.log('🔓 Search overlay opened');
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
        if (isSearchFocused) {
          setIsSearchFocused(false);
          return true;
        }
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
      console.log('👤 User authenticated:', user?.id || 'No user');
    })();
  }, []);

  const fetchSuggestedRoutes = async () => {
    if (!userLocation) return;
    console.log('🚌 Fetching suggested routes...');
    setLoadingSuggestions(true);
    try {
      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .limit(50);
      if (!stops || stops.length === 0) return;

      const { data: routeStops } = await supabase
        .from('route_stops')
        .select(`
          stop_id,
          routes (*)
        `);

      const nearestStops = stops
        .map(stop => ({
          ...stop,
          distance: calculateDistance(userLocation.latitude, userLocation.longitude, stop.latitude, stop.longitude)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      const uniqueRoutes = new Map();
      nearestStops.forEach(stop => {
        const stopRoutes = routeStops?.filter(rs => rs.stop_id === stop.id) || [];
        stopRoutes.forEach(rs => {
          if (rs.routes && !uniqueRoutes.has(rs.routes.id)) {
            uniqueRoutes.set(rs.routes.id, {
              ...rs.routes,
              distanceToStop: stop.distance,
              nearestStopName: stop.name
            });
          }
        });
      });

      const routeArray = Array.from(uniqueRoutes.values());
      setSuggestedRoutes(routeArray.slice(0, 3));
      console.log('🚌 Suggested routes found:', routeArray.length);
    } catch (error) {
      console.error('Error fetching suggested routes:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (visible && userLocation && !isSearchFocused) {
      fetchSuggestedRoutes();
    }
  }, [visible, userLocation, isSearchFocused]);

  // Handle native place selection from Google Places
  const handlePlaceSelected = async (place: any) => {
    console.log('📍 Native place selected:', place);
    let lat = null;
    let lng = null;
    let formattedAddress = '';
    let shortName = '';

    if (place.details?.location?.lat && place.details?.location?.lng) {
      lat = place.details.location.lat;
      lng = place.details.location.lng;
      formattedAddress = place.details.formattedAddress || place.description;
      shortName = place.structured_formatting?.main_text || formattedAddress.split(',')[0];
    } else if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
      lat = place.geometry.location.lat;
      lng = place.geometry.location.lng;
      formattedAddress = place.formatted_address || place.name;
      shortName = place.name || formattedAddress.split(',')[0];
    }

    if (lat && lng) {
      const searchResult: SearchResult = {
        id: `place-${Date.now()}`,
        name: shortName,
        type: 'address',
        data: { latitude: lat, longitude: lng, address: formattedAddress },
        coords: { latitude: lat, longitude: lng },
        contextTitle: formattedAddress,
        fullAddress: formattedAddress
      };

      saveRecentSearch(searchResult);
      navigateToSearchResults(lat, lng, shortName, formattedAddress);
    }
  };

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

  const renderSearchInput = () => {
    if (Platform.OS === 'web') {
      return (
        <WebAddressSearch
          onAddressSelect={handleAddressSelect}
          placeholder={isGettingLocation ? "Detecting your location..." : "Search in South Africa..."}
          onTextChange={setSearchQuery}
          userLat={userLocation?.latitude}
          userLon={userLocation?.longitude}
          onFocusChange={setIsSearchFocused}
        />
      );
    }

    if (GooglePlacesTextInput) {
      return (
        <GooglePlacesTextInput
          ref={placesRef}
          apiKey={GOOGLE_PLACES_API_KEY}
          placeholder={isGettingLocation ? "Detecting your location..." : "Search in South Africa..."}
          onPlaceSelect={handlePlaceSelected}
          fetchDetails={true}
          showLoadingIndicator={true}
          showClearButton={true}
          debounceDelay={300}
          minCharsToFetch={2}
          languageCode="en"
          includedRegionCodes={[SOUTH_AFRICA_REGION_CODE]}
          locationBias={SOUTH_AFRICA_BIAS}
          types={['geocode', 'establishment']}
          enableDebug={__DEV__}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
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
      );
    }

    return (
      <RNTextInput
        style={styles.webInput}
        placeholder="Search in South Africa..."
        placeholderTextColor="#888888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
      />
    );
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: anims.opacity }]}>
          <View style={styles.searchContainer}>
            {/* Header Section - Always on top */}
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
                  {renderSearchInput()}
                </View>

                <View style={styles.countryIndicator}>
                  <MapPin size={12} color="#1ea2b1" />
                  <Text style={styles.countryIndicatorText}>Searching in South Africa</Text>
                </View>
              </View>
            </Animated.View>

            {/* Content - Only show when not searching */}
            {!isSearchFocused && (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.discoveryContent}>
                  {/* Quick Actions Section */}
                  <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.shortcutsY }] }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                    <View style={styles.threeColumnGrid}>
                      {/* Home Card */}
                      <TouchableOpacity
                        style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                        onPress={() => homeAddress ? handleSavedAddressPress(homeAddress) : handleAddHomeAddress()}
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
                          <Text style={styles.shortcutAddText}>Add address</Text>
                        )}
                      </TouchableOpacity>

                      {/* Work Card */}
                      <TouchableOpacity
                        style={[styles.shortcutCard, { backgroundColor: colors.card }]}
                        onPress={() => workAddress ? handleSavedAddressPress(workAddress) : handleAddHomeAddress()}
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
                          <Text style={styles.shortcutAddText}>Add address</Text>
                        )}
                      </TouchableOpacity>

                      {/* Nearby Card */}
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

                  {/* Recent Searches Section */}
                  {recentSearches.length > 0 && (
                    <Animated.View style={[styles.sectionWrapper, { transform: [{ translateY: anims.recentsY }] }]}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
                        <TouchableOpacity onPress={clearRecentSearches}>
                          <Text style={styles.clearAllText}>Clear all</Text>
                        </TouchableOpacity>
                      </View>
                      {recentSearches.map((item) => (
                        <RecentSearchItem
                          key={item.id}
                          item={item}
                          onPress={() => handleRecentSearchPress(item)}
                          onSave={() => handleSaveRecentAddress(item)}
                          colors={colors}
                        />
                      ))}
                    </Animated.View>
                  )}

                  {/* Suggested Routes Section */}
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
                            Nearest stop: {route.nearestStopName} ({route.distanceToStop?.toFixed(1)}km away)
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
            )}
          </View>
        </Animated.View>
      </Modal>

      {/* Save Address Modal */}
      {selectedAddress && (
        <SaveAddressModal
          visible={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setSelectedAddress(null);
          }}
          onSave={saveAddressToProfile}
          addressName={selectedAddress.name}
          addressDetails={selectedAddress.fullAddress}
          colors={colors}
        />
      )}

      <SuccessModal />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchContainer: {
    flex: 1,
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
    backgroundColor: '#000000',
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
  webInput: {
    backgroundColor: '#1A1D1E',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 48,
    color: '#FFFFFF',
    fontSize: 16,
    width: '100%',
  },
  webSuggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#1A1D1E',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 2000,
    borderWidth: 1,
    borderColor: '#2A2D2E',
  },
  webSuggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D2E',
  },
  webSuggestionItemLast: {
    borderBottomWidth: 0,
  },
  webSuggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webSuggestionTextContainer: {
    flex: 1,
  },
  webSuggestionMain: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  webSuggestionSecondary: {
    color: '#888888',
    fontSize: 12,
  },
  webSuggestionDistance: {
    color: '#1ea2b1',
    fontSize: 12,
    marginLeft: 8,
  },
  webSuggestionLoading: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  webSuggestionLoadingText: {
    color: '#888888',
    fontSize: 14,
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
  shortcutAddText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontStyle: 'italic',
  },
  recentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1A1D1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2D2E',
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
  recentSaveButton: {
    padding: 12,
    marginRight: 8,
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
  // Save Modal Styles
  saveModalContainer: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveModalClose: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalAddressInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: 12,
  },
  saveModalAddressText: {
    flex: 1,
  },
  saveModalAddressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  saveModalAddressDetails: {
    fontSize: 12,
  },
  saveModalButtons: {
    gap: 12,
    marginBottom: 16,
  },
  saveModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  saveModalHomeButton: {
    backgroundColor: '#1ea2b1',
  },
  saveModalWorkButton: {
    backgroundColor: '#f59e0b',
  },
  saveModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveModalCancel: {
    alignItems: 'center',
    padding: 12,
  },
  saveModalCancelText: {
    fontSize: 14,
  },
});

export default SearchOverlay;