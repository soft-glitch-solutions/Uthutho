import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Bookmark, 
  BookmarkCheck, 
  Users, 
  Clock, 
  DollarSign,
  ArrowLeft,
  X
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFavorites, FavoriteItem } from '@/hook/useFavorites';
import { useAuth } from '@/hook/useAuth';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface SearchResult {
  id: string;
  name: string;
  type: 'route' | 'stop' | 'hub' | 'nearby_spot';
  data: any;
  distance?: number;
}

// Skeleton Loading Component
const SkeletonLoader = ({ isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
  
  return (
    <View style={[styles.skeletonContainer, desktopMode && styles.skeletonContainerDesktop]}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={[styles.skeletonCard, desktopMode && styles.skeletonCardDesktop]}>
          <View style={[styles.skeletonHeader, desktopMode && styles.skeletonHeaderDesktop]}>
            <View style={[styles.skeletonIcon, desktopMode && styles.skeletonIconDesktop]} />
            <View style={[styles.skeletonTextContainer, desktopMode && styles.skeletonTextContainerDesktop]}>
              <View style={[styles.skeletonLine, styles.skeletonTitle, desktopMode && styles.skeletonTitleDesktop]} />
              <View style={[styles.skeletonLine, styles.skeletonSubtitle, desktopMode && styles.skeletonSubtitleDesktop]} />
            </View>
            <View style={[styles.skeletonFavorite, desktopMode && styles.skeletonFavoriteDesktop]} />
          </View>
          <View style={[styles.skeletonMeta, desktopMode && styles.skeletonMetaDesktop]}>
            <View style={[styles.skeletonTag, desktopMode && styles.skeletonTagDesktop]} />
            <View style={[styles.skeletonRouteInfo, desktopMode && styles.skeletonRouteInfoDesktop]} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Follow Button Component
const FollowButton = ({ 
  isFollowing, 
  onToggle, 
  loading, 
  followerCount,
  isDesktop = false 
}: { 
  isFollowing: boolean; 
  onToggle: () => void; 
  loading: boolean; 
  followerCount: number;
  isDesktop?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.followButton,
        isDesktop && styles.followButtonDesktop,
        isFollowing && styles.followingButton,
        loading && styles.followButtonLoading,
      ]}
      onPress={onToggle}
      disabled={loading}
    >
      {loading ? (
        <View style={styles.followButtonLoadingContent}>
          <Text style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText,
            isDesktop && styles.followButtonTextDesktop,
          ]}>
            {isFollowing ? 'Unfollowing...' : 'Following...'}
          </Text>
        </View>
      ) : (
        <View style={styles.followButtonContent}>
          {isFollowing ? (
            <>
              <BookmarkCheck size={isDesktop ? 14 : 16} color="#ffffff" />
              <Text style={[
                styles.followButtonText,
                styles.followingButtonText,
                isDesktop && styles.followButtonTextDesktop,
              ]}>
                Following
              </Text>
              {followerCount > 0 && (
                <View style={[styles.followerCountBadge, isDesktop && styles.followerCountBadgeDesktop]}>
                  <Text style={styles.followerCountText}>{followerCount}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Users size={isDesktop ? 14 : 16} color="#1ea2b1" />
              <Text style={[
                styles.followButtonText,
                isDesktop && styles.followButtonTextDesktop,
              ]}>
                Follow
              </Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Header Component with Back Button
const HeaderWithBack = ({ 
  onBack, 
  title = "Explore Communities",
  subtitle = "Discover and follow routes, stops, and hubs in your community",
  isDesktop = false 
}: { 
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  isDesktop?: boolean;
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer, isDesktop && styles.headerContainerDesktop]}>

      <View style={[styles.headerContent, isDesktop && styles.headerContentDesktop]}>
        <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>
          {title}
        </Text>
        <Text style={[styles.headerSubtitle, isDesktop && styles.headerSubtitleDesktop]}>
          {subtitle}
        </Text>
      </View>
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
  const [togglingFavorites, setTogglingFavorites] = useState<Record<string, boolean>>({});
  const router = useRouter();
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

      // Get routes
      const { data: routes } = await supabase
        .from('routes')
        .select('*')
        .limit(8);

      if (routes) {
        console.log('Routes found:', routes.length);
        routes.forEach(route => {
          results.push({
            id: route.id,
            name: route.name,
            type: 'route',
            data: route,
          });
        });
      }

      // Sort by distance (where available)
      const sortedResults = results.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });
      
      console.log('Final recommended results:', sortedResults.length);
      setRecommendedNearby(sortedResults.slice(0, 8));
      populateFollowerCounts(sortedResults);
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
    const entityType: 'route' | 'hub' | 'stop' = result.type as 'route' | 'hub' | 'stop';
    if (entityType === 'nearby_spot') {
      Alert.alert('Not Supported', 'Nearby spots cannot be bookmarked yet.');
      return;
    }

    const id = result.id;
    const isFav = isFavorite(id);
    const delta = isFav ? -1 : 1;

    // Set loading state
    setTogglingFavorites(prev => ({ ...prev, [id]: true }));

    // Optimistic UI update
    setFavoritesCountMap(prev => ({ 
      ...prev, 
      [id]: Math.max(0, (prev[id] || 0) + delta) 
    }));

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

        await addToFavorites({ 
          id, 
          type: entityType, 
          name: result.name, 
          data: result.data 
        });
      }
    } catch (e) {
      // Revert optimistic change on error
      setFavoritesCountMap(prev => ({ 
        ...prev, 
        [id]: Math.max(0, (prev[id] || 0) - delta) 
      }));
      console.error('Favorite toggle failed:', e);
      Alert.alert('Error', 'Could not update favorites. Please try again.');
    } finally {
      setTogglingFavorites(prev => ({ ...prev, [id]: false }));
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
    const followerCount = favoritesCountMap[result.id] || 0;
    const isLoading = togglingFavorites[result.id] || false;

    const handlePress = () => {
      // Navigate to appropriate detail screen based on type
      switch (result.type) {
        case 'hub':
          router.push(`/hub/${result.id}`);
          break;
        case 'route':
          router.push(`/route-details?routeId=${result.id}`);
          break;
        case 'stop':
          router.push(`/stop-details?stopId=${result.id}`);
          break;
        case 'nearby_spot':
          // You might want to create a nearby-spot-details screen
          router.push(`/nearby/${result.id}`);
          break;
        default:
          console.warn('Unknown result type:', result.type);
      }
    };
    
    return (
      <TouchableOpacity 
        key={result.id} 
        style={[styles.resultCard, isDesktop && styles.resultCardDesktop]}
        onPress={handlePress}
      >
        <View style={[styles.resultHeader, isDesktop && styles.resultHeaderDesktop]}>
          <View style={[styles.resultInfo, isDesktop && styles.resultInfoDesktop]}>
            <IconComponent size={isDesktop ? 18 : 20} color="#1ea2b1" />
            <View style={[styles.resultDetails, isDesktop && styles.resultDetailsDesktop]}>
              <Text style={[styles.resultTitle, isDesktop && styles.resultTitleDesktop]} numberOfLines={1}>
                {result.name}
              </Text>
              <Text style={[styles.resultSubtitle, isDesktop && styles.resultSubtitleDesktop]} numberOfLines={2}>
                {getResultSubtitle(result)}
              </Text>
            </View>
          </View>
          
          {result.type !== 'nearby_spot' && (
            <FollowButton
              isFollowing={isResultFavorite}
              onToggle={() => handleFavoriteToggle(result)}
              loading={isLoading}
              followerCount={followerCount}
              isDesktop={isDesktop}
            />
          )}
        </View>
        
        <View style={[styles.resultMeta, isDesktop && styles.resultMetaDesktop]}>
          <View style={[styles.resultType, isDesktop && styles.resultTypeDesktop]}>
            <Text style={[styles.resultTypeText, isDesktop && styles.resultTypeTextDesktop]}>
              {result.type.charAt(0).toUpperCase() + result.type.slice(1).replace('_', ' ')}
            </Text>
          </View>

          {result.type !== 'nearby_spot' && followerCount > 0 && (
            <View style={styles.followerCountContainer}>
              <Users size={isDesktop ? 12 : 14} color="#1ea2b1" />
              <Text style={[styles.followersText, isDesktop && styles.followersTextDesktop]}>
                {followerCount} follower{followerCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const populateFollowerCounts = async (items: SearchResult[]) => {
    const byType: Record<'route'|'hub'|'stop', string[]> = { route: [], hub: [], stop: [] };
    items.forEach(r => { 
      if (r.type === 'route' || r.type === 'hub' || r.type === 'stop') {
        byType[r.type].push(r.id);
      }
    });

    const newMap: Record<string, number> = {};
    const fetchType = async (type: 'route'|'hub'|'stop') => {
      if (!byType[type].length) return;
      const { data } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', type)
        .in('entity_id', byType[type]);
      (data || []).forEach(f => { 
        newMap[f.entity_id] = (newMap[f.entity_id] || 0) + 1; 
      });
    };

    await Promise.all([
      fetchType('route'), 
      fetchType('hub'), 
      fetchType('stop')
    ]);
    setFavoritesCountMap(prev => ({ ...prev, ...newMap }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDesktop && styles.safeAreaDesktop]}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Desktop layout with centered content */}
        {isDesktop ? (
          <ScrollView 
            style={styles.desktopScrollWrapper}
            contentContainerStyle={styles.desktopScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.desktopContentWrapper}>
              <HeaderWithBack 
                isDesktop={isDesktop}
                onBack={() => router.back()}
              />

              {/* Search Input */}
              <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
                <View style={[styles.searchInputContainer, isDesktop && styles.searchInputContainerDesktop]}>
                  <Search size={isDesktop ? 18 : 20} color="#1ea2b1" />
                  <TextInput
                    style={[styles.searchInput, isDesktop && styles.searchInputDesktop]}
                    placeholder="Search for routes, stops, hubs..."
                    placeholderTextColor="#888888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={!isDesktop}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButton}
                    >
                      <X size={isDesktop ? 16 : 18} color="#888888" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={[styles.tabsWrapper, isDesktop && styles.tabsWrapperDesktop]}>
                <ScrollView 
                  horizontal={!isDesktop}
                  showsHorizontalScrollIndicator={!isDesktop}
                  contentContainerStyle={[styles.filtersContainer, isDesktop && styles.filtersContainerDesktop]}
                >
                  {filters.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.filterTab, 
                        isDesktop && styles.filterTabDesktop,
                        selectedFilter === item.key && styles.activeFilterTab
                      ]}
                      onPress={() => setSelectedFilter(item.key as any)}
                    >
                      <item.icon size={isDesktop ? 14 : 16} color={selectedFilter === item.key ? '#FFFFFF' : '#888888'} />
                      <Text style={[
                        styles.filterText, 
                        isDesktop && styles.filterTextDesktop,
                        selectedFilter === item.key && styles.activeFilterText
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Search Results */}
              <ScrollView 
                style={[styles.resultsContainer, isDesktop && styles.resultsContainerDesktop]} 
                contentContainerStyle={[styles.resultsContent, isDesktop && styles.resultsContentDesktop]}
                showsVerticalScrollIndicator={isDesktop}
              >
                {loading ? (
                  <SkeletonLoader isDesktop={isDesktop} />
                ) : searchResults.length > 0 ? (
                  <View style={styles.desktopResultsGrid}>
                    {searchResults.map((result, index) => (
                      <View key={result.id} style={[
                        styles.desktopResultColumn,
                        index % 2 === 0 ? styles.desktopResultLeft : styles.desktopResultRight
                      ]}>
                        {renderResultItem(result)}
                      </View>
                    ))}
                  </View>
                ) : searchQuery.length > 2 ? (
                  <View style={[styles.noResultsContainer, isDesktop && styles.noResultsContainerDesktop]}>
                    <Search size={isDesktop ? 40 : 48} color="#333333" />
                    <Text style={[styles.noResultsTitle, isDesktop && styles.noResultsTitleDesktop]}>No results found</Text>
                    <Text style={[styles.noResultsText, isDesktop && styles.noResultsTextDesktop]}>
                      Try searching with different keywords or check your spelling.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.emptyStateContainer, isDesktop && styles.emptyStateContainerDesktop]}>
                    <Text style={[styles.recommendedTitle, isDesktop && styles.recommendedTitleDesktop]}>
                      Recommended Nearby
                    </Text>
                    {isLoadingRecommended ? (
                      <SkeletonLoader isDesktop={isDesktop} />
                    ) : recommendedNearby.length > 0 ? (
                      <View style={styles.desktopResultsGrid}>
                        {recommendedNearby.map((result, index) => (
                          <View key={result.id} style={[
                            styles.desktopResultColumn,
                            index % 2 === 0 ? styles.desktopResultLeft : styles.desktopResultRight
                          ]}>
                            {renderResultItem(result)}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.loadingRecommended, isDesktop && styles.loadingRecommendedDesktop]}>
                        <Text style={[styles.loadingRecommendedText, isDesktop && styles.loadingRecommendedTextDesktop]}>
                          No nearby locations found
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          // Mobile layout
          <>
            <HeaderWithBack 
              onBack={() => router.back()}
            />

            {/* Search Input */}
            <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
              <View style={[styles.searchInputContainer, isDesktop && styles.searchInputContainerDesktop]}>
                <Search size={isDesktop ? 18 : 20} color="#1ea2b1" />
                <TextInput
                  style={[styles.searchInput, isDesktop && styles.searchInputDesktop]}
                  placeholder="Search for routes, stops, hubs..."
                  placeholderTextColor="#888888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={!isDesktop}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <X size={isDesktop ? 16 : 18} color="#888888" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.tabsWrapper, isDesktop && styles.tabsWrapperDesktop]}>
              <ScrollView 
                horizontal={!isDesktop}
                showsHorizontalScrollIndicator={!isDesktop}
                contentContainerStyle={[styles.filtersContainer, isDesktop && styles.filtersContainerDesktop]}
              >
                {filters.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterTab, 
                      isDesktop && styles.filterTabDesktop,
                      selectedFilter === item.key && styles.activeFilterTab
                    ]}
                    onPress={() => setSelectedFilter(item.key as any)}
                  >
                    <item.icon size={isDesktop ? 14 : 16} color={selectedFilter === item.key ? '#FFFFFF' : '#888888'} />
                    <Text style={[
                      styles.filterText, 
                      isDesktop && styles.filterTextDesktop,
                      selectedFilter === item.key && styles.activeFilterText
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Search Results */}
            <ScrollView 
              style={[styles.resultsContainer, isDesktop && styles.resultsContainerDesktop]} 
              contentContainerStyle={[styles.resultsContent, isDesktop && styles.resultsContentDesktop]}
              showsVerticalScrollIndicator={isDesktop}
            >
              {loading ? (
                <SkeletonLoader isDesktop={isDesktop} />
              ) : searchResults.length > 0 ? (
                searchResults.map(renderResultItem)
              ) : searchQuery.length > 2 ? (
                <View style={[styles.noResultsContainer, isDesktop && styles.noResultsContainerDesktop]}>
                  <Search size={isDesktop ? 40 : 48} color="#333333" />
                  <Text style={[styles.noResultsTitle, isDesktop && styles.noResultsTitleDesktop]}>No results found</Text>
                  <Text style={[styles.noResultsText, isDesktop && styles.noResultsTextDesktop]}>
                    Try searching with different keywords or check your spelling.
                  </Text>
                </View>
              ) : (
                <View style={[styles.emptyStateContainer, isDesktop && styles.emptyStateContainerDesktop]}>
                  <Text style={[styles.recommendedTitle, isDesktop && styles.recommendedTitleDesktop]}>
                    Recommended Nearby
                  </Text>
                  {isLoadingRecommended ? (
                    <SkeletonLoader isDesktop={isDesktop} />
                  ) : recommendedNearby.length > 0 ? (
                    recommendedNearby.map(renderResultItem)
                  ) : (
                    <View style={[styles.loadingRecommended, isDesktop && styles.loadingRecommendedDesktop]}>
                      <Text style={[styles.loadingRecommendedText, isDesktop && styles.loadingRecommendedTextDesktop]}>
                        No nearby locations found
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeAreaDesktop: {
    backgroundColor: '#000000',
  },
  
  // Header Styles
  headerContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerContainerDesktop: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonDesktop: {
    gap: 6,
  },
  
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  headerContent: {
    // No additional styles needed
  },
  headerContentDesktop: {
    // No additional styles needed
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerTitleDesktop: {
    fontSize: 32,
    marginBottom: 6,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: '#888888',
    lineHeight: 22,
  },
  headerSubtitleDesktop: {
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Clear Search Button
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Base styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  containerDesktop: {
    width: '100%',
  },
  
  // Desktop wrapper styles
  desktopScrollWrapper: {
    flex: 1,
    width: '100%',
  },
  desktopScrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  desktopContentWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  searchContainerDesktop: {
    paddingHorizontal: 32,
    marginBottom: 20,
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
  searchInputContainerDesktop: {
    borderRadius: 10,
    padding: 14,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchInputDesktop: {
    marginLeft: 10,
    fontSize: 15,
  },
  
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
    width: '100%',
  },
  tabsWrapperDesktop: {
    borderBottomWidth: 0,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  
  filtersContainer: {
    flex: 0,
    paddingHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 4,
  },
  filtersContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 0,
    gap: 8,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
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
  filterTabDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    margin: 0,
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
  filterTextDesktop: {
    fontSize: 13,
    marginLeft: 4,
  },
  
  activeFilterText: {
    color: '#FFFFFF',
  },
  
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  resultsContainerDesktop: {
    paddingHorizontal: 32,
  },
  
  resultsContent: {
    padding: 16,
    paddingBottom: 100,
    width: '100%',
  },
  resultsContentDesktop: {
    padding: 0,
    paddingBottom: 40,
  },
  
  desktopResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  
  desktopResultColumn: {
    width: '48%',
    minWidth: 280,
  },
  
  desktopResultLeft: {},
  desktopResultRight: {},
  
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
    width: '100%',
  },
  resultCardDesktop: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
  },
  
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultHeaderDesktop: {
    marginBottom: 10,
  },
  
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  resultInfoDesktop: {
    alignItems: 'center',
  },
  
  resultDetails: {
    marginLeft: 12,
    flex: 1,
  },
  resultDetailsDesktop: {
    marginLeft: 10,
  },
  
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultTitleDesktop: {
    fontSize: 15,
    marginBottom: 3,
  },
  
  resultSubtitle: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 18,
  },
  resultSubtitleDesktop: {
    fontSize: 13,
    lineHeight: 16,
  },
  
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultMetaDesktop: {
    marginTop: 2,
  },
  
  resultType: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultTypeDesktop: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  
  resultTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultTypeTextDesktop: {
    fontSize: 11,
  },
  
  // Follow Button Styles
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#000000ff',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
  },
  
  followingButton: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  
  followButtonLoading: {
    opacity: 0.7,
  },
  
  followButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  
  followButtonLoadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  followButtonTextDesktop: {
    fontSize: 13,
  },
  
  followingButtonText: {
    color: '#ffffff',
  },
  
  followerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  followersText: {
    color: '#1ea2b1',
    fontSize: 12,
  },
  followersTextDesktop: {
    fontSize: 11,
  },
  
  followerCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  followerCountBadgeDesktop: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 3,
  },
  
  followerCountText: {
    color: '#ffffff',
    fontSize: 10,
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
  noResultsContainerDesktop: {
    paddingVertical: 60,
  },
  
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsTitleDesktop: {
    fontSize: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  
  noResultsText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  noResultsTextDesktop: {
    fontSize: 18,
    lineHeight: 24,
    maxWidth: 400,
  },
  
  emptyStateContainer: {
    flex: 1,
  },
  emptyStateContainerDesktop: {
    paddingTop: 8,
  },
  
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recommendedTitleDesktop: {
    fontSize: 22,
    marginBottom: 20,
  },
  
  loadingRecommended: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingRecommendedDesktop: {
    paddingVertical: 60,
  },
  
  loadingRecommendedText: {
    color: '#888888',
    fontSize: 16,
  },

  loadingRecommendedTextDesktop: {
    fontSize: 18,
  },
  
  // Skeleton Loading Styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonContainerDesktop: {
    // Additional desktop styles for skeleton
  },
  
  skeletonCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonCardDesktop: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
  },
  
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skeletonHeaderDesktop: {
    marginBottom: 10,
  },
  
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333333',
  },
  skeletonIconDesktop: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  
  skeletonTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonTextContainerDesktop: {
    marginLeft: 10,
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
  skeletonTitleDesktop: {
    height: 15,
    marginBottom: 6,
  },
  
  skeletonSubtitle: {
    height: 14,
    width: '50%',
  },
  skeletonSubtitleDesktop: {
    height: 13,
  },
  
  skeletonFavorite: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333333',
  },
  skeletonFavoriteDesktop: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  
  skeletonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonMetaDesktop: {
    marginTop: 2,
  },
  
  skeletonTag: {
    width: 60,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  skeletonTagDesktop: {
    width: 50,
    height: 18,
    borderRadius: 5,
  },
  
  skeletonRouteInfo: {
    width: 40,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  skeletonRouteInfoDesktop: {
    width: 35,
    height: 13,
  },
});