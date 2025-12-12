import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import SearchSection from '@/components/routes/SearchSection';
import StopItem from '@/components/routes/StopItem';
import EmptyState from '@/components/routes/EmptyState';
import SkeletonLoader from '@/components/routes/SkeletonLoader';
import ListFooter from '@/components/routes/ListFooter';
import { Stop } from '@/app/(app)/(tabs)/routes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface StopsTabProps {
  stops: Stop[];
  stopsLoading: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  isSearchModeRef: React.MutableRefObject<boolean>;
  stopFollowerCounts: Record<string, number>;
  isDesktop?: boolean;
}

export default function StopsTab({ 
  stops, 
  stopsLoading, 
  onLoadMore, 
  onRefresh,
  isSearchModeRef, 
  stopFollowerCounts,
  isDesktop: propIsDesktop = false 
}: StopsTabProps) {
  const desktopMode = isDesktop || propIsDesktop;
  
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [isSearchingStops, setIsSearchingStops] = useState(false);
  const [stopsRefreshing, setStopsRefreshing] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (stopSearchQuery.trim()) {
        handleStopSearch();
      } else {
        isSearchModeRef.current = false;
        setFilteredStops(stops);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [stopSearchQuery, stops]);

  const handleStopSearch = async () => {
    if (!stopSearchQuery.trim()) {
      isSearchModeRef.current = false;
      setFilteredStops(stops);
      return;
    }

    setIsSearchingStops(true);
    isSearchModeRef.current = true;

    try {
      let query = supabase
        .from('stops')
        .select('*');

      if (stopSearchQuery.trim()) {
        const searchQuery = stopSearchQuery.toLowerCase();
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      query = query.limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setFilteredStops(data || []);
    } catch (err) {
      console.error('Failed to search stops:', err);
      // Fallback to client-side filtering
      const filtered = stops.filter(stop => 
        stop.name.toLowerCase().includes(stopSearchQuery.toLowerCase()) ||
        (stop.address && stop.address.toLowerCase().includes(stopSearchQuery.toLowerCase()))
      );
      setFilteredStops(filtered);
    } finally {
      setIsSearchingStops(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    setStopsRefreshing(true);
    setTimeout(() => setStopsRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, desktopMode && styles.containerDesktop]}>
      <SearchSection
        searchQuery={stopSearchQuery}
        onSearchChange={setStopSearchQuery}
        placeholder="Search stops by name or address..."
        onSubmit={handleStopSearch}
        isDesktop={desktopMode}
      />

      {(stopsRefreshing || stopsLoading) && filteredStops.length === 0 ? (
        <SkeletonLoader type="stop" isDesktop={desktopMode} />
      ) : (
        <FlatList
          data={filteredStops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StopItem 
              stop={item} 
              followerCount={stopFollowerCounts[item.id] || 0}
              isDesktop={desktopMode}
            />
          )}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefresh}
          refreshing={stopsRefreshing}
          ListFooterComponent={
            <ListFooter 
              loadingMore={stopsLoading} 
              isSearchMode={isSearchModeRef.current} 
              isDesktop={desktopMode}
            />
          }
          ListEmptyComponent={
            <EmptyState 
              isSearching={isSearchingStops} 
              type="stop" 
              searchQuery={stopSearchQuery}
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