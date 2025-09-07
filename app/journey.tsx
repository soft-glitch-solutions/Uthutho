import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MapPin, Clock, Users, Navigation, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useJourney } from '@/hook/useJourney';
import { supabase } from '@/lib/supabase';

interface JourneyStop {
  id: string;
  name: string;
  order_number: number;
  passed: boolean;
  current: boolean;
  upcoming: boolean;
}

export default function JourneyScreen() {
  const router = useRouter();
  const { activeJourney, loading, completeJourney } = useJourney();
  const [journeyStops, setJourneyStops] = useState<JourneyStop[]>([]);
  const [otherPassengers, setOtherPassengers] = useState<any[]>([]);

  useEffect(() => {
    if (activeJourney) {
      loadJourneyStops();
      loadOtherPassengers();
    }
  }, [activeJourney]);

  const loadJourneyStops = async () => {
    if (!activeJourney) return;

    try {
      const { data: stops, error } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', activeJourney.route_id)
        .order('order_number', { ascending: true });

      if (error) {
        console.error('Error loading journey stops:', error);
        return;
      }

      const processedStops = stops.map(stop => ({
        ...stop,
        passed: stop.order_number < activeJourney.current_stop_sequence,
        current: stop.order_number === activeJourney.current_stop_sequence,
        upcoming: stop.order_number > activeJourney.current_stop_sequence,
      }));

      setJourneyStops(processedStops);
    } catch (error) {
      console.error('Error loading journey stops:', error);
    }
  };

  const loadOtherPassengers = async () => {
    if (!activeJourney) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passengers, error } = await supabase
        .from('stop_waiting')
        .select(`
          *,
          profiles (
            first_name,
            last_name
          ),
          stops (
            name,
            order_number
          )
        `)
        .eq('journey_id', activeJourney.id)
        .neq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      if (!error) {
        setOtherPassengers(passengers || []);
      }
    } catch (error) {
      console.error('Error loading other passengers:', error);
    }
  };

  const handleCompleteJourney = () => {
    Alert.alert(
      'Complete Journey',
      'Have you reached your destination?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Yes, I\'ve Arrived', 
          onPress: async () => {
            const result = await completeJourney();
            if (result.success) {
              router.replace('/(tabs)');
            }
          }
        },
      ]
    );
  };

  const getProgressPercentage = () => {
    if (!activeJourney || journeyStops.length === 0) return 0;
    return (activeJourney.current_stop_sequence / journeyStops.length) * 100;
  };

  const getEstimatedArrival = () => {
    if (!activeJourney || journeyStops.length === 0) return 'Unknown';
    const remainingStops = journeyStops.length - activeJourney.current_stop_sequence;
    const estimatedMinutes = remainingStops * 3; // Assume 3 minutes per stop
    return `${estimatedMinutes} min`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  if (!activeJourney) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>No Active Journey</Text>
        <Text style={styles.errorText}>
          You don't have an active journey. Mark yourself as waiting at a stop to start tracking your journey.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.backButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Journey</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Journey Overview */}
      <View style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <Navigation size={24} color="#1ea2b1" />
          <View style={styles.journeyInfo}>
            <Text style={styles.routeName}>{activeJourney.routes.name}</Text>
            <Text style={styles.routeType}>{activeJourney.routes.transport_type}</Text>
          </View>
        </View>

        <Text style={styles.routeDestination}>
          {activeJourney.routes.start_point} → {activeJourney.routes.end_point}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getProgressPercentage()}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% Complete
          </Text>
        </View>

        {/* Journey Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={16} color="#1ea2b1" />
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{getEstimatedArrival()}</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={16} color="#1ea2b1" />
            <Text style={styles.statLabel}>Passengers</Text>
            <Text style={styles.statValue}>{otherPassengers.length + 1}</Text>
          </View>
          <View style={styles.statItem}>
            <MapPin size={16} color="#1ea2b1" />
            <Text style={styles.statLabel}>Stop</Text>
            <Text style={styles.statValue}>{activeJourney.current_stop_sequence}/{journeyStops.length}</Text>
          </View>
        </View>
      </View>

      {/* Route Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Progress</Text>
        {journeyStops.map((stop, index) => (
          <View key={stop.id} style={styles.stopItem}>
            <View style={[
              styles.stopIndicator,
              stop.passed && styles.stopPassed,
              stop.current && styles.stopCurrent,
              stop.upcoming && styles.stopUpcoming,
            ]}>
              {stop.passed && <CheckCircle size={16} color="#4ade80" />}
              {stop.current && <Navigation size={16} color="#1ea2b1" />}
              {stop.upcoming && <MapPin size={16} color="#666666" />}
            </View>
            
            <View style={styles.stopInfo}>
              <Text style={[
                styles.stopName,
                stop.current && styles.currentStopName,
                stop.passed && styles.passedStopName,
              ]}>
                {stop.name}
              </Text>
              <Text style={styles.stopNumber}>Stop {stop.order_number}</Text>
            </View>

            {stop.current && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Other Passengers */}
      {otherPassengers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fellow Passengers ({otherPassengers.length})</Text>
          {otherPassengers.map((passenger) => (
            <View key={passenger.id} style={styles.passengerItem}>
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerName}>
                  {passenger.profiles.first_name} {passenger.profiles.last_name}
                </Text>
                <Text style={styles.passengerStop}>
                  Waiting at {passenger.stops.name}
                </Text>
              </View>
              <Text style={styles.passengerTime}>
                {new Date(passenger.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Complete Journey Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.completeButton} 
          onPress={handleCompleteJourney}
        >
          <CheckCircle size={20} color="#ffffff" />
          <Text style={styles.completeButtonText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
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
    color: '#ffffff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerBackButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  journeyCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  routeType: {
    fontSize: 14,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '500',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stopIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopPassed: {
    backgroundColor: '#4ade8020',
  },
  stopCurrent: {
    backgroundColor: '#1ea2b120',
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  stopUpcoming: {
    backgroundColor: '#333333',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 2,
  },
  currentStopName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  passedStopName: {
    color: '#4ade80',
  },
  stopNumber: {
    fontSize: 12,
    color: '#666666',
  },
  currentBadge: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  passengerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  passengerStop: {
    fontSize: 14,
    color: '#666666',
  },
  passengerTime: {
    fontSize: 12,
    color: '#1ea2b1',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});