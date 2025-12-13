// app/trips.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Clock, 
  MapPin, 
  Car, 
  Award, 
  Leaf, 
  TrendingUp, 
  Star,
  Calendar,
  ChevronRight,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTripHistory, CompletedJourney } from '@/hook/useTripHistory';
import { format, formatDistanceToNow, startOfMonth, isSameMonth } from 'date-fns';

export default function TripHistoryScreen() {
  const router = useRouter();
  const { trips, loading, error, stats, refresh, addRating, deleteTrip } = useTripHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<CompletedJourney | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Group trips by month
  const tripsByMonth = useMemo(() => {
    const groups: { [key: string]: CompletedJourney[] } = {};
    
    trips.forEach(trip => {
      const monthKey = format(new Date(trip.completed_at), 'yyyy-MM'); // e.g., "2024-01"
      const monthLabel = format(new Date(trip.completed_at), 'MMMM yyyy'); // e.g., "January 2024"
      
      if (!groups[monthLabel]) {
        groups[monthLabel] = [];
      }
      groups[monthLabel].push({
        ...trip,
        monthKey
      });
    });
    
    // Sort months in descending order (newest first)
    return Object.entries(groups)
      .sort(([aLabel, aTrips], [bLabel, bTrips]) => {
        const aDate = new Date(aTrips[0].completed_at);
        const bDate = new Date(bTrips[0].completed_at);
        return bDate.getTime() - aDate.getTime();
      });
  }, [trips]);

  // Get current month trips for stats
  const currentMonthTrips = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return trips.filter(trip => 
      format(new Date(trip.completed_at), 'yyyy-MM') === currentMonth
    );
  }, [trips]);

  const handleRateTrip = (trip: CompletedJourney) => {
    setSelectedTrip(trip);
    setRating(trip.rating || 0);
    setNotes(trip.notes || '');
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!selectedTrip) return;

    const result = await addRating(selectedTrip.id, rating, notes);
    if (result.success) {
      setShowRatingModal(false);
      Alert.alert('Success', 'Rating submitted!');
    } else {
      Alert.alert('Error', result.error || 'Failed to submit rating');
    }
  };

  const confirmDeleteTrip = (trip: CompletedJourney) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTrip(trip.id),
        },
      ]
    );
  };

  const toggleMonth = (monthLabel: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthLabel)) {
      newExpanded.delete(monthLabel);
    } else {
      newExpanded.add(monthLabel);
    }
    setExpandedMonths(newExpanded);
  };

  const isMonthExpanded = (monthLabel: string) => {
    return expandedMonths.has(monthLabel);
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <TrendingUp size={20} color="#1ea2b1" />
        </View>
        <Text style={styles.statNumber}>{stats.totalTrips}</Text>
        <Text style={styles.statLabel}>Total Trips</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Award size={20} color="#f59e0b" />
        </View>
        <Text style={styles.statNumber}>{stats.totalPoints}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Leaf size={20} color="#10b981" />
        </View>
        <Text style={styles.statNumber}>
          {stats.totalCo2Saved.toFixed(1)}kg
        </Text>
        <Text style={styles.statLabel}>CO₂ Saved</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Calendar size={20} color="#8b5cf6" />
        </View>
        <Text style={styles.statNumber}>{currentMonthTrips.length}</Text>
        <Text style={styles.statLabel}>This Month</Text>
      </View>
    </View>
  );

  const renderTripCard = (trip: CompletedJourney) => (
    <TouchableOpacity
      key={trip.id}
      style={styles.tripCard}
      onPress={() => handleRateTrip(trip)}
      onLongPress={() => confirmDeleteTrip(trip)}
    >
      <View style={styles.tripHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName} numberOfLines={1}>
            {trip.route_name}
          </Text>
          <View style={styles.transportBadge}>
            <Car size={12} color="#ffffff" />
            <Text style={styles.transportText}>
              {trip.transport_type}
            </Text>
          </View>
        </View>
        
        <View style={styles.tripDate}>
          <Calendar size={12} color="#666666" />
          <Text style={styles.dateText}>
            {format(new Date(trip.completed_at), 'MMM d')}
          </Text>
        </View>
      </View>
      
      <View style={styles.routePoints}>
        <Text style={styles.pointText} numberOfLines={1}>
          {trip.start_point}
        </Text>
        <ChevronRight size={12} color="#666666" />
        <Text style={styles.pointText} numberOfLines={1}>
          {trip.end_point}
        </Text>
      </View>
      
      <View style={styles.tripStats}>
        <View style={styles.statBadge}>
          <Clock size={12} color="#1ea2b1" />
          <Text style={styles.statBadgeText}>
            {formatDuration(trip.duration_seconds)}
          </Text>
        </View>
        
        {trip.co2_saved_kg > 0 && (
          <View style={styles.statBadge}>
            <Leaf size={12} color="#10b981" />
            <Text style={styles.statBadgeText}>
              {trip.co2_saved_kg.toFixed(1)}kg CO₂
            </Text>
          </View>
        )}
        
        {trip.points_earned > 0 && (
          <View style={styles.statBadge}>
            <Award size={12} color="#f59e0b" />
            <Text style={styles.statBadgeText}>
              +{trip.points_earned} pts
            </Text>
          </View>
        )}
      </View>
      
      {trip.rating && (
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={12}
              color={star <= trip.rating! ? '#fbbf24' : '#666666'}
              fill={star <= trip.rating! ? '#fbbf24' : 'transparent'}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMonthSection = (monthLabel: string, monthTrips: CompletedJourney[]) => {
    const isExpanded = isMonthExpanded(monthLabel);
    const totalDuration = monthTrips.reduce((sum, trip) => sum + trip.duration_seconds, 0);
    const totalPoints = monthTrips.reduce((sum, trip) => sum + (trip.points_earned || 0), 0);
    const totalCO2 = monthTrips.reduce((sum, trip) => sum + (trip.co2_saved_kg || 0), 0);

    return (
      <View key={monthLabel} style={styles.monthSection}>
        <TouchableOpacity
          style={styles.monthHeader}
          onPress={() => toggleMonth(monthLabel)}
          activeOpacity={0.7}
        >
          <View style={styles.monthHeaderContent}>
            <View style={styles.monthTitleContainer}>
              <Calendar size={16} color="#1ea2b1" />
              <Text style={styles.monthTitle}>{monthLabel}</Text>
            </View>
            <Text style={styles.monthTripCount}>{monthTrips.length} trips</Text>
          </View>
          
          <View style={styles.monthSummary}>
            <View style={styles.monthStat}>
              <Clock size={12} color="#666666" />
              <Text style={styles.monthStatText}>
                {formatDuration(totalDuration)}
              </Text>
            </View>
            {totalPoints > 0 && (
              <View style={styles.monthStat}>
                <Award size={12} color="#f59e0b" />
                <Text style={styles.monthStatText}>+{totalPoints} pts</Text>
              </View>
            )}
            {totalCO2 > 0 && (
              <View style={styles.monthStat}>
                <Leaf size={12} color="#10b981" />
                <Text style={styles.monthStatText}>{totalCO2.toFixed(1)}kg</Text>
              </View>
            )}
          </View>
          
          {isExpanded ? (
            <ChevronUp size={20} color="#666666" />
          ) : (
            <ChevronDown size={20} color="#666666" />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.monthTripsContainer}>
            {monthTrips.map(trip => renderTripCard(trip))}
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Trip History' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1ea2b1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Trip History',
          headerRight: () => (
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.headerButton}>Refresh</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!error && (
          <>
            {renderStats()}
            
            {tripsByMonth.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptyText}>
                  Complete your first journey to see it here!
                </Text>
                <TouchableOpacity
                  style={styles.findRideButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.findRideText}>Find a Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.monthsContainer}>
                {tripsByMonth.map(([monthLabel, monthTrips]) => 
                  renderMonthSection(monthLabel, monthTrips)
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Trip</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedTrip && (
              <>
                <Text style={styles.routeNameModal}>{selectedTrip.route_name}</Text>
                <Text style={styles.dateModal}>
                  {format(new Date(selectedTrip.completed_at), 'PPP')}
                </Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <Star
                        size={36}
                        color={star <= rating ? '#fbbf24' : '#666666'}
                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes (optional)"
                  placeholderTextColor="#666666"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitRating}
                >
                  <Text style={styles.submitButtonText}>
                    {selectedTrip.rating ? 'Update Rating' : 'Submit Rating'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  monthsContainer: {
    marginBottom: 20,
  },
  monthSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  monthHeader: {
    padding: 16,
  },
  monthHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  monthTripCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  monthSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  monthStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthStatText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  monthTripsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  tripCard: {
    backgroundColor: '#222222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  routeInfo: {
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b130',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  transportText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  tripDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  routePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointText: {
    color: '#cccccc',
    fontSize: 12,
    flex: 1,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  errorContainer: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  findRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  findRideText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeNameModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateModal: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});