import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronLeft, MapPin, Bus, Check, Plus, Navigation } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFavorites, FavoriteItem } from '@/hook/useFavorites';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface CommunityItem {
  id: string;
  name: string;
  type: 'stop' | 'hub';
  latitude: number;
  longitude: number;
  image_url?: string;
  memberCount?: number;
  distance?: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ExploreCommunitiesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<'all' | 'hub' | 'stop'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      // 1. Get user location
      let userLat = 0;
      let userLon = 0;
      let hasLocation = false;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          userLat = location.coords.latitude;
          userLon = location.coords.longitude;
          hasLocation = true;
        } catch (e) {
          console.warn('Could not get current location', e);
        }
      }

      // 2. Fetch data with larger limits
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('id, name, latitude, longitude, image_url')
        .limit(500);

      const { data: hubsData, error: hubsError } = await supabase
        .from('hubs')
        .select('id, name, latitude, longitude, image')
        .limit(500);

      if (stopsError) console.error('Stops fetch error:', stopsError);
      if (hubsError) console.error('Hubs fetch error:', hubsError);

      const stops: CommunityItem[] = (stopsData || []).map(s => {
        const dist = hasLocation ? calculateDistance(userLat, userLon, s.latitude, s.longitude) : Infinity;
        return { ...s, type: 'stop', memberCount: Math.floor(Math.random() * 500) + 50, distance: dist };
      });

      const hubs: CommunityItem[] = (hubsData || []).map(h => {
        const dist = hasLocation ? calculateDistance(userLat, userLon, h.latitude, h.longitude) : Infinity;
        return { ...h, type: 'hub', memberCount: Math.floor(Math.random() * 2000) + 100, distance: dist };
      });

      // 3. Combine and sort by distance (or random if no location)
      const combined = [...hubs, ...stops].sort((a, b) => {
        if (hasLocation) {
          return (a.distance || 0) - (b.distance || 0);
        }
        return Math.random() - 0.5;
      });

      setCommunities(combined);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const isJoined = (id: string) => {
    return favorites.some(fav => fav.id === id);
  };

  const toggleJoin = async (item: CommunityItem) => {
    if (isJoined(item.id)) {
      await removeFromFavorites(item.id);
    } else {
      const favItem: FavoriteItem = {
        id: item.id,
        type: item.type,
        name: item.name,
        data: item,
      };
      await addToFavorites(favItem);
    }
  };

  const handleCardPress = (item: CommunityItem) => {
    if (item.type === 'hub') {
      router.push(`/hub/${item.id}`);
    } else {
      router.push(`/stop-details?stopId=${item.id}`);
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesTab = activeTab === 'all' || c.type === activeTab;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderItem = ({ item, index }: { item: CommunityItem, index: number }) => {
    const joined = isJoined(item.id);
    const isHub = item.type === 'hub';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => handleCardPress(item)}
        >
          <View style={styles.cardImageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImagePlaceholder, { backgroundColor: isHub ? '#1ea2b122' : '#8B5CF622' }]}>
                {isHub ? <Bus size={32} color="#1ea2b1" /> : <MapPin size={32} color="#8B5CF6" />}
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: isHub ? '#1ea2b1' : '#8B5CF6' }]}>
              <Text style={styles.badgeText}>{isHub ? 'HUB' : 'STOP'}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.memberCount}>{item.memberCount?.toLocaleString()} members</Text>
                {item.distance !== undefined && item.distance !== Infinity && (
                  <>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Navigation size={12} color="#1ea2b1" />
                    <Text style={styles.distanceText}>{item.distance < 1 ? '< 1' : Math.round(item.distance)} km</Text>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.joinBtn, joined && styles.joinedBtn]}
              onPress={(e) => {
                e.stopPropagation();
                toggleJoin(item);
              }}
            >
              {joined ? (
                <>
                  <Check size={14} color="#000" />
                  <Text style={styles.joinedText}>Joined</Text>
                </>
              ) : (
                <>
                  <Plus size={14} color="#1ea2b1" />
                  <Text style={styles.joinText}>Join</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Communities</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stops and hubs..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'hub', 'stop'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab === 'hub' ? 'Hubs' : 'Stops'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1ea2b1" />
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={styles.emptyState}>
              <Text style={styles.emptyText}>No communities found.</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60, // approximate SafeArea top
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  activeTab: {
    backgroundColor: 'rgba(30,162,177,0.15)',
    borderColor: '#1ea2b1',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#1ea2b1',
    fontWeight: '800',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotSeparator: {
    color: '#444',
    fontSize: 12,
    marginHorizontal: 2,
  },
  distanceText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,162,177,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1ea2b1',
    gap: 6,
  },
  joinedBtn: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  joinText: {
    color: '#1ea2b1',
    fontWeight: '800',
    fontSize: 13,
  },
  joinedText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
