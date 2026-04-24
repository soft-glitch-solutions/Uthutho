import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Linking,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, School, Share2, Info, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/hook/useAuth';
import { SchoolTransport } from '@/types/transport';
import { fetchTransportDetails, checkIfApplied } from '@/services/transportService';
import { TransportDetailsSkeleton } from '@/components/transport/SkeletonLoading';
import { TransportHeader, TransportInfoHeader } from '@/components/transport/TransportHeader';
import { AvailabilityBanner } from '@/components/transport/AvailabilityBanner';
import { StatsGrid } from '@/components/transport/StatsGrid';
import { PickupAreas, PickupTimes } from '@/components/transport/PickupInfo';
import { DriverInfo } from '@/components/transport/DriverInfo';
import { ApplyButton } from '@/components/transport/ApplyButton';
import { useTheme } from '@/context/ThemeContext';
import StatusModal from '@/components/modals/StatusModal';

const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function TransportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [transport, setTransport] = useState<SchoolTransport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchTransportDetails(id as string);
    setTransport(data);
    
    if (user && data) {
      const applied = await checkIfApplied(data.id, user.id);
      setHasApplied(applied);
    }
    
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const handleApply = () => {
    if (!transport) return;
    
    if (transport.current_riders >= transport.capacity) {
      setStatusModal({
        visible: true,
        type: 'warning',
        title: 'Full Capacity',
        message: 'This transport service has reached its maximum capacity. Please check back later or contact the driver.',
      });
      return;
    }

    if (hasApplied) {
      setStatusModal({
        visible: true,
        type: 'info',
        title: 'Already Applied',
        message: 'Your application for this transport is already submitted and pending review.',
      });
      return;
    }

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
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Missing Info',
        message: 'Phone number not available for this driver.',
      });
      return;
    }
    Linking.openURL(`tel:${transport.driver.profiles.phone}`);
  };

  const handleMessageDriver = () => {
    if (!user) {
      setStatusModal({
        visible: true,
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to message the driver and track your application.',
      });
      return;
    }

    if (transport) {
      router.push(`/chat/${transport.driver.id}`);
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
    const url = Platform.OS === 'ios' 
      ? `maps://0,0?q=${encodedArea}` 
      : `geo:0,0?q=${encodedArea}`;
    Linking.openURL(url).catch(() => {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Map Error',
        message: 'Unable to open maps on your device.',
      });
    });
  };

  const headerImageHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return <TransportDetailsSkeleton />;
  }

  if (!transport) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerSpacer}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.card }]}>
            <School size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Transport Not Found</Text>
          <Text style={[styles.emptyMessage, { color: colors.text }]}>
            The transport service you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Back to Listing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.imageHeader, { height: headerImageHeight }]}>
        <Animated.Image 
          source={require('@/assets/images/school-header.png')}
          style={[styles.headerImage, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}
        />
        <View style={styles.imageOverlay} />
        <TransportInfoHeader transport={transport} scrollY={scrollY} />
      </Animated.View>

      <TransportHeader 
        transport={transport}
        onBack={() => router.back()}
        onShare={handleShare}
        scrollY={scrollY}
      />

      <Animated.ScrollView 
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: HEADER_MAX_HEIGHT }}>
          <AvailabilityBanner transport={transport} />
          <StatsGrid transport={transport} />

          {transport.description && transport.description.trim() && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Info size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>About Service</Text>
              </View>
              <Text 
                style={[styles.description, { color: colors.text }]} 
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {transport.description}
              </Text>
              {transport.description.length > 200 && (
                <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} style={styles.readMoreBtn}>
                  <Text style={[styles.readMore, { color: colors.primary }]}>
                    {showFullDescription ? 'Show Less' : 'Read Full Description'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {transport.pickup_areas.length > 0 && (
            <PickupAreas 
              areas={transport.pickup_areas}
              onOpenMaps={handleOpenMaps}
            />
          )}

          {transport.pickup_times.length > 0 && (
            <PickupTimes times={transport.pickup_times} />
          )}

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Details</Text>
            </View>
            <Text style={[styles.vehicleDescription, { color: colors.text }]}>
              {transport.vehicle_info || 'Standard safe transport vehicle. Verified and inspected for school transport safety standards.'}
            </Text>
          </View>

          <DriverInfo 
            transport={transport}
            onViewProfile={() => router.push(`/driver/${transport.driver.id}`)}
            onMessage={handleMessageDriver}
            onCall={handleContactDriver}
          />

          <View style={styles.footerSpacer} />
        </View>
      </Animated.ScrollView>

      <ApplyButton 
        transport={transport}
        hasApplied={hasApplied}
        onApply={handleApply}
      />

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSpacer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  imageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 5,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.6,
  },
  emptyButton: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.8,
  },
  readMoreBtn: {
    marginTop: 12,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '700',
  },
  vehicleDescription: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.8,
  },
  footerSpacer: {
    height: 120,
  },
});