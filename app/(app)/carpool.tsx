// app/carpool.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Users, Clock, Star, Shield, Car, Filter, Users as UsersIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

import SchoolTransportCard from '@/components/school-transport/SchoolTransportCard';
import TransportFilters from '@/components/school-transport/TransportFilters';
import ApplyModal from '@/components/modals/ApplyModal';
import StatusModal from '@/components/modals/StatusModal';

interface CarpoolClub {
  id: string;
  name: string;
  description: string | null;
  from_location: string;
  to_location: string;
  from_latitude: number | null;
  from_longitude: number | null;
  to_latitude: number | null;
  to_longitude: number | null;
  pickup_time: string;
  return_time: string | null;
  days_of_week: string[];
  max_members: number;
  current_members: number;
  price_per_trip: number | null;
  price_range: string | null;
  vehicle_info: string | null;
  rules: string | null;
  is_active: boolean | null;
  is_full: boolean | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
      total_trips: number;
    };
  };
}

export default function CarpoolScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [carpools, setCarpools] = useState<CarpoolClub[]>([]);
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
    console.log('📡 fetchCarpools called');
    try {
      console.log('🔍 Building Supabase query...');
      
      // Start with base query
      let query = supabase
        .from('carpool_clubs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.fromLocation) {
        query = query.ilike('from_location', `%${filters.fromLocation}%`);
      }
      if (filters.toLocation) {
        query = query.ilike('to_location', `%${filters.toLocation}%`);
      }
      if (filters.pickupTime) {
        query = query.ilike('pickup_time', `%${filters.pickupTime}%`);
      }
      if (filters.minPrice && filters.priceRange) {
        const min = parseFloat(filters.minPrice);
        query = query.or(`price_per_trip.gte.${min},price_range.ilike.%${filters.minPrice}%`);
      }
      if (filters.maxPrice) {
        const max = parseFloat(filters.maxPrice);
        query = query.or(`price_per_trip.lte.${max},price_range.ilike.%${filters.maxPrice}%`);
      }
      if (filters.daysOfWeek.length > 0) {
        // Filter by days of week (array overlap)
        query = query.contains('days_of_week', filters.daysOfWeek);
      }

      console.log('🚀 Executing carpools query...');
      const { data: carpoolsData, error: carpoolsError } = await query;

      if (carpoolsError) {
        console.error('❌ Error fetching carpools:', carpoolsError);
        throw carpoolsError;
      }

      console.log('📦 Carpools fetched:', carpoolsData?.length || 0);

      if (!carpoolsData || carpoolsData.length === 0) {
        console.log('📭 No carpool data found');
        setCarpools([]);
        return;
      }

      // Get all creator IDs from carpools
      const creatorIds = carpoolsData
        .map(c => c.creator_id)
        .filter(id => id) as string[];

      console.log('👥 Creator IDs to fetch:', creatorIds);

      let creatorsMap = new Map();
      
      if (creatorIds.length > 0) {
        // Fetch creators with their profiles
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            rating,
            total_trips
          `)
          .in('id', creatorIds);

        if (creatorsError) {
          console.error('❌ Error fetching creators:', creatorsError);
        } else if (creatorsData) {
          console.log('👤 Creators fetched:', creatorsData.length);
          
          // Create a map for easy lookup
          creatorsData.forEach(creator => {
            creatorsMap.set(creator.id, {
              id: creator.id,
              user_id: creator.user_id,
              profiles: {
                first_name: creator.first_name || 'Unknown',
                last_name: creator.last_name || 'User',
                rating: creator.rating || 0,
                total_trips: creator.total_trips || 0
              }
            });
          });
        }
      }

      // Format the combined data
      const formattedData = carpoolsData.map(carpool => {
        const creatorData = creatorsMap.get(carpool.creator_id) || {
          id: carpool.creator_id || '',
          user_id: '',
          profiles: {
            first_name: 'Unknown',
            last_name: 'User',
            rating: 0,
            total_trips: 0
          }
        };

        return {
          ...carpool,
          days_of_week: Array.isArray(carpool.days_of_week) ? carpool.days_of_week : [],
          // Transform carpool data to match SchoolTransportCard interface
          school_name: carpool.name,
          school_area: carpool.to_location,
          pickup_areas: [carpool.from_location],
          pickup_times: [carpool.pickup_time],
          capacity: carpool.max_members,
          current_riders: carpool.current_members,
          price_per_month: carpool.price_per_trip ? carpool.price_per_trip * 20 : 0, // Approximate monthly
          price_per_week: carpool.price_per_trip ? carpool.price_per_trip * 5 : 0, // Approximate weekly
          vehicle_info: carpool.vehicle_info || 'Not specified',
          vehicle_type: carpool.vehicle_info?.includes('SUV') ? 'SUV' : 
                       carpool.vehicle_info?.includes('Van') ? 'Van' : 
                       carpool.vehicle_info?.includes('Sedan') ? 'Sedan' : 'Car',
          features: [
            ...carpool.days_of_week,
            carpool.return_time ? 'Round Trip' : 'One Way',
            carpool.rules ? 'Rules Apply' : 'Flexible'
          ].filter(Boolean),
          description: carpool.description || 'Join this carpool club!',
          is_verified: false, // Carpool clubs don't have verification yet
          driver_id: carpool.creator_id,
          driver: {
            id: creatorData.id,
            user_id: creatorData.user_id,
            is_verified: false, // Carpool creators aren't verified drivers
            profiles: creatorData.profiles
          }
        };
      }).filter(Boolean) as any[];

      console.log('🎉 Formatted data:', {
        length: formattedData.length,
        firstItem: formattedData[0]
      });
      
      setCarpools(formattedData);
    } catch (error: any) {
      console.error('💥 Critical error fetching carpools:', error);
      
      if (error.message?.includes('No rows returned') || 
          error.message?.includes('no rows')) {
        console.log('📭 No data available - showing empty state');
        setCarpools([]);
      } else {
        showErrorModal('Failed to load carpool listings. Please try again.');
      }
    } finally {
      console.log('🏁 fetchCarpools completed');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCarpools();
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
  const handleApply = async (carpoolId: string) => {
    if (!user) {
      showErrorModal('Please sign in to join a carpool');
      return;
    }
    
    const carpool = carpools.find(c => c.id === carpoolId);
    if (!carpool) {
      showErrorModal('Carpool club not found');
      return;
    }

    if (carpool.is_full || carpool.current_members >= carpool.max_members) {
      showWarningModal('Full Capacity', 'This carpool club has reached its maximum capacity');
      return;
    }

    try {
      // Check if user is already a member or has pending request
      // We'll need a carpool_members or carpool_requests table
      // For now, just show the apply modal
      setSelectedCarpool(carpoolId);
      setShowApplyModal(true);
    } catch (error) {
      console.error('Error checking membership:', error);
      showErrorModal('Failed to check membership status');
    }
  };

  const handleSubmitApplication = async (applicationData: {
    studentName: string;
    grade: string;
    pickupAddress: string;
    parentPhone: string;
    parentEmail: string;
  }) => {
    if (!selectedCarpool || !user) {
      showErrorModal('Please sign in to apply');
      return;
    }

    setApplyLoading(true);
    try {
      // Since we don't have a carpool_requests table yet,
      // we'll update the carpool's current_members directly
      // In production, you should create a proper join request system
      const carpool = carpools.find(c => c.id === selectedCarpool);
      if (!carpool) {
        showErrorModal('Carpool not found');
        return;
      }

      const { error } = await supabase
        .from('carpool_clubs')
        .update({
          current_members: carpool.current_members + 1,
          is_full: carpool.current_members + 1 >= carpool.max_members
        })
        .eq('id', selectedCarpool);

      if (error) throw error;

      showSuccessModal('Successfully joined the carpool club! The creator will contact you with details.');
      setShowApplyModal(false);
      
      // Refresh carpools to get updated counts
      fetchCarpools();
      
    } catch (error: any) {
      console.error('Error joining carpool:', error);
      showErrorModal('Failed to join carpool. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleViewDetails = (carpoolId: string) => {
    router.push(`/carpool/${carpoolId}`);
  };

  const handleCreateCarpool = () => {
    router.push('/create-carpool');
  };

  // Filtered carpools
  const filteredCarpools = carpools.filter(carpool => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      carpool.name.toLowerCase().includes(query) ||
      carpool.from_location.toLowerCase().includes(query) ||
      carpool.to_location.toLowerCase().includes(query) ||
      carpool.description?.toLowerCase().includes(query) ||
      carpool.driver.profiles.first_name.toLowerCase().includes(query) ||
      carpool.driver.profiles.last_name.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (loading && carpools.length === 0) {
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
          <Text style={styles.title}>Carpool Clubs</Text>
          <Text style={styles.subtitle}>Share rides and save on commuting</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#888888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, destination, or creator..."
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
            // Override filter labels for carpool
            filterConfig={{
              schoolArea: { label: 'Destination', icon: MapPin },
              pickupArea: { label: 'Pickup Location', icon: MapPin },
              minPrice: { label: 'Min Price per Trip', icon: '$' },
              maxPrice: { label: 'Max Price per Trip', icon: '$' },
              vehicleType: { label: 'Vehicle Type', icon: Car },
            }}
          />
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Car size={20} color="#1ea2b1" />
            <Text style={styles.statNumber}>{carpools.length}</Text>
            <Text style={styles.statLabel}>Clubs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <UsersIcon size={20} color="#10B981" />
            <Text style={styles.statNumber}>
              {carpools.reduce((sum, c) => sum + c.current_members, 0)}
            </Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {carpools.filter(c => !c.is_full).length}
            </Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
        </View>

        {/* Carpool Listings */}
        <View style={styles.carpoolsContainer}>
          {filteredCarpools.length === 0 ? (
            <View style={styles.emptyState}>
              <UsersIcon size={48} color="#888888" />
              <Text style={styles.emptyStateText}>
                {searchQuery || Object.values(filters).some(f => 
                  Array.isArray(f) ? f.length > 0 : f !== '' && f !== false
                ) 
                  ? 'No matching carpool clubs found' 
                  : 'No carpool clubs available yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Be the first to create a carpool club'}
              </Text>
              <TouchableOpacity 
                style={styles.createCarpoolButton}
                onPress={handleCreateCarpool}
              >
                <Text style={styles.createCarpoolText}>Create Carpool Club</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredCarpools.map((carpool) => (
              <SchoolTransportCard
                key={carpool.id}
                transport={carpool}
                onApply={() => handleApply(carpool.id)}
                onViewDetails={() => handleViewDetails(carpool.id)}
                // Override button text for carpool
                applyButtonText="Join Club"
                detailsButtonText="View Details"
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
          setSelectedCarpool(null);
        }}
        onSubmit={handleSubmitApplication}
        loading={applyLoading}
        // Customize modal for carpool
        title="Join Carpool Club"
        submitButtonText="Join Club"
        fields={[
          {
            label: 'Your Name',
            placeholder: 'Enter your full name',
            key: 'studentName'
          },
          {
            label: 'Pickup Address',
            placeholder: 'Your exact pickup location',
            key: 'pickupAddress'
          },
          {
            label: 'Phone Number',
            placeholder: 'Your contact number',
            key: 'parentPhone'
          },
          {
            label: 'Email',
            placeholder: 'Your email address',
            key: 'parentEmail'
          }
        ]}
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
  carpoolsContainer: {
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
  createCarpoolButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createCarpoolText: {
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