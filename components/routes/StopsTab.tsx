import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList } from 'react-native';
import { supabase } from '@/lib/supabase';
import SearchSection from '@/components/routes/SearchSection';
import StopItem from '@/components/routes/StopItem';
import EmptyState from '@/components/routes/EmptyState';
import SkeletonLoader from '@/components/routes/SkeletonLoader';
import ListFooter from '@/components/routes/ListFooter';
import { Stop } from '@/app/(app)/(tabs)/routes';

interface StopsTabProps {
  stops: Stop[];
  stopsLoading: boolean;
  onLoadMore: () => void;
  isSearchModeRef: React.MutableRefObject<boolean>;
}

export default function StopsTab({ stops, stopsLoading, onLoadMore, isSearchModeRef }: StopsTabProps) {
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

  const handleRefreshStops = () => {
    setStopsRefreshing(true);
    // Refresh logic here
    setStopsRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchSection
        searchQuery={stopSearchQuery}
        onSearchChange={setStopSearchQuery}
        placeholder="Search stops by name or address..."
        onSubmit={handleStopSearch}
      />

      {(stopsRefreshing || stopsLoading) && filteredStops.length === 0 ? (
        <SkeletonLoader type="stop" />
      ) : (
        <FlatList
          data={filteredStops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StopItem stop={item} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={handleRefreshStops}
          refreshing={stopsRefreshing}
          ListFooterComponent={<ListFooter loadingMore={stopsLoading} isSearchMode={isSearchModeRef.current} />}
          ListEmptyComponent={
            <EmptyState 
              isSearching={isSearchingStops} 
              type="stop" 
              searchQuery={stopSearchQuery} 
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}