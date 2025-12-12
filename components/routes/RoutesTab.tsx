import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import SearchSection from '@/components/routes/SearchSection';
import RouteItem from '@/components/routes/RouteItem';
import EmptyState from '@/components/routes/EmptyState';
import SkeletonLoader from '@/components/routes/SkeletonLoader';
import ListFooter from '@/components/routes/ListFooter';
import FilterButton from '@/components/routes/FilterButton';
import { Route } from './RoutesScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface RoutesTabProps {
  routes: Route[];
  routesLoading: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  isSearchModeRef: React.MutableRefObject<boolean>;
  routeFollowerCounts: Record<string, number>;
  isDesktop?: boolean;
}

const transportTypes = ['All', 'Taxi', 'Bus', 'Train', 'Shuttle'];

export default function RoutesTab({ 
  routes, 
  routesLoading, 
  onLoadMore, 
  onRefresh,
  isSearchModeRef, 
  routeFollowerCounts,
  isDesktop: propIsDesktop = false 
}: RoutesTabProps) {
  const desktopMode = isDesktop || propIsDesktop;
  
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

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setRoutesRefreshing(true);
    setTimeout(() => setRoutesRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, desktopMode && styles.containerDesktop]}>
      <SearchSection
        searchQuery={routeSearchQuery}
        onSearchChange={setRouteSearchQuery}
        placeholder="Search routes..."
        isDesktop={desktopMode}
      />

      <View style={[styles.filterContainer, desktopMode && styles.filterContainerDesktop]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.scrollView}
          contentContainerStyle={desktopMode && styles.scrollContentDesktop}
        >
          {transportTypes.map((type) => (
            <FilterButton
              key={type}
              label={type}
              isActive={selectedTransportType === type}
              onPress={() => setSelectedTransportType(type)}
              isDesktop={desktopMode}
            />
          ))}
        </ScrollView>
      </View>

      {(routesRefreshing || routesLoading) && filteredRoutes.length === 0 ? (
        <SkeletonLoader type="route" isDesktop={desktopMode} />
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RouteItem 
              route={item} 
              followerCount={routeFollowerCounts[item.id] || 0}
              isDesktop={desktopMode}
            />
          )}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={routesRefreshing}
          ListFooterComponent={
            <ListFooter 
              loadingMore={routesLoading} 
              isSearchMode={isSearchModeRef.current} 
              isDesktop={desktopMode}
            />
          }
          ListEmptyComponent={
            <EmptyState 
              isSearching={isSearchingRoutes} 
              type="route" 
              searchQuery={routeSearchQuery}
              isDesktop={desktopMode}
            />
          }
          contentContainerStyle={[
            styles.contentContainer,
            desktopMode && styles.contentContainerDesktop
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={desktopMode ? 2 : 1}
          columnWrapperStyle={desktopMode && styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDesktop: {
    paddingHorizontal: 24,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterContainerDesktop: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  scrollView: {
    marginBottom: 8,
  },
  scrollContentDesktop: {
    paddingRight: 8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentContainerDesktop: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
});