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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  Shield,
  Car,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  Award,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface DriverProfile {
  id: string;
  user_id: string;
  is_verified: boolean;
  license_number: string;
  vehicle_registration: string;
  insurance_provider: string;
  insurance_expiry: string;
  years_experience: number;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url: string;
    rating: number;
    total_trips: number;
    bio: string;
  };
  transports: Array<{
    id: string;
    school_name: string;
    school_area: string;
    capacity: number;
    current_riders: number;
    price_per_month: number;
    is_verified: boolean;
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
      
      // Fetch driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            rating,
            total_trips,
            bio
          )
        `)
        .eq('id', id)
        .single();

      if (driverError) throw driverError;

      // Fetch driver's transports
      const { data: transportsData, error: transportsError } = await supabase
        .from('school_transports')
        .select(`
          id,
          school_name,
          school_area,
          capacity,
          current_riders,
          price_per_month,
          is_verified
        `)
        .eq('driver_id', id)
        .eq('is_active', true);

      if (transportsError) throw transportsError;

      // Fetch driver reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('transport_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!transport_reviews_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('driver_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      const driverProfile: DriverProfile = {
        ...driverData,
        profiles: driverData.profiles || {
          first_name: 'Unknown',
          last_name: 'Driver',
          email: '',
          phone: '',
          avatar_url: '',
          rating: 0,
          total_trips: 0,
          bio: ''
        },
        transports: transportsData || [],
        reviews: reviewsData || []
      };

      setDriver(driverProfile);
      
      // Check if this is the current user's profile
      if (user && driverData.user_id === user.id) {
        setIsCurrentUser(true);
      }
      
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      Alert.alert('Error', 'Failed to load driver profile');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    // Navigate to chat with driver
    if (user && driver) {
      router.push(`/chat/${driver.id}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading driver profile...</Text>
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Driver not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = driver.profiles;
  const averageRating = profile.rating || 0;
  const fullName = `${profile.first_name} ${profile.last_name}`;

  return (
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.profileHeader}>
          {profile.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </Text>
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>
                {averageRating.toFixed(1)} ({profile.total_trips} trips)
              </Text>
            </View>
            
            {driver.is_verified && (
              <View style={styles.verifiedBadge}>
                <Shield size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Verified Driver</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isCurrentUser ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={handleSendMessage}
              >
                <MessageSquare size={20} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactGrid}>
          {profile.phone && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('phone')}
            >
              <Phone size={20} color="#1ea2b1" />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </TouchableOpacity>
          )}
          
          {profile.email && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <Mail size={20} color="#1ea2b1" />
              <Text style={styles.contactText}>{profile.email}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Driver Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Car size={20} color="#888888" />
            <Text style={styles.infoLabel}>Experience</Text>
            <Text style={styles.infoValue}>
              {driver.years_experience || 0} years
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Shield size={20} color="#888888" />
            <Text style={styles.infoLabel}>License</Text>
            <Text style={styles.infoValue}>
              {driver.license_number ? '✓ Verified' : 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Calendar size={20} color="#888888" />
            <Text style={styles.infoLabel}>Insurance</Text>
            <Text style={styles.infoValue}>
              {driver.insurance_provider || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Award size={20} color="#888888" />
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>
              {new Date(driver.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        
        {profile.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}
      </View>

      {/* Available Transports */}
      {driver.transports.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Transports</Text>
          
          {driver.transports.map((transport) => (
            <TouchableOpacity
              key={transport.id}
              style={styles.transportCard}
              onPress={() => handleViewTransport(transport.id)}
            >
              <View style={styles.transportInfo}>
                <Text style={styles.transportName}>{transport.school_name}</Text>
                <Text style={styles.transportArea}>{transport.school_area}</Text>
                
                <View style={styles.transportDetails}>
                  <View style={styles.transportDetail}>
                    <Users size={16} color="#888888" />
                    <Text style={styles.transportDetailText}>
                      {transport.current_riders}/{transport.capacity} seats
                    </Text>
                  </View>
                  
                  <View style={styles.transportDetail}>
                    <Text style={styles.transportPrice}>
                      ${transport.price_per_month}/month
                    </Text>
                  </View>
                </View>
              </View>
              
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reviews */}
      {driver.reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews ({driver.reviews.length})
          </Text>
          
          {driver.reviews.slice(0, 3).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>
                    {review.reviewer.first_name} {review.reviewer.last_name}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.reviewRating}>
                  <Star size={16} color="#FBBF24" fill="#FBBF24" />
                  <Text style={styles.ratingNumber}>{review.rating.toFixed(1)}</Text>
                </View>
              </View>
              
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
            </View>
          ))}
          
          {driver.reviews.length > 3 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push(`/driver/${id}/reviews`)}
            >
              <Text style={styles.viewAllText}>
                View all {driver.reviews.length} reviews
              </Text>
              <ChevronRight size={20} color="#1ea2b1" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    backgroundColor: '#111111',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: '#CCCCCC',
    marginLeft: 6,
    fontSize: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactGrid: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoLabel: {
    color: '#888888',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bioContainer: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginTop: 12,
  },
  bioText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  transportInfo: {
    flex: 1,
  },
  transportName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transportArea: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
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
    color: '#888888',
    fontSize: 12,
  },
  transportPrice: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    color: '#888888',
    fontSize: 12,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewComment: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  viewAllText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
});