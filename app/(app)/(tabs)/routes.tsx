import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
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

  // Routes State
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedTransportType, setSelectedTransportType] = useState<string>('All');

  // Hubs State
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [filteredHubs, setFilteredHubs] = useState<Hub[]>([]);
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [selectedHubType, setSelectedHubType] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [loadingHubs, setLoadingHubs] = useState(false);

  const transportTypes = ['All', 'Taxi', 'Bus', 'Train'];
  const hubTypes = ['All', 'Taxi', 'Bus', 'Train', 'Metro', 'Interchange'];

  useEffect(() => {
    loadRoutes();
    loadHubs();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [routes, routeSearchQuery, selectedTransportType]);

  useEffect(() => {
    filterHubs();
  }, [hubs, hubSearchQuery, selectedHubType]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .limit(50);

      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHubs = async () => {
    setLoadingHubs(true);
    try {
      const { data, error } = await supabase
        .from('hubs')
        .select('*')
        .limit(50);

      if (error) throw error;
      setHubs(data || []);
      setFilteredHubs(data || []);
    } catch (err) {
      console.error('Failed to load hubs:', err);
    } finally {
      setLoadingHubs(false);
    }
  };

  const filterRoutes = () => {
    let filtered = routes;

    if (routeSearchQuery.trim()) {
      const query = routeSearchQuery.toLowerCase();
      filtered = filtered.filter(route =>
        route.name.toLowerCase().includes(query) ||
        route.start_point.toLowerCase().includes(query) ||
        route.end_point.toLowerCase().includes(query)
      );
    }

    if (selectedTransportType !== 'All') {
      filtered = filtered.filter(route =>
        route.transport_type === selectedTransportType
      );
    }

    setFilteredRoutes(filtered);
  };

  const filterHubs = () => {
    let filtered = hubs;

    if (hubSearchQuery.trim()) {
      const query = hubSearchQuery.toLowerCase();
      filtered = filtered.filter(hub =>
        hub.name.toLowerCase().includes(query) ||
        (hub.address && hub.address.toLowerCase().includes(query)) ||
        (hub.transport_type && hub.transport_type.toLowerCase().includes(query))
      );
    }

    if (selectedHubType !== 'All') {
      filtered = filtered.filter(hub =>
        hub.transport_type === selectedHubType
      );
    }

    setFilteredHubs(filtered);
  };

  const findRoute = async () => {
    if (!fromLocation || !toLocation) return;

    setSearchingRoute(true);

    try {
      const { data: matchingRoutes, error } = await supabase
        .from('routes')
        .select('*')
        .ilike('start_point', `%${fromLocation.display_name.split(',')[0]}%`)
        .ilike('end_point', `%${toLocation.display_name.split(',')[0]}%`);

      if (error) throw error;

      const instructions =
        matchingRoutes && matchingRoutes.length > 0
          ? generateRouteInstructions(fromLocation, toLocation, matchingRoutes)
          : generateGeneralInstructions(fromLocation, toLocation);

      setRouteInstructions(instructions);
    } catch (err) {
      console.error('Error finding route:', err);
    } finally {
      setSearchingRoute(false);
    }
  };

  const generateRouteInstructions = (from: Location, to: Location, routes: Route[]) => {
    const bestRoute = routes[0];
    return {
      fromLocation: from.display_name.split(',')[0],
      toLocation: to.display_name.split(',')[0],
      totalDuration: '45-60 min',
      totalCost: bestRoute.cost,
      steps: [
        {
          instruction: `Walk to the nearest ${bestRoute.transport_type} stop`,
          transport_type: 'Walking',
          duration: '5-10 min',
        },
        {
          instruction: `Take ${bestRoute.name} from ${bestRoute.start_point} to ${bestRoute.end_point}`,
          transport_type: bestRoute.transport_type,
          duration: '30-45 min',
          cost: bestRoute.cost,
        },
        {
          instruction: 'Walk to your destination',
          transport_type: 'Walking',
          duration: '5-10 min',
        },
      ],
    };
  };

  const generateGeneralInstructions = (from: Location, to: Location) => ({
    fromLocation: from.display_name.split(',')[0],
    toLocation: to.display_name.split(',')[0],
    totalDuration: '60-90 min',
    totalCost: 25,
    steps: [
      {
        instruction: 'Walk to the nearest taxi rank or bus stop',
        transport_type: 'Walking',
        duration: '10-15 min',
      },
      {
        instruction: 'Take a taxi or bus towards your destination area',
        transport_type: 'Taxi/Bus',
        duration: '40-60 min',
        cost: 20,
      },
      {
        instruction: 'Transfer to local transport if needed',
        transport_type: 'Local Transport',
        duration: '10-15 min',
        cost: 5,
      },
      {
        instruction: 'Walk to your final destination',
        transport_type: 'Walking',
        duration: '5-10 min',
      },
    ],
  });

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'planner':
        return (
          <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
            {/* Search Form */}
            <View style={styles.searchCard}>
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
            </View>

            {/* Route Instructions */}
            {routeInstructions && (
              <View style={styles.instructionsContainer}>
                <RouteInstructions {...routeInstructions} />
              </View>
            )}
          </ScrollView>
        );

      case 'routes':
        return (
          <ScrollView style={styles.tabContent}>
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

            {/* Routes List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {filteredRoutes.length} Routes Found
              </Text>

              {loading ? (
                // Skeleton Loader for Routes
                Array.from({ length: 5 }).map((_, index) => (
                  <RouteSkeleton key={index} />
                ))
              ) : filteredRoutes.length === 0 ? (
                <Text style={styles.noDataText}>No routes found</Text>
              ) : (
                filteredRoutes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={styles.routeCard}
                    onPress={() => navigateToRoute(route.id)}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeTitle}>{route.name}</Text>
                        <Text style={styles.routeDestination}>
                          {route.start_point} → {route.end_point}
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
                ))
              )}
            </View>
          </ScrollView>
        );

      case 'hubs':
        return (
          <ScrollView style={styles.tabContent}>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Transport Hubs ({filteredHubs.length})
              </Text>

              {loadingHubs ? (
                // Skeleton Loader for Hubs
                Array.from({ length: 5 }).map((_, index) => (
                  <HubSkeleton key={index} />
                ))
              ) : filteredHubs.length === 0 ? (
                <Text style={styles.noDataText}>No hubs found</Text>
              ) : (
                filteredHubs.map((hub) => (
                  <TouchableOpacity
                    key={hub.id}
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
                      <Text style={styles.coordinatesText}>
                        {hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />

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
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
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
  loadingText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
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