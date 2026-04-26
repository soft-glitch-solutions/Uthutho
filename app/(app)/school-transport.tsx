import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Users, Clock, Star, Shield, Car, School, Filter, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';

import SchoolTransportCard from '@/components/school-transport/SchoolTransportCard';
import SchoolTransportGridCard from '@/components/school-transport/SchoolTransportGridCard';
import TransportFilters from '@/components/school-transport/TransportFilters';
import ApplyModal from '@/components/modals/ApplyModal';
import StatusModal from '@/components/modals/StatusModal';
import { Animated, Platform, Image } from 'react-native';

interface SchoolTransport {
  id: string;
  school_name: string;
  school_area: string;
  pickup_areas: string[];
  pickup_times: string[];
  capacity: number;
  current_riders: number;
  price_per_month: number;
  price_per_week: number;
  vehicle_info: string;
  vehicle_type: string;
  features: string[];
  description: string;
  is_verified: boolean;
  driver_id: string;
  driver: {
    id: string;
    user_id: string;
    is_verified: boolean;
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
      total_trips: number;
    };
  };
}

export default function SchoolTransportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 160;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // State
  const [transports, setTransports] = useState<SchoolTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    schoolArea: '',
    pickupArea: '',
    minPrice: '',
    maxPrice: '',
    vehicleType: '',
    verifiedOnly: false,
  });

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
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
    fetchTransports();
  }, [filters]);

  const fetchTransports = async () => {
    try {
      let query = supabase
        .from('school_transports')
        .select('*')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.schoolArea) query = query.ilike('school_area', `%${filters.schoolArea}%`);
      if (filters.verifiedOnly) query = query.eq('is_verified', true);
      if (filters.vehicleType) query = query.eq('vehicle_type', filters.vehicleType);
      if (filters.minPrice) query = query.gte('price_per_month', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price_per_month', parseFloat(filters.maxPrice));

      const { data: transportsData, error: transportsError } = await query;
      if (transportsError) throw transportsError;

      if (!transportsData || transportsData.length === 0) {
        setTransports([]);
        return;
      }

      const driverIds = transportsData.map(t => t.driver_id).filter(id => id) as string[];
      let driversMap = new Map();

      if (driverIds.length > 0) {
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select(`
            id,
            user_id,
            is_verified,
            profiles:user_id (
              first_name,
              last_name,
              rating,
              total_trips
            )
          `)
          .in('id', driverIds);

        if (!driversError && driversData) {
          driversData.forEach(driver => {
            driversMap.set(driver.id, {
              id: driver.id,
              user_id: driver.user_id,
              is_verified: driver.is_verified,
              profiles: driver.profiles || { first_name: 'Unknown', last_name: 'Driver', rating: 0, total_trips: 0 }
            });
          });
        }
      }

      const formattedData = transportsData.map(transport => {
        const driverData = driversMap.get(transport.driver_id) || {
          id: transport.driver_id || '',
          user_id: '',
          is_verified: false,
          profiles: { first_name: 'Unknown', last_name: 'Driver', rating: 0, total_trips: 0 }
        };

        if (filters.pickupArea) {
          const pickupAreas = Array.isArray(transport.pickup_areas) ? transport.pickup_areas : [];
          if (!pickupAreas.some(area => area.toLowerCase().includes(filters.pickupArea.toLowerCase()))) return null;
        }

        return {
          ...transport,
          pickup_areas: Array.isArray(transport.pickup_areas) ? transport.pickup_areas : [],
          pickup_times: Array.isArray(transport.pickup_times) ? transport.pickup_times : [],
          features: Array.isArray(transport.features) ? transport.features : [],
          driver: driverData
        };
      }).filter(Boolean) as SchoolTransport[];

      setTransports(formattedData);
    } catch (error: any) {
      console.error('Error fetching transports:', error);
      setTransports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransports();
  };

  const handleApply = async (transportId: string) => {
    if (!user) {
      setModalStatus({ type: 'error', title: 'Sign In Required', message: 'Please sign in to apply for transport' });
      setShowStatusModal(true);
      return;
    }

    const transport = transports.find(t => t.id === transportId);
    if (!transport) return;

    if (transport.current_riders >= transport.capacity) {
      setModalStatus({ type: 'warning', title: 'Full Capacity', message: 'This transport service has reached its maximum capacity' });
      setShowStatusModal(true);
      return;
    }

    try {
      const { data: existingRequest } = await supabase
        .from('transport_requests')
        .select('id')
        .eq('transport_id', transportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRequest) {
        setModalStatus({ type: 'warning', title: 'Already Applied', message: 'You have already applied to this transport service' });
        setShowStatusModal(true);
        return;
      }

      setSelectedTransport(transportId);
      setShowApplyModal(true);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleSubmitApplication = async (applicationData: {
    studentName: string;
    grade: string;
    pickupAddress: string;
    parentPhone: string;
    parentEmail: string;
  }) => {
    if (!selectedTransport || !user) return;
    setApplyLoading(true);
    try {
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          transport_id: selectedTransport,
          user_id: user.id,
          student_name: applicationData.studentName,
          student_grade: applicationData.grade,
          pickup_address: applicationData.pickupAddress,
          parent_phone: applicationData.parentPhone,
          parent_email: applicationData.parentEmail,
          status: 'pending',
        });

      if (error) throw error;
      setModalStatus({ type: 'success', title: 'Success', message: 'Application submitted! The driver will review your request.' });
      setShowStatusModal(true);
      setShowApplyModal(false);
      fetchTransports();
    } catch (error: any) {
      console.error('Error applying:', error);
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredTransports = transports.filter(transport => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      transport.school_name.toLowerCase().includes(query) ||
      transport.school_area.toLowerCase().includes(query) ||
      transport.pickup_areas.some(area => area.toLowerCase().includes(query)) ||
      transport.driver.profiles.first_name.toLowerCase().includes(query)
    );
  });

  const renderSkeleton = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.skeletonGridCard, { backgroundColor: colors.card, borderColor: colors.border }]} />
      ))}
    </View>
  );

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

  const renderHeader = () => (
    <View>
      <View style={{ height: HEADER_MAX_HEIGHT - 30 }} />
      <View style={[styles.searchWrapper, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search schools or areas..."
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
          source={require('@/assets/images/school-transport.jpg')}
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
            <Text style={styles.heroTitle}>School Transport</Text>
            <Animated.Text style={[styles.heroSubtitle, { opacity: imageOpacity }]}>
              Safe and reliable journeys for your children
            </Animated.Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={filteredTransports}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <SchoolTransportGridCard
            transport={item}
            onViewDetails={() => router.push(`/school-transport/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <School size={64} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No services found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.text, opacity: 0.5 }]}>
                Try adjusting your search or filters
              </Text>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.primary }]} onPress={() => router.push('/driver-onboarding')}>
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Become a Driver</Text>
              </TouchableOpacity>
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

      <ApplyModal
        visible={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleSubmitApplication}
        loading={applyLoading}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
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
    marginBottom: 16,
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
  searchWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  secondaryButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  skeletonGridCard: {
    width: '48%',
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
});