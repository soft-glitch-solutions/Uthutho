import React, { useState, useEffect } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Image,
  Animated,
  Modal
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, Users, Clock, MapPin, Car, User, ChevronRight } from 'lucide-react-native';

import { useJourney } from '@/hook/useJourney';
import { supabase } from '@/lib/supabase';
import { JourneyHeader } from '@/components/journey/JourneyHeader';
import { CompactRouteSlider } from '@/components/journey/CompactRouteSlider';
import { JourneyTabs } from '@/components/journey/JourneyTabs';
import { ConnectionError } from '@/components/journey/ConnectionError';
import { JourneySkeleton } from '@/components/journey/JourneySkeleton';
import { NoActiveJourney } from '@/components/journey/NoActiveJourney';

import type { JourneyStop, Passenger, ChatMessage } from '@/types/journey';

// Stop Details Modal Component
const StopDetailsModal = ({ stop, visible, onClose, passengers }) => {
  if (!stop) return null;

  const passengersAtStop = passengers.filter(p => p.stop_id === stop.id);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{stop.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.stopInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stop Number:</Text>
              <Text style={styles.infoValue}>{stop.order_number}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                stop.passed && styles.passedBadge,
                stop.current && styles.currentBadge,
                stop.upcoming && styles.upcomingBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {stop.passed ? 'Passed' : 
                   stop.current ? 'Current' : 
                   stop.upcoming ? 'Upcoming' : 'Future'}
                </Text>
              </View>
            </View>
            
            {passengersAtStop.length > 0 ? (
              <View style={styles.passengersSection}>
                <Text style={styles.sectionTitle}>
                  Passengers Waiting ({passengersAtStop.length})
                </Text>
                {passengersAtStop.map(passenger => (
                  <View key={passenger.id} style={styles.passengerItem}>
                    <View style={styles.passengerAvatar}>
                      {passenger.profiles?.avatar_url ? (
                        <Image 
                          source={{ uri: passenger.profiles.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {passenger.profiles?.first_name?.[0] || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>
                        {passenger.profiles?.first_name} {passenger.profiles?.last_name}
                      </Text>
                      <Text style={styles.waitingText}>
                        Waiting at this stop
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noPassengers}>
                <Text style={styles.noPassengersText}>No passengers waiting at this stop</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function JourneyScreen() {
  const router = useRouter();
  const { activeJourney, loading, completeJourney, refreshActiveJourney } = useJourney();
  
  const [journeyStops, setJourneyStops] = useState<JourneyStop[]>([]);
  const [otherPassengers, setOtherPassengers] = useState<Passenger[]>([]);
  const [waitingTime, setWaitingTime] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [userStopName, setUserStopName] = useState<string>('');
  const [connectionError, setConnectionError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [participantStatus, setParticipantStatus] = useState<'waiting' | 'picked_up' | 'arrived'>('waiting');
  const [isDriver, setIsDriver] = useState(false);
  const [hasDriverInJourney, setHasDriverInJourney] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);
  
  // Simple animation
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    getCurrentUser();
    checkIfDriver();
    
    if (activeJourney) {
      loadJourneyData();
      subscribeToDriverChanges();
    } else {
      setJourneyStops([]);
    }
  }, [activeJourney]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeJourney?.id || !currentUserId) return;

    // Subscribe to changes in journey_participants for this user
    const subscription = supabase
      .channel(`journey-participant-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journey_participants',
          filter: `journey_id=eq.${activeJourney.id} AND user_id=eq.${currentUserId}`
        },
        (payload) => {
          if (payload.new.status !== participantStatus) {
            setParticipantStatus(payload.new.status || 'waiting');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeJourney?.id, currentUserId]);

  const checkIfDriver = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, is_verified, is_active')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      setIsDriver(!!driverData);
    } catch (error) {
      console.error('Error checking driver status:', error);
    }
  };

  const getUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const subscribeToDriverChanges = () => {
    if (!activeJourney) return;

    try {
      const subscription = supabase
        .channel('journey-driver-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'journeys',
            filter: `id=eq.${activeJourney.id}`
          },
          (payload) => {
            if (payload.new.has_driver !== hasDriverInJourney) {
              setHasDriverInJourney(payload.new.has_driver);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to driver changes:', error);
    }
  };

  const loadJourneyData = async () => {
    setConnectionError(false);
    try {
      await Promise.all([
        loadJourneyStops(),
        loadOtherPassengers(),
        loadCurrentUserStop(),
        loadParticipantStatus(),
        getUserProfile(),
      ]);
      startWaitingTimer();
      subscribeToChat();
    } catch (error) {
      console.error('Error loading journey data:', error);
      setConnectionError(true);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setConnectionError(true);
    }
  };

  const loadCurrentUserStop = async () => {
    if (!activeJourney || !currentUserId) return;

    try {
      const { data: userStop, error } = await supabase
        .from('stop_waiting')
        .select('*, stops(name, order_number)')
        .eq('user_id', currentUserId)
        .eq('journey_id', activeJourney.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading current user stop:', error);
        return;
      }

      if (userStop && userStop.stops) {
        setUserStopName(userStop.stops.name);
      } else {
        // User is not in stop_waiting (could be picked_up or arrived)
        setUserStopName('');
      }
    } catch (error) {
      console.error('Error loading current user stop:', error);
      throw error;
    }
  };

  const loadParticipantStatus = async () => {
    if (!activeJourney || !currentUserId) return;

    try {
      const { data: participant } = await supabase
        .from('journey_participants')
        .select('status')
        .eq('journey_id', activeJourney.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (participant) {
        setParticipantStatus(participant.status || 'waiting');
      }
    } catch (error) {
      console.error('Error loading participant status:', error);
    }
  };

  const startWaitingTimer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: waitingData } = await supabase
        .from('stop_waiting')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('journey_id', activeJourney?.id)
        .maybeSingle();

      if (waitingData) {
        const startTime = new Date(waitingData.created_at).getTime();
        
        const updateTimer = () => {
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startTime) / 1000);
          setWaitingTime(elapsed);
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Error starting waiting timer:', error);
    }
  };

  const loadOtherPassengers = async () => {
    if (!activeJourney) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passengers } = await supabase
        .from('stop_waiting')
        .select('*, profiles (first_name, last_name, avatar_url), stops (id, name, order_number)')
        .eq('journey_id', activeJourney.id)
        .neq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      setOtherPassengers(passengers || []);
    } catch (error) {
      console.error('Error loading other passengers:', error);
      throw error;
    }
  };

  const subscribeToChat = () => {
    if (!activeJourney) return;

    try {
      const subscription = supabase
        .channel('journey-chat-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'journey_messages',
            filter: `journey_id=eq.${activeJourney.id}`
          },
          async (payload) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();
              
            const newMessage = {
              ...payload.new as ChatMessage,
              profiles: profile
            };
            
            setChatMessages(prev => [...prev, newMessage]);
            
            if (activeTab !== 'chat') {
              setUnreadMessages(prev => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to chat:', error);
    }
  };

  const updateParticipantStatus = async (newStatus: 'waiting' | 'picked_up' | 'arrived') => {
    if (!activeJourney || !currentUserId) return;

    try {
      // Only update the status column since stop_waiting_id doesn't exist
      const { error } = await supabase
        .from('journey_participants')
        .update({ 
          status: newStatus
        })
        .eq('journey_id', activeJourney.id)
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating participant status:', error);
        Alert.alert('Error', 'Failed to update status');
        return;
      }

      setParticipantStatus(newStatus);
      
      if (newStatus === 'picked_up') {
        await awardPoints(2);
        
        // Get the user's current stop to update the journey's current stop sequence
        const { data: userStop, error: userStopError } = await supabase
          .from('stop_waiting')
          .select('stop_id, stops(order_number)')
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id)
          .maybeSingle();

        if (userStopError && userStopError.code !== 'PGRST116') {
          console.error('Error getting user stop:', userStopError);
        }

        // Update the journey's current stop sequence to the user's stop
        // This marks that the taxi has reached this stop
        if (userStop && userStop.stops) {
          const userStopOrder = userStop.stops.order_number;
          
          // Update the journey's current stop sequence
          const { error: updateJourneyError } = await supabase
            .from('journeys')
            .update({ 
              current_stop_sequence: userStopOrder
            })
            .eq('id', activeJourney.id);

          if (updateJourneyError) {
            console.error('Error updating journey stop sequence:', updateJourneyError);
          } else {
            console.log(`Updated journey stop sequence to ${userStopOrder}`);
            
            // Refresh the active journey to get updated stop sequence
            await refreshActiveJourney();
          }
        }
        
        // Remove current user from stop_waiting (they're no longer waiting)
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id);
        
        // Clear user stop name since they're no longer waiting at a stop
        setUserStopName('');
        
        // Reload passengers and stops to reflect changes
        await Promise.all([
          loadOtherPassengers(),
          loadJourneyStops()
        ]);
        
        Alert.alert('Success', 'You have been marked as picked up!');
        
      } else if (newStatus === 'arrived') {
        await awardPoints(5);
        
        // Remove from stop_waiting if still there
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id);
          
        await handleCompleteJourney();
      }
    } catch (error) {
      console.error('Error updating participant status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const awardPoints = async (points: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + points })
          .eq('id', currentUserId);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const shareJourney = async () => {
    if (!activeJourney) return;

    try {
      const baseUrl = __DEV__ 
        ? 'http://localhost:8081' 
        : 'https://mobile.uthutho.co.za';
      
      const shareUrl = `${baseUrl}/journey-share/${activeJourney.id}`;
      
      const shareMessage = `📍 My Current Location - Uthutho

I'm currently at ${userStopName}${activeJourney.routes?.name ? ` on the ${activeJourney.routes.name}` : ''}.

View my real-time location and journey details:
${shareUrl}

Shared via Uthutho`;

      await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: 'Share My Location'
      });

    } catch (error) {
      console.error('Error sharing journey:', error);
      Alert.alert('Error', 'Failed to share journey. Please try again.');
    }
  };

  const pingPassengersAhead = async () => {
    if (!activeJourney || !currentUserId) return;

    try {
      const { data: currentUserWaiting, error } = await supabase
        .from('stop_waiting')
        .select('*, stops (order_number, name)')
        .eq('user_id', currentUserId)
        .eq('journey_id', activeJourney.id)
        .single();

      if (error) {
        Alert.alert('Error', 'Could not find your waiting stop');
        return;
      }

      const currentStopSequence = currentUserWaiting.stops.order_number;

      const { data: passengersAhead, error: passengersError } = await supabase
        .from('stop_waiting')
        .select('user_id, stops (order_number, name)')
        .eq('journey_id', activeJourney.id)
        .neq('user_id', currentUserId)
        .gt('stops.order_number', currentStopSequence);

      if (passengersError) {
        console.error('Error finding passengers ahead:', passengersError);
        Alert.alert('Error', 'Failed to find passengers ahead');
        return;
      }

      if (passengersAhead && passengersAhead.length > 0) {
        const notifications = passengersAhead.map(passenger => ({
          user_id: passenger.user_id,
          type: 'journey_update',
          title: 'Transport Approaching',
          message: `Your ${activeJourney.routes.transport_type} is approaching. Get ready!`,
          data: { 
            journey_id: activeJourney.id,
            current_stop: currentUserWaiting.stops.name,
          }
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error sending notifications:', notificationError);
          Alert.alert('Error', 'Failed to send notifications');
          return;
        }

        Alert.alert('Success', `Notified ${passengersAhead.length} passenger(s) ahead`);
      } else {
        Alert.alert('Info', 'No passengers ahead to notify');
      }
    } catch (error) {
      console.error('Error pinging passengers ahead:', error);
      Alert.alert('Error', 'Failed to notify passengers. Please check your connection.');
    }
  };

  const handleCompleteJourney = async () => {
    try {
      console.log('Completing journey...');
      const result = await completeJourney();
      console.log('Complete Journey result:', result);

      if (result.success) {
        router.push({
          pathname: '/journeyComplete',
          params: {
            duration: String(result.rideDuration ?? 0),
            trips: result.newTrips?.toString(),
            routeName: activeJourney?.routes?.name ?? '',
            transportMode: activeJourney?.routes?.transport_type ?? '',
          },
        });
      } else {
        Alert.alert('Error', result.error || 'Could not complete journey');
      }
    } catch (err) {
      console.error('Unexpected error completing journey:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const loadJourneyStops = async () => {
    if (!activeJourney) return;

    try {
      // Load route stops
      const { data: routeStopsData, error: routeStopsError } = await supabase
        .from('route_stops')
        .select(`
          order_number,
          stops (
            id,
            name,
            latitude,
            longitude
          )
        `)
        .eq('route_id', activeJourney.route_id)
        .order('order_number', { ascending: true });

      if (routeStopsError) throw routeStopsError;

      // Get all active waiting stops
      const { data: activeWaitingStops } = await supabase
        .from('stop_waiting')
        .select('stop_id')
        .eq('journey_id', activeJourney.id);

      const activeStopIds = new Set(activeWaitingStops?.map(w => w.stop_id) || []);

      const processedStops = (routeStopsData || []).map((routeStop) => {
        const stop = routeStop.stops;
        if (!stop) return null;

        const stopOrder = routeStop.order_number;
        const currentStopSequence = activeJourney.current_stop_sequence || 0;
        
        // Check if this stop has any waiting passengers
        const hasWaitingPassengers = activeStopIds.has(stop.id);
        
        return {
          id: stop.id,
          name: stop.name,
          order_number: stopOrder,
          passed: stopOrder < currentStopSequence,
          current: stopOrder === currentStopSequence,
          upcoming: stopOrder > currentStopSequence,
          hasWaitingPassengers: hasWaitingPassengers,
          latitude: stop.latitude,
          longitude: stop.longitude
        };
      });

      const validStops = processedStops.filter(stop => stop !== null) as JourneyStop[];
      setJourneyStops(validStops);

    } catch (error) {
      console.error('Error loading journey stops:', error);
    }
  };

  const formatWaitingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEstimatedArrival = () => {
    if (!activeJourney || journeyStops.length === 0) return 'Unknown';
    
    const currentStopSequence = activeJourney.current_stop_sequence || 0;
    const remainingStops = journeyStops.length - currentStopSequence;
    const estimatedMinutes = remainingStops * 3;
    
    return `${estimatedMinutes}m`;
  };

  const handleStopPress = (stop: JourneyStop) => {
    setSelectedStop(stop);
    setShowStopDetails(true);
  };

  const getProfileInitial = () => {
    if (!userProfile) return 'Y';
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`;
    } else if (userProfile.first_name) {
      return userProfile.first_name[0];
    }
    return 'Y';
  };

  const renderContent = () => {
    if (activeTab === 'info') {
      return (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Compact Journey Header */}
          <View style={styles.compactHeader}>
            <View style={styles.routeRow}>
              <Text style={styles.routeName} numberOfLines={1}>
                {activeJourney.routes.name}
              </Text>
              <View style={styles.transportBadge}>
                <Car size={14} color="#1ea2b1" />
                <Text style={styles.transportText}>
                  {activeJourney.routes.transport_type}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeEndpoints}>
              <Text style={styles.startPoint} numberOfLines={1}>
                {activeJourney.routes.start_point}
              </Text>
              <ChevronRight size={16} color="#666666" />
              <Text style={styles.endPoint} numberOfLines={1}>
                {activeJourney.routes.end_point}
              </Text>
            </View>
          </View>

          {/* Your Status Section - Updated for picked_up state */}
          <View style={styles.yourStopRow}>
            <View style={styles.profileContainer}>
              {userProfile?.avatar_url ? (
                <Image 
                  source={{ uri: userProfile.avatar_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>{getProfileInitial()}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.yourStopInfo}>
              <Text style={styles.yourStopName} numberOfLines={1}>
                {participantStatus === 'waiting' ? userStopName : 'On Board'}
              </Text>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot,
                  participantStatus === 'waiting' ? styles.waitingDot : 
                  participantStatus === 'picked_up' ? styles.pickedUpDot :
                  styles.arrivedDot
                ]} />
                <Text style={styles.yourStopStatus}>
                  {participantStatus === 'waiting' ? 'Waiting for pickup' : 
                   participantStatus === 'picked_up' ? 'On board - Picked up' : 
                   'Arrived'}
                </Text>
              </View>
              <Text style={styles.yourStopTime}>
                {participantStatus === 'waiting' ? `Waiting: ${formatWaitingTime(waitingTime)}` : 
                 participantStatus === 'picked_up' ? 'On the way to destination' :
                 'Journey completed'}
              </Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Users size={16} color="#1ea2b1" />
                <Text style={styles.statNumber}>{otherPassengers.length + 1}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Clock size={16} color="#fbbf24" />
                <Text style={styles.statNumber}>{getEstimatedArrival()}</Text>
              </View>
              
              <View style={styles.statItem}>
                <MapPin size={16} color="#34d399" />
                <Text style={styles.statNumber}>
                  {activeJourney.current_stop_sequence || 0}/{journeyStops.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Route Slider */}
          <CompactRouteSlider
            stops={journeyStops}
            currentUserStopName={userStopName}
            currentUserId={currentUserId}
            passengers={otherPassengers}
            transportType={activeJourney.routes.transport_type}
            currentStopSequence={activeJourney.current_stop_sequence || 0}
            participantStatus={participantStatus}
            onStopPress={handleStopPress}
          />

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {participantStatus === 'waiting' && (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => updateParticipantStatus('picked_up')}
              >
                <Text style={styles.primaryActionText}>Mark as Picked Up</Text>
              </TouchableOpacity>
            )}
            
            {participantStatus === 'picked_up' && (
              <TouchableOpacity
                style={[styles.primaryActionButton, styles.arrivedButton]}
                onPress={() => updateParticipantStatus('arrived')}
              >
                <Text style={styles.primaryActionText}>I've Arrived</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={pingPassengersAhead}
              disabled={participantStatus !== 'waiting'}
            >
              <Text style={[
                styles.secondaryActionText,
                participantStatus !== 'waiting' && styles.disabledActionText
              ]}>
                Notify Ahead
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={shareJourney}
            >
              <Share2 size={20} color="#1ea2b1" />
            </TouchableOpacity>
          </View>

          {connectionError && (
            <View style={styles.errorContainer}>
              <ConnectionError />
            </View>
          )}

          {/* No Driver Indicator */}
          {!hasDriverInJourney && !isDriver && (
            <TouchableOpacity style={styles.noDriverCard}>
              <Text style={styles.noDriverText}>No driver assigned</Text>
            </TouchableOpacity>
          )}

          {/* Stop Details Modal */}
          <StopDetailsModal
            stop={selectedStop}
            visible={showStopDetails}
            onClose={() => setShowStopDetails(false)}
            passengers={otherPassengers}
          />
        </Animated.View>
      );
    } else {
      return (
        <View style={styles.chatContainer}>
          <Text style={styles.chatPlaceholder}>Chat would appear here</Text>
        </View>
      );
    }
  };

  if (loading) {
    return <JourneySkeleton />;
  }

  if (!activeJourney) {
    return <NoActiveJourney />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <JourneyHeader title="Active Journey" />
        
        <JourneyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessages={unreadMessages}
        />
        
        {renderContent()}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  compactHeader: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  transportText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startPoint: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  endPoint: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  yourStopRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    marginBottom: 12,
    alignItems: 'center',
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  yourStopInfo: {
    flex: 1,
  },
  yourStopName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  waitingDot: {
    backgroundColor: '#fbbf24',
  },
  pickedUpDot: {
    backgroundColor: '#34d399',
  },
  arrivedDot: {
    backgroundColor: '#4ade80',
  },
  yourStopStatus: {
    fontSize: 11,
    color: '#cccccc',
    fontWeight: '500',
  },
  yourStopTime: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  arrivedButton: {
    backgroundColor: '#fbbf24',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledActionText: {
    color: '#666666',
  },
  iconButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    marginBottom: 12,
  },
  noDriverCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  noDriverText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    color: '#666666',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 24,
    fontWeight: '300',
  },
  stopInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  passedBadge: {
    backgroundColor: '#065f46',
  },
  currentBadge: {
    backgroundColor: '#1e40af',
  },
  upcomingBadge: {
    backgroundColor: '#78350f',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  passengersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  waitingText: {
    color: '#666666',
    fontSize: 12,
  },
  noPassengers: {
    padding: 20,
    alignItems: 'center',
  },
  noPassengersText: {
    color: '#666666',
    fontSize: 14,
  },
  dismissButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});