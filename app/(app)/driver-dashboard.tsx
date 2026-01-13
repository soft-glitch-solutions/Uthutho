// app/(app)/driver/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Car,
  Users,
  DollarSign,
  Calendar,
  Star,
  MessageSquare,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Settings,
  Bell,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface TransportService {
  id: string;
  school_name: string;
  school_area: string;
  capacity: number;
  current_riders: number;
  price_per_month: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface PendingRequest {
  id: string;
  student_name: string;
  student_grade: string;
  pickup_address: string;
  parent_phone: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  transport_id: string;
}

interface DriverStats {
  total_services: number;
  total_riders: number;
  total_earnings: number;
  average_rating: number;
  pending_requests: number;
}

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    total_services: 0,
    total_riders: 0,
    total_earnings: 0,
    average_rating: 0,
    pending_requests: 0,
  });
  const [transports, setTransports] = useState<TransportService[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch driver info
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (driverError) {
        console.error('Error fetching driver:', driverError);
        Alert.alert('Error', 'You are not registered as a driver');
        router.back();
        return;
      }

      const driverId = driverData.id;

      // Fetch all data in parallel
      const [
        { data: transportsData },
        { data: requestsData },
        { data: reviewsData },
      ] = await Promise.all([
        supabase
          .from('school_transports')
          .select('*')
          .eq('driver_id', driverId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('transport_requests')
          .select('*')
          .eq('status', 'pending')
          .in('transport_id', transportsData?.map(t => t.id) || []),
        
        supabase
          .from('transport_reviews')
          .select('rating')
          .eq('driver_id', driverId),
      ]);

      // Calculate stats
      const totalServices = transportsData?.length || 0;
      const totalRiders = transportsData?.reduce((sum, transport) => 
        sum + (transport.current_riders || 0), 0) || 0;
      const totalEarnings = transportsData?.reduce((sum, transport) => 
        sum + (transport.price_per_month * (transport.current_riders || 0)), 0) || 0;
      const pendingRequests = requestsData?.length || 0;
      
      // Calculate average rating
      let averageRating = 0;
      if (reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / reviewsData.length;
      }

      setDriverStats({
        total_services: totalServices,
        total_riders: totalRiders,
        total_earnings: totalEarnings,
        average_rating: averageRating,
        pending_requests: pendingRequests,
      });

      setTransports(transportsData || []);
      setPendingRequests(requestsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleCreateService = () => {
    router.push('/driver/create-service');
  };

  const handleViewService = (serviceId: string) => {
    router.push(`/school-transport/${serviceId}`);
  };

  const handleViewRequests = () => {
    router.push('/driver/requests');
  };

  const handleViewEarnings = () => {
    router.push('/driver/earnings');
  };

  const handleViewReviews = () => {
    router.push('/driver/reviews');
  };

  const handleManageServices = () => {
    router.push('/driver/services');
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Request approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Request declined');
      fetchDashboardData();
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <Text style={styles.title}>Driver Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Driver Dashboard</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/driver/notifications')}
        >
          <Bell size={24} color="#FFFFFF" />
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
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
              <Car size={20} color="#1ea2b1" />
            </View>
            <Text style={styles.statNumber}>{driverStats.total_services}</Text>
            <Text style={styles.statLabel}>Active Services</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Users size={20} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{driverStats.total_riders}</Text>
            <Text style={styles.statLabel}>Total Riders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <DollarSign size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>
              {formatCurrency(driverStats.total_earnings)}
            </Text>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
          </View>
        </View>

        {/* Pending Requests */}
        {driverStats.pending_requests > 0 && (
          <TouchableOpacity 
            style={styles.pendingRequestsBanner}
            onPress={handleViewRequests}
          >
            <View style={styles.pendingRequestsContent}>
              <View style={styles.pendingRequestsIcon}>
                <AlertCircle size={24} color="#FFFFFF" />
              </View>
              <View style={styles.pendingRequestsText}>
                <Text style={styles.pendingRequestsTitle}>
                  {driverStats.pending_requests} Pending Requests
                </Text>
                <Text style={styles.pendingRequestsSubtitle}>
                  Tap to review applications
                </Text>
              </View>
            </View>
            <ArrowLeft size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleCreateService}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
                <Plus size={24} color="#1ea2b1" />
              </View>
              <Text style={styles.quickActionText}>New Service</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleViewRequests}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <FileText size={24} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Requests</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleViewEarnings}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <TrendingUp size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleViewReviews}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Star size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Services</Text>
            <TouchableOpacity onPress={handleManageServices}>
              <Text style={styles.viewAllText}>Manage All</Text>
            </TouchableOpacity>
          </View>
          
          {transports.length === 0 ? (
            <View style={styles.emptyServices}>
              <Car size={48} color="#888888" />
              <Text style={styles.emptyServicesText}>No active services</Text>
              <Text style={styles.emptyServicesSubtext}>
                Create your first transport service to get started
              </Text>
              <TouchableOpacity 
                style={styles.createServiceButton}
                onPress={handleCreateService}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createServiceText}>Create Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {transports.slice(0, 3).map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleViewService(service.id)}
                >
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceIcon}>
                      <Car size={20} color="#1ea2b1" />
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.school_name}</Text>
                      <Text style={styles.serviceArea}>{service.school_area}</Text>
                    </View>
                    {service.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <CheckCircle size={14} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Users size={14} color="#888888" />
                      <Text style={styles.serviceDetailText}>
                        {service.current_riders}/{service.capacity} riders
                      </Text>
                    </View>
                    
                    <View style={styles.serviceDetail}>
                      <DollarSign size={14} color="#888888" />
                      <Text style={styles.serviceDetailText}>
                        {formatCurrency(service.price_per_month)}/month
                      </Text>
                    </View>
                    
                    <View style={styles.serviceDetail}>
                      <Clock size={14} color="#888888" />
                      <Text style={styles.serviceDetailText}>
                        {new Date(service.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Requests (if any) */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <View style={styles.requestsList}>
              {pendingRequests.slice(0, 2).map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestName}>{request.student_name}</Text>
                    <Text style={styles.requestGrade}>Grade {request.student_grade}</Text>
                  </View>
                  
                  <View style={styles.requestDetails}>
                    <View style={styles.requestDetail}>
                      <MapPin size={14} color="#888888" />
                      <Text style={styles.requestDetailText} numberOfLines={1}>
                        {request.pickup_address}
                      </Text>
                    </View>
                    
                    <View style={styles.requestDetail}>
                      <Clock size={14} color="#888888" />
                      <Text style={styles.requestDetailText}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.requestActions}>
                    <TouchableOpacity 
                      style={[styles.requestButton, styles.declineButton]}
                      onPress={() => handleDeclineRequest(request.id)}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.requestButton, styles.approveButton]}
                      onPress={() => handleApproveRequest(request.id)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {pendingRequests.length > 2 && (
                <TouchableOpacity 
                  style={styles.viewAllRequests}
                  onPress={handleViewRequests}
                >
                  <Text style={styles.viewAllRequestsText}>
                    View all {pendingRequests.length} requests
                  </Text>
                  <ArrowLeft size={16} color="#1ea2b1" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Driver Rating */}
        {driverStats.average_rating > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingCard}>
              <View style={styles.ratingContent}>
                <Star size={32} color="#FBBF24" fill="#FBBF24" />
                <View style={styles.ratingInfo}>
                  <Text style={styles.ratingValue}>
                    {driverStats.average_rating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingLabel}>Average Rating</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewReviewsButton}
                onPress={handleViewReviews}
              >
                <Text style={styles.viewReviewsText}>View Reviews</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
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
  scrollContainer: {
    flex: 1,
    paddingTop: 80,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  pendingRequestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  pendingRequestsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingRequestsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingRequestsText: {
    flex: 1,
  },
  pendingRequestsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pendingRequestsSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  section: {
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyServices: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyServicesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyServicesSubtext: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  createServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createServiceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  serviceArea: {
    fontSize: 14,
    color: '#888888',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceDetailText: {
    color: '#888888',
    fontSize: 12,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestGrade: {
    fontSize: 14,
    color: '#888888',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestDetailText: {
    color: '#888888',
    fontSize: 14,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  declineButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#1ea2b1',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllRequests: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  viewAllRequestsText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingInfo: {
    marginLeft: 12,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#888888',
  },
  viewReviewsButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewReviewsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});