// app/school-transport/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Star,
  Shield,
  Car,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Share2,
  ChevronRight,
  DollarSign,
  MessageSquare,
  Navigation,
  User,
  School,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width } = Dimensions.get('window');

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
  created_at: string;
  updated_at: string;
  driver: {
    id: string;
    user_id: string;
    is_verified: boolean;
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
      total_trips: number;
      phone?: string;
      email?: string;
      avatar_url?: string;
    };
  };
}

export default function TransportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [transport, setTransport] = useState<SchoolTransport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  console.log('🚀 TransportDetailsScreen mounted with ID:', id);
  console.log('📱 User:', user?.id ? 'Logged in' : 'Not logged in');

  useEffect(() => {
    console.log('🔍 useEffect triggered, ID:', id);
    if (id) {
      fetchTransportDetails();
      checkIfApplied();
    } else {
      console.error('❌ No ID provided in URL params');
      setLoading(false);
    }
  }, [id, user]);

const fetchTransportDetails = async () => {
  try {
    console.log('📡 ===== STARTING FETCH =====');
    console.log('🔍 ID from URL:', id);
    console.log('🔍 ID type:', typeof id);
    console.log('🔍 ID length:', id?.length);
    
    // Check if ID is valid
    if (!id) {
      console.error('❌ No ID provided');
      setTransport(null);
      setLoading(false);
      return;
    }

    // If ID is an array, take the first element
    const transportId = Array.isArray(id) ? id[0] : id;
    console.log('🔍 Using transportId:', transportId);

    setLoading(true);

    // STEP 1: First, let's check if we can access the table at all
    console.log('🔍 STEP 1: Testing basic table access...');
    const { data: testData, error: testError } = await supabase
      .from('school_transports')
      .select('id, school_name')
      .limit(1);

    console.log('📊 Basic table test:', {
      hasData: !!testData,
      dataCount: testData?.length,
      error: testError,
      errorMessage: testError?.message
    });

    // STEP 2: Try a SIMPLE query first - just get the transport without joins
    console.log('🔍 STEP 2: Trying simple transport query...');
    const { data: transportData, error: transportError } = await supabase
      .from('school_transports')
      .select('*')
      .eq('id', transportId)
      .single();

    console.log('📊 Simple transport query:', {
      success: !transportError,
      hasData: !!transportData,
      error: transportError,
      errorMessage: transportError?.message,
      errorCode: transportError?.code,
      dataKeys: transportData ? Object.keys(transportData) : []
    });

    if (transportError) {
      console.error('❌ Failed to fetch transport:', {
        code: transportError.code,
        message: transportError.message,
        details: transportError.details,
        hint: transportError.hint
      });
      
      // Check if it's a "no rows" error
      if (transportError.code === 'PGRST116') {
        console.log('⚠️ No transport found with ID:', transportId);
        
        // Let's check what IDs exist in the database
        const { data: allTransports } = await supabase
          .from('school_transports')
          .select('id, school_name')
          .limit(5);
        
        console.log('📊 Available transports:', allTransports);
      }
      
      setTransport(null);
      return;
    }

    if (!transportData) {
      console.log('⚠️ No transport data returned');
      setTransport(null);
      return;
    }

    console.log('✅ Transport data received:', {
      id: transportData.id,
      school_name: transportData.school_name,
      driver_id: transportData.driver_id,
      pickup_areas: transportData.pickup_areas,
      capacity: transportData.capacity
    });

    // STEP 3: Now get driver information
    console.log('🔍 STEP 3: Fetching driver information...');
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select(`
        *,
        profiles (*)
      `)
      .eq('id', transportData.driver_id)
      .single();

    console.log('📊 Driver query:', {
      success: !driverError,
      hasData: !!driverData,
      error: driverError,
      driverId: transportData.driver_id,
      data: driverData
    });

    // STEP 4: Format the complete transport object
    console.log('🔍 STEP 4: Formatting complete transport object...');
    
    let driverInfo = null;
    let profilesInfo = null;
    
    if (driverData) {
      driverInfo = driverData;
      
      // Handle profiles data (could be array or object)
      if (Array.isArray(driverData.profiles) && driverData.profiles.length > 0) {
        profilesInfo = driverData.profiles[0];
      } else if (driverData.profiles && typeof driverData.profiles === 'object') {
        profilesInfo = driverData.profiles;
      }
      
      console.log('📊 Extracted driver info:', {
        driverId: driverInfo.id,
        hasProfiles: !!profilesInfo,
        profileName: profilesInfo ? `${profilesInfo.first_name} ${profilesInfo.last_name}` : 'No profile'
      });
    }

    const formattedTransport: SchoolTransport = {
      id: transportData.id || '',
      school_name: transportData.school_name || 'Unknown School',
      school_area: transportData.school_area || 'Unknown Area',
      pickup_areas: Array.isArray(transportData.pickup_areas) 
        ? transportData.pickup_areas 
        : (transportData.pickup_areas ? [transportData.pickup_areas] : []),
      pickup_times: Array.isArray(transportData.pickup_times) 
        ? transportData.pickup_times 
        : (transportData.pickup_times ? [transportData.pickup_times] : []),
      capacity: transportData.capacity || 0,
      current_riders: transportData.current_riders || 0,
      price_per_month: transportData.price_per_month || 0,
      price_per_week: transportData.price_per_week || 0,
      vehicle_info: transportData.vehicle_info || '',
      vehicle_type: transportData.vehicle_type || 'Standard Vehicle',
      features: Array.isArray(transportData.features) ? transportData.features : [],
      description: transportData.description || '',
      is_verified: transportData.is_verified || false,
      created_at: transportData.created_at || new Date().toISOString(),
      updated_at: transportData.updated_at || new Date().toISOString(),
      driver: {
        id: driverInfo?.id || transportData.driver_id || '',
        user_id: driverInfo?.user_id || '',
        is_verified: driverInfo?.is_verified || false,
        profiles: {
          first_name: profilesInfo?.first_name || 'Unknown',
          last_name: profilesInfo?.last_name || 'Driver',
          rating: driverInfo?.rating || 0,
          total_trips: driverInfo?.total_trips || 0,
          phone: profilesInfo?.phone,
          email: profilesInfo?.email,
          avatar_url: profilesInfo?.avatar_url
        }
      }
    };

    console.log('✅ ===== FORMATTED TRANSPORT =====');
    console.log('🏫 School:', formattedTransport.school_name);
    console.log('📍 Area:', formattedTransport.school_area);
    console.log('👤 Driver:', `${formattedTransport.driver.profiles.first_name} ${formattedTransport.driver.profiles.last_name}`);
    console.log('💺 Capacity:', `${formattedTransport.current_riders}/${formattedTransport.capacity}`);
    console.log('💰 Price:', `$${formattedTransport.price_per_month}/month`);
    console.log('📋 Pickup areas:', formattedTransport.pickup_areas.length);
    console.log('🕐 Pickup times:', formattedTransport.pickup_times.length);
    console.log('==============================');

    setTransport(formattedTransport);

  } catch (error) {
    console.error('❌ ===== UNEXPECTED ERROR =====');
    console.error('Error:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    console.error('==============================');
    
    setTransport(null);
  } finally {
    console.log('🏁 fetchTransportDetails completed');
    setLoading(false);
    setRefreshing(false);
  }
};

// Helper function to format transport data
const formatTransportData = (data: any): SchoolTransport => {
  console.log('🔧 Formatting transport data...', {
    rawData: data,
    driversType: typeof data.drivers,
    driversIsArray: Array.isArray(data.drivers)
  });

  // Handle driver data - it could be an array or object
  let driverInfo = null;
  
  if (Array.isArray(data.drivers) && data.drivers.length > 0) {
    driverInfo = data.drivers[0];
  } else if (data.drivers && typeof data.drivers === 'object') {
    driverInfo = data.drivers;
  }
  
  console.log('🔧 Extracted driver info:', driverInfo);

  // Handle profiles data
  let profilesInfo = null;
  if (driverInfo) {
    if (Array.isArray(driverInfo.profiles) && driverInfo.profiles.length > 0) {
      profilesInfo = driverInfo.profiles[0];
    } else if (driverInfo.profiles && typeof driverInfo.profiles === 'object') {
      profilesInfo = driverInfo.profiles;
    }
  }

  const formattedTransport: SchoolTransport = {
    id: data.id || '',
    school_name: data.school_name || 'Unknown School',
    school_area: data.school_area || 'Unknown Area',
    pickup_areas: Array.isArray(data.pickup_areas) ? data.pickup_areas : (data.pickup_areas ? [data.pickup_areas] : []),
    pickup_times: Array.isArray(data.pickup_times) ? data.pickup_times : (data.pickup_times ? [data.pickup_times] : []),
    capacity: data.capacity || 0,
    current_riders: data.current_riders || 0,
    price_per_month: data.price_per_month || 0,
    price_per_week: data.price_per_week || 0,
    vehicle_info: data.vehicle_info || '',
    vehicle_type: data.vehicle_type || 'Standard Vehicle',
    features: Array.isArray(data.features) ? data.features : [],
    description: data.description || '',
    is_verified: data.is_verified || false,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    driver: {
      id: driverInfo?.id || data.driver_id || '',
      user_id: driverInfo?.user_id || '',
      is_verified: driverInfo?.is_verified || false,
      profiles: {
        first_name: profilesInfo?.first_name || 'Unknown',
        last_name: profilesInfo?.last_name || 'Driver',
        rating: driverInfo?.rating || 0,
        total_trips: driverInfo?.total_trips || 0,
        phone: profilesInfo?.phone,
        email: profilesInfo?.email,
        avatar_url: profilesInfo?.avatar_url
      }
    }
  };

  console.log('✅ Formatted transport:', {
    schoolName: formattedTransport.school_name,
    driverName: `${formattedTransport.driver.profiles.first_name} ${formattedTransport.driver.profiles.last_name}`,
    hasPickupAreas: formattedTransport.pickup_areas.length
  });

  return formattedTransport;
};

  const checkIfApplied = async () => {
    console.log('🔍 Checking if user has applied...');
    if (!user) {
      console.log('👤 No user, skipping application check');
      return;
    }

    try {
      console.log('📡 Querying transport_requests for user:', user.id);
      const { data, error } = await supabase
        .from('transport_requests')
        .select('id, status')
        .eq('transport_id', id)
        .eq('user_id', user.id)
        .single();

      console.log('📊 Application check result:', {
        hasData: !!data,
        data: data,
        error: error,
        errorCode: error?.code
      });

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('❌ Error checking application:', error);
      } else if (error?.code === 'PGRST116') {
        console.log('✅ User has not applied to this transport');
      } else {
        console.log('✅ User has applied, application ID:', data?.id);
      }

      setHasApplied(!!data);
    } catch (error) {
      console.error('❌ Unexpected error in checkIfApplied:', error);
    }
  };

  const onRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchTransportDetails();
  };

  const handleApply = () => {
    console.log('📝 Apply button pressed');
    if (!transport) {
      console.error('❌ Cannot apply - no transport data');
      return;
    }
    
    if (transport.current_riders >= transport.capacity) {
      console.log('⚠️ Transport is at full capacity');
      Alert.alert(
        'Full Capacity',
        'This transport service has reached its maximum capacity',
        [{ text: 'OK' }]
      );
      return;
    }

    if (hasApplied) {
      console.log('⚠️ User has already applied');
      Alert.alert(
        'Already Applied',
        'You have already applied to this transport service',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('➡️ Navigating to application form');
    // Navigate to application form
    router.push({
      pathname: '/transport-application',
      params: { 
        transportId: transport.id,
        driverId: transport.driver.id,
        transportName: transport.school_name,
        schoolArea: transport.school_area
      }
    });
  };

  const handleContactDriver = () => {
    console.log('📞 Contact driver pressed');
    if (!transport || !transport.driver.profiles.phone) {
      console.log('⚠️ No phone number available');
      Alert.alert('Contact Information', 'Phone number not available for this driver');
      return;
    }

    console.log('📲 Calling driver:', transport.driver.profiles.phone);
    Alert.alert(
      'Contact Driver',
      `Call ${transport.driver.profiles.first_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${transport.driver.profiles.phone}`)
        }
      ]
    );
  };

  const handleMessageDriver = () => {
    console.log('💬 Message driver pressed');
    if (!user) {
      console.log('⚠️ User not logged in');
      Alert.alert('Sign In Required', 'Please sign in to message the driver');
      return;
    }

    if (transport) {
      console.log('➡️ Navigating to chat with driver:', transport.driver.id);
      router.push(`/chat/${transport.driver.id}`);
    }
  };

  const handleViewDriverProfile = () => {
    console.log('👤 View driver profile pressed');
    if (transport) {
      console.log('➡️ Navigating to driver profile:', transport.driver.id);
      router.push(`/driver/${transport.driver.id}`);
    }
  };

  const handleShare = async () => {
    console.log('📤 Share pressed');
    if (!transport) return;

    try {
      console.log('📲 Sharing transport:', transport.id);
      await Share.share({
        message: `Check out this school transport service for ${transport.school_name} in ${transport.school_area}. Available seats: ${transport.capacity - transport.current_riders}/${transport.capacity}`,
        url: `https://mobile.uthutho.co.za/school-transport/${transport.id}`,
        title: `Transport Service: ${transport.school_name}`
      });
    } catch (error) {
      console.error('❌ Error sharing:', error);
    }
  };

  const handleOpenMaps = (area: string) => {
    console.log('🗺️ Opening maps for area:', area);
    const encodedArea = encodeURIComponent(area);
    const url = `https://maps.google.com/?q=${encodedArea}`;
    Linking.openURL(url).catch(() => {
      console.error('❌ Failed to open maps');
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  const handleReportIssue = () => {
    console.log('🚨 Report issue pressed');
    Alert.alert(
      'Report Issue',
      'Select an issue to report',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Incorrect Information', onPress: () => reportIssue('incorrect_info') },
        { text: 'Safety Concern', onPress: () => reportIssue('safety_concern') },
        { text: 'Spam or Fake', onPress: () => reportIssue('spam_fake') },
        { text: 'Other', onPress: () => reportIssue('other') },
      ]
    );
  };

  const reportIssue = async (type: string) => {
    console.log('📝 Submitting report type:', type);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          transport_id: id,
          user_id: user?.id,
          report_type: type,
          status: 'pending'
        });

      if (error) {
        console.error('❌ Error submitting report:', error);
        throw error;
      }

      console.log('✅ Report submitted successfully');
      Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const handleGoBack = () => {
    console.log('⬅️ Go back pressed');
    router.back();
  };

  console.log('🔄 Render - loading:', loading, 'transport:', !!transport);

  if (loading) {
    console.log('⏳ Showing loading state');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transport details...</Text>
        </View>
      </View>
    );
  }

  if (!transport) {
    console.log('❌ No transport data, showing empty state');
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <School size={64} color="#888888" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Transport Found</Text>
          <Text style={styles.emptyMessage}>
            The transport service you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleGoBack}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate values safely
  const availableSeats = Math.max(0, transport.capacity - transport.current_riders);
  const isFull = availableSeats <= 0;
  const driverName = `${transport.driver.profiles.first_name} ${transport.driver.profiles.last_name}`;
  const driverRating = transport.driver.profiles.rating || 0;
  const driverTrips = transport.driver.profiles.total_trips || 0;

  console.log('✅ Rendering transport details:', {
    schoolName: transport.school_name,
    availableSeats,
    driverName,
    hasDriverProfile: !!transport.driver.id
  });

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={["#1ea2b1"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Transport Header Section - ALWAYS SHOW */}
        <View style={styles.transportHeader}>
          <View style={styles.schoolInfo}>
            <View style={styles.schoolIcon}>
              <School size={24} color="#1ea2b1" />
            </View>
            <View style={styles.schoolText}>
              <Text style={styles.schoolName}>{transport.school_name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#888888" />
                <Text style={styles.schoolArea}>{transport.school_area}</Text>
              </View>
            </View>
          </View>
          
          {transport.is_verified && (
            <View style={styles.verifiedBadge}>
              <Shield size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified Service</Text>
            </View>
          )}
        </View>

        {/* Availability Banner - ALWAYS SHOW */}
        <View style={[
          styles.availabilityBanner,
          isFull ? styles.fullBanner : styles.availableBanner
        ]}>
          <View style={styles.availabilityContent}>
            <Users size={20} color={isFull ? '#EF4444' : '#10B981'} />
            <View style={styles.availabilityText}>
              <Text style={[
                styles.availabilityStatus,
                { color: isFull ? '#EF4444' : '#10B981' }
              ]}>
                {isFull ? 'FULL' : 'AVAILABLE'}
              </Text>
              <Text style={styles.availabilitySeats}>
                {availableSeats} of {transport.capacity} seats available
              </Text>
            </View>
          </View>
          {!isFull && transport.price_per_month > 0 && (
            <Text style={styles.availabilityPrice}>
              ${transport.price_per_month}/month
            </Text>
          )}
        </View>

        {/* Quick Stats - ALWAYS SHOW */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <DollarSign size={20} color="#1ea2b1" />
            <Text style={styles.statValue}>
              ${transport.price_per_month > 0 ? transport.price_per_month : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Per Month</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Clock size={20} color="#1ea2b1" />
            <Text style={styles.statValue}>{transport.pickup_times.length}</Text>
            <Text style={styles.statLabel}>Pickup Times</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Car size={20} color="#1ea2b1" />
            <Text style={styles.statValue}>{transport.vehicle_type}</Text>
            <Text style={styles.statLabel}>Vehicle Type</Text>
          </View>
        </View>

        {/* Pickup Areas Section - SHOW IF HAS DATA */}
        {transport.pickup_areas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Areas</Text>
            <View style={styles.pickupAreas}>
              {transport.pickup_areas.map((area, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.pickupAreaItem}
                  onPress={() => handleOpenMaps(area)}
                >
                  <MapPin size={16} color="#1ea2b1" />
                  <Text style={styles.pickupAreaText}>{area}</Text>
                  <Navigation size={16} color="#666666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Pickup Times Section - SHOW IF HAS DATA */}
        {transport.pickup_times.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Times</Text>
            <View style={styles.pickupTimes}>
              {transport.pickup_times.map((time, index) => (
                <View key={index} style={styles.timeSlot}>
                  <Clock size={16} color="#1ea2b1" />
                  <Text style={styles.timeText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description Section - SHOW IF HAS DATA */}
        {(transport.description && transport.description.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 3}>
              {transport.description}
            </Text>
            {transport.description.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Vehicle Information - ALWAYS SHOW (with fallbacks) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleDetail}>
              <Car size={20} color="#888888" />
              <Text style={styles.vehicleDetailText}>{transport.vehicle_type}</Text>
            </View>
            {transport.vehicle_info && transport.vehicle_info.trim() && (
              <Text style={styles.vehicleDescription}>{transport.vehicle_info}</Text>
            )}
          </View>
          
          {/* Features - SHOW IF HAS DATA */}
          {transport.features.length > 0 && (
            <>
              <Text style={styles.featuresTitle}>Features</Text>
              <View style={styles.featuresGrid}>
                {transport.features.map((feature, index) => (
                  <View key={index} style={styles.featureBadge}>
                    <CheckCircle size={14} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Driver Information Section - ALWAYS SHOW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <TouchableOpacity 
            style={styles.driverCard}
            onPress={handleViewDriverProfile}
          >
            <View style={styles.driverInfo}>
              {transport.driver.profiles.avatar_url ? (
                <Image 
                  source={{ uri: transport.driver.profiles.avatar_url }}
                  style={styles.driverAvatar}
                />
              ) : (
                <View style={styles.driverAvatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {transport.driver.profiles.first_name?.[0]}{transport.driver.profiles.last_name?.[0]}
                  </Text>
                </View>
              )}
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverName}</Text>
                
                <View style={styles.driverStats}>
                  <View style={styles.driverStat}>
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.driverStatText}>
                      {driverRating.toFixed(1)} ({driverTrips} trips)
                    </Text>
                  </View>
                  
                  {transport.driver.is_verified && (
                    <View style={styles.driverVerified}>
                      <Shield size={14} color="#10B981" />
                      <Text style={styles.driverVerifiedText}>Verified Driver</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>

          {/* Contact Buttons - SHOW IF HAS CONTACT INFO */}
          {(transport.driver.profiles.phone || transport.driver.profiles.email) && (
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={[styles.contactButton, styles.messageButton]}
                onPress={handleMessageDriver}
              >
                <MessageSquare size={20} color="#1ea2b1" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
              
              {transport.driver.profiles.phone && (
                <TouchableOpacity 
                  style={[styles.contactButton, styles.callButton]}
                  onPress={handleContactDriver}
                >
                  <Phone size={20} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Report Issue - ALWAYS SHOW */}
        <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.reportText}>Report an Issue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Apply Button (Fixed at bottom) - ALWAYS SHOW IF NOT FULL */}
      {!hasApplied && !isFull && (
        <View style={styles.applyContainer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.9}
          >
            <Text style={styles.applyButtonText}>
              {transport.price_per_month > 0 
                ? `Apply Now - $${transport.price_per_month}/month`
                : 'Apply Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {hasApplied && (
        <View style={styles.applyContainer}>
          <TouchableOpacity 
            style={[styles.applyButton, styles.appliedButton]}
            disabled
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>Application Submitted</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFull && !hasApplied && (
        <View style={styles.applyContainer}>
          <TouchableOpacity 
            style={[styles.applyButton, styles.fullButton]}
            disabled
          >
            <AlertCircle size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>No Seats Available</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 80,
  },
  transportHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  schoolText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolArea: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  availabilityBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  fullBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    marginLeft: 12,
  },
  availabilityStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  availabilitySeats: {
    fontSize: 12,
    color: '#888888',
  },
  availabilityPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 20,
    marginBottom: 20,
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#111111',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pickupAreas: {
    gap: 8,
  },
  pickupAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pickupAreaText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  pickupTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  vehicleInfo: {
    gap: 12,
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetailText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  vehicleDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  featureText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverStatText: {
    color: '#888888',
    fontSize: 12,
    marginLeft: 4,
  },
  driverVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  driverVerifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButton: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  messageButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#1ea2b1',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 8,
  },
  reportText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  applyButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appliedButton: {
    backgroundColor: '#10B981',
  },
  fullButton: {
    backgroundColor: '#EF4444',
  },
});