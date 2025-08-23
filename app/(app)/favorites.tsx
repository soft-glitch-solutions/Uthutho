import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Search, MapPin, Navigation, Heart, Clock, DollarSign } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFavorites, FavoriteItem } from '@/hook/useFavorites';
import { useAuth } from '@/hook/useAuth';
import * as Location from 'expo-location';

interface SearchResult {
  id: string;
  name: string;
  type: 'route' | 'stop' | 'hub' | 'nearby_spot';
  data: any;
  distance?: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'route' | 'stop' | 'hub' | 'nearby_spot'>('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();

  const filters = [
    { key: 'all', label: 'All', icon: Search },
    { key: 'route', label: 'Routes', icon: Navigation },
    { key: 'stop', label: 'Stops', icon: MapPin },
    { key: 'hub', label: 'Hubs', icon: MapPin },
    { key: 'nearby_spot', label: 'Nearby', icon: MapPin },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedFilter]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const performSearch = async () => {
    setLoading(true);
    const results: SearchResult[] = [];

    try {
      // Search routes
      if (selectedFilter === 'all' || selectedFilter === 'route') {
        const { data: routes } = await supabase
          .from('routes')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,start_point.ilike.%${searchQuery}%,end_point.ilike.%${searchQuery}%`)
          .limit(10);

        if (routes) {
          routes.forEach(route => {
            results.push({
              id: route.id,
              name: route.name,
              type: 'route',
              data: route,
            });
          });
        }
      }

      // Search stops
      if (selectedFilter === 'all' || selectedFilter === 'stop') {
        const { data: stops } = await supabase
          .from('stops')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(10);

        if (stops) {
          stops.forEach(stop => {
            let distance;
            if (userLocation) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                stop.latitude,
                stop.longitude
              );
            }

            results.push({
              id: stop.id,
              name: stop.name,
              type: 'stop',
              data: stop,
              distance,
            });
          });
        }
      }

      // Search hubs
      if (selectedFilter === 'all' || selectedFilter === 'hub') {
        const { data: hubs } = await supabase
          .from('hubs')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
          .limit(10);

        if (hubs) {
          hubs.forEach(hub => {
            let distance;
            if (userLocation) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                hub.latitude,
                hub.longitude
              );
            }

            results.push({
              id: hub.id,
              name: hub.name,
              type: 'hub',
              data: hub,
              distance,
            });
          });
        }
      }

      // Search nearby spots
      if (selectedFilter === 'all' || selectedFilter === 'nearby_spot') {
        const { data: nearbySpots } = await supabase
          .from('nearby_spots')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(10);

        if (nearbySpots) {
          nearbySpots.forEach(spot => {
            let distance;
            if (userLocation) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                spot.latitude,
                spot.longitude
              );
            }

            results.push({
              id: spot.id,
              name: spot.name,
              type: 'nearby_spot',
              data: spot,
              distance,
            });
          });
        }
      }

      // Sort by distance if location is available
      if (userLocation) {
        results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (result: SearchResult) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save favorites.');
      return;
    }

    const favoriteItem: FavoriteItem = {
      id: result.id,
      type: result.type,
      name: result.name,
      data: result.data,
    };

    if (isFavorite(result.id)) {
      await removeFromFavorites(result.id);
    } else {
      await addToFavorites(favoriteItem);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'route': return Navigation;
      case 'stop': return MapPin;
      case 'hub': return MapPin;
      case 'nearby_spot': return MapPin;
      default: return MapPin;
    }
  };

  const getResultSubtitle = (result: SearchResult) => {
    switch (result.type) {
      case 'route':
        return `${result.data.start_point} → ${result.data.end_point} • R${result.data.cost}`;
      case 'stop':
        return result.distance ? `${result.distance.toFixed(1)}km away` : 'Transport Stop';
      case 'hub':
        return `${result.data.address || 'Transport Hub'}${result.distance ? ` • ${result.distance.toFixed(1)}km away` : ''}`;
      case 'nearby_spot':
        return `${result.data.category || 'Point of Interest'}${result.distance ? ` • ${result.distance.toFixed(1)}km away` : ''}`;
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSubtitle}>Find routes, stops, hubs & nearby spots</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#1ea2b1" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for routes, stops, hubs..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <FlatList
      data={filters}
      numColumns={Math.ceil(filters.length/2)} // Adjust as needed
      renderItem={({item}) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.filterTab, selectedFilter === item.key && styles.activeFilterTab]}
          onPress={() => setSelectedFilter(item.key as any)}
        >
          <item.icon size={16} color={selectedFilter === item.key ? '#FFFFFF' : '#888888'} />
          <Text style={[styles.filterText, selectedFilter === item.key && styles.activeFilterText]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.key}
      contentContainerStyle={styles.filtersContainer}
    />

      {/* Search Results */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          searchResults.map((result) => {
            const IconComponent = getResultIcon(result.type);
            const isResultFavorite = isFavorite(result.id);
            
            return (
              <TouchableOpacity key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultInfo}>
                    <IconComponent size={20} color="#1ea2b1" />
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultTitle}>{result.name}</Text>
                      <Text style={styles.resultSubtitle}>{getResultSubtitle(result)}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleFavoriteToggle(result)}
                  >
                    <Heart
                      size={20}
                      color={isResultFavorite ? '#ff6b35' : '#888888'}
                      fill={isResultFavorite ? '#ff6b35' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.resultMeta}>
                  <View style={styles.resultType}>
                    <Text style={styles.resultTypeText}>
                      {result.type.charAt(0).toUpperCase() + result.type.slice(1).replace('_', ' ')}
                    </Text>
                  </View>
                  
                  {result.type === 'route' && (
                    <View style={styles.routeInfo}>
                      <Clock size={14} color="#888888" />
                      <Text style={styles.routeInfoText}>{result.data.transport_type}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : searchQuery.length > 2 ? (
          <View style={styles.noResultsContainer}>
            <Search size={48} color="#333333" />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              Try searching with different keywords or check your spelling.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Search size={48} color="#333333" />
            <Text style={styles.emptyStateTitle}>Start searching</Text>
            <Text style={styles.emptyStateText}>
              Search for routes, stops, hubs, or nearby spots to get started.
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
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filtersContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 12,  // Reduced from 16
    paddingVertical: 4
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#333333',
    width: 'auto', // Let content determine width
  },
  activeFilterTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  filterText: {
    color: '#888888',
    flexGrow: 0, // Prevent text from stretching
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  resultDetails: {
    marginLeft: 12,
    flex: 1,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubtitle: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 18,
  },
  favoriteButton: {
    padding: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultType: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    color: '#888888',
    fontSize: 12,
    marginLeft: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});