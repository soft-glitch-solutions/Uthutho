import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Search, MapPin, Navigation, Bookmark, BookmarkCheck, Clock, DollarSign } from 'lucide-react-native';
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

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonTextContainer}>
              <View style={[styles.skeletonLine, styles.skeletonTitle]} />
              <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
            </View>
            <View style={styles.skeletonFavorite} />
          </View>
          <View style={styles.skeletonMeta}>
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonRouteInfo} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'route' | 'stop' | 'hub' | 'nearby_spot'>('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recommendedNearby, setRecommendedNearby] = useState<SearchResult[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});
  const [routeFollowerCounts, setRouteFollowerCounts] = useState<Record<string, number>>({});
  const [hubFollowerCounts, setHubFollowerCounts] = useState<Record<string, number>>({});
  
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
      loadRecommendedNearby();
    }
  }, [searchQuery, selectedFilter]);

  useEffect(() => {
    if (userLocation) {
      loadRecommendedNearby();
    }
  }, [userLocation]);

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

  const loadRecommendedNearby = async () => {
    if (!userLocation) return;
    
    setIsLoadingRecommended(true);
    try {
      const results: SearchResult[] = [];

      // Get nearby stops with distance calculation
      const { data: stops } = await supabase
        .from('stops')
        .select('*');

      if (stops) {
        console.log('Stops found:', stops.length);
        stops.forEach(stop => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            stop.latitude,
            stop.longitude
          );

          results.push({
            id: stop.id,
            name: stop.name,
            type: 'stop',
            data: stop,
            distance,
          });
        });
      }

      // Get nearby hubs with distance calculation
      const { data: hubs } = await supabase
        .from('hubs')
        .select('*');

      if (hubs) {
        console.log('Hubs found:', hubs.length);
        hubs.forEach(hub => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            hub.latitude,
            hub.longitude
          );

          results.push({
            id: hub.id,
            name: hub.name,
            type: 'hub',
            data: hub,
            distance,
          });
        });
      }

      // Sort by distance
      const sortedResults = results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      
      // Get a balanced mix of stops and hubs
      const stopsOnly = sortedResults.filter(r => r.type === 'stop').slice(0, 4);
      const hubsOnly = sortedResults.filter(r => r.type === 'hub').slice(0, 4);
      
      // Combine and take up to 8 results
      const balancedResults = [...stopsOnly, ...hubsOnly]
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        .slice(0, 8);
        
      console.log('Final recommended results:', balancedResults);
      setRecommendedNearby(balancedResults);
      populateFollowerCounts(balancedResults);
    } catch (error) {
      console.error('Error loading recommended nearby:', error);
    } finally {
      setIsLoadingRecommended(false);
    }
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
      populateFollowerCounts(results);
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

    // Map result.type to your favorites entity_type
    const entityType: 'route' | 'hub' | 'stop' | 'nearby_spot' = result.type;
    if (entityType === 'nearby_spot') {
      Alert.alert('Not Supported', 'Nearby spots cannot be bookmarked yet.');
      return;
    }

    const id = result.id;
    const isFav = isFavorite(id);
    const delta = isFav ? -1 : 1;

    // Optimistic UI update
    setFavoritesCountMap(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

    try {
      if (isFav) {
        const { error: favErr } = await supabase.rpc('remove_favorite', {
          p_user_id: user.id,
          p_entity_type: entityType,
          p_entity_id: id,
        });
        if (favErr) throw favErr;

        const { error: bumpErr } = await supabase.rpc('bump_favorites_count', {
          p_user_id: user.id,
          p_delta: -1,
        });
        if (bumpErr) console.warn('bump_favorites_count failed:', bumpErr);

        await removeFromFavorites(id);
      } else {
        const { error: favErr } = await supabase.rpc('add_favorite', {
          p_user_id: user.id,
          p_entity_type: entityType,
          p_entity_id: id,
        });
        if (favErr) throw favErr;

        const { error: bumpErr } = await supabase.rpc('bump_favorites_count', {
          p_user_id: user.id,
          p_delta: 1,
        });
        if (bumpErr) console.warn('bump_favorites_count failed:', bumpErr);

        await addToFavorites({ id, type: entityType, name: result.name, data: result.data });
      }
    } catch (e) {
      // Revert optimistic change on error
      setFavoritesCountMap(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - delta) }));
      console.error('Favorite toggle failed:', e);
      Alert.alert('Error', 'Could not update favorites. Please try again.');
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

  const renderResultItem = (result: SearchResult) => {
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
            {isResultFavorite ? (
              <BookmarkCheck size={20} color="#22c55e" />
            ) : (
              <Bookmark size={20} color="#888888" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.resultMeta}>
          <View style={styles.resultType}>
            <Text style={styles.resultTypeText}>
              {result.type.charAt(0).toUpperCase() + result.type.slice(1).replace('_', ' ')}
            </Text>
          </View>

          {(result.type === 'route' || result.type === 'hub' || result.type === 'stop') && (
            <Text style={{ color: '#1ea2b1', fontSize: 12 }}>
              Followers: {favoritesCountMap[result.id] || 0}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const populateFollowerCounts = async (items: SearchResult[]) => {
    const byType: Record<'route'|'hub'|'stop', string[]> = { route: [], hub: [], stop: [] };
    items.forEach(r => { if (r.type === 'route' || r.type === 'hub' || r.type === 'stop') byType[r.type].push(r.id); });

    const newMap: Record<string, number> = {};
    const fetchType = async (type: 'route'|'hub'|'stop') => {
      if (!byType[type].length) return;
      const { data } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', type)
        .in('entity_id', byType[type]);
      (data || []).forEach(f => { newMap[f.entity_id] = (newMap[f.entity_id] || 0) + 1; });
    };

    await Promise.all([fetchType('route'), fetchType('hub'), fetchType('stop')]);
    setFavoritesCountMap(prev => ({ ...prev, ...newMap }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Community</Text>
        <Text style={styles.headerSubtitle}>Find your community by your favorite stops.</Text>
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

      <View style={styles.tabsWrapper}>
      <FlatList
        data={filters}
        horizontal
        showsHorizontalScrollIndicator={false}
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
      </View>

      {/* Search Results */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        {loading ? (
          <SkeletonLoader />
        ) : searchResults.length > 0 ? (
          searchResults.map(renderResultItem)
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
            <Text style={styles.recommendedTitle}>Recommended Nearby</Text>
            {isLoadingRecommended ? (
              <SkeletonLoader />
            ) : recommendedNearby.length > 0 ? (
              recommendedNearby.map(renderResultItem)
            ) : (
              <View style={styles.loadingRecommended}>
                <Text style={styles.loadingRecommendedText}>No nearby locations found</Text>
              </View>
            )}
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
    paddingTop: 40,
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
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
  },
  filtersContainer: {
    flex: 0,
    paddingHorizontal: 16,
    marginBottom: 12,
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
    width: 'auto',
  },
  activeFilterTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  filterText: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
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
    paddingVertical: 40,
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
    flex: 1,
  },
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingRecommended: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingRecommendedText: {
    color: '#888888',
    fontSize: 16,
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333333',
  },
  skeletonTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTitle: {
    height: 16,
    width: '70%',
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    width: '50%',
  },
  skeletonFavorite: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333333',
  },
  skeletonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonTag: {
    width: 60,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  skeletonRouteInfo: {
    width: 40,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
});