// app/trips.tsx - COMPLETE FIXED VERSION
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  ArrowLeft,
  BarChart3,
  Users,
  Route as RouteIcon,
} from 'lucide-react-native';
import { useTripHistory, CompletedJourney } from '@/hook/useTripHistory';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;
const isSmallScreen = SCREEN_WIDTH <= 375;

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
    if (!seconds || seconds <= 0) return '0m 0s';
    
    const totalSeconds = Math.max(0, parseInt(seconds.toString(), 10) || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Group trips by month
  const tripsByMonth = useMemo(() => {
    const groups: { [key: string]: CompletedJourney[] } = {};
    
    trips.forEach(trip => {
      const monthKey = format(new Date(trip.completed_at), 'yyyy-MM');
      const monthLabel = format(new Date(trip.completed_at), 'MMMM yyyy');
      
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

  // Desktop Layout Component
  const DesktopTripHistory = () => {
    return (
      <View style={styles.container}>
        {/* Desktop Header */}
        <View style={styles.desktopHeader}>
          <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
            <Text style={styles.desktopBackButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.desktopHeaderTitleContainer}>
            <View style={styles.cardTypeIcon}>
              <RouteIcon size={28} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.desktopHeaderTitle}>Trip History</Text>
              <Text style={styles.desktopHeaderSubtitle}>Your completed journeys and statistics</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.desktopAddButton}
            onPress={onRefresh}
          >
            <Text style={styles.desktopAddButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Desktop Layout */}
        <View style={styles.desktopLayout}>
          {/* Left Column - Stats */}
          <View style={styles.leftColumn}>
            {/* Quick Stats */}
            <View style={styles.quickStatsDesktop}>
              <View style={styles.quickStatsHeader}>
                <BarChart3 size={20} color="#1ea2b1" />
                <Text style={styles.quickStatsTitle}>Your Stats</Text>
              </View>
              <View style={styles.quickStatsGrid}>
                <View style={[styles.statItemDesktop, { borderColor: '#1ea2b1' }]}>
                  <Text style={styles.statValueDesktop}>
                    {stats.totalTrips}
                  </Text>
                  <Text style={styles.statLabelDesktop}>Total Trips</Text>
                </View>
                <View style={[styles.statItemDesktop, { borderColor: '#f59e0b' }]}>
                  <Text style={styles.statValueDesktop}>
                    {stats.totalPoints}
                  </Text>
                  <Text style={styles.statLabelDesktop}>Total Points</Text>
                </View>
                <View style={[styles.statItemDesktop, { borderColor: '#10b981' }]}>
                  <Text style={styles.statValueDesktop}>
                    {stats.totalCo2Saved.toFixed(1)}kg
                  </Text>
                  <Text style={styles.statLabelDesktop}>CO₂ Saved</Text>
                </View>
                <View style={[styles.statItemDesktop, { borderColor: '#8b5cf6' }]}>
                  <Text style={styles.statValueDesktop}>
                    {currentMonthTrips.length}
                  </Text>
                  <Text style={styles.statLabelDesktop}>This Month</Text>
                </View>
              </View>
            </View>

            {/* Total Distance Card */}
            <View style={styles.totalDistanceCard}>
              <Text style={styles.distanceLabel}>Total Distance</Text>
              <Text style={styles.distanceValue}>
                {Math.floor(stats.totalTrips * 10)}km
              </Text>
              <Text style={styles.distanceSubtitle}>
                Estimated from {stats.totalTrips} journeys
              </Text>
            </View>

            {/* Journey Map Placeholder */}
            <View style={styles.journeyMapPlaceholder}>
              <View style={styles.mapPlaceholderContent}>
                <RouteIcon size={48} color="#1ea2b1" />
                <Text style={styles.mapPlaceholderTitle}>Your Journey Map</Text>
                <Text style={styles.mapPlaceholderSubtitle}>
                  Visualize your travel patterns
                </Text>
              </View>
              <View style={styles.mapStats}>
                <View style={styles.mapStatItem}>
                  <Text style={styles.mapStatValue}>{stats.totalTrips}</Text>
                  <Text style={styles.mapStatLabel}>Trips</Text>
                </View>
                <View style={styles.mapStatDivider} />
                <View style={styles.mapStatItem}>
                  <Text style={styles.mapStatValue}>
                    {Math.floor(stats.totalTrips * 10)}km
                  </Text>
                  <Text style={styles.mapStatLabel}>Distance</Text>
                </View>
                <View style={styles.mapStatDivider} />
                <View style={styles.mapStatItem}>
                  <Text style={styles.mapStatValue}>
                    {stats.totalCo2Saved.toFixed(0)}kg
                  </Text>
                  <Text style={styles.mapStatLabel}>CO₂ Saved</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Trip List */}
          <ScrollView 
            style={styles.rightColumn} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.rightColumnContent}
          >
            <Text style={styles.sectionTitleDesktop}>Journey History</Text>
            
            {tripsByMonth.length === 0 ? (
              <View style={styles.emptyContainerDesktop}>
                <View style={styles.emptyIllustrationDesktop}>
                  <Clock size={48} color="#666666" />
                </View>
                <Text style={styles.emptyTitleDesktop}>No trips yet</Text>
                <Text style={styles.emptyTextDesktop}>
                  Complete your first journey to see it here!
                </Text>
                <TouchableOpacity
                  style={styles.findRideButtonDesktop}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.findRideTextDesktop}>Find a Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.monthsContainerDesktop}>
                {tripsByMonth.map(([monthLabel, monthTrips]) => 
                  renderMonthSection(monthLabel, monthTrips, true)
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderTripCard = (trip: CompletedJourney, isDesktop: boolean = false) => {
    // Fix duration display for each trip
    const tripDuration = trip.duration_seconds || 0;
    const durationDisplay = formatDuration(tripDuration);
    
    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, isDesktop && styles.tripCardDesktop]}
        onPress={() => handleRateTrip(trip)}
        onLongPress={() => confirmDeleteTrip(trip)}
      >
        <View style={styles.tripHeader}>
          <View style={styles.routeInfo}>
            <Text style={[styles.routeName, isDesktop && styles.routeNameDesktop]} numberOfLines={1}>
              {trip.route_name || 'Unknown Route'}
            </Text>
            {trip.transport_type && (
              <View style={[styles.transportBadge, isDesktop && styles.transportBadgeDesktop]}>
                <Car size={isDesktop ? 14 : 12} color="#ffffff" />
                <Text style={[styles.transportText, isDesktop && styles.transportTextDesktop]}>
                  {trip.transport_type}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.tripDate}>
            <Calendar size={isDesktop ? 14 : 12} color="#666666" />
            <Text style={[styles.dateText, isDesktop && styles.dateTextDesktop]}>
              {format(new Date(trip.completed_at), 'MMM d')}
            </Text>
          </View>
        </View>
        
        <View style={[styles.routePoints, isDesktop && styles.routePointsDesktop]}>
          <Text style={[styles.pointText, isDesktop && styles.pointTextDesktop]} numberOfLines={1}>
            {trip.start_point || 'Start point'}
          </Text>
          <ChevronRight size={isDesktop ? 14 : 12} color="#666666" />
          <Text style={[styles.pointText, isDesktop && styles.pointTextDesktop]} numberOfLines={1}>
            {trip.end_point || 'End point'}
          </Text>
        </View>
        
        <View style={[styles.tripStats, isDesktop && styles.tripStatsDesktop]}>
          <View style={[styles.statBadge, isDesktop && styles.statBadgeDesktop]}>
            <Clock size={isDesktop ? 14 : 12} color="#1ea2b1" />
            <Text style={[styles.statBadgeText, isDesktop && styles.statBadgeTextDesktop]}>
              {durationDisplay}
            </Text>
          </View>
          
          {trip.co2_saved_kg > 0 && (
            <View style={[styles.statBadge, isDesktop && styles.statBadgeDesktop]}>
              <Leaf size={isDesktop ? 14 : 12} color="#10b981" />
              <Text style={[styles.statBadgeText, isDesktop && styles.statBadgeTextDesktop]}>
                {trip.co2_saved_kg.toFixed(1)}kg CO₂
              </Text>
            </View>
          )}
          
          {trip.points_earned > 0 && (
            <View style={[styles.statBadge, isDesktop && styles.statBadgeDesktop]}>
              <Award size={isDesktop ? 14 : 12} color="#f59e0b" />
              <Text style={[styles.statBadgeText, isDesktop && styles.statBadgeTextDesktop]}>
                +{trip.points_earned} pts
              </Text>
            </View>
          )}
        </View>
        
        {trip.rating && trip.rating > 0 && (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={isDesktop ? 14 : 12}
                color={star <= trip.rating! ? '#fbbf24' : '#666666'}
                fill={star <= trip.rating! ? '#fbbf24' : 'transparent'}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMonthSection = (monthLabel: string, monthTrips: CompletedJourney[], isDesktop: boolean = false) => {
    const isExpanded = isMonthExpanded(monthLabel);
    const totalDuration = monthTrips.reduce((sum, trip) => sum + (trip.duration_seconds || 0), 0);
    const totalPoints = monthTrips.reduce((sum, trip) => sum + (trip.points_earned || 0), 0);
    const totalCO2 = monthTrips.reduce((sum, trip) => sum + (trip.co2_saved_kg || 0), 0);

    return (
      <View key={monthLabel} style={[styles.monthSection, isDesktop && styles.monthSectionDesktop]}>
        <TouchableOpacity
          style={[styles.monthHeader, isDesktop && styles.monthHeaderDesktop]}
          onPress={() => toggleMonth(monthLabel)}
          activeOpacity={0.7}
        >
          <View style={styles.monthHeaderContent}>
            <View style={styles.monthTitleContainer}>
              <Calendar size={isDesktop ? 20 : 16} color="#1ea2b1" />
              <Text style={[styles.monthTitle, isDesktop && styles.monthTitleDesktop]}>{monthLabel}</Text>
            </View>
            <Text style={[styles.monthTripCount, isDesktop && styles.monthTripCountDesktop]}>{monthTrips.length} trips</Text>
          </View>
          
          <View style={[styles.monthSummary, isDesktop && styles.monthSummaryDesktop]}>
            <View style={styles.monthStat}>
              <Clock size={isDesktop ? 14 : 12} color="#666666" />
              <Text style={[styles.monthStatText, isDesktop && styles.monthStatTextDesktop]}>
                {formatDuration(totalDuration)}
              </Text>
            </View>
            {totalPoints > 0 && (
              <View style={styles.monthStat}>
                <Award size={isDesktop ? 14 : 12} color="#f59e0b" />
                <Text style={[styles.monthStatText, isDesktop && styles.monthStatTextDesktop]}>+{totalPoints} pts</Text>
              </View>
            )}
            {totalCO2 > 0 && (
              <View style={styles.monthStat}>
                <Leaf size={isDesktop ? 14 : 12} color="#10b981" />
                <Text style={[styles.monthStatText, isDesktop && styles.monthStatTextDesktop]}>{totalCO2.toFixed(1)}kg</Text>
              </View>
            )}
          </View>
          
          {isExpanded ? (
            <ChevronUp size={isDesktop ? 24 : 20} color="#666666" />
          ) : (
            <ChevronDown size={isDesktop ? 24 : 20} color="#666666" />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.monthTripsContainer}>
            {monthTrips.map(trip => renderTripCard(trip, isDesktop))}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.smallScreenHeader]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#ffffff" />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isSmallScreen && styles.smallScreenHeaderTitle]}>Trip History</Text>
      <TouchableOpacity style={styles.addButton} onPress={onRefresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1ea2b1" />
          <Text style={styles.loadingText}>Loading your trip history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isDesktop) {
    return <DesktopTripHistory />;
  }

  // Mobile Layout
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#1ea2b1']}
            tintColor="#1ea2b1"
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.smallScreenScrollContent
        ]}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[
              styles.statsContainer,
              isSmallScreen && styles.smallScreenStatsContainer
            ]}>
              <View style={[
                styles.statCard,
                isSmallScreen && styles.smallScreenStatCard
              ]}>
                <View style={styles.statIcon}>
                  <TrendingUp size={20} color="#1ea2b1" />
                </View>
                <Text style={[
                  styles.statNumber,
                  isSmallScreen && styles.smallScreenStatNumber
                ]}>{stats.totalTrips}</Text>
                <Text style={[
                  styles.statLabel,
                  isSmallScreen && styles.smallScreenStatLabel
                ]}>Total Trips</Text>
              </View>
              
              <View style={[
                styles.statCard,
                isSmallScreen && styles.smallScreenStatCard
              ]}>
                <View style={styles.statIcon}>
                  <Award size={20} color="#f59e0b" />
                </View>
                <Text style={[
                  styles.statNumber,
                  isSmallScreen && styles.smallScreenStatNumber
                ]}>{stats.totalPoints}</Text>
                <Text style={[
                  styles.statLabel,
                  isSmallScreen && styles.smallScreenStatLabel
                ]}>Points</Text>
              </View>
              
              <View style={[
                styles.statCard,
                isSmallScreen && styles.smallScreenStatCard
              ]}>
                <View style={styles.statIcon}>
                  <Leaf size={20} color="#10b981" />
                </View>
                <Text style={[
                  styles.statNumber,
                  isSmallScreen && styles.smallScreenStatNumber
                ]}>
                  {stats.totalCo2Saved.toFixed(1)}kg
                </Text>
                <Text style={[
                  styles.statLabel,
                  isSmallScreen && styles.smallScreenStatLabel
                ]}>CO₂ Saved</Text>
              </View>
              
              <View style={[
                styles.statCard,
                isSmallScreen && styles.smallScreenStatCard
              ]}>
                <View style={styles.statIcon}>
                  <Calendar size={20} color="#8b5cf6" />
                </View>
                <Text style={[
                  styles.statNumber,
                  isSmallScreen && styles.smallScreenStatNumber
                ]}>{currentMonthTrips.length}</Text>
                <Text style={[
                  styles.statLabel,
                  isSmallScreen && styles.smallScreenStatLabel
                ]}>This Month</Text>
              </View>
            </View>
            
            {tripsByMonth.length === 0 ? (
              <View style={[
                styles.emptyContainer,
                isSmallScreen && styles.smallScreenEmptyContainer
              ]}>
                <View style={[
                  styles.emptyIllustration,
                  isSmallScreen && styles.smallScreenEmptyIllustration
                ]}>
                  <Clock size={isSmallScreen ? 40 : 48} color="#666666" />
                </View>
                <Text style={[
                  styles.emptyTitle,
                  isSmallScreen && styles.smallScreenEmptyTitle
                ]}>No trips yet</Text>
                <Text style={[
                  styles.emptyText,
                  isSmallScreen && styles.smallScreenEmptyText
                ]}>
                  Complete your first journey to see it here!
                </Text>
                <TouchableOpacity
                  style={[
                    styles.findRideButton,
                    isSmallScreen && styles.smallScreenFindRideButton
                  ]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Plus size={isSmallScreen ? 14 : 16} color="#ffffff" />
                  <Text style={[
                    styles.findRideText,
                    isSmallScreen && styles.smallScreenFindRideText
                  ]}>Find a Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[
                styles.monthsContainer,
                isSmallScreen && styles.smallScreenMonthsContainer
              ]}>
                <Text style={[
                  styles.sectionTitle,
                  isSmallScreen && styles.smallScreenSectionTitle
                ]}>Your Journey History</Text>
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
          <View style={[
            styles.modalContent,
            isSmallScreen && styles.smallScreenModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                isSmallScreen && styles.smallScreenModalTitle
              ]}>Rate Your Trip</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedTrip && (
              <>
                <Text style={[
                  styles.routeNameModal,
                  isSmallScreen && styles.smallScreenRouteNameModal
                ]}>{selectedTrip.route_name || 'Unknown Route'}</Text>
                <Text style={styles.dateModal}>
                  {format(new Date(selectedTrip.completed_at), 'PPP')}
                </Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Star
                        size={isSmallScreen ? 32 : 36}
                        color={star <= rating ? '#fbbf24' : '#666666'}
                        fill={star <= rating ? '#fbbf24' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>
                  {rating === 0 ? 'Select Rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
                </Text>
                
                <TextInput
                  style={[
                    styles.notesInput,
                    isSmallScreen && styles.smallScreenNotesInput
                  ]}
                  placeholder="Add notes (optional)"
                  placeholderTextColor="#666666"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSmallScreen && styles.smallScreenSubmitButton
                  ]}
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
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
  },
  desktopHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopHeaderSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  desktopAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  desktopAddButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    flex: 1,
  },
  leftColumn: {
    width: '35%',
    minWidth: 0,
  },
  rightColumn: {
    width: '65%',
    minWidth: 0,
    flex: 1,
    paddingRight: 4,
  },
  rightColumnContent: {
    paddingBottom: 40,
  },
  
  // Desktop Stats
  quickStatsDesktop: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  quickStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItemDesktop: {
    width: 'calc(50% - 6px)',
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValueDesktop: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabelDesktop: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // Desktop Total Distance Card
  totalDistanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 4,
  },
  distanceSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Desktop Journey Map Placeholder
  journeyMapPlaceholder: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  mapPlaceholderContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  mapPlaceholderSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  mapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  mapStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  mapStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  mapStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mapStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#333333',
  },
  
  // Section Title
  sectionTitleDesktop: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  
  // Desktop Empty State
  emptyContainerDesktop: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIllustrationDesktop: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitleDesktop: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyTextDesktop: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  findRideButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  findRideTextDesktop: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Desktop Month Sections
  monthsContainerDesktop: {
    marginBottom: 20,
  },
  monthSectionDesktop: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  monthHeaderDesktop: {
    padding: 20,
  },
  monthTitleDesktop: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  monthTripCountDesktop: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  monthSummaryDesktop: {
    gap: 16,
    marginBottom: 12,
  },
  monthStatTextDesktop: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  
  // Desktop Trip Cards
  tripCardDesktop: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeNameDesktop: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#ffffff',
  },
  transportBadgeDesktop: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#1ea2b130',
  },
  transportTextDesktop: {
    fontSize: 12,
    marginLeft: 6,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  routePointsDesktop: {
    marginBottom: 14,
  },
  pointTextDesktop: {
    fontSize: 13,
    color: '#cccccc',
  },
  dateTextDesktop: {
    fontSize: 13,
    marginLeft: 6,
    color: '#9ca3af',
  },
  tripStatsDesktop: {
    gap: 10,
    marginBottom: 10,
  },
  statBadgeDesktop: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  statBadgeTextDesktop: {
    fontSize: 12,
    marginLeft: 6,
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Mobile Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  smallScreenHeader: {
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  smallScreenHeaderTitle: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshText: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Mobile Content
  scrollContent: {
    padding: 16,
  },
  smallScreenScrollContent: {
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
  
  // Mobile Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  smallScreenStatsContainer: {
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  smallScreenStatCard: {
    padding: 10,
    marginHorizontal: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  smallScreenStatNumber: {
    fontSize: 15,
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  smallScreenStatLabel: {
    fontSize: 9,
  },
  
  // Mobile Month Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  smallScreenSectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  monthsContainer: {
    marginBottom: 20,
  },
  smallScreenMonthsContainer: {
    marginBottom: 16,
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
  smallScreenMonthHeader: {
    padding: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  smallScreenMonthTitle: {
    fontSize: 15,
  },
  monthTripCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  smallScreenMonthTripCount: {
    fontSize: 13,
  },
  monthSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  smallScreenMonthSummary: {
    gap: 10,
  },
  monthStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthStatText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  smallScreenMonthStatText: {
    fontSize: 11,
  },
  monthTripsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  smallScreenMonthTripsContainer: {
    paddingHorizontal: 10,
  },
  
  // Mobile Trip Cards
  tripCard: {
    backgroundColor: '#222222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  smallScreenTripCard: {
    padding: 12,
    marginBottom: 8,
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
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 4,
  },
  routePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallScreenRoutePoints: {
    marginBottom: 8,
  },
  pointText: {
    color: '#cccccc',
    fontSize: 12,
    flex: 1,
  },
  smallScreenPointText: {
    fontSize: 11,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  smallScreenTripStats: {
    gap: 6,
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
  smallScreenStatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  smallScreenStatBadgeText: {
    fontSize: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  
  // Mobile Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  smallScreenEmptyContainer: {
    paddingVertical: 30,
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  smallScreenEmptyIllustration: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  smallScreenEmptyTitle: {
    fontSize: 18,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  smallScreenEmptyText: {
    fontSize: 13,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  findRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  smallScreenFindRideButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  findRideText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  smallScreenFindRideText: {
    fontSize: 13,
  },
  
  // Error State
  errorContainer: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
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
  
  // Rating Modal
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
  smallScreenModalContent: {
    padding: 16,
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
  smallScreenModalTitle: {
    fontSize: 18,
  },
  routeNameModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  smallScreenRouteNameModal: {
    fontSize: 16,
  },
  dateModal: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  smallScreenStarsContainer: {
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  smallScreenRatingLabel: {
    fontSize: 15,
    marginBottom: 20,
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
  smallScreenNotesInput: {
    padding: 10,
    fontSize: 13,
    minHeight: 70,
  },
  submitButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  smallScreenSubmitButton: {
    paddingVertical: 14,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallScreenSubmitButtonText: {
    fontSize: 15,
  },
});