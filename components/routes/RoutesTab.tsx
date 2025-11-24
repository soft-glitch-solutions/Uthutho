import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import SearchSection from '@/components/routes/SearchSection';
import RouteItem from '@/components/routes/RouteItem';
import EmptyState from '@/components/routes/EmptyState';
import SkeletonLoader from '@/components/routes/SkeletonLoader';
import ListFooter from '@/components/routes/ListFooter';
import FilterButton from '@/components/routes/FilterButton';
import { Route } from './RoutesScreen';

interface RoutesTabProps {
  routes: Route[];
  routesLoading: boolean;
  onLoadMore: () => void;
  isSearchModeRef: React.MutableRefObject<boolean>;
}

const transportTypes = ['All', 'Taxi', 'Bus', 'Train', 'Shuttle'];

export default function RoutesTab({ routes, routesLoading, onLoadMore, isSearchModeRef }: RoutesTabProps) {
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedTransportType, setSelectedTransportType] = useState<string>('All');
  const [isSearchingRoutes, setIsSearchingRoutes] = useState(false);
  const [routesRefreshing, setRoutesRefreshing] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (routeSearchQuery.trim() || selectedTransportType !== 'All') {
        handleRouteSearch();
      } else {
        isSearchModeRef.current = false;
        setFilteredRoutes(routes);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [routeSearchQuery, selectedTransportType, routes]);

  const handleRouteSearch = async () => {
    if (!routeSearchQuery.trim() && selectedTransportType === 'All') {
      isSearchModeRef.current = false;
      setFilteredRoutes(routes);
      return;
    }

    setIsSearchingRoutes(true);
    isSearchModeRef.current = true;

    try {
      let query = supabase.from('routes').select('*');

      if (routeSearchQuery.trim()) {
        const searchQuery = routeSearchQuery.toLowerCase();
        query = query.or(`name.ilike.%${searchQuery}%,start_point.ilike.%${searchQuery}%,end_point.ilike.%${searchQuery}%`);
      }

      if (selectedTransportType !== 'All') {
        query = query.eq('transport_type', selectedTransportType);
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setFilteredRoutes(data || []);
    } catch (err) {
      console.error('Failed to search routes:', err);
    } finally {
      setIsSearchingRoutes(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchSection
        searchQuery={routeSearchQuery}
        onSearchChange={setRouteSearchQuery}
        placeholder="Search routes..."
      />

      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {transportTypes.map((type) => (
            <FilterButton
              key={type}
              label={type}
              isActive={selectedTransportType === type}
              onPress={() => setSelectedTransportType(type)}
            />
          ))}
        </ScrollView>
      </View>

      {(routesRefreshing || routesLoading) && filteredRoutes.length === 0 ? (
        <SkeletonLoader type="route" />
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RouteItem route={item} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<ListFooter loadingMore={routesLoading} isSearchMode={isSearchModeRef.current} />}
          ListEmptyComponent={
            <EmptyState 
              isSearching={isSearchingRoutes} 
              type="route" 
              searchQuery={routeSearchQuery} 
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}