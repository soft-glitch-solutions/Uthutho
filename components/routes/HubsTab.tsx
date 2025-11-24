import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import SearchSection from '@/components/routes/SearchSection';
import HubItem from '@/components/routes/HubItem';
import EmptyState from '@/components/routes/EmptyState';
import SkeletonLoader from '@/components/routes/SkeletonLoader';
import ListFooter from '@/components/routes/ListFooter';
import FilterButton from '@/components/routes/FilterButton';
import { Hub } from './RoutesScreen';

interface HubsTabProps {
  hubs: Hub[];
  hubsLoading: boolean;
  onLoadMore: () => void;
  isSearchModeRef: React.MutableRefObject<boolean>;
}

const hubTypes = ['All', 'Taxi', 'Bus', 'Train', 'Metro', 'Interchange'];

export default function HubsTab({ hubs, hubsLoading, onLoadMore, isSearchModeRef }: HubsTabProps) {
  const [filteredHubs, setFilteredHubs] = useState<Hub[]>([]);
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [selectedHubType, setSelectedHubType] = useState<string>('All');
  const [isSearchingHubs, setIsSearchingHubs] = useState(false);
  const [hubsRefreshing, setHubsRefreshing] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hubSearchQuery.trim() || selectedHubType !== 'All') {
        handleHubSearch();
      } else {
        isSearchModeRef.current = false;
        setFilteredHubs(hubs);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [hubSearchQuery, selectedHubType, hubs]);

  const handleHubSearch = async () => {
    if (!hubSearchQuery.trim() && selectedHubType === 'All') {
      isSearchModeRef.current = false;
      setFilteredHubs(hubs);
      return;
    }

    setIsSearchingHubs(true);
    isSearchModeRef.current = true;

    try {
      let query = supabase.from('hubs').select('*');

      if (hubSearchQuery.trim()) {
        const searchQuery = hubSearchQuery.toLowerCase();
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,transport_type.ilike.%${searchQuery}%`);
      }

      if (selectedHubType !== 'All') {
        query = query.eq('transport_type', selectedHubType);
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setFilteredHubs(data || []);
    } catch (err) {
      console.error('Failed to search hubs:', err);
    } finally {
      setIsSearchingHubs(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchSection
        searchQuery={hubSearchQuery}
        onSearchChange={setHubSearchQuery}
        placeholder="Search hubs by name, address or type..."
      />

      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {hubTypes.map((type) => (
            <FilterButton
              key={type}
              label={type}
              isActive={selectedHubType === type}
              onPress={() => setSelectedHubType(type)}
            />
          ))}
        </ScrollView>
      </View>

      {(hubsRefreshing || hubsLoading) && filteredHubs.length === 0 ? (
        <SkeletonLoader type="hub" />
      ) : (
        <FlatList
          data={filteredHubs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HubItem hub={item} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<ListFooter loadingMore={hubsLoading} isSearchMode={isSearchModeRef.current} />}
          ListEmptyComponent={
            <EmptyState 
              isSearching={isSearchingHubs} 
              type="hub" 
              searchQuery={hubSearchQuery} 
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}