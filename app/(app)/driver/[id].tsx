// app/(app)/driver/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Platform, 
  Dimensions, 
  Image,
  ActivityIndicator,
  Linking,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Shield, 
  Car, 
  Users,
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  MapPin, 
  CheckCircle2,
  Calendar,
  Clock,
  Briefcase,
  Share2
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [driver, setDriver] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  useEffect(() => {
    if (id) fetchDriverDetails();
  }, [id]);

  const fetchDriverDetails = async () => {
    try {
      setLoading(true);
      // Fetch driver and profile
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('id', id)
        .single();

      if (driverError) throw driverError;

      // Fetch their school transport services
      const { data: servicesData } = await supabase
        .from('school_transports')
        .select('*')
        .eq('driver_id', id)
        .eq('is_active', true);

      setDriver(driverData);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching driver:', error);
    } finally {
      setLoading(false);
    }
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
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF' }}>Driver not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonInline}>
          <Text style={{ color: '#1ea2b1' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = driver.profiles;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={profile.avatar_url ? { uri: profile.avatar_url } : require('@/assets/images/school-header.jpg')}
          style={[styles.headerImage, { opacity: imageOpacity }]}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Animated.View style={{ opacity: imageOpacity }}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{profile.first_name} {profile.last_name}</Text>
              {driver.is_verified && <CheckCircle2 size={20} color="#10B981" fill="#10B981" />}
            </View>
            <Text style={styles.driverTitle}>{profile.selected_title || 'Expert Driver'}</Text>
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
        
        <View style={styles.contentCard}>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Star size={18} color="#FFD700" fill="#FFD700" />
              <Text style={styles.statValue}>{profile.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Briefcase size={18} color="#1ea2b1" />
              <Text style={styles.statValue}>{profile.total_trips || 0}</Text>
              <Text style={styles.statLabel}>TRIPS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Calendar size={18} color="#8B5CF6" />
              <Text style={styles.statValue}>3+</Text>
              <Text style={styles.statLabel}>YEARS</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT DRIVER</Text>
            <Text style={styles.bioText}>
              Professional transport provider dedicated to safe and reliable commuting. Specializing in school transport and organized carpool clubs across the metro area.
            </Text>
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VEHICLE INFO</Text>
            <View style={styles.vehicleCard}>
              <Car size={24} color="#1ea2b1" />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{driver.vehicle_model || 'Toyota Quantum'}</Text>
                <Text style={styles.vehicleMeta}>{driver.vehicle_year || '2022'} • {driver.license_plate || 'CA 123-456'}</Text>
              </View>
              <View style={styles.capacityBadge}>
                <Users size={14} color="#1ea2b1" />
                <Text style={styles.capacityText}>{driver.capacity || 16}</Text>
              </View>
            </View>
          </View>

          {/* Active Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACTIVE SERVICES</Text>
              <Text style={styles.serviceCount}>{services.length}</Text>
            </View>
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={styles.serviceItem}
                onPress={() => router.push(`/school-transport/${service.id}`)}
              >
                <View style={styles.serviceIcon}>
                  <MapPin size={20} color="#1ea2b1" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.school_name}</Text>
                  <Text style={styles.serviceMeta}>{service.school_area}</Text>
                </View>
                <ChevronRight size={20} color="#333" />
              </TouchableOpacity>
            ))}
            {services.length === 0 && (
              <Text style={styles.emptyText}>No active public services listed.</Text>
            )}
          </View>

          {/* Trust Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Shield size={16} color="#10B981" />
              <Text style={styles.badgeText}>ID VERIFIED</Text>
            </View>
            <View style={styles.badge}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.badgeText}>PDP LICENSED</Text>
            </View>
            <View style={styles.badge}>
              <Clock size={16} color="#10B981" />
              <Text style={styles.badgeText}>PUNCTUAL</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Bottom Contact Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${profile.phone || ''}`)}>
          <Phone size={20} color="#FFF" />
          <Text style={styles.contactBtnText}>CALL DRIVER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.msgBtn} onPress={() => Linking.openURL(`mailto:${profile.email || ''}`)}>
          <MessageSquare size={20} color="#1ea2b1" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  driverTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1ea2b1',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentCard: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#222',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 2,
  },
  serviceCount: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1ea2b1',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bioText: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginTop: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 12,
  },
  vehicleDetails: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vehicleMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  capacityText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1ea2b1',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 14,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  serviceMeta: {
    fontSize: 12,
    color: '#555',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  emptyText: {
    color: '#444',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#1ea2b1',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  msgBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonInline: {
    marginTop: 20,
    padding: 10,
  }
});
