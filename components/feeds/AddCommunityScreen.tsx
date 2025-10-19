// components/feeds/AddCommunityScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { AddCommunityScreenProps, Community } from '@/types';

const CommunityItem: React.FC<{
  community: Community;
  isFavorite: boolean;
  onToggleFavorite: (communityId: string) => void;
  followerCount?: number;
}> = ({ community, isFavorite, onToggleFavorite, followerCount = 0 }) => {
  return (
    <Pressable
      style={[styles.communityItem, isFavorite && styles.favoriteItem]}
      onPress={() => onToggleFavorite(community.id)}
      android_ripple={{ color: '#0f3e45' }}
    >
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{community.name}</Text>
        <View style={styles.communityMeta}>
          <MapPin size={14} color="#666" />
          <Text style={styles.communityType}>
            {community.type === 'hub' ? 'Hub' : 'Stop'}
          </Text>
          {followerCount > 0 && (
            <Text style={styles.communityFollowers}>
              • {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
            </Text>
          )}
        </View>
        {community.address && (
          <Text style={styles.communityAddress} numberOfLines={1}>
            {community.address}
          </Text>
        )}
      </View>
      <View style={[
        styles.favoriteButton,
        isFavorite && styles.favoriteButtonActive
      ]}>
        <Text style={[
          styles.favoriteButtonText,
          isFavorite && styles.favoriteButtonTextActive
        ]}>
          {isFavorite ? 'Unfollow' : 'Follow'}
        </Text>
      </View>
    </Pressable>
  );
};

const AddCommunityScreen: React.FC<AddCommunityScreenProps> = ({
  searchQuery,
  setSearchQuery,
  setShowAddCommunity,
  allCommunities,
  communities,
  toggleFavorite,
  followerCounts,
  refreshing,
  onRefresh,
}) => {
  const filteredCommunities = allCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteCommunityIds = new Set(communities.map(c => c.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setShowAddCommunity(false)} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Community</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Community List */}
      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.communitiesListContent}
        renderItem={({ item }) => (
          <CommunityItem
            community={item}
            isFavorite={favoriteCommunityIds.has(item.id)}
            onToggleFavorite={toggleFavorite}
            followerCount={followerCounts[item.id]}
          />
        )}
        ListEmptyComponent={
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No communities found' : 'No communities available'}
            </Text>
            <Text style={styles.noResultsSubtext}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new communities'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Stats Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Following {favoriteCommunityIds.size} of {allCommunities.length} communities
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  communitiesListContent: {
    padding: 16,
    paddingBottom: 80, // Space for footer
  },
  communityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  favoriteItem: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b120',
  },
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityType: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  communityFollowers: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  communityAddress: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  favoriteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1ea2b1',
    minWidth: 80,
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#1ea2b1',
  },
  favoriteButtonText: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  favoriteButtonTextActive: {
    color: '#ffffff',
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: '500',
  },
});

export default AddCommunityScreen;