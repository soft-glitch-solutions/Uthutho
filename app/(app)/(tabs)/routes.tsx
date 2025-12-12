import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { Header, TabNavigation, StopsTab, RoutesTab, HubsTab } from '@/components/routes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

export interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  cost: number;
  transport_type: string;
}

export interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  transport_type?: string;
  image?: string;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  transport_type?: string;
  routes_count?: number;
}

const ITEMS_PER_PAGE = 20;

export default function RoutesScreen() {
  const [activeTab, setActiveTab] = useState<'stops' | 'routes' | 'hubs'>('stops');

  // Shared state for all tabs
  const [routes, setRoutes] = useState<Route[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  
  const [routesLoading, setRoutesLoading] = useState(false);
  const [hubsLoading, setHubsLoading] = useState(false);
  const [stopsLoading, setStopsLoading] = useState(false);

  const [routeFollowerCounts, setRouteFollowerCounts] = useState<Record<string, number>>({});
  const [hubFollowerCounts, setHubFollowerCounts] = useState<Record<string, number>>({});
  const [stopFollowerCounts, setStopFollowerCounts] = useState<Record<string, number>>({});

  // Refs to track if we're in search mode
  const isRouteSearchMode = useRef(false);
  const isHubSearchMode = useRef(false);
  const isStopSearchMode = useRef(false);

  useEffect(() => {
    loadRoutes(true);
    loadHubs(true);
    loadStops(true);
  }, []);

  const loadRoutes = async (initialLoad = false) => {
    if (isRouteSearchMode.current) return;

    setRoutesLoading(true);
    try {
      const from = initialLoad ? 0 : routes.length;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .range(from, to);

      if (error) throw error;

      if (initialLoad) {
        setRoutes(data || []);
      } else {
        setRoutes(prev => [...prev, ...(data || [])]);
      }

      // Load follower counts
      await loadRouteFollowerCounts(data || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setRoutesLoading(false);
    }
  };

  const loadHubs = async (initialLoad = false) => {
    if (isHubSearchMode.current) return;

    setHubsLoading(true);
    try {
      const from = initialLoad ? 0 : hubs.length;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('hubs')
        .select('*')
        .range(from, to);

      if (error) throw error;

      if (initialLoad) {
        setHubs(data || []);
      } else {
        setHubs(prev => [...prev, ...(data || [])]);
      }

      // Load follower counts
      await loadHubFollowerCounts(data || []);
    } catch (err) {
      console.error('Failed to load hubs:', err);
    } finally {
      setHubsLoading(false);
    }
  };

  const loadStops = async (initialLoad = false) => {
    if (isStopSearchMode.current) return;

    setStopsLoading(true);
    try {
      const from = initialLoad ? 0 : stops.length;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .range(from, to);

      if (error) throw error;

      if (initialLoad) {
        setStops(data || []);
      } else {
        setStops(prev => [...prev, ...(data || [])]);
      }

      // Load follower counts
      await loadStopFollowerCounts(data || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    } finally {
      setStopsLoading(false);
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

  const loadStopFollowerCounts = async (stopsData: Stop[]) => {
    const stopIds = stopsData.map(s => s.id);
    if (stopIds.length) {
      const { data: favs } = await supabase
        .from('favorites')
        .select('entity_id')
        .eq('entity_type', 'stop')
        .in('entity_id', stopIds);

      const map: Record<string, number> = {};
      (favs || []).forEach(f => { 
        map[f.entity_id] = (map[f.entity_id] || 0) + 1; 
      });
      setStopFollowerCounts(prev => ({ ...prev, ...map }));
    }
  };

  const handleRefreshRoutes = () => {
    setRoutes([]);
    isRouteSearchMode.current = false;
    loadRoutes(true);
  };

  const handleRefreshHubs = () => {
    setHubs([]);
    isHubSearchMode.current = false;
    loadHubs(true);
  };

  const handleRefreshStops = () => {
    setStops([]);
    isStopSearchMode.current = false;
    loadStops(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stops':
        return (
          <StopsTab
            stops={stops}
            stopsLoading={stopsLoading}
            onLoadMore={() => loadStops(false)}
            onRefresh={handleRefreshStops}
            isSearchModeRef={isStopSearchMode}
            stopFollowerCounts={stopFollowerCounts}
            isDesktop={isDesktop}
          />
        );
      case 'routes':
        return (
          <RoutesTab
            routes={routes}
            routesLoading={routesLoading}
            onLoadMore={() => loadRoutes(false)}
            onRefresh={handleRefreshRoutes}
            isSearchModeRef={isRouteSearchMode}
            routeFollowerCounts={routeFollowerCounts}
            isDesktop={isDesktop}
          />
        );
      case 'hubs':
        return (
          <HubsTab
            hubs={hubs}
            hubsLoading={hubsLoading}
            onLoadMore={() => loadHubs(false)}
            onRefresh={handleRefreshHubs}
            isSearchModeRef={isHubSearchMode}
            hubFollowerCounts={hubFollowerCounts}
            isDesktop={isDesktop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.innerContainer, isDesktop && styles.innerContainerDesktop]}>
        <Header isDesktop={isDesktop} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isDesktop={isDesktop} />
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
  },
  innerContainerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
});