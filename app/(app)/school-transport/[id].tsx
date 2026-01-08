import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, School } from 'lucide-react-native';
import { useAuth } from '@/hook/useAuth';
import { SchoolTransport } from '@/types/transport';
import { fetchTransportDetails } from '@/services/transportService';
import { TransportDetailsSkeleton } from '@/components/transport/SkeletonLoading';
import { TransportHeader, TransportInfoHeader } from '@/components/transport/TransportHeader';
import { AvailabilityBanner } from '@/components/transport/AvailabilityBanner';
import { StatsGrid } from '@/components/transport/StatsGrid';
import { PickupAreas, PickupTimes } from '@/components/transport/PickupInfo';
import { DriverInfo } from '@/components/transport/DriverInfo';
import { ApplyButton } from '@/components/transport/ApplyButton';

const checkIfApplied = async (transportId: string, userId: string): Promise<boolean> => {
  // Implementation from original checkIfApplied function
  return false;
};

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
      Alert.alert('Full Capacity', 'This transport service has reached its maximum capacity');
      return;
    }

    if (hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this transport service');
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
    // Implementation from original reportIssue function
  };

  if (loading) {
    return <TransportDetailsSkeleton />;
  }

  if (!transport) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
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
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TransportHeader 
        transport={transport}
        onBack={() => router.back()}
        onShare={handleShare}
      />

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
        <TransportInfoHeader transport={transport} />
        <AvailabilityBanner transport={transport} />
        <StatsGrid transport={transport} />

        {transport.pickup_areas.length > 0 && (
          <PickupAreas 
            areas={transport.pickup_areas}
            onOpenMaps={handleOpenMaps}
          />
        )}

        {transport.pickup_times.length > 0 && (
          <PickupTimes times={transport.pickup_times} />
        )}

        {transport.description && transport.description.trim() && (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <Text style={styles.vehicleDescription}>{transport.vehicle_info || 'No vehicle information available'}</Text>
        </View>

        <DriverInfo 
          transport={transport}
          onViewProfile={() => router.push(`/driver/${transport.driver.id}`)}
          onMessage={handleMessageDriver}
          onCall={handleContactDriver}
        />

        <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.reportText}>Report an Issue</Text>
        </TouchableOpacity>
      </ScrollView>

      <ApplyButton 
        transport={transport}
        hasApplied={hasApplied}
        onApply={handleApply}
      />
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
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
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
  vehicleDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
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
});