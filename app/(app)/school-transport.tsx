// app/school-transport.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Users, Clock, Star, Shield, Car, School, Filter } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

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
    console.log('📡 fetchTransports called');
    try {
      console.log('🔍 Building Supabase query...');
      
      // Start with a simple query to get transports
      let query = supabase
        .from('school_transports')
        .select('*')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.schoolArea) {
        query = query.ilike('school_area', `%${filters.schoolArea}%`);
      }
      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true);
      }
      if (filters.vehicleType) {
        query = query.eq('vehicle_type', filters.vehicleType);
      }
      if (filters.minPrice) {
        query = query.gte('price_per_month', parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price_per_month', parseFloat(filters.maxPrice));
      }

      console.log('🚀 Executing transports query...');
      const { data: transportsData, error: transportsError } = await query;

      if (transportsError) {
        console.error('❌ Error fetching transports:', transportsError);
        throw transportsError;
      }

      console.log('📦 Transports fetched:', transportsData?.length || 0);

      if (!transportsData || transportsData.length === 0) {
        console.log('📭 No transport data found');
        setTransports([]);
        return;
      }

      // Get all driver IDs from transports
      const driverIds = transportsData
        .map(t => t.driver_id)
        .filter(id => id) as string[];

      console.log('👥 Driver IDs to fetch:', driverIds);

      let driversMap = new Map();
      
      if (driverIds.length > 0) {
        // Fetch drivers with their profiles
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

        if (driversError) {
          console.error('❌ Error fetching drivers:', driversError);
        } else if (driversData) {
          console.log('👤 Drivers fetched:', driversData.length);
          
          // Create a map for easy lookup
          driversData.forEach(driver => {
            driversMap.set(driver.id, {
              id: driver.id,
              user_id: driver.user_id,
              is_verified: driver.is_verified,
              profiles: driver.profiles || {
                first_name: 'Unknown',
                last_name: 'Driver',
                rating: 0,
                total_trips: 0
              }
            });
          });
        }
      }

      // Format the combined data
      const formattedData = transportsData.map(transport => {
        const driverData = driversMap.get(transport.driver_id) || {
          id: transport.driver_id || '',
          user_id: '',
          is_verified: false,
          profiles: {
            first_name: 'Unknown',
            last_name: 'Driver',
            rating: 0,
            total_trips: 0
          }
        };

        // Handle pickup_areas filter separately since it's an array
        if (filters.pickupArea) {
          const pickupAreas = Array.isArray(transport.pickup_areas) ? transport.pickup_areas : [];
          const hasPickupArea = pickupAreas.some(area => 
            area.toLowerCase().includes(filters.pickupArea.toLowerCase())
          );
          if (!hasPickupArea) {
            return null; // Filter out this transport
          }
        }

        return {
          ...transport,
          pickup_areas: Array.isArray(transport.pickup_areas) ? transport.pickup_areas : [],
          pickup_times: Array.isArray(transport.pickup_times) ? transport.pickup_times : [],
          features: Array.isArray(transport.features) ? transport.features : [],
          driver: driverData
        };
      }).filter(Boolean) as SchoolTransport[];

      console.log('🎉 Formatted data:', {
        length: formattedData.length,
        firstItem: formattedData[0]
      });
      
      setTransports(formattedData);
    } catch (error: any) {
      console.error('💥 Critical error fetching transports:', error);
      
      // Don't show error modal for empty data
      if (error.message?.includes('No rows returned') || 
          error.message?.includes('no rows')) {
        console.log('📭 No data available - showing empty state');
        setTransports([]);
      } else {
        showErrorModal('Failed to load transport listings. Please try again.');
      }
    } finally {
      console.log('🏁 fetchTransports completed');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransports();
  };

  // Modal handlers
  const showErrorModal = (message: string) => {
    setModalStatus({
      type: 'error',
      title: 'Error',
      message,
    });
    setShowStatusModal(true);
  };

  const showSuccessModal = (message: string) => {
    setModalStatus({
      type: 'success',
      title: 'Success',
      message,
    });
    setShowStatusModal(true);
  };

  const showWarningModal = (title: string, message: string) => {
    setModalStatus({
      type: 'warning',
      title,
      message,
    });
    setShowStatusModal(true);
  };

  // Application handler
  const handleApply = async (transportId: string) => {
    if (!user) {
      showErrorModal('Please sign in to apply for transport');
      return;
    }
    
    const transport = transports.find(t => t.id === transportId);
    if (!transport) {
      showErrorModal('Transport service not found');
      return;
    }

    if (transport.current_riders >= transport.capacity) {
      showWarningModal('Full Capacity', 'This transport service has reached its maximum capacity');
      return;
    }

    try {
      const { data: existingRequest, error: checkError } = await supabase
        .from('transport_requests')
        .select('id')
        .eq('transport_id', transportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking application:', checkError);
        showErrorModal('Failed to check application status');
        return;
      }

      if (existingRequest) {
        showWarningModal('Already Applied', 'You have already applied to this transport service');
        return;
      }

      // Open apply modal
      setSelectedTransport(transportId);
      setShowApplyModal(true);
    } catch (error) {
      console.error('Error checking application:', error);
      showErrorModal('Failed to check application status');
    }
  };

  const handleSubmitApplication = async (applicationData: {
    studentName: string;
    grade: string;
    pickupAddress: string;
    parentPhone: string;
    parentEmail: string;
  }) => {
    if (!selectedTransport || !user) {
      showErrorModal('Please sign in to apply');
      return;
    }

    setApplyLoading(true);
    try {
      // Submit new application
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

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showWarningModal('Already Applied', 'You have already applied to this transport service');
        } else {
          throw error;
        }
        return;
      }

      showSuccessModal('Application submitted! The driver will review your request and contact you.');
      setShowApplyModal(false);
      
      // Refresh transports to get updated counts
      fetchTransports();
      
    } catch (error: any) {
      console.error('Error applying:', error);
      showErrorModal('Failed to submit application. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleViewDetails = (transportId: string) => {
    router.push(`/school-transport/${transportId}`);
  };

  const handleBecomeDriver = () => {
    router.push('/driver-onboarding');
  };

  // Filtered transports
  const filteredTransports = transports.filter(transport => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      transport.school_name.toLowerCase().includes(query) ||
      transport.school_area.toLowerCase().includes(query) ||
      transport.pickup_areas.some(area => area.toLowerCase().includes(query)) ||
      transport.driver.profiles.first_name.toLowerCase().includes(query) ||
      transport.driver.profiles.last_name.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loading && transports.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={["#1ea2b1"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>School Transport</Text>
          <Text style={styles.subtitle}>Find reliable transport services</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#888888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by school, area, or driver..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <TransportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Car size={20} color="#1ea2b1" />
            <Text style={styles.statNumber}>{transports.length}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Shield size={20} color="#10B981" />
            <Text style={styles.statNumber}>
              {transports.filter(t => t.is_verified).length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Users size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {transports.reduce((sum, t) => sum + t.current_riders, 0)}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {/* Transport Listings */}
        <View style={styles.transportsContainer}>
          {filteredTransports.length === 0 ? (
            <View style={styles.emptyState}>
              <School size={48} color="#888888" />
              <Text style={styles.emptyStateText}>
                {searchQuery || Object.values(filters).some(f => f !== '' && f !== false) 
                  ? 'No matching transport services found' 
                  : 'No transport services available yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Be the first to list your service'}
              </Text>
              <TouchableOpacity 
                style={styles.becomeDriverButton}
                onPress={handleBecomeDriver}
              >
                <Text style={styles.becomeDriverText}>Become a Driver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTransports.map((transport) => (
              <SchoolTransportCard
                key={transport.id}
                transport={transport}
                onApply={() => handleApply(transport.id)}
                onViewDetails={() => handleViewDetails(transport.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ApplyModal
        visible={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedTransport(null);
        }}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 12,
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#1ea2b1',
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333333',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  transportsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  becomeDriverButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  becomeDriverText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonHeader: {
    height: 120,
    backgroundColor: '#111111',
    margin: 16,
    borderRadius: 12,
  },
  skeletonCard: {
    height: 180,
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
});