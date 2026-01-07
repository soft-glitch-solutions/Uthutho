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

  useEffect(() => {
    if (id) {
      fetchTransportDetails();
      checkIfApplied();
    }
  }, [id, user]);

  const fetchTransportDetails = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching transport details for ID:', id);
      
      const { data, error } = await supabase
        .from('school_transports')
        .select(`
          *,
          driver:driver_id (
            id,
            user_id,
            is_verified,
            profiles (
              first_name,
              last_name,
              rating,
              total_trips,
              phone,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      console.log('Query result:', { 
        hasData: !!data,
        error: error?.message,
        errorCode: error?.code 
      });

      if (error) {
        console.error('Error fetching transport details:', error);
        
        // If transport not found, still set null and let UI handle it
        setTransport(null);
        return;
      }

      if (data) {
        // Safely format the data, handling missing fields
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
            id: data.driver?.id || '',
            user_id: data.driver?.user_id || '',
            is_verified: data.driver?.is_verified || false,
            profiles: {
              first_name: data.driver?.profiles?.first_name || 'Unknown',
              last_name: data.driver?.profiles?.last_name || 'Driver',
              rating: data.driver?.profiles?.rating || 0,
              total_trips: data.driver?.profiles?.total_trips || 0,
              phone: data.driver?.profiles?.phone,
              email: data.driver?.profiles?.email,
              avatar_url: data.driver?.profiles?.avatar_url
            }
          }
        };
        
        console.log('Formatted transport:', formattedTransport);
        setTransport(formattedTransport);
      } else {
        setTransport(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setTransport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transport_requests')
        .select('id, status')
        .eq('transport_id', id)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error checking application:', error);
      }

      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransportDetails();
  };

  const handleApply = () => {
    if (!transport) return;
    
    if (transport.current_riders >= transport.capacity) {
      Alert.alert(
        'Full Capacity',
        'This transport service has reached its maximum capacity',
        [{ text: 'OK' }]
      );
      return;
    }

    if (hasApplied) {
      Alert.alert(
        'Already Applied',
        'You have already applied to this transport service',
        [{ text: 'OK' }]
      );
      return;
    }

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
    if (!transport || !transport.driver.profiles.phone) {
      Alert.alert('Contact Information', 'Phone number not available for this driver');
      return;
    }

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
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message the driver');
      return;
    }

    if (transport) {
      router.push(`/chat/${transport.driver.id}`);
    }
  };

  const handleViewDriverProfile = () => {
    if (transport) {
      router.push(`/driver/${transport.driver.id}`);
    }
  };

  const handleShare = async () => {
    if (!transport) return;

    try {
      await Share.share({
        message: `Check out this school transport service for ${transport.school_name} in ${transport.school_area}. Available seats: ${transport.capacity - transport.current_riders}/${transport.capacity}`,
        url: `https://mobile.uthutho.co.za/school-transport/${transport.id}`,
        title: `Transport Service: ${transport.school_name}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenMaps = (area: string) => {
    const encodedArea = encodeURIComponent(area);
    const url = `https://maps.google.com/?q=${encodedArea}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps');
    });
  };

  const handleReportIssue = () => {
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
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          transport_id: id,
          user_id: user?.id,
          report_type: type,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
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