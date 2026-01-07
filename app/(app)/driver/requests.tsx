// app/(app)/driver/requests.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Filter,
  Search,
  ChevronDown,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface TransportRequest {
  id: string;
  student_name: string;
  student_grade: string;
  pickup_address: string;
  parent_phone: string;
  parent_email: string;
  message: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  transport_id: string;
  transport: {
    school_name: string;
    school_area: string;
  };
  user: {
    profiles: {
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
}

type FilterType = 'all' | 'pending' | 'approved' | 'declined';

export default function DriverRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (driverError) throw driverError;

      const driverId = driverData.id;

      // Get all transports by this driver
      const { data: transportsData, error: transportsError } = await supabase
        .from('school_transports')
        .select('id')
        .eq('driver_id', driverId);

      if (transportsError) throw transportsError;

      const transportIds = transportsData.map(t => t.id);

      if (transportIds.length === 0) {
        setRequests([]);
        return;
      }

      // Get requests for these transports
      const { data: requestsData, error: requestsError } = await supabase
        .from('transport_requests')
        .select(`
          *,
          transport:transport_id (
            school_name,
            school_area
          ),
          user:user_id (
            profiles (
              first_name,
              last_name,
              phone
            )
          )
        `)
        .in('transport_id', transportIds)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Approved', 'Request has been approved');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleDecline = async (requestId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ 
          status: 'declined',
          message: reason ? `Declined: ${reason}` : 'Declined by driver'
        })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Declined', 'Request has been declined');
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request');
    }
  };

  const handleContactParent = (phone: string) => {
    Alert.alert(
      'Contact Parent',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${phone}`)
        }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'declined': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#10B981" />;
      case 'declined': return <XCircle size={16} color="#EF4444" />;
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      default: return null;
    }
  };

  const filteredRequests = requests.filter(request => {
    // Apply status filter
    if (filter !== 'all' && request.status !== filter) return false;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.student_name.toLowerCase().includes(query) ||
        request.transport.school_name.toLowerCase().includes(query) ||
        request.parent_phone.includes(query)
      );
    }
    
    return true;
  });

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const declined = requests.filter(r => r.status === 'declined').length;
    
    return { total, pending, approved, declined };
  };

  const stats = getStats();

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
        <Text style={styles.title}>Requests</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statItem, filter === 'all' && styles.statItemActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statItem, filter === 'pending' && styles.statItemActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statItem, filter === 'approved' && styles.statItemActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statItem, filter === 'declined' && styles.statItemActive]}
          onPress={() => setFilter('declined')}
        >
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.declined}</Text>
          <Text style={styles.statLabel}>Declined</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#888888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or school..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#888888" />
            <Text style={styles.emptyText}>
              {searchQuery || filter !== 'all' 
                ? 'No matching requests found' 
                : 'No requests yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Requests will appear here when parents apply'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.studentName}>{request.student_name}</Text>
                    <Text style={styles.schoolName}>{request.transport.school_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                    {getStatusIcon(request.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Grade:</Text>
                    <Text style={styles.detailValue}>{request.student_grade}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#888888" />
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {request.pickup_address}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Phone size={14} color="#888888" />
                    <Text style={styles.detailValue}>{request.parent_phone}</Text>
                  </View>
                  
                  {request.message && (
                    <View style={styles.messageContainer}>
                      <MessageSquare size={14} color="#888888" />
                      <Text style={styles.messageText} numberOfLines={2}>
                        {request.message}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.dateText}>
                    Applied on {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                {request.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() => {
                        setSelectedRequest(request);
                        setShowDeclineModal(true);
                      }}
                    >
                      <XCircle size={16} color="#EF4444" />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(request.id)}
                    >
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {(request.status === 'approved' || request.status === 'declined') && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleContactParent(request.parent_phone)}
                  >
                    <Phone size={16} color="#1ea2b1" />
                    <Text style={styles.contactButtonText}>Contact Parent</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Decline Reason Modal */}
      <Modal
        visible={showDeclineModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDeclineModal(false);
          setDeclineReason('');
          setSelectedRequest(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Request</Text>
            <Text style={styles.modalSubtitle}>
              Add a reason for declining {selectedRequest?.student_name}'s application
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for declining (optional)"
              placeholderTextColor="#666666"
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setSelectedRequest(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeclineButton]}
                onPress={() => selectedRequest && handleDecline(selectedRequest.id, declineReason)}
              >
                <Text style={styles.modalDeclineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  statItemActive: {
    backgroundColor: '#1a1a1a',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  requestsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 14,
    color: '#888888',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    color: '#888888',
    fontSize: 14,
    minWidth: 40,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  messageText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 14,
    fontStyle: 'italic',
  },
  dateText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  approveButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
    gap: 8,
  },
  contactButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#333333',
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeclineButton: {
    backgroundColor: '#EF4444',
  },
  modalDeclineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});