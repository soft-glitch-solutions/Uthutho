import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Platform, TextInput, Animated, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Search, Clock, MapPin, Filter, Route as RouteIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import RouteInstructions from '@/components/RouteInstructions';

interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  cost: number;
  transport_type: string;
}

interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  transport_type?: string;
  image?: string;
}

interface Location {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

// Distance calculation function
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const ITEMS_PER_PAGE = 20;

export default function RoutesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'planner' | 'routes' | 'hubs'>('planner');

  // Route Planner State
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [searchingRoute, setSearchingRoute] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<any>(null);

  // Routes State with Pagination
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedTransportType, setSelectedTransportType] = useState<string>('All');
  const [routeFollowerCounts, setRouteFollowerCounts] = useState<Record<string, number>>({});
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesLoadingMore, setRoutesLoadingMore] = useState(false);
  const [routesPage, setRoutesPage] = useState(0);
  const [hasMoreRoutes, setHasMoreRoutes] = useState(true);
  const [isSearchingRoutes, setIsSearchingRoutes] = useState(false);
  const [routesRefreshing, setRoutesRefreshing] = useState(false);

  // Hubs State with Pagination
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [filteredHubs, setFilteredHubs] = useState<Hub[]>([]);
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [selectedHubType, setSelectedHubType] = useState<string>('All');
  const [hubFollowerCounts, setHubFollowerCounts] = useState<Record<string, number>>({});
  const [hubsLoading, setHubsLoading] = useState(false);
  const [hubsLoadingMore, setHubsLoadingMore] = useState(false);
  const [hubsPage, setHubsPage] = useState(0);
  const [hasMoreHubs, setHasMoreHubs] = useState(true);
  const [isSearchingHubs, setIsSearchingHubs] = useState(false);
  const [hubsRefreshing, setHubsRefreshing] = useState(false);

  const transportTypes = ['All', 'Taxi', 'Bus', 'Train','Shuttle'];
  const hubTypes = ['All', 'Taxi', 'Bus', 'Train', 'Metro', 'Interchange'];

  const searchFieldsOpacity = useRef(new Animated.Value(1)).current;
  const [showSearchFields, setShowSearchFields] = useState(true);

  // Refs to track if we're in search mode
  const isRouteSearchMode = useRef(false);
  const isHubSearchMode = useRef(false);

  useEffect(() => {
    loadRoutes(true);
    loadHubs(true);
  }, []);

  useEffect(() => {
    // Debounce search for routes
    const timeoutId = setTimeout(() => {
      if (routeSearchQuery.trim() || selectedTransportType !== 'All') {
        handleRouteSearch();
      } else {
        // If no search query and "All" transport type, reset to normal infinite scroll
        isRouteSearchMode.current = false;
        setFilteredRoutes(routes);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [routeSearchQuery, selectedTransportType]);

  useEffect(() => {
    // Debounce search for hubs
    const timeoutId = setTimeout(() => {
      if (hubSearchQuery.trim() || selectedHubType !== 'All') {
        handleHubSearch();
      } else {
        // If no search query and "All" hub type, reset to normal infinite scroll
        isHubSearchMode.current = false;
        setFilteredHubs(hubs);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [hubSearchQuery, selectedHubType]);

  const loadRoutes = async (initialLoad = false) => {
    if (isRouteSearchMode.current) return; // Don't load more if in search mode

    if (initialLoad) {
      setRoutesLoading(true);
    } else {
      setRoutesLoadingMore(true);
    }

    try {
      const from = initialLoad ? 0 : routesPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('routes')
        .select('*', { count: 'exact' })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (initialLoad) {
        setRoutes(data || []);
        setRoutesPage(1);
        setFilteredRoutes(data || []);
      } else {
        const newRoutes = [...routes, ...(data || [])];
        setRoutes(newRoutes);
        setFilteredRoutes(newRoutes);
        setRoutesPage(prev => prev + 1);
      }

      // Check if there are more items to load
      setHasMoreRoutes((data?.length || 0) === ITEMS_PER_PAGE);

      // Load follower counts for the new routes
      await loadRouteFollowerCounts(data || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setRoutesLoading(false);
      setRoutesLoadingMore(false);
      setRoutesRefreshing(false);
    }
  };

  const loadHubs = async (initialLoad = false) => {
    if (isHubSearchMode.current) return; // Don't load more if in search mode

    if (initialLoad) {
      setHubsLoading(true);
    } else {
      setHubsLoadingMore(true);
    }

    try {
      const from = initialLoad ? 0 : hubsPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('hubs')
        .select('*', { count: 'exact' })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (initialLoad) {
        setHubs(data || []);
        setHubsPage(1);
        setFilteredHubs(data || []);
      } else {
        const newHubs = [...hubs, ...(data || [])];
        setHubs(newHubs);
        setFilteredHubs(newHubs);
        setHubsPage(prev => prev + 1);
      }

      // Check if there are more items to load
      setHasMoreHubs((data?.length || 0) === ITEMS_PER_PAGE);

      // Load follower counts for the new hubs
      await loadHubFollowerCounts(data || []);
    } catch (err) {
      console.error('Failed to load hubs:', err);
    } finally {
      setHubsLoading(false);
      setHubsLoadingMore(false);
      setHubsRefreshing(false);
    }
  };

  const loadRouteFollowerCounts = async (routesData: Route[]) => {
    const routeIds = routesData.map(r => r.id);
    if (routeIds.length) {
      const { data: favs } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', 'route')
        .in('entity_id', routeIds);

      const map: Record<string, number> = {};
      (favs || []).forEach(f => { 
        map[f.entity_id] = (map[f.entity_id] || 0) + 1; 
      });
      setRouteFollowerCounts(prev => ({ ...prev, ...map }));
    }
  };

  const loadHubFollowerCounts = async (hubsData: Hub[]) => {
    const hubIds = hubsData.map(h => h.id);
    if (hubIds.length) {
      const { data: favs } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', 'hub')
        .in('entity_id', hubIds);

      const map: Record<string, number> = {};
      (favs || []).forEach(f => { 
        map[f.entity_id] = (map[f.entity_id] || 0) + 1; 
      });
      setHubFollowerCounts(prev => ({ ...prev, ...map }));
    }
  };

  const handleRouteSearch = async () => {
    if (!routeSearchQuery.trim() && selectedTransportType === 'All') {
      isRouteSearchMode.current = false;
      setFilteredRoutes(routes);
      return;
    }

    setIsSearchingRoutes(true);
    isRouteSearchMode.current = true;

    try {
      let query = supabase
        .from('routes')
        .select('*');

      // Add search conditions
      if (routeSearchQuery.trim()) {
        const searchQuery = routeSearchQuery.toLowerCase();
        query = query.or(`name.ilike.%${searchQuery}%,start_point.ilike.%${searchQuery}%,end_point.ilike.%${searchQuery}%`);
      }

      // Add transport type filter
      if (selectedTransportType !== 'All') {
        query = query.eq('transport_type', selectedTransportType);
      }

      // Limit results for search
      query = query.limit(100); // Increase limit for search results

      const { data, error } = await query;

      if (error) throw error;

      setFilteredRoutes(data || []);
      
      // Load follower counts for search results
      if (data && data.length > 0) {
        await loadRouteFollowerCounts(data);
      }
    } catch (err) {
      console.error('Failed to search routes:', err);
    } finally {
      setIsSearchingRoutes(false);
    }
  };

  const handleHubSearch = async () => {
    if (!hubSearchQuery.trim() && selectedHubType === 'All') {
      isHubSearchMode.current = false;
      setFilteredHubs(hubs);
      return;
    }

    setIsSearchingHubs(true);
    isHubSearchMode.current = true;

    try {
      let query = supabase
        .from('hubs')
        .select('*');

      // Add search conditions
      if (hubSearchQuery.trim()) {
        const searchQuery = hubSearchQuery.toLowerCase();
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,transport_type.ilike.%${searchQuery}%`);
      }

      // Add hub type filter
      if (selectedHubType !== 'All') {
        query = query.eq('transport_type', selectedHubType);
      }

      // Limit results for search
      query = query.limit(100); // Increase limit for search results

      const { data, error } = await query;

      if (error) throw error;

      setFilteredHubs(data || []);
      
      // Load follower counts for search results
      if (data && data.length > 0) {
        await loadHubFollowerCounts(data);
      }
    } catch (err) {
      console.error('Failed to search hubs:', err);
    } finally {
      setIsSearchingHubs(false);
    }
  };

  const loadMoreRoutes = useCallback(() => {
    if (!routesLoadingMore && hasMoreRoutes && !isRouteSearchMode.current) {
      loadRoutes(false);
    }
  }, [routesLoadingMore, hasMoreRoutes, isRouteSearchMode.current]);

  const loadMoreHubs = useCallback(() => {
    if (!hubsLoadingMore && hasMoreHubs && !isHubSearchMode.current) {
      loadHubs(false);
    }
  }, [hubsLoadingMore, hasMoreHubs, isHubSearchMode.current]);

  const handleRefreshRoutes = () => {
    setRoutesRefreshing(true);
    setRoutes([]);
    setRoutesPage(0);
    setHasMoreRoutes(true);
    isRouteSearchMode.current = false;
    setRouteSearchQuery('');
    setSelectedTransportType('All');
    loadRoutes(true);
  };

  const handleRefreshHubs = () => {
    setHubsRefreshing(true);
    setHubs([]);
    setHubsPage(0);
    setHasMoreHubs(true);
    isHubSearchMode.current = false;
    setHubSearchQuery('');
    setSelectedHubType('All');
    loadHubs(true);
  };

  const findRoute = async () => {
    if (!fromLocation || !toLocation) return;

    // Fade out the search fields
    Animated.timing(searchFieldsOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setShowSearchFields(false);
      setSearchingRoute(true);
    });

    // Wait for fade out before searching
    setTimeout(async () => {
      try {
        const fromQuery = fromLocation.display_name.split(',')[0];
        const toQuery = toLocation.display_name.split(',')[0];

        console.log("🗂 Supabase query", { fromQuery, toQuery });

        const { data: matchingRoutes, error } = await supabase
          .from('routes')
          .select('*')
          .ilike('start_point', `%${fromQuery}%`)
          .ilike('end_point', `%${toQuery}%`);

        if (error) {
          console.error("❌ Supabase error:", error);
          return;
        }

        console.log("✅ Matching routes:", matchingRoutes);

        let instructions;
        if (matchingRoutes && matchingRoutes.length > 0) {
          instructions = generateRouteInstructions(fromLocation, toLocation, matchingRoutes);
          console.log("✅ Using specific route instructions");
        } else {
          instructions = {
            hasValidRoute: false,
            fromLocation: fromLocation.display_name.split(',')[0],
            toLocation: toLocation.display_name.split(',')[0],
            totalDuration: 'Unknown',
            totalDistance: calculateDistance(
              parseFloat(fromLocation.lat),
              parseFloat(fromLocation.lon),
              parseFloat(toLocation.lat),
              parseFloat(toLocation.lon)
            ),
            totalCost: 0,
            steps: [],
            isMultiModal: false,
            routes: [],
            message: "We don't have information about this specific route in our system. This route might not be in our database yet."
          };
          console.log("❌ No routes found, showing unknown route message");
        }

        console.log("📝 Generated instructions:", instructions);
        setRouteInstructions(instructions);
      } catch (err) {
        console.error("❌ Error finding route:", err);
        setRouteInstructions({
          hasValidRoute: false,
          fromLocation: fromLocation?.display_name.split(',')[0] || 'Starting point',
          toLocation: toLocation?.display_name.split(',')[0] || 'Destination',
          totalDuration: 'Unknown',
          totalDistance: 0,
          totalCost: 0,
          steps: [],
          isMultiModal: false,
          routes: [],
          message: "We encountered an error while searching for this route. Please try again."
        });
      } finally {
        setSearchingRoute(false);
      }
    }, 400);
  };

  const generateRouteInstructions = (from: Location, to: Location, routes: Route[]) => {
    const bestRoute = routes[0];
    const totalDistance = calculateDistance(
      parseFloat(from.lat),
      parseFloat(from.lon),
      parseFloat(to.lat),
      parseFloat(to.lon)
    );

    return {
      fromLocation: from.display_name.split(',')[0],
      toLocation: to.display_name.split(',')[0],
      totalDuration: '45-60 min',
      totalDistance: totalDistance,
      totalCost: bestRoute.cost,
      steps: [
        {
          instruction: `Walk to the nearest ${bestRoute.transport_type} stop`,
          transport_type: 'Walking',
          duration: '5-10 min',
          distance: totalDistance * 0.1, // Estimate walking distance
        },
        {
          instruction: `Take ${bestRoute.name} from ${bestRoute.start_point} to ${bestRoute.end_point}`,
          transport_type: bestRoute.transport_type,
          duration: '30-45 min',
          cost: bestRoute.cost,
          distance: totalDistance * 0.8, // Estimate transport distance
          entityId: bestRoute.id,
          entityType: 'route' as const,
          navigationLink: `/route-details?routeId=${bestRoute.id}`,
        },
        {
          instruction: 'Walk to your destination',
          transport_type: 'Walking',
          duration: '5-10 min',
          distance: totalDistance * 0.1, // Estimate walking distance
        },
      ],
      isMultiModal: false,
      routes: [{
        routeId: bestRoute.id,
        routeName: bestRoute.name,
        transportType: bestRoute.transport_type,
        navigationLink: `/route-details?routeId=${bestRoute.id}`
      }],
      hasValidRoute: true,
    };
  };

  const navigateToRoute = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  const navigateToHub = (hubId: string) => {
    router.push(`/hub/${hubId}`);
  };

  // Skeleton Loader Components
  const RouteSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
        <View style={[styles.skeletonLine, { width: '30%', height: 12 }]} />
      </View>
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonLine, { width: '40%', height: 14 }]} />
        <View style={[styles.skeletonLine, { width: '20%', height: 14 }]} />
      </View>
    </View>
  );

  const HubSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonInfo}>
          <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '90%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '30%', height: 12 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 12 }]} />
    </View>
  );

  // Skeleton loading for refresh - shows multiple skeleton items
  const RouteSkeletonList = () => (
    <View style={styles.listContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <RouteSkeleton key={`route-skeleton-${index}`} />
      ))}
    </View>
  );

  const HubSkeletonList = () => (
    <View style={styles.listContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <HubSkeleton key={`hub-skeleton-${index}`} />
      ))}
    </View>
  );

  const RouteItem = ({ route }: { route: Route }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => navigateToRoute(route.id)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{route.name}</Text>
          <Text style={[styles.coordinatesText, { marginTop: 4, color: '#1ea2b1' }]}>
            Followers: {routeFollowerCounts[route.id] || 0}
          </Text>
        </View>
        <View style={styles.routeType}>
          <Text style={styles.routeTypeText}>{route.transport_type}</Text>
        </View>
      </View>

      <View style={styles.routeFooter}>
        <View style={styles.routeDetail}>
          <Clock size={16} color="#1ea2b1" />
          <Text style={styles.routeDetailText}>Est. 45-60 min</Text>
        </View>
        <Text style={styles.routeCost}>R {route.cost}</Text>
      </View>
    </TouchableOpacity>
  );

  const HubItem = ({ hub }: { hub: Hub }) => (
    <TouchableOpacity
      style={styles.hubCard}
      onPress={() => navigateToHub(hub.id)}
    >
      <View style={styles.hubHeader}>
        <MapPin size={24} color="#1ea2b1" />
        <View style={styles.hubInfo}>
          <Text style={styles.hubName}>{hub.name}</Text>
          {hub.address && (
            <Text style={styles.hubAddress}>{hub.address}</Text>
          )}
          {hub.transport_type && (
            <Text style={styles.hubType}>{hub.transport_type}</Text>
          )}
        </View>
      </View>
      <View style={styles.hubCoordinates}>
        <Text style={[styles.coordinatesText, { marginTop: 4, color: '#1ea2b1' }]}>
          Followers: {hubFollowerCounts[hub.id] || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ListFooterComponent = ({ loadingMore, isSearchMode }: { loadingMore: boolean; isSearchMode: boolean }) => {
    if (isSearchMode) return null; // Don't show load more in search mode
    
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1ea2b1" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const ListEmptyComponent = ({ loading, isSearching, type }: { loading: boolean; isSearching: boolean; type: string }) => {
    if (loading || isSearching) {
      return null; // We'll handle skeleton loading in the main render
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {isSearching ? `No ${type}s match your search` : `No ${type}s found`}
        </Text>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'planner':
        return (
          <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
            <View style={styles.searchCard}>
              {showSearchFields && (
                <Animated.View style={{ opacity: searchFieldsOpacity }}>
                  {/* From/To fields and Find Route button */}
                  <View style={{ zIndex: 2000 }}>
                    <Text style={styles.inputLabel}>From</Text>
                    <LocationAutocomplete
                      placeholder="Your current location"
                      value={fromText}
                      onChangeText={setFromText}
                      onLocationSelect={setFromLocation}
                    />
                  </View>

                  <View style={{ zIndex: 1000 }}>
                    <Text style={styles.inputLabel}>To</Text>
                    <LocationAutocomplete
                      placeholder="Your destination"
                      value={toText}
                      onChangeText={setToText}
                      onLocationSelect={setToLocation}
                    />
                    <Text style={{ color: '#666666', fontSize: 12, marginTop: 8 }}>
                      Note: Searches are limited to South Africa addresses.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.searchButton, (!fromLocation || !toLocation) && styles.searchButtonDisabled]}
                    onPress={findRoute}
                    disabled={!fromLocation || !toLocation || searchingRoute}
                  >
                    <Search size={20} color="#ffffff" style={styles.searchIcon} />
                    <Text style={styles.searchButtonText}>
                      {searchingRoute ? 'Finding Route...' : 'Find Route'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
              {!showSearchFields && searchingRoute && (
                <View style={{ alignItems: 'center', padding: 32 }}>
                  <ActivityIndicator size="large" color="#1ea2b1" />
                  <Text style={{ color: '#1ea2b1', marginTop: 16, fontSize: 16 }}>
                    Finding the best route...
                  </Text>
                </View>
              )}
            </View>

            {/* Route Instructions */}
            {routeInstructions && (
              <View>
                <View style={styles.instructionsContainer}>
                  <RouteInstructions {...routeInstructions} />
                </View>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => {
                    setShowSearchFields(true);
                    searchFieldsOpacity.setValue(1);
                    setRouteInstructions(null);
                    setFromLocation(null);
                    setToLocation(null);
                    setFromText('');
                    setToText('');
                  }}
                >
                  <Text style={styles.searchButtonText}>Plan Another Route</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );

      case 'routes':
        return (
          <View style={styles.tabContent}>
            {/* Search and Filter */}
            <View style={styles.filterSection}>
              <View style={styles.searchContainer}>
                <Search size={20} color="#666666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search routes..."
                  placeholderTextColor="#666666"
                  value={routeSearchQuery}
                  onChangeText={setRouteSearchQuery}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {transportTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      selectedTransportType === type && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedTransportType(type)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedTransportType === type && styles.filterButtonTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Show skeleton loading during refresh */}
            {(routesRefreshing || routesLoading) && filteredRoutes.length === 0 ? (
              <RouteSkeletonList />
            ) : (
              /* Routes List with Infinite Scroll */
              <FlatList
                data={filteredRoutes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <RouteItem route={item} />}
                onEndReached={loadMoreRoutes}
                onEndReachedThreshold={0.5}
                onRefresh={handleRefreshRoutes}
                refreshing={routesRefreshing}
                ListFooterComponent={<ListFooterComponent loadingMore={routesLoadingMore} isSearchMode={isRouteSearchMode.current} />}
                ListEmptyComponent={<ListEmptyComponent loading={routesLoading} isSearching={isSearchingRoutes} type="route" />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );

      case 'hubs':
        return (
          <View style={styles.tabContent}>
            {/* Search and Filter for Hubs */}
            <View style={styles.filterSection}>
              <View style={styles.searchContainer}>
                <Search size={20} color="#666666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search hubs by name, address or type..."
                  placeholderTextColor="#666666"
                  value={hubSearchQuery}
                  onChangeText={setHubSearchQuery}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {hubTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      selectedHubType === type && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedHubType(type)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedHubType === type && styles.filterButtonTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Show skeleton loading during refresh */}
            {(hubsRefreshing || hubsLoading) && filteredHubs.length === 0 ? (
              <HubSkeletonList />
            ) : (
              /* Hubs List with Infinite Scroll */
              <FlatList
                data={filteredHubs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <HubItem hub={item} />}
                onEndReached={loadMoreHubs}
                onEndReachedThreshold={0.5}
                onRefresh={handleRefreshHubs}
                refreshing={hubsRefreshing}
                ListFooterComponent={<ListFooterComponent loadingMore={hubsLoadingMore} isSearchMode={isHubSearchMode.current} />}
                ListEmptyComponent={<ListEmptyComponent loading={hubsLoading} isSearching={isSearchingHubs} type="hub" />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Transport</Text>
        <Text style={styles.subtitle}>Plan your journey with ease</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'planner' && styles.activeTab]}
          onPress={() => setActiveTab('planner')}
        >
          <Search size={20} color={activeTab === 'planner' ? '#1ea2b1' : '#666666'} />
          <Text style={[styles.tabText, activeTab === 'planner' && styles.activeTabText]}>
            Planner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <RouteIcon size={20} color={activeTab === 'routes' ? '#1ea2b1' : '#666666'} />
          <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
            Routes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'hubs' && styles.activeTab]}
          onPress={() => setActiveTab('hubs')}
        >
          <MapPin size={20} color={activeTab === 'hubs' ? '#1ea2b1' : '#666666'} />
          <Text style={[styles.tabText, activeTab === 'hubs' && styles.activeTabText]}>
            Hubs
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1ea2b1',
  },
  tabContent: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#1ea2b1',
  },
  filterButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  routeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeType: {
    backgroundColor: '#1ea2b120',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeTypeText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailText: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 4,
  },
  routeCost: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hubCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hubInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  hubAddress: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  hubType: {
    fontSize: 12,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hubCoordinates: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    color: '#1ea2b1',
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  searchButtonDisabled: {
    backgroundColor: '#333333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  // Skeleton Loader Styles
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonHeader: {
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLine: {
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 12,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
});