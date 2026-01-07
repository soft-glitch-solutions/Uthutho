// app/driver/[id].tsx
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
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  Shield,
  Car,
  Phone,
  Mail,
  Users,
  MessageCircle,
  ChevronRight,
  Calendar,
  Award,
  FileText,
  MapPin,
  CheckCircle,
  TrendingUp,
  Car as CarIcon,
  PhoneCall,
  Mail as MailIcon,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width } = Dimensions.get('window');

interface DriverProfile {
  id: string;
  user_id: string;
  is_verified: boolean;
  license_number: string;
  vehicle_type: string;
  vehicle_registration: string;
  is_active: boolean;
  rating: number;
  total_trips: number;
  created_at: string;
  updated_at: string;
  license_front_url?: string;
  license_back_url?: string;
  pdp_certificate_url?: string;
  vehicle_photos?: string[];
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  profiles: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
  };
  transports: Array<{
    id: string;
    school_name: string;
    school_area: string;
    capacity: number;
    current_riders: number;
    price_per_month: number;
    is_verified: boolean;
    vehicle_type: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer: {
      first_name: string;
      last_name: string;
    };
  }>;
}

// Helper function to convert USD to ZAR (Rands)
const formatToRands = (usdAmount: number): string => {
  const exchangeRate = 18.5; // Approximate USD to ZAR exchange rate
  const zarAmount = usdAmount * exchangeRate;
  return `R${zarAmount.toFixed(0)}`;
};

// Skeleton Loading Components
const SkeletonAvatar = () => (
  <View style={styles.skeletonAvatar}>
    <View style={styles.skeletonInner} />
  </View>
);

const SkeletonText = ({ width = 100, height = 16 }: { width?: number; height?: number }) => (
  <View style={[styles.skeletonText, { width, height }]} />
);

const SkeletonButton = () => (
  <View style={styles.skeletonButton} />
);

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonCardContent}>
      <SkeletonText width={120} height={20} />
      <SkeletonText width={80} height={14} />
    </View>
  </View>
);

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDriverProfile();
    }
  }, [id]);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles!drivers_user_id_fkey (
            first_name,
            last_name,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (driverError) {
        // Fallback to separate queries
        const { data: driverOnly } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (driverOnly) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, email, avatar_url')
            .eq('id', driverOnly.user_id)
            .single();
          
          const driverWithProfile = {
            ...driverOnly,
            profiles: profileData || {
              first_name: 'Unknown',
              last_name: 'Driver',
              phone: '',
              email: '',
              avatar_url: ''
            }
          };
          
          await fetchTransportsAndReviews(driverWithProfile);
          return;
        }
        
        Alert.alert('Error', 'Failed to load driver profile');
        router.back();
        return;
      }

      if (!driverData) {
        Alert.alert('Error', 'Driver not found');
        router.back();
        return;
      }

      await fetchTransportsAndReviews(driverData);

    } catch (error) {
      Alert.alert('Error', 'Failed to load driver profile');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransportsAndReviews = async (driverData: any) => {
    let profilesInfo = null;
    if (Array.isArray(driverData.profiles) && driverData.profiles.length > 0) {
      profilesInfo = driverData.profiles[0];
    } else if (driverData.profiles && typeof driverData.profiles === 'object') {
      profilesInfo = driverData.profiles;
    }

    const { data: transportsData } = await supabase
      .from('school_transports')
      .select(`
        id,
        school_name,
        school_area,
        capacity,
        current_riders,
        price_per_month,
        is_verified,
        vehicle_type
      `)
      .eq('driver_id', driverData.id)
      .eq('is_active', true);

    const { data: reviewsData } = await supabase
      .from('transport_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles!transport_reviews_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('driver_id', driverData.id)
      .order('created_at', { ascending: false });

    const driverProfile: DriverProfile = {
      id: driverData.id || '',
      user_id: driverData.user_id || '',
      is_verified: driverData.is_verified || false,
      license_number: driverData.license_number || '',
      vehicle_type: driverData.vehicle_type || '',
      vehicle_registration: driverData.vehicle_registration || '',
      is_active: driverData.is_active || false,
      rating: driverData.rating || 0,
      total_trips: driverData.total_trips || 0,
      created_at: driverData.created_at || new Date().toISOString(),
      updated_at: driverData.updated_at || new Date().toISOString(),
      license_front_url: driverData.license_front_url,
      license_back_url: driverData.license_back_url,
      pdp_certificate_url: driverData.pdp_certificate_url,
      vehicle_photos: driverData.vehicle_photos || [],
      verification_notes: driverData.verification_notes,
      verified_by: driverData.verified_by,
      verified_at: driverData.verified_at,
      profiles: {
        first_name: profilesInfo?.first_name || 'Unknown',
        last_name: profilesInfo?.last_name || 'Driver',
        email: profilesInfo?.email,
        phone: profilesInfo?.phone,
        avatar_url: profilesInfo?.avatar_url,
        bio: profilesInfo?.bio
      },
      transports: transportsData || [],
      reviews: reviewsData?.map(review => ({
        id: review.id,
        rating: review.rating || 0,
        comment: review.comment || '',
        created_at: review.created_at || new Date().toISOString(),
        reviewer: {
          first_name: review.profiles?.first_name || 'Anonymous',
          last_name: review.profiles?.last_name || 'User'
        }
      })) || []
    };

    setDriver(driverProfile);
    
    if (user && driverData.user_id === user.id) {
      setIsCurrentUser(true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDriverProfile();
  };

  const handleContact = (type: 'phone' | 'email') => {
    if (!driver) return;
    
    const profile = driver.profiles;
    
    if (type === 'phone' && profile.phone) {
      Linking.openURL(`tel:${profile.phone}`);
    } else if (type === 'email' && profile.email) {
      Linking.openURL(`mailto:${profile.email}`);
    } else {
      Alert.alert('Contact Information', 'Contact information not available');
    }
  };

  const handleViewTransport = (transportId: string) => {
    router.push(`/school-transport/${transportId}`);
  };

  const handleEditProfile = () => {
    router.push('/driver/edit-profile');
  };

  const handleSendMessage = () => {
    if (user && driver) {
      router.push(`/chat/${driver.id}`);
    } else {
      Alert.alert('Sign In Required', 'Please sign in to message the driver');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderSkeletonLoading = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section Skeleton */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <SkeletonAvatar />
            <View style={styles.heroInfo}>
              <SkeletonText width={180} height={28} />
              <View style={{ marginVertical: 8 }}>
                <SkeletonText width={120} height={16} />
              </View>
              <SkeletonText width={200} height={14} />
            </View>
          </View>
          <SkeletonButton />
        </View>

        {/* Stats Grid Skeleton */}
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.skeletonStatIcon} />
              <SkeletonText width={40} height={20} />
              <SkeletonText width={60} height={12} />
            </View>
          ))}
        </View>

        {/* Contact Information Skeleton */}
        <View style={styles.section}>
          <SkeletonText width={120} height={20} />
          <View style={styles.contactGrid}>
            {[1, 2].map((i) => (
              <View key={i} style={styles.skeletonContactCard}>
                <View style={styles.skeletonContactIcon} />
                <View style={styles.skeletonContactDetails}>
                  <SkeletonText width={40} height={12} />
                  <SkeletonText width={100} height={16} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Driver Details Skeleton */}
        <View style={styles.section}>
          <SkeletonText width={120} height={20} />
          <View style={styles.detailsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonDetailItem}>
                <View style={styles.skeletonIcon} />
                <SkeletonText width={60} height={12} />
                <SkeletonText width={80} height={15} />
              </View>
            ))}
          </View>
        </View>

        {/* Transports Skeleton */}
        <View style={styles.section}>
          <SkeletonText width={180} height={20} />
          <View style={styles.transportsList}>
            {[1, 2].map((i) => (
              <View key={i} style={styles.skeletonTransportCard}>
                <View style={styles.skeletonTransportHeader}>
                  <View style={styles.skeletonTransportIcon} />
                  <View style={styles.skeletonTransportInfo}>
                    <SkeletonText width={150} height={16} />
                    <SkeletonText width={100} height={14} />
                  </View>
                </View>
                <View style={styles.skeletonTransportDetails}>
                  <SkeletonText width={100} height={14} />
                  <SkeletonText width={80} height={16} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews Skeleton */}
        <View style={styles.section}>
          <SkeletonText width={150} height={20} />
          <View style={styles.reviewsList}>
            {[1, 2].map((i) => (
              <View key={i} style={styles.skeletonReviewCard}>
                <View style={styles.skeletonReviewHeader}>
                  <View style={styles.skeletonReviewerAvatar} />
                  <View style={styles.skeletonReviewerInfo}>
                    <SkeletonText width={120} height={15} />
                    <SkeletonText width={80} height={12} />
                  </View>
                </View>
                <SkeletonText width="100%" height={40} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return renderSkeletonLoading();
  }

  if (!driver) {
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Driver not found</Text>
          <Text style={styles.errorMessage}>
            The driver profile you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleGoBack}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const profile = driver.profiles;
  const averageRating = driver.rating || 0;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const memberSince = new Date(driver.created_at).getFullYear();
  const availableSeats = driver.transports.reduce((total, transport) => 
    total + (transport.capacity - transport.current_riders), 0
  );
  const totalCapacity = driver.transports.reduce((total, transport) => 
    total + transport.capacity, 0
  );

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
        
        {!isCurrentUser && (
          <TouchableOpacity 
            style={styles.messageHeaderButton}
            onPress={handleSendMessage}
          >
            <MessageCircle size={22} color="#1ea2b1" />
          </TouchableOpacity>
        )}
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            {profile.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.heroAvatar}
              />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </Text>
              </View>
            )}
            
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{fullName}</Text>
                {driver.is_verified && (
                  <View style={styles.verifiedIcon}>
                    <Shield size={16} color="#10B981" />
                  </View>
                )}
              </View>
              
              <View style={styles.ratingRow}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color={star <= Math.round(averageRating) ? "#FBBF24" : "#4B5563"}
                      fill={star <= Math.round(averageRating) ? "#FBBF24" : "transparent"}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} • {driver.total_trips} trips
                </Text>
              </View>
              
              <Text style={styles.heroSubtitle}>
                Professional School Transport Driver
              </Text>
            </View>
          </View>
          
          {isCurrentUser ? (
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactButtons}>
              {profile.phone && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => handleContact('phone')}
                >
                  <PhoneCall size={20} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.contactButton, styles.messageButton]}
                onPress={handleSendMessage}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
              <Car size={20} color="#1ea2b1" />
            </View>
            <Text style={styles.statValue}>{driver.transports.length}</Text>
            <Text style={styles.statLabel}>Active Routes</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Users size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{availableSeats}</Text>
            <Text style={styles.statLabel}>Seats Available</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <TrendingUp size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{driver.total_trips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Calendar size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{memberSince}</Text>
            <Text style={styles.statLabel}>Since</Text>
          </View>
        </View>

        {/* Contact Information */}
        {(profile.phone || profile.email) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <View style={styles.contactGrid}>
              {profile.phone && (
                <TouchableOpacity 
                  style={styles.contactInfoCard}
                  onPress={() => handleContact('phone')}
                >
                  <View style={styles.contactIcon}>
                    <Phone size={20} color="#1ea2b1" />
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactType}>Phone</Text>
                    <Text style={styles.contactValue}>{profile.phone}</Text>
                  </View>
                  <ChevronRight size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
              
              {profile.email && (
                <TouchableOpacity 
                  style={styles.contactInfoCard}
                  onPress={() => handleContact('email')}
                >
                  <View style={styles.contactIcon}>
                    <MailIcon size={20} color="#1ea2b1" />
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactType}>Email</Text>
                    <Text style={styles.contactValue}>{profile.email}</Text>
                  </View>
                  <ChevronRight size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Driver Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <CarIcon size={18} color="#6B7280" />
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{driver.vehicle_type || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <FileText size={18} color="#6B7280" />
              <Text style={styles.detailLabel}>License</Text>
              <Text style={styles.detailValue}>
                {driver.license_number ? 'Verified' : 'Not provided'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Shield size={18} color="#6B7280" />
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, 
                driver.is_active ? styles.activeStatus : styles.inactiveStatus
              ]}>
                {driver.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Award size={18} color="#6B7280" />
              <Text style={styles.detailLabel}>Verified</Text>
              <Text style={[styles.detailValue, 
                driver.is_verified ? styles.verifiedStatus : styles.unverifiedStatus
              ]}>
                {driver.is_verified ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* Available Transports */}
        {driver.transports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Transports</Text>
              <Text style={styles.sectionSubtitle}>
                {driver.transports.length} routes • {availableSeats}/{totalCapacity} seats
              </Text>
            </View>
            
            <View style={styles.transportsList}>
              {driver.transports.map((transport) => (
                <TouchableOpacity
                  key={transport.id}
                  style={styles.transportCard}
                  onPress={() => handleViewTransport(transport.id)}
                >
                  <View style={styles.transportHeader}>
                    <View style={styles.transportIcon}>
                      <Car size={18} color="#1ea2b1" />
                    </View>
                    <View style={styles.transportInfo}>
                      <Text style={styles.transportName}>{transport.school_name}</Text>
                      <View style={styles.transportLocation}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.transportArea}>{transport.school_area}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </View>
                  
                  <View style={styles.transportDetails}>
                    <View style={styles.transportDetail}>
                      <Users size={16} color="#6B7280" />
                      <Text style={styles.transportDetailText}>
                        {transport.current_riders}/{transport.capacity} seats
                      </Text>
                    </View>
                    
                    {transport.price_per_month > 0 && (
                      <View style={styles.transportDetail}>
                        <Text style={styles.transportPrice}>
                          {formatToRands(transport.price_per_month)}/month
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {transport.is_verified && (
                    <View style={styles.transportVerified}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.transportVerifiedText}>Verified Route</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        {driver.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Text style={styles.sectionSubtitle}>
                {driver.reviews.length} total • {averageRating.toFixed(1)} avg rating
              </Text>
            </View>
            
            <View style={styles.reviewsList}>
              {driver.reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitials}>
                        {review.reviewer.first_name?.[0]}{review.reviewer.last_name?.[0]}
                      </Text>
                    </View>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>
                        {review.reviewer.first_name} {review.reviewer.last_name}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Star size={14} color="#FBBF24" fill="#FBBF24" />
                      <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  
                  {review.comment && (
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}
            </View>
            
            {driver.reviews.length > 2 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push(`/driver/${id}/reviews`)}
              >
                <Text style={styles.viewAllText}>
                  View all {driver.reviews.length} reviews
                </Text>
                <ChevronRight size={18} color="#1ea2b1" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Shield size={20} color="#10B981" />
          <Text style={styles.safetyText}>
            All drivers are verified and background checked for your safety
          </Text>
        </View>
        
        {/* Spacer for bottom padding */}
        <View style={styles.spacer} />
      </ScrollView>
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
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000000',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 100,
  },
  heroSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#1ea2b1',
  },
  heroAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(30, 162, 177, 0.3)',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  verifiedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  editProfileButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#374151',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  contactGrid: {
    gap: 12,
  },
  contactInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactType: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeStatus: {
    color: '#10B981',
  },
  inactiveStatus: {
    color: '#EF4444',
  },
  verifiedStatus: {
    color: '#10B981',
  },
  unverifiedStatus: {
    color: '#6B7280',
  },
  transportsList: {
    gap: 12,
  },
  transportCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transportInfo: {
    flex: 1,
  },
  transportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transportLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportArea: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  transportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transportDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transportDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  transportPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  transportVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  transportVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 6,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1ea2b1',
    marginRight: 8,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    lineHeight: 20,
  },
  spacer: {
    height: 100,
  },
  // Skeleton Loading Styles
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    overflow: 'hidden',
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
  },
  skeletonText: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  skeletonStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginBottom: 12,
  },
  skeletonContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  skeletonContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginRight: 12,
  },
  skeletonContactDetails: {
    flex: 1,
    gap: 4,
  },
  skeletonDetailItem: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  skeletonIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 4,
  },
  skeletonTransportCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  skeletonTransportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonTransportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginRight: 12,
  },
  skeletonTransportInfo: {
    flex: 1,
    gap: 4,
  },
  skeletonTransportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonReviewCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  skeletonReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonReviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    marginRight: 12,
  },
  skeletonReviewerInfo: {
    flex: 1,
    gap: 4,
  },
  skeletonCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  skeletonCardContent: {
    gap: 4,
  },
});