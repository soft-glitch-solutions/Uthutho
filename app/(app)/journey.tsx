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
  Modal,
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, Users, Clock, MapPin, Car, User, ChevronRight, MessageCircle } from 'lucide-react-native';
import * as Location from 'expo-location';

import { useJourney } from '@/hook/useJourney';
import { supabase } from '@/lib/supabase';
import { JourneyHeader } from '@/components/journey/JourneyHeader';
import { CompactRouteSlider } from '@/components/journey/CompactRouteSlider';
import { JourneyTabs } from '@/components/journey/JourneyTabs';
import { ConnectionError } from '@/components/journey/ConnectionError';
import { JourneySkeleton } from '@/components/journey/JourneySkeleton';
import { NoActiveJourney } from '@/components/journey/NoActiveJourney';
import { JourneyChat } from '@/components/journey/JourneyChat';

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
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{stop.name}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.stopInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Stop:</Text>
                <Text style={styles.infoValue}>#{stop.order_number}</Text>
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
                    Waiting: {passengersAtStop.length}
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
                        <Text style={styles.passengerName} numberOfLines={1}>
                          {passenger.profiles?.first_name} {passenger.profiles?.last_name}
                        </Text>
                        <Text style={styles.waitingText}>
                          Waiting
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noPassengers}>
                  <Text style={styles.noPassengersText}>No passengers waiting</Text>
                </View>
              )}
            </View>
          </ScrollView>
          
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
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState(1);
  
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
    checkLocationPermission();
    
    if (activeJourney) {
      loadJourneyData();
      subscribeToDriverChanges();
      subscribeToOnlineCount();
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

  // Periodic location updates for picked_up users
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const updateLocationPeriodically = async () => {
      if (participantStatus === 'picked_up' && activeJourney && currentUserId && locationPermission) {
        console.log('Starting periodic location updates for user:', currentUserId);
        
        // Function to update location
        const updateLocation = async () => {
          try {
            setIsUpdatingLocation(true);
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
            });
            
            console.log('Updating location:', {
              lat: location.coords.latitude,
              lng: location.coords.longitude
            });
            
            const { error } = await supabase
              .from('journey_participants')
              .update({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                last_location_update: new Date().toISOString()
              })
              .eq('journey_id', activeJourney.id)
              .eq('user_id', currentUserId)
              .eq('is_active', true);

            if (error) {
              console.error('Error updating location in database:', error);
            } else {
              console.log('Location updated successfully');
            }
          } catch (error) {
            console.log('Error getting location:', error);
          } finally {
            setIsUpdatingLocation(false);
          }
        };

        // Update immediately
        await updateLocation();
        
        // Then update every 30 seconds
        intervalId = setInterval(updateLocation, 30000);
      }
    };

    updateLocationPeriodically();

    return () => {
      if (intervalId) {
        console.log('Clearing periodic location updates');
        clearInterval(intervalId);
      }
    };
  }, [participantStatus, activeJourney?.id, currentUserId, locationPermission]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const subscribeToOnlineCount = () => {
    if (!activeJourney?.id) return;

    const estimateOnlineCount = async () => {
      const { count } = await supabase
        .from('journey_participants')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', activeJourney.id)
        .eq('is_active', true);

      setOnlineCount(count || 1);
    };

    estimateOnlineCount();
  };

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
        loadChatMessages(),
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

  const loadChatMessages = async () => {
    if (!activeJourney?.id) return;

    try {
      const { data: messages, error } = await supabase
        .from('journey_messages')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            selected_title,
            avatar_url
          )
        `)
        .eq('journey_id', activeJourney.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
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
              .select('first_name, last_name, avatar_url, selected_title')
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
      let updates: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        const hasPermission = locationPermission || await requestLocationPermission();
        
        if (!hasPermission) {
          Alert.alert(
            'Location Permission Required',
            'To share your live location with others, please enable location services.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                console.log('Open location settings');
              }}
            ]
          );
          return;
        }
        
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          
          updates.latitude = location.coords.latitude;
          updates.longitude = location.coords.longitude;
          updates.last_location_update = new Date().toISOString();
          
          console.log('Location captured for picked_up:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
        } catch (locationError) {
          console.log('Could not get location:', locationError);
          Alert.alert(
            'Location Error',
            'Unable to get your current location.',
            [{ text: 'OK' }]
          );
        }
      } else if (newStatus === 'arrived') {
        updates.latitude = null;
        updates.longitude = null;
      }

      const { error } = await supabase
        .from('journey_participants')
        .update(updates)
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
        
        const { data: userStop } = await supabase
          .from('stop_waiting')
          .select('stop_id, stops(order_number)')
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id)
          .maybeSingle();

        if (userStop && userStop.stops) {
          const userStopOrder = userStop.stops.order_number;
          
          const { error: updateJourneyError } = await supabase
            .from('journeys')
            .update({ 
              current_stop_sequence: userStopOrder
            })
            .eq('id', activeJourney.id);

          if (!updateJourneyError) {
            console.log(`Updated journey stop sequence to ${userStopOrder}`);
            await refreshActiveJourney();
          }
        }
        
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id);
        
        setUserStopName('');
        
        await Promise.all([
          loadOtherPassengers(),
          loadJourneyStops()
        ]);
        
        Alert.alert('Success', 'You have been marked as picked up!');
        
      } else if (newStatus === 'arrived') {
        await awardPoints(5);
        
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
      Alert.alert('Error', 'Failed to share journey.');
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
      Alert.alert('Error', 'Failed to notify passengers.');
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
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const loadJourneyStops = async () => {
    if (!activeJourney) return;

    try {
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

  const sendChatMessage = async () => {
    if (!activeJourney?.id || !currentUserId || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('journey_messages')
        .insert({
          journey_id: activeJourney.id,
          user_id: currentUserId,
          message: newMessage.trim(),
          is_anonymous: true
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
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
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Compact Journey Header */}
            <View style={styles.compactHeader}>
              <View style={styles.routeRow}>
                <Text style={styles.routeName} numberOfLines={1}>
                  {activeJourney.routes.name}
                </Text>
                <View style={styles.transportBadge}>
                  <Car size={12} color="#1ea2b1" />
                  <Text style={styles.transportText}>
                    {activeJourney.routes.transport_type}
                  </Text>
                </View>
              </View>
              
              <View style={styles.routeEndpoints}>
                <Text style={styles.startPoint} numberOfLines={1}>
                  {activeJourney.routes.start_point}
                </Text>
                <ChevronRight size={12} color="#666666" style={styles.chevron} />
                <Text style={styles.endPoint} numberOfLines={1}>
                  {activeJourney.routes.end_point}
                </Text>
              </View>
            </View>

            {/* Your Status Section */}
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
                  <Text style={styles.yourStopStatus} numberOfLines={1}>
                    {participantStatus === 'waiting' ? 'Waiting for pickup' : 
                     participantStatus === 'picked_up' ? 'On board - Picked up' : 
                     'Arrived'}
                  </Text>
                  {isUpdatingLocation && participantStatus === 'picked_up' && (
                    <View style={styles.locationUpdating}>
                      <Text style={styles.locationUpdatingText}>🔄 Live</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.yourStopTime} numberOfLines={1}>
                  {participantStatus === 'waiting' ? `Waiting: ${formatWaitingTime(waitingTime)}` : 
                   participantStatus === 'picked_up' ? 'On the way to destination' :
                   'Journey completed'}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Users size={14} color="#1ea2b1" />
                <Text style={styles.statNumber}>{otherPassengers.length + 1}</Text>
                <Text style={styles.statLabel}>People</Text>
              </View>
              
              <View style={styles.statItem}>
                <Clock size={14} color="#fbbf24" />
                <Text style={styles.statNumber}>{getEstimatedArrival()}</Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
              
              <View style={styles.statItem}>
                <MapPin size={14} color="#34d399" />
                <Text style={styles.statNumber}>
                  {activeJourney.current_stop_sequence || 0}/{journeyStops.length}
                </Text>
                <Text style={styles.statLabel}>Stops</Text>
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
                  <Text style={styles.primaryActionText}>Picked Up</Text>
                </TouchableOpacity>
              )}
              
              {participantStatus === 'picked_up' && (
                <TouchableOpacity
                  style={[styles.primaryActionButton, styles.arrivedButton]}
                  onPress={() => updateParticipantStatus('arrived')}
                >
                  <Text style={styles.primaryActionText}>Arrived</Text>
                </TouchableOpacity>
              )}
              
              {participantStatus === 'waiting' && (
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={pingPassengersAhead}
                >
                  <Text style={styles.secondaryActionText}>Notify Ahead</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={shareJourney}
              >
                <Share2 size={18} color="#1ea2b1" />
              </TouchableOpacity>
            </View>

            {/* Location Status */}
            {participantStatus === 'picked_up' && (
              <View style={styles.locationStatus}>
                <Text style={styles.locationStatusText} numberOfLines={2}>
                  {locationPermission 
                    ? '📍 Location shared live'
                    : '📍 Enable location for sharing'}
                </Text>
                {!locationPermission && (
                  <TouchableOpacity 
                    style={styles.enableLocationButton}
                    onPress={requestLocationPermission}
                  >
                    <Text style={styles.enableLocationText}>Enable</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

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
          </ScrollView>

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
      // Chat Tab
      return (
        <JourneyChat
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendChatMessage}
          currentUserId={currentUserId}
          onlineCount={onlineCount}
        />
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <JourneyHeader title="Active Journey" />
        
        <JourneyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessages={unreadMessages}
          onlineCount={onlineCount} 
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
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  compactHeader: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  transportText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '600',
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startPoint: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  endPoint: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  chevron: {
    marginHorizontal: 4,
  },
  yourStopRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    marginBottom: 10,
    alignItems: 'center',
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  yourStopInfo: {
    flex: 1,
    minWidth: 0,
  },
  yourStopName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
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
    fontSize: 10,
    color: '#cccccc',
    fontWeight: '500',
    marginRight: 6,
    flexShrink: 1,
  },
  locationUpdating: {
    backgroundColor: '#1ea2b130',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationUpdatingText: {
    fontSize: 9,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  yourStopTime: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  arrivedButton: {
    backgroundColor: '#fbbf24',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  secondaryActionText: {
    color: '#1ea2b1',
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  locationStatus: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  locationStatusText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  enableLocationButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableLocationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  errorContainer: {
    marginBottom: 10,
  },
  noDriverCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  noDriverText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 2,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 20,
    fontWeight: '300',
  },
  stopInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
    width: 70,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: '600',
  },
  passengersSection: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  passengerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 10,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
    minWidth: 0,
  },
  passengerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  waitingText: {
    color: '#666666',
    fontSize: 11,
  },
  noPassengers: {
    padding: 16,
    alignItems: 'center',
  },
  noPassengersText: {
    color: '#666666',
    fontSize: 13,
  },
  dismissButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});