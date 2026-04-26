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
  Platform,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  MapPin,
  Search,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { RequestsSkeleton } from '@/components/profile/SkeletonComponents';

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
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
      
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (driverError) throw driverError;

      const driverId = driverData.id;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'declined': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#666';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter !== 'all' && request.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.student_name.toLowerCase().includes(query) ||
        request.transport.school_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/driver-dashboard');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Uthutho</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Users size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.readyText}>REQUESTS OVERVIEW</Text>
          <Text style={styles.headingText}>Transport Applications</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students or schools..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'declined'] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterPill, filter === type && styles.filterPillActive]}
            onPress={() => setFilter(type)}
          >
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
          />
        }
      >
        {loading ? (
          <RequestsSkeleton colors={colors} />
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#222" />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>New applications will appear here</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.studentName}>{request.student_name}</Text>
                    <Text style={styles.schoolName}>{request.transport.school_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}10` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.detailText} numberOfLines={1}>{request.pickup_address}</Text>
                  </View>
                  {request.message && (
                    <View style={styles.messageBox}>
                      <MessageSquare size={14} color="#1ea2b1" />
                      <Text style={styles.messageText}>{request.message}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                  
                  <View style={styles.actionButtons}>
                    {request.status === 'pending' ? (
                      <>
                        <TouchableOpacity 
                          style={styles.declineBtn}
                          onPress={() => {
                            setSelectedRequest(request);
                            setShowDeclineModal(true);
                          }}
                        >
                          <XCircle size={20} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.approveBtn}
                          onPress={() => handleApprove(request.id)}
                        >
                          <CheckCircle size={20} color="#10B981" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity 
                        style={styles.contactBtn}
                        onPress={() => handleContactParent(request.parent_phone)}
                      >
                        <Phone size={18} color="#1ea2b1" />
                        <Text style={styles.contactBtnText}>Contact</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Decline Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Request</Text>
            <Text style={styles.modalSubtitle}>Provide a reason for the parent (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="E.g. Full capacity, route unavailable..."
              placeholderTextColor="#444"
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setShowDeclineModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmDeclineBtn}
                onPress={() => selectedRequest && handleDecline(selectedRequest.id, declineReason)}
              >
                <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 0,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginLeft: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  filterPillActive: {
    borderColor: '#1ea2b1',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
  },
  filterTextActive: {
    color: '#1ea2b1',
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 13,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cardDetails: {
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  messageBox: {
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    color: '#CCC',
    fontStyle: 'italic',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  dateText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1ea2b1',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 16,
    color: '#FFF',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  confirmDeclineBtn: {
    flex: 2,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  confirmDeclineBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
});