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
  Dimensions,
} from 'react-native';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { AddCommunityScreenProps, Community } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

const CommunityItem: React.FC<{
  community: Community;
  isFavorite: boolean;
  onToggleFavorite: (communityId: string) => void;
  followerCount?: number;
  isDesktop?: boolean;
}> = ({ community, isFavorite, onToggleFavorite, followerCount = 0, isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
  
  return (
    <Pressable
      style={[
        styles.communityItem, 
        desktopMode && styles.communityItemDesktop,
        isFavorite && styles.favoriteItem,
        isFavorite && desktopMode && styles.favoriteItemDesktop
      ]}
      onPress={() => onToggleFavorite(community.id)}
      android_ripple={{ color: '#0f3e45' }}
    >
      <View style={[styles.communityInfo, desktopMode && styles.communityInfoDesktop]}>
        <Text style={[styles.communityName, desktopMode && styles.communityNameDesktop]}>
          {community.name}
        </Text>
        <View style={[styles.communityMeta, desktopMode && styles.communityMetaDesktop]}>
          <MapPin size={desktopMode ? 12 : 14} color="#666" />
          <Text style={[styles.communityType, desktopMode && styles.communityTypeDesktop]}>
            {community.type === 'hub' ? 'Hub' : 'Stop'}
          </Text>
          {followerCount > 0 && (
            <Text style={[styles.communityFollowers, desktopMode && styles.communityFollowersDesktop]}>
              • {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
            </Text>
          )}
        </View>
        {community.address && (
          <Text style={[styles.communityAddress, desktopMode && styles.communityAddressDesktop]} numberOfLines={1}>
            {community.address}
          </Text>
        )}
      </View>
      <View style={[
        styles.favoriteButton,
        desktopMode && styles.favoriteButtonDesktop,
        isFavorite && styles.favoriteButtonActive,
        isFavorite && desktopMode && styles.favoriteButtonActiveDesktop
      ]}>
        <Text style={[
          styles.favoriteButtonText,
          desktopMode && styles.favoriteButtonTextDesktop,
          isFavorite && styles.favoriteButtonTextActive
        ]}>
          {isFavorite ? 'Unfollow' : 'Follow'}
        </Text>
      </View>
    </Pressable>
  );
};

const AddCommunityScreen: React.FC<AddCommunityScreenProps & { isDesktop?: boolean }> = ({
  searchQuery,
  setSearchQuery,
  setShowAddCommunity,
  allCommunities,
  communities,
  toggleFavorite,
  followerCounts,
  refreshing,
  onRefresh,
  isDesktop: propIsDesktop = false,
}) => {
  const desktopMode = isDesktop || propIsDesktop;
  const filteredCommunities = allCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteCommunityIds = new Set(communities.map(c => c.id));

  return (
    <View style={[styles.container, desktopMode && styles.containerDesktop]}>
      {/* Header */}
      <View style={[styles.header, desktopMode && styles.headerDesktop]}>
        <TouchableOpacity 
          onPress={() => setShowAddCommunity(false)} 
          style={[styles.backButton, desktopMode && styles.backButtonDesktop]}
        >
          <ArrowLeft size={desktopMode ? 20 : 24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, desktopMode && styles.headerTitleDesktop]}>
          Add Community
        </Text>
        <View style={[styles.placeholder, desktopMode && styles.placeholderDesktop]} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, desktopMode && styles.searchContainerDesktop]}>
        <Search size={desktopMode ? 18 : 20} color="#666" />
        <TextInput
          style={[styles.searchInput, desktopMode && styles.searchInputDesktop]}
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
        contentContainerStyle={[
          styles.communitiesListContent,
          desktopMode && styles.communitiesListContentDesktop
        ]}
        renderItem={({ item }) => (
          <CommunityItem
            community={item}
            isFavorite={favoriteCommunityIds.has(item.id)}
            onToggleFavorite={toggleFavorite}
            followerCount={followerCounts[item.id]}
            isDesktop={desktopMode}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.noResults, desktopMode && styles.noResultsDesktop]}>
            <Text style={[styles.noResultsText, desktopMode && styles.noResultsTextDesktop]}>
              {searchQuery ? 'No communities found' : 'No communities available'}
            </Text>
            <Text style={[styles.noResultsSubtext, desktopMode && styles.noResultsSubtextDesktop]}>
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
        numColumns={desktopMode ? 2 : 1}
        columnWrapperStyle={desktopMode && styles.columnWrapper}
      />

      {/* Stats Footer */}
      <View style={[styles.footer, desktopMode && styles.footerDesktop]}>
        <Text style={[styles.footerText, desktopMode && styles.footerTextDesktop]}>
          Following {favoriteCommunityIds.size} of {allCommunities.length} communities
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
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
  headerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTitleDesktop: {
    fontSize: 22,
  },
  
  placeholder: {
    width: 44,
  },
  placeholderDesktop: {
    width: 40,
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
  searchContainerDesktop: {
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  searchInputDesktop: {
    fontSize: 15,
    marginLeft: 10,
  },
  
  communitiesListContent: {
    padding: 16,
    paddingBottom: 80, // Space for footer
  },
  communitiesListContentDesktop: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
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
  communityItemDesktop: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
  },
  
  favoriteItem: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b120',
  },
  favoriteItemDesktop: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b120',
  },
  
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityInfoDesktop: {
    marginRight: 8,
  },
  
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  communityNameDesktop: {
    fontSize: 15,
    marginBottom: 3,
  },
  
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityMetaDesktop: {
    marginBottom: 3,
  },
  
  communityType: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  communityTypeDesktop: {
    fontSize: 13,
  },
  
  communityFollowers: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  communityFollowersDesktop: {
    fontSize: 11,
    marginLeft: 6,
  },
  
  communityAddress: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  communityAddressDesktop: {
    fontSize: 11,
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
  favoriteButtonDesktop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    borderRadius: 16,
  },
  
  favoriteButtonActive: {
    backgroundColor: '#1ea2b1',
  },
  favoriteButtonActiveDesktop: {
    backgroundColor: '#1ea2b1',
  },
  
  favoriteButtonText: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  favoriteButtonTextDesktop: {
    fontSize: 13,
  },
  
  favoriteButtonTextActive: {
    color: '#ffffff',
  },
  
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsDesktop: {
    padding: 60,
    gridColumn: 'span 2',
  },
  
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsTextDesktop: {
    fontSize: 20,
  },
  
  noResultsSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  noResultsSubtextDesktop: {
    fontSize: 16,
    maxWidth: 400,
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
  footerDesktop: {
    padding: 12,
  },
  
  footerText: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: '500',
  },
  footerTextDesktop: {
    fontSize: 13,
  },
});

export default AddCommunityScreen;