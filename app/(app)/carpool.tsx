// app/carpool.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Platform,
  Image,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Users,
  Clock,
  Star,
  Shield,
  Car,
  Filter,
  ArrowLeft,
  Users as UsersIcon,
  ChevronRight,
  TrendingUp
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';

import TransportFilters from '@/components/school-transport/TransportFilters';
import ApplyModal from '@/components/modals/ApplyModal';
import StatusModal from '@/components/modals/StatusModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarpoolClub {
  id: string;
  name: string;
  description: string | null;
  from_location: string;
  to_location: string;
  pickup_time: string;
  return_time: string | null;
  days_of_week: string[];
  max_members: number;
  current_members: number;
  price_per_trip: number | null;
  vehicle_info: string | null;
  creator_id: string;
  creator: {
    id: string;
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
      total_trips: number;
    };
  };
}

// Sub-component for Grid Item to match school transport style
const CarpoolGridCard = ({ carpool, onViewDetails }: { carpool: any, onViewDetails: () => void }) => {
  const { colors } = useTheme();
  const isFull = carpool.current_members >= carpool.max_members;
  const spotsLeft = carpool.max_members - carpool.current_members;

  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onViewDetails}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {carpool.name}
        </Text>
        <View style={styles.cardLocation}>
          <MapPin size={10} color={colors.primary} />
          <Text style={[styles.cardLocationText, { color: colors.text }]} numberOfLines={1}>
            {carpool.to_location}
          </Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.cardStat}>
          <Users size={12} color={isFull ? '#EF4444' : '#10B981'} />
          <Text style={[styles.cardStatText, { color: isFull ? '#EF4444' : '#10B981' }]}>
            {isFull ? 'FULL' : `${spotsLeft} SPOTS`}
          </Text>
        </View>
        <View style={styles.cardRating}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.cardRatingText, { color: colors.text }]}>
            {carpool.driver.profiles.rating?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.timeInfo}>
          <Clock size={12} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.text }]}>{carpool.pickup_time}</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={[styles.priceText, { color: colors.text }]}>R{carpool.price_per_trip || '0'}</Text>
          <Text style={styles.priceSubText}>/trip</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function CarpoolScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 160;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // State
  const [carpools, setCarpools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fromLocation: '',
    toLocation: '',
    minPrice: '',
    maxPrice: '',
    pickupTime: '',
    daysOfWeek: [] as string[],
    vehicleType: '',
  });

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCarpool, setSelectedCarpool] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    type: 'info',
    title: '',
    message: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    fetchCarpools();
  }, [filters]);

  const fetchCarpools = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('carpool_clubs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.fromLocation) query = query.ilike('from_location', `%${filters.fromLocation}%`);
      if (filters.toLocation) query = query.ilike('to_location', `%${filters.toLocation}%`);
      if (filters.pickupTime) query = query.ilike('pickup_time', `%${filters.pickupTime}%`);

      const { data: carpoolsData, error: carpoolsError } = await query;
      if (carpoolsError) throw carpoolsError;

      if (!carpoolsData || carpoolsData.length === 0) {
        setCarpools([]);
        return;
      }

      const creatorIds = carpoolsData.map(c => c.creator_id).filter(id => id);
      let creatorsMap = new Map();

      if (creatorIds.length > 0) {
        const { data: creatorsData } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, rating, total_trips')
          .in('id', creatorIds);

        if (creatorsData) {
          creatorsData.forEach(creator => {
            creatorsMap.set(creator.id, creator);
          });
        }
      }

      const formattedData = carpoolsData.map(carpool => {
        const creatorData = creatorsMap.get(carpool.creator_id) || {
          first_name: 'Unknown', last_name: 'User', rating: 0, total_trips: 0
        };

        return {
          ...carpool,
          days_of_week: Array.isArray(carpool.days_of_week) ? carpool.days_of_week : [],
          driver: {
            profiles: creatorData
          }
        };
      });

      setCarpools(formattedData);
    } catch (error) {
      console.error('Error fetching carpools:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCarpools();
  };

  const filteredCarpools = carpools.filter(carpool => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      carpool.name.toLowerCase().includes(query) ||
      carpool.from_location.toLowerCase().includes(query) ||
      carpool.to_location.toLowerCase().includes(query) ||
      carpool.driver.profiles.first_name.toLowerCase().includes(query)
    );
  });

  const headerImageHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.75],
    extrapolate: 'clamp',
  });

  const headerTitleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const renderSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.skeletonGridCard, { backgroundColor: colors.card, borderColor: colors.border }]} />
      ))}
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={{ height: HEADER_MAX_HEIGHT - 30 }} />

      {/* Stats Bar */}
      <View style={styles.statsBar}>

      </View>

      <View style={[styles.searchWrapper, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search destination or creator..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.filterIcon, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && renderSkeleton()}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View style={[styles.imageHeader, { height: headerImageHeight, backgroundColor: colors.background }]}>
        <Animated.Image
          source={require('@/assets/images/carpool-header.jpg')}
          style={[styles.headerImage, { opacity: imageOpacity }]}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>

          <Animated.View style={{
            transform: [
              { scale: headerTitleScale },
              { translateY: headerTitleTranslateY }
            ]
          }}>
            <Text style={styles.heroTitle}>Carpool Clubs</Text>
            <Animated.Text style={[styles.heroSubtitle, { opacity: imageOpacity }]}>
              Share rides and save on commuting
            </Animated.Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={filteredCarpools}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <CarpoolGridCard
            carpool={item}
            onViewDetails={() => router.push(`/carpool/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <UsersIcon size={64} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No clubs found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.text, opacity: 0.5 }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : null
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />

      <TransportFilters
        visible={showFilters}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setShowFilters(false)}
      />

      <StatusModal
        visible={showStatusModal}
        type={modalStatus.type}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={() => setShowStatusModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 15,
    left: 24,
    right: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  searchWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  gridCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocationText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRatingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  priceSubText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  skeletonGridCard: {
    width: '48%',
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
});