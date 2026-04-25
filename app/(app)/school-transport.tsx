import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Users, Clock, Star, Shield, Car, School, Filter, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';

import SchoolTransportCard from '@/components/school-transport/SchoolTransportCard';
import TransportFilters from '@/components/school-transport/TransportFilters';
import ApplyModal from '@/components/modals/ApplyModal';
import StatusModal from '@/components/modals/StatusModal';

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
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { color: colors.text }]}>School Transport</Text>
          <Text style={[styles.heroSubtitle, { color: colors.text, opacity: 0.6 }]}>
            Safe and reliable journeys for your children
          </Text>
        </View>

        {/* Search Bar (Sticky) */}
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


        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            renderSkeleton()
          ) : filteredTransports.length === 0 ? (
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
          ) : (
            filteredTransports.map((transport) => (
              <SchoolTransportCard
                key={transport.id}
                transport={transport}
                onApply={() => handleApply(transport.id)}
                onViewDetails={() => router.push(`/school-transport/${transport.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: -10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  searchWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
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
  statsWrapper: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  skeletonContainer: {
    gap: 16,
  },
  skeletonCard: {
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
  },
});