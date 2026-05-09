import React, { useState, useEffect, useRef } from 'react';
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
  School,
  Filter,
  ArrowLeft,
  ChevronRight,
  Plus,
  Compass,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_COLOR = '#1ea2b1';

interface SchoolTransport {
  id: string;
  school_name: string;
  school_area: string;
  pickup_areas: string[];
  pickup_times: string[];
  capacity: number;
  current_riders: number;
  price_per_month: number;
  is_verified: boolean;
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

const SchoolTransportCard = ({ item, onPress }: { item: SchoolTransport, onPress: () => void }) => {
  const isFull = (item.current_riders || 0) >= item.capacity;
  const spotsLeft = item.capacity - (item.current_riders || 0);

  return (
    <Animated.View entering={FadeInDown.duration(600)}>
      <TouchableOpacity
        style={styles.premiumCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.schoolRow}>
              <School size={16} color={BRAND_COLOR} />
              <Text style={styles.schoolName} numberOfLines={1}>{item.school_name}</Text>
            </View>
            <View style={styles.areaRow}>
              <MapPin size={12} color="#444" />
              <Text style={styles.areaText}>{item.school_area}</Text>
            </View>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceVal}>R{item.price_per_month}</Text>
            <Text style={styles.priceSub}>/month</Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statPill}>
            <Zap size={12} color={BRAND_COLOR} fill={BRAND_COLOR} />
            <Text style={styles.statPillText}>Lvl {Math.floor((item.driver?.profiles?.rating || 4) * 2)} Service</Text>
          </View>
          <View style={[styles.statPill, isFull && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Users size={12} color={isFull ? '#ef4444' : BRAND_COLOR} />
            <Text style={[styles.statPillText, isFull && { color: '#ef4444' }]}>
              {isFull ? 'FULL' : `${spotsLeft} SEATS`}
            </Text>
          </View>
          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color={BRAND_COLOR} />
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.driverInfo}>
            <Image
              source={{ uri: item.driver?.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${item.driver?.profiles?.first_name}+${item.driver?.profiles?.last_name}&background=111&color=fff` }}
              style={styles.driverAvatar}
            />
            <View>
              <Text style={styles.driverName}>{item.driver?.profiles?.first_name} {item.driver?.profiles?.last_name?.charAt(0)}.</Text>
              <View style={styles.ratingRow}>
                <Star size={10} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{item.driver?.profiles?.rating?.toFixed(1) || '4.8'}</Text>
              </View>
            </View>
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

export default function SchoolTransportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [transports, setTransports] = useState<SchoolTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDriver, setIsDriver] = useState(false);

  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const fetchTransports = async () => {
    try {
      setLoading(true);

      // Check if user is a driver
      if (user?.id) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        setIsDriver(!!driverData);
      }

      const { data, error } = await supabase
        .from('school_transports')
        .select(`
          *,
          driver:drivers (
            profiles:user_id (
              first_name,
              last_name,
              avatar_url,
              rating,
              total_trips
            )
          )
        `)
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match interface
      const formatted = data?.map(t => ({
        ...t,
        driver: {
          profiles: t.driver?.profiles || { first_name: 'Unknown', last_name: 'Driver', rating: 0, total_trips: 0 }
        }
      }));

      setTransports(formatted as any);
    } catch (error) {
      console.error('Error fetching school transport:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransports();
  };

  const filteredTransports = transports.filter(t =>
    t.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.school_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.pickup_areas?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>SAFE PASSAGE</Text>
            <Text style={styles.heroTitle}>School Express</Text>
          </View>

        </View>

        <View style={styles.searchBar}>
          <Search size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search school or suburb..."
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
            <ShieldCheck size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Verified</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill}>
            <TrendingUp size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Top Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill}>
            <Clock size={14} color={BRAND_COLOR} />
            <Text style={styles.actionText}>Early Birds</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>LEGION OF DRIVERS</Text>
        <Text style={styles.sectionCount}>{filteredTransports.length} Found</Text>
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
        <Text style={styles.navTitle}>Uthutho School</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={filteredTransports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SchoolTransportCard
            item={item}
            onPress={() => router.push(`/school-transport/${item.id}`)}
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
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={BRAND_COLOR} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <School size={64} color="#222" />
              <Text style={styles.emptyTitle}>No Service Found</Text>
              <Text style={styles.emptySubtitle}>Try searching for a different school or suburb.</Text>
            </View>
          )
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => isDriver ? router.push('/driver/create-service/school') : router.push('/driver-onboarding')}
      >
        <LinearGradient
          colors={[BRAND_COLOR, '#15808d']}
          style={styles.fabInner}
        >
          <Plus size={24} color="#FFF" />
          <Text style={styles.fabText}>{isDriver ? 'LAUNCH SERVICE' : 'DRIVE WITH US'}</Text>
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
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroBadgeText: {
    color: BRAND_COLOR,
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
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  schoolName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  areaText: {
    color: '#888',
    fontSize: 13,
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
    alignItems: 'center',
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
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
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
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  driverName: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
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