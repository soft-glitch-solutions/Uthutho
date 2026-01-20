// app/carpool/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Linking,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  DollarSign, 
  Calendar, 
  Shield,
  Star,
  Phone,
  Mail,
  Share2,
  Navigation,
  CheckCircle,
  XCircle
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
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
  creator?: {
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
      total_trips: number;
      phone?: string;
      email?: string;
    };
  };
  members?: Array<{
    profiles: {
      first_name: string;
      last_name: string;
      rating: number;
    };
  }>;
}

export default function CarpoolDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [carpool, setCarpool] = useState<CarpoolClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
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
    if (id) {
      fetchCarpoolDetails();
      checkMembership();
    }
  }, [id, user]);

  const fetchCarpoolDetails = async () => {
    try {
      // First, fetch the carpool
      const { data: carpoolData, error: carpoolError } = await supabase
        .from('carpool_clubs')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (carpoolError) {
        console.error('Error fetching carpool:', carpoolError);
        showErrorModal('Failed to load carpool details');
        return;
      }

      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', carpoolData.creator_id)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
      }

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('carpool_members')
        .select(`
          profiles (*)
        `)
        .eq('carpool_id', id)
        .eq('is_active', true);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      // Check if current user is the creator
      if (user && carpoolData.creator_id === user.id) {
        setIsCreator(true);
      }

      setCarpool(carpoolData);
      setCreatorProfile(creatorData);
      setMembers(membersData || []);
      
    } catch (error) {
      console.error('Error:', error);
      showErrorModal('Failed to load carpool details');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('carpool_members')
        .select('*')
        .eq('carpool_id', id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking membership:', error);
        return;
      }

      if (data) {
        setIsMember(true);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

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

  const handleJoinCarpool = () => {
    if (!user) {
      showErrorModal('Please sign in to join this carpool');
      return;
    }

    if (!carpool) {
      showErrorModal('Carpool not found');
      return;
    }

    if (carpool.is_full || carpool.current_members >= carpool.max_members) {
      showErrorModal('This carpool is already full');
      return;
    }

    if (isMember) {
      showErrorModal('You are already a member of this carpool');
      return;
    }

    if (isCreator) {
      showErrorModal('You cannot join your own carpool');
      return;
    }

    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (applicationData: {
    studentName: string;
    grade: string;
    pickupAddress: string;
    parentPhone: string;
    parentEmail: string;
  }) => {
    if (!user || !carpool) return;

    setApplyLoading(true);
    try {
      // Insert into carpool_members table
      const { error } = await supabase
        .from('carpool_members')
        .insert({
          carpool_id: carpool.id,
          user_id: user.id,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setIsMember(true);
          showSuccessModal('You are already a member of this carpool.');
        } else {
          throw error;
        }
        return;
      }

      // Update carpool member count
      const { error: updateError } = await supabase
        .from('carpool_clubs')
        .update({
          current_members: carpool.current_members + 1,
          is_full: carpool.current_members + 1 >= carpool.max_members
        })
        .eq('id', carpool.id);

      if (updateError) {
        console.error('Error updating carpool count:', updateError);
      }

      setIsMember(true);
      showSuccessModal('Successfully joined the carpool!');
      setShowApplyModal(false);
      
      // Refresh carpool details
      fetchCarpoolDetails();
      
    } catch (error: any) {
      console.error('Error joining carpool:', error);
      showErrorModal('Failed to join carpool. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleOpenMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    Linking.openURL(url).catch(err => 
      console.error('Error opening maps:', err)
    );
  };

  const handleContactCreator = () => {
    if (!creatorProfile?.phone && !creatorProfile?.email) {
      showErrorModal('No contact information available');
      return;
    }

    Alert.alert(
      'Contact Creator',
      'Choose contact method:',
      [
        creatorProfile?.phone ? {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${creatorProfile.phone}`)
        } : null,
        creatorProfile?.email ? {
          text: 'Email',
          onPress: () => Linking.openURL(`mailto:${creatorProfile.email}`)
        } : null,
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ].filter(Boolean) as any[]
    );
  };

  const handleShare = async () => {
    if (!carpool) return;

    try {
      await Share.share({
        title: `Carpool Club: ${carpool.name}`,
        message: `Join our carpool club! From ${carpool.from_location} to ${carpool.to_location} at ${carpool.pickup_time}. ${carpool.description || ''}`,
        url: `https://yourapp.com/carpool/${carpool.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveCarpool = () => {
    if (!user || !carpool) return;

    Alert.alert(
      'Leave Carpool',
      'Are you sure you want to leave this carpool?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('carpool_members')
                .update({ is_active: false })
                .eq('carpool_id', carpool.id)
                .eq('user_id', user.id);

              if (error) throw error;

              // Update carpool member count
              await supabase
                .from('carpool_clubs')
                .update({
                  current_members: carpool.current_members - 1,
                  is_full: false
                })
                .eq('id', carpool.id);

              setIsMember(false);
              showSuccessModal('You have left the carpool');
              fetchCarpoolDetails();
              
            } catch (error) {
              console.error('Error leaving carpool:', error);
              showErrorModal('Failed to leave carpool');
            }
          }
        }
      ]
    );
  };

  const handleManageCarpool = () => {
    // Navigate to carpool management screen
    router.push(`/carpool/${id}/manage`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1ea2b1" />
        <Text style={styles.loadingText}>Loading carpool details...</Text>
      </View>
    );
  }

  if (!carpool) {
    return (
      <View style={styles.errorContainer}>
        <XCircle size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Carpool Not Found</Text>
        <Text style={styles.errorText}>This carpool club may have been removed or is no longer active.</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButtonHeader}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{carpool.name}</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Share2 size={20} color="#1ea2b1" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Route Info */}
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.routeDotStart} />
              <View style={styles.routeLine} />
              <View style={styles.routeDotEnd} />
            </View>
            <View style={styles.routeDetails}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>From</Text>
                <View style={styles.routeLocation}>
                  <MapPin size={16} color="#888888" />
                  <Text style={styles.routeText}>{carpool.from_location}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => handleOpenMaps(carpool.from_location)}
                >
                  <Navigation size={14} color="#1ea2b1" />
                  <Text style={styles.mapButtonText}>Open Map</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>To</Text>
                <View style={styles.routeLocation}>
                  <MapPin size={16} color="#888888" />
                  <Text style={styles.routeText}>{carpool.to_location}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => handleOpenMaps(carpool.to_location)}
                >
                  <Navigation size={14} color="#1ea2b1" />
                  <Text style={styles.mapButtonText}>Open Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Schedule Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={20} color="#1ea2b1" />
              <Text style={styles.cardTitle}>Schedule</Text>
            </View>
            <View style={styles.scheduleGrid}>
              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>Pickup Time</Text>
                <Text style={styles.scheduleValue}>{formatTime(carpool.pickup_time)}</Text>
              </View>
              {carpool.return_time && (
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>Return Time</Text>
                  <Text style={styles.scheduleValue}>{formatTime(carpool.return_time)}</Text>
                </View>
              )}
            </View>
            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>Days:</Text>
              <View style={styles.daysList}>
                {daysOfWeek.map(day => (
                  <View 
                    key={day}
                    style={[
                      styles.dayPill,
                      carpool.days_of_week.includes(day) 
                        ? styles.dayPillActive 
                        : styles.dayPillInactive
                    ]}
                  >
                    <Text 
                      style={[
                        styles.dayText,
                        carpool.days_of_week.includes(day) 
                          ? styles.dayTextActive 
                          : styles.dayTextInactive
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Carpool Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Users size={20} color="#1ea2b1" />
              <Text style={styles.detailValue}>
                {carpool.current_members}/{carpool.max_members}
              </Text>
              <Text style={styles.detailLabel}>Members</Text>
              {carpool.is_full && (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullBadgeText}>FULL</Text>
                </View>
              )}
            </View>
            
            <View style={styles.detailCard}>
              <DollarSign size={20} color="#1ea2b1" />
              <Text style={styles.detailValue}>
                {carpool.price_per_trip 
                  ? `$${carpool.price_per_trip}/trip`
                  : carpool.price_range || 'Free'
                }
              </Text>
              <Text style={styles.detailLabel}>Price</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Car size={20} color="#1ea2b1" />
              <Text style={styles.detailValue}>
                {carpool.vehicle_info || 'Not specified'}
              </Text>
              <Text style={styles.detailLabel}>Vehicle</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Calendar size={20} color="#1ea2b1" />
              <Text style={styles.detailValue}>
                {new Date(carpool.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.detailLabel}>Created</Text>
            </View>
          </View>

          {/* Description */}
          {carpool.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.descriptionText}>{carpool.description}</Text>
            </View>
          )}

          {/* Rules */}
          {carpool.rules && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rules</Text>
              <Text style={styles.rulesText}>{carpool.rules}</Text>
            </View>
          )}

          {/* Creator Info */}
          {creatorProfile && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Shield size={20} color="#1ea2b1" />
                <Text style={styles.cardTitle}>Carpool Creator</Text>
              </View>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorDetails}>
                  <Text style={styles.creatorName}>
                    {creatorProfile.first_name} {creatorProfile.last_name}
                  </Text>
                  <View style={styles.creatorStats}>
                    <Star size={14} color="#F59E0B" />
                    <Text style={styles.creatorRating}>
                      {creatorProfile.rating || 'New'}
                    </Text>
                    <Text style={styles.creatorTrips}>
                      • {creatorProfile.total_trips || 0} trips
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleContactCreator}
                  disabled={!creatorProfile.phone && !creatorProfile.email}
                >
                  <Phone size={16} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Members List */}
          {members.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Members ({members.length})</Text>
              <View style={styles.membersList}>
                {members.map((member, index) => (
                  <View key={index} style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>
                        {member.profiles?.first_name?.[0] || 'U'}
                        {member.profiles?.last_name?.[0] || 'S'}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.profiles?.first_name || 'Unknown'} {member.profiles?.last_name || 'User'}
                      </Text>
                      <View style={styles.memberRating}>
                        <Star size={12} color="#F59E0B" />
                        <Text style={styles.memberRatingText}>
                          {member.profiles?.rating || 'New'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {isCreator ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.manageButton]}
              onPress={handleManageCarpool}
            >
              <Text style={styles.actionButtonText}>Manage Carpool</Text>
            </TouchableOpacity>
          ) : isMember ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveCarpool}
            >
              <Text style={styles.actionButtonText}>Leave Carpool</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.joinButton]}
              onPress={handleJoinCarpool}
              disabled={carpool.is_full || carpool.current_members >= carpool.max_members}
            >
              <Text style={styles.actionButtonText}>
                {carpool.is_full || carpool.current_members >= carpool.max_members
                  ? 'Carpool Full'
                  : 'Join Carpool'
                }
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ApplyModal
        visible={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleSubmitApplication}
        loading={applyLoading}
        title="Join Carpool Club"
        submitButtonText="Send Request"
        fields={[
          {
            label: 'Your Name',
            placeholder: 'Enter your full name',
            key: 'studentName'
          },
          {
            label: 'Pickup Address (if different)',
            placeholder: 'Optional: Your exact pickup location',
            key: 'pickupAddress',
            optional: true
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
          },
          {
            label: 'Message to Creator',
            placeholder: 'Optional: Add a message...',
            key: 'grade',
            optional: true,
            multiline: true
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888888',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#111111',
  },
  backButtonHeader: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  routeContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    marginRight: 16,
  },
  routeDotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#333333',
    marginVertical: 4,
  },
  routeDotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  routeDetails: {
    flex: 1,
  },
  routeItem: {
    marginBottom: 12,
  },
  routeLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  routeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
    marginLeft: 4,
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleItem: {
    flex: 1,
  },
  scheduleLabel: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 4,
  },
  scheduleValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  daysContainer: {
    marginTop: 8,
  },
  daysLabel: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  daysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayPillActive: {
    backgroundColor: '#1ea2b1',
  },
  dayPillInactive: {
    backgroundColor: '#333333',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  dayTextInactive: {
    color: '#888888',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  detailLabel: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  fullBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 8,
  },
  fullBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
  },
  rulesText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  creatorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  creatorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  creatorRating: {
    color: '#F59E0B',
    fontSize: 14,
    marginLeft: 4,
  },
  creatorTrips: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 8,
  },
  contactButton: {
    backgroundColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  membersList: {
    marginTop: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberRatingText: {
    color: '#F59E0B',
    fontSize: 12,
    marginLeft: 4,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#1ea2b1',
  },
  leaveButton: {
    backgroundColor: '#EF4444',
  },
  manageButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});