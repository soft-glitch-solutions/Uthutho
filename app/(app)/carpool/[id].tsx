// app/carpool/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  Share,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  Shield,
  Star,
  Share2,
  Navigation,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Calendar,
  CreditCard
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';
import ApplyModal from '@/components/modals/ApplyModal';
import StatusModal from '@/components/modals/StatusModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CarpoolDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [carpool, setCarpool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 240;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ type: 'info', title: '', message: '' });
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCarpoolDetails();
      checkMembership();
    }
  }, [id, user]);

  const fetchCarpoolDetails = async () => {
    try {
      const { data: carpoolData, error: carpoolError } = await supabase
        .from('carpool_clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (carpoolError) throw carpoolError;

      const { data: creatorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', carpoolData.creator_id)
        .single();

      setCarpool(carpoolData);
      setCreatorProfile(creatorData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('carpool_members')
      .select('*')
      .eq('carpool_id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (data) setIsMember(true);
  };

  const handleJoinCarpool = () => {
    if (!user) {
      setModalStatus({ type: 'error', title: 'Sign In', message: 'Please sign in to join' });
      setShowStatusModal(true);
      return;
    }
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!user || !carpool) return;
    setApplyLoading(true);
    try {
      const { error } = await supabase
        .from('carpool_members')
        .insert({ carpool_id: carpool.id, user_id: user.id, is_active: true });

      if (error) throw error;

      await supabase
        .from('carpool_clubs')
        .update({ 
          current_members: carpool.current_members + 1,
          is_full: carpool.current_members + 1 >= carpool.max_members 
        })
        .eq('id', carpool.id);

      setIsMember(true);
      setModalStatus({ type: 'success', title: 'Welcome!', message: 'You have joined the club.' });
      setShowStatusModal(true);
      setShowApplyModal(false);
      fetchCarpoolDetails();
    } catch (error) {
      console.error(error);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleShare = async () => {
    if (!carpool) return;
    try {
      await Share.share({
        message: `Join ${carpool.name} Carpool Club! From ${carpool.from_location} to ${carpool.to_location}.`,
      });
    } catch (error) { console.error(error); }
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={require('@/assets/images/carpool.jpg')}
          style={[styles.headerImage, { opacity: imageOpacity }]}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Animated.View style={{ opacity: imageOpacity }}>
            <Text style={styles.headerTitle}>{carpool?.name}</Text>
            <View style={styles.headerSubtitleRow}>
              <Users size={14} color="#1ea2b1" />
              <Text style={styles.headerSubtitle}>{carpool?.current_members}/{carpool?.max_members} Members</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: HEADER_MAX_HEIGHT }} />
        
        <View style={styles.mainCard}>
          {/* Journey Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>THE JOURNEY</Text>
            <View style={styles.routeBox}>
              <View style={styles.routeLineBox}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <View style={styles.verticalLine} />
                <View style={[styles.dot, { backgroundColor: '#1ea2b1' }]} />
              </View>
              <View style={styles.routeTextBox}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>STARTING POINT</Text>
                  <Text style={styles.locationName}>{carpool?.from_location}</Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>DESTINATION</Text>
                  <Text style={styles.locationName}>{carpool?.to_location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Clock size={16} color="#fbbf24" />
              <View>
                <Text style={styles.statPillLabel}>PICKUP</Text>
                <Text style={styles.statPillValue}>{carpool?.pickup_time}</Text>
              </View>
            </View>
            <View style={styles.statPill}>
              <CreditCard size={16} color="#1ea2b1" />
              <View>
                <Text style={styles.statPillLabel}>PRICE</Text>
                <Text style={styles.statPillValue}>R{carpool?.price_per_trip}/trip</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT THIS CLUB</Text>
            <Text style={styles.description}>
              {carpool?.description || 'No description available for this carpool club.'}
            </Text>
          </View>

          {/* Creator Profile */}
          <View style={styles.creatorSection}>
            <View style={styles.creatorInfo}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.avatarInitial}>
                  {creatorProfile?.first_name?.[0] || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.creatorName}>{creatorProfile?.first_name} {creatorProfile?.last_name}</Text>
                <View style={styles.creatorRatingRow}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.creatorRatingText}>{creatorProfile?.rating || 'New'}</Text>
                  <Text style={styles.creatorStatus}> • CLUB CREATOR</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Requirements/Rules */}
          {carpool?.rules && (
            <View style={[styles.section, styles.rulesBox]}>
              <Shield size={16} color="#444" />
              <Text style={styles.rulesText}>{carpool.rules}</Text>
            </View>
          )}
        </View>

        <View style={styles.footerSpace} />
      </Animated.ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.joinButton, isMember && styles.memberButton]} 
          onPress={isMember ? undefined : handleJoinCarpool}
          disabled={isMember || carpool?.is_full}
        >
          <Text style={styles.joinButtonText}>
            {isMember ? 'ALREADY A MEMBER' : carpool?.is_full ? 'CLUB FULL' : 'JOIN CARPOOL CLUB'}
          </Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1ea2b1',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainCard: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 2,
    marginBottom: 16,
  },
  routeBox: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: '#111',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  routeLineBox: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#222',
    marginVertical: 6,
  },
  routeTextBox: {
    flex: 1,
    gap: 24,
  },
  locationItem: {
    gap: 4,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  statPillLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  description: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 32,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ea2b1',
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  creatorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  creatorRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  creatorStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1ea2b1',
    letterSpacing: 0.5,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    alignItems: 'center',
  },
  rulesText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  footerSpace: {
    height: 60,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  joinButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#222',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
});