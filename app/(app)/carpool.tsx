import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated as RNAnimated,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
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
  Plus,
  Compass,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_COLOR = '#1ea2b1';

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
  driver: {
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
      rating: number;
      total_trips: number;
    };
  };
}

const CarpoolCard = ({ item, onPress }: { item: CarpoolClub, onPress: () => void }) => {
  const isFull = item.current_members >= item.max_members;
  const spotsLeft = item.max_members - item.current_members;

  return (
    <Animated.View entering={FadeInDown.duration(600)}>
      <TouchableOpacity 
        style={styles.premiumCard} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.clubName}>{item.name}</Text>
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>{item.from_location}</Text>
              <ArrowLeft size={10} color="#444" style={{ transform: [{ rotate: '180deg' }] }} />
              <Text style={styles.routeText}>{item.to_location}</Text>
            </View>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceVal}>R{item.price_per_trip || 0}</Text>
            <Text style={styles.priceSub}>/trip</Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statPill}>
            <Clock size={12} color={BRAND_COLOR} />
            <Text style={styles.statPillText}>{item.pickup_time}</Text>
          </View>
          <View style={[styles.statPill, isFull && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Users size={12} color={isFull ? '#ef4444' : BRAND_COLOR} />
            <Text style={[styles.statPillText, isFull && { color: '#ef4444' }]}>
              {isFull ? 'FULL' : `${spotsLeft} SPOTS LEFT`}
            </Text>
          </View>
          <View style={styles.driverRating}>
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>{item.driver?.profiles?.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.driverInfo}>
            <Image 
              source={{ uri: item.driver?.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${item.driver?.profiles?.first_name}+${item.driver?.profiles?.last_name}&background=111&color=fff` }}
              style={styles.driverAvatar}
            />
            <Text style={styles.driverName}>{item.driver?.profiles?.first_name} {item.driver?.profiles?.last_name?.charAt(0)}.</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
            <Text style={styles.viewBtnText}>SECURE SEAT</Text>
            <ChevronRight size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CarpoolScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [carpools, setCarpools] = useState<CarpoolClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const fetchCarpools = async () => {
    try {
      setLoading(true);
      const { data: carpoolsData, error: carpoolsError } = await supabase
        .from('carpool_clubs')
        .select(`
          *,
          driver:profiles (
            first_name,
            last_name,
            avatar_url,
            rating,
            total_trips
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (carpoolsError) throw carpoolsError;
      setCarpools(carpoolsData as any);
    } catch (error) {
      console.error('Error fetching carpools:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCarpools();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCarpools();
  };

  const filteredCarpools = carpools.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.from_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>COMMUNITY TRANSIT</Text>
            <Text style={styles.heroTitle}>Carpool Clubs</Text>
          </View>
          <View style={styles.heroBadge}>
            <Zap size={14} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.heroBadgeText}>SAVE 40%</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination or club..."
            placeholderTextColor="#444"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Filter size={18} color={BRAND_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionPill}>
            <MapPin size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Near Me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill}>
            <TrendingUp size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Top Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill}>
            <Clock size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Evening</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>ACTIVE CLUBS</Text>
        <Text style={styles.sectionCount}>{filteredCarpools.length} Found</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Uthutho Clubs</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={filteredCarpools}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CarpoolCard 
            item={item} 
            onPress={() => router.push(`/carpool/${item.id}`)} 
          />
        )}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={BRAND_COLOR}
          />
        }
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={BRAND_COLOR} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Compass size={64} color="#222" />
              <Text style={styles.emptyTitle}>No Clubs Found</Text>
              <Text style={styles.emptySubtitle}>Try searching for a different destination.</Text>
            </View>
          )
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/driver/create-service/carpool')}
      >
        <LinearGradient
          colors={[BRAND_COLOR, '#15808d']}
          style={styles.fabInner}
        >
          <Plus size={24} color="#FFF" />
          <Text style={styles.fabText}>START A CLUB</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  navTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  listHeader: {
    marginTop: 12,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroLabel: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    height: 64,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  actionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionCount: {
    color: BRAND_COLOR,
    fontSize: 11,
    fontWeight: '900',
  },
  premiumCard: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  clubName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceVal: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  priceSub: {
    color: '#444',
    fontSize: 10,
    fontWeight: '700',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.1)',
  },
  statPillText: {
    color: BRAND_COLOR,
    fontSize: 11,
    fontWeight: '800',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  driverName: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '700',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  viewBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 24,
  },
  emptySubtitle: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    gap: 12,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});