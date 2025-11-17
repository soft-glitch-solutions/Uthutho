import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  RefreshControl,
  Alert,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Share
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, UserPlus, Award } from 'lucide-react-native';

import { useJourney } from '@/hook/useJourney';
import { supabase } from '@/lib/supabase';
import { JourneyHeader } from '@/components/journey/JourneyHeader';
import { JourneyOverview } from '@/components/journey/JourneyOverview';
import { UserStopHighlight } from '@/components/journey/UserStopHighlight';
import { RouteProgress } from '@/components/journey/RouteProgress';
import { PassengersList } from '@/components/journey/PassengersList';
import { JourneyChat } from '@/components/journey/JourneyChat';
import { CompleteJourneyButton } from '@/components/journey/CompleteJourneyButton';
import { ConnectionError } from '@/components/journey/ConnectionError';
import { JourneySkeleton } from '@/components/journey/JourneySkeleton';
import { NoActiveJourney } from '@/components/journey/NoActiveJourney';
import { JourneyTabs } from '@/components/journey/JourneyTabs';

import type { JourneyStop, Passenger, ChatMessage } from '@/types/journey';

// No Driver Promotion Component
const NoDriverPromotion = ({ onShare, onDriverSignup, routeName, transportType }) => {
  return (
    <View style={styles.noDriverContainer}>
      <View style={styles.noDriverHeader}>
        <Text style={styles.noDriverTitle}>🚨 Oh no, no driver!</Text>
        <Text style={styles.noDriverSubtitle}>
          Get your driver to join Uthutho and earn <Text style={styles.pointsHighlight}>200 points</Text>
        </Text>
      </View>
      
      <View style={styles.pointsBadge}>
        <Award size={20} color="#fbbf24" />
        <Text style={styles.pointsText}>200 POINTS REWARD</Text>
      </View>

      <TouchableOpacity 
        style={styles.shareButton}
        onPress={onShare}
      >
        <Share2 size={20} color="#ffffff" />
        <Text style={styles.shareButtonText}>Share with Driver</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.driverSignupButton}
        onPress={onDriverSignup}
      >
        <UserPlus size={20} color="#1ea2b1" />
        <Text style={styles.driverSignupButtonText}>Become a Driver</Text>
      </TouchableOpacity>
    </View>
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
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [participantStatus, setParticipantStatus] = useState<'waiting' | 'picked_up' | 'arrived'>('waiting');
  const [isDriver, setIsDriver] = useState(false);
  const hasDriverInJourney = activeJourney?.has_driver || false;
  const journeyDriver = activeJourney?.driver_journeys?.[0]?.drivers;

  useEffect(() => {
    getCurrentUser();
    checkIfDriver();
    
    if (activeJourney) {
      loadJourneyData();
      checkJourneyDriver();
      subscribeToDriverChanges();
    }
  }, [activeJourney]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

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

  const checkJourneyDriver = async () => {
    if (!activeJourney) return;

    try {
      // First check if journey already has a driver assigned
      const { data: journeyWithDriver } = await supabase
        .from('journeys')
        .select('driver_id, has_driver, drivers(user_id, profiles(first_name, last_name))')
        .eq('id', activeJourney.id)
        .maybeSingle();

      if (journeyWithDriver && journeyWithDriver.has_driver) {
        // Journey already has a driver assigned
        setHasDriverInJourney(true);
        setJourneyDriver(journeyWithDriver.drivers);
        return;
      }

      // If no driver assigned, check if any verified drivers have joined as participants
      const { data: driverParticipants, error } = await supabase
        .from('journey_participants')
        .select(`
          user_id,
          profiles (
            first_name,
            last_name
          ),
          drivers!inner (
            id,
            is_verified,
            is_active
          )
        `)
        .eq('journey_id', activeJourney.id)
        .eq('is_active', true)
        .eq('drivers.is_verified', true)
        .eq('drivers.is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking driver participants:', error);
        return;
      }

      if (driverParticipants && driverParticipants.length > 0) {
        // Found a verified driver in participants - assign them as the journey driver
        const driverParticipant = driverParticipants[0];
        await assignDriverToJourney(driverParticipant.user_id, driverParticipant);
      } else {
        // No driver found
        setHasDriverInJourney(false);
        setJourneyDriver(null);
      }
    } catch (error) {
      console.error('Error checking journey driver:', error);
    }
  };

  const assignDriverToJourney = async (driverUserId: string, driverData: any) => {
    if (!activeJourney) return;

    try {
      // First get the driver ID from the drivers table
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', driverUserId)
        .eq('is_verified', true)
        .eq('is_active', true)
        .single();

      if (driverError || !driverRecord) {
        console.error('Error finding driver record:', driverError);
        return;
      }

      // Update the journey to assign the driver
      const { error: updateError } = await supabase
        .from('journeys')
        .update({
          driver_id: driverRecord.id,
          has_driver: true
        })
        .eq('id', activeJourney.id);

      if (updateError) {
        console.error('Error assigning driver to journey:', updateError);
        return;
      }

      // Update local state
      setHasDriverInJourney(true);
      setJourneyDriver({
        user_id: driverUserId,
        profiles: driverData.profiles
      });

      console.log('Driver assigned to journey:', driverUserId);
      
      // Send notification to passengers that a driver has joined
      await notifyPassengersDriverJoined(driverData.profiles);
    } catch (error) {
      console.error('Error in assignDriverToJourney:', error);
    }
  };

  const notifyPassengersDriverJoined = async (driverProfile: any) => {
    if (!activeJourney) return;

    try {
      const { data: passengers, error } = await supabase
        .from('journey_participants')
        .select('user_id')
        .eq('journey_id', activeJourney.id)
        .eq('is_active', true)
        .neq('user_id', currentUserId); // Don't notify the driver themselves

      if (error || !passengers) return;

      const driverName = `${driverProfile.first_name} ${driverProfile.last_name}`;
      const notifications = passengers.map(passenger => ({
        user_id: passenger.user_id,
        type: 'driver_joined',
        title: 'Driver Joined! 🎉',
        message: `${driverName} has joined as your driver for the ${activeJourney.routes.transport_type} journey`,
        data: { 
          journey_id: activeJourney.id,
          driver_name: driverName
        }
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

    } catch (error) {
      console.error('Error notifying passengers:', error);
    }
  };

  const subscribeToDriverChanges = () => {
    if (!activeJourney) return;

    try {
      // Subscribe to journey participant changes to detect when drivers join
      const subscription = supabase
        .channel('journey-driver-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'journey_participants',
            filter: `journey_id=eq.${activeJourney.id}`
          },
          async (payload) => {
            console.log('New participant joined:', payload.new);
            
            // Check if the new participant is a verified driver
            const { data: driverCheck, error } = await supabase
              .from('drivers')
              .select('id, is_verified, is_active')
              .eq('user_id', payload.new.user_id)
              .eq('is_verified', true)
              .eq('is_active', true)
              .maybeSingle();

            if (driverCheck && !hasDriverInJourney) {
              // Found a new verified driver - assign them to the journey
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', payload.new.user_id)
                .single();

              await assignDriverToJourney(payload.new.user_id, { profiles: profile });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'journeys',
            filter: `id=eq.${activeJourney.id}`
          },
          (payload) => {
            // Journey was updated - refresh driver status
            if (payload.new.has_driver !== hasDriverInJourney) {
              checkJourneyDriver();
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

        loadOtherPassengers(),
        loadCurrentUserStop(),
        loadChatMessages(),
        loadParticipantStatus(),
        checkJourneyDriver()
      ]);
      startWaitingTimer();
      subscribeToChat();
      subscribeToDriverChanges();
    } catch (error) {
      console.error('Error loading journey data:', error);
      setConnectionError(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setConnectionError(false);
    
    try {
      await refreshActiveJourney();
      
      if (activeJourney) {
        await loadJourneyData();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      setConnectionError(true);
    } finally {
      setRefreshing(false);
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
        .single();

      if (error) {
        console.error('Error loading current user stop:', error);
        return;
      }

      if (userStop && userStop.stops) {
        setUserStopName(userStop.stops.name);
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
        .select('*, profiles (first_name, last_name), stops (name, order_number)')
        .eq('journey_id', activeJourney.id)
        .neq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      setOtherPassengers(passengers || []);
    } catch (error) {
      console.error('Error loading other passengers:', error);
      throw error;
    }
  };

  const loadChatMessages = async () => {
    if (!activeJourney) return;

    try {
      const { data: messages, error } = await supabase
        .from('journey_messages')
        .select('*, profiles (first_name, last_name, selected_title, avatar_url)')
        .eq('journey_id', activeJourney.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat messages:', error);
        return;
      }

      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
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
              .select('first_name, last_name, selected_title, avatar_url')
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeJourney || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('journey_messages')
        .insert({
          journey_id: activeJourney.id,
          user_id: currentUserId,
          message: newMessage.trim(),
          is_anonymous: true
        });

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

const updateParticipantStatus = async (newStatus: 'waiting' | 'picked_up' | 'arrived') => {
  if (!activeJourney || !currentUserId) return;

  try {
    const { error } = await supabase
      .from('journey_participants')
      .update({ status: newStatus })
      .eq('journey_id', activeJourney.id)
      .eq('user_id', currentUserId)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating participant status:', error);
      Alert.alert('Error', 'Failed to update status');
      return;
    }

    setParticipantStatus(newStatus);
    
    // If user is marked as picked up, find user's current stop
    if (newStatus === 'picked_up') {
      const { data: userWaiting } = await supabase
        .from('stop_waiting')
        .select('stop_id, stops!inner(order_number)')
        .eq('user_id', currentUserId)
        .eq('journey_id', activeJourney.id)
        .single();

      if (userWaiting && userWaiting.stops) {
        const userStopOrder = userWaiting.stops.order_number;
        
        // TODO: If you want to advance journey progress, implement updateJourneyProgress function
        // For now, we'll just award points
        console.log(`User picked up at stop ${userStopOrder}`);
      }

      await awardPoints(2);
    } else if (newStatus === 'arrived') {
      await awardPoints(5);
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

  const handleShareWithDriver = async () => {
    const shareMessage = `Join me on Uthutho for our ${activeJourney?.routes?.transport_type} journey on route ${activeJourney?.routes?.name}!

🚗 Drive with Uthutho and earn 200 points!
• Real-time journey tracking
• Connect with passengers
• Build your driver reputation
• Earn rewards and recognition

Sign up: https://uthutho.app/driver-signup

Current route: ${activeJourney?.routes?.start_point} to ${activeJourney?.routes?.end_point}`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'Join Uthutho as a Driver'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleDriverSignup = () => {
    router.push('/OnboardDriver');
  };

  const handleCompleteJourney = async () => {
    try {
      console.log('Complete Journey pressed');
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

  const getProgressPercentage = () => {
    if (!activeJourney || journeyStops.length === 0) return 0;
    
    const currentStopSequence = activeJourney.current_stop_sequence || 0;
    return (currentStopSequence / journeyStops.length) * 100;
  };

  const getEstimatedArrival = () => {
    if (!activeJourney || journeyStops.length === 0) return 'Unknown';
    
    const currentStopSequence = activeJourney.current_stop_sequence || 0;
    const remainingStops = journeyStops.length - currentStopSequence;
    const estimatedMinutes = remainingStops * 3;
    
    return `${estimatedMinutes} min`;
  };

  const formatWaitingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPassengerWaitingTime = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const elapsed = Math.floor((now - created) / 1000);
    
    return formatWaitingTime(elapsed);
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

      if (error || !currentUserWaiting) return;

      const currentStopSequence = currentUserWaiting.stops.order_number;

      const { data: passengersAhead, error: passengersError } = await supabase
        .from('stop_waiting')
        .select('user_id, stops (order_number, name)')
        .eq('journey_id', activeJourney.id)
        .neq('user_id', currentUserId)
        .gt('stops.order_number', currentStopSequence);

      if (passengersError) {
        console.error('Error finding passengers ahead:', passengersError);
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
          return;
        }

        Alert.alert('Success', 'Passengers ahead have been notified');
      } else {
        Alert.alert('Info', 'No passengers ahead to notify');
      }
    } catch (error) {
      console.error('Error pinging passengers ahead:', error);
      Alert.alert('Error', 'Failed to notify passengers. Please check your connection.');
    }
  };

  const renderContent = () => {
    if (activeTab === 'info') {
      return (
        <>
        <JourneyOverview
          routeName={activeJourney.routes.name}
          transportType={activeJourney.routes.transport_type}
          startPoint={activeJourney.routes.start_point}
          endPoint={activeJourney.routes.end_point}
          progressPercentage={getProgressPercentage()}
          waitingTime={formatWaitingTime(waitingTime)}
          estimatedArrival={getEstimatedArrival()}
          passengerCount={otherPassengers.length + 1}
          currentStop={activeJourney.current_stop_sequence || 0}
          totalStops={journeyStops.length} // This should now have the correct count
          hasDriver={hasDriverInJourney}
          driverName={journeyDriver?.profiles ? 
            `${journeyDriver.profiles.first_name} ${journeyDriver.profiles.last_name}` : 
            null
          }
        />

                    {/* Journey Status Buttons */}
          <View style={styles.statusContainer}>
            {participantStatus === 'waiting' && (
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => updateParticipantStatus('picked_up')}
              >
                <Text style={styles.statusButtonText}>Mark as Picked Up</Text>
              </TouchableOpacity>
            )}
            
            {participantStatus === 'picked_up' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.arrivedButton]}
                onPress={() => updateParticipantStatus('arrived')}
              >
                <Text style={styles.statusButtonText}>I've Arrived</Text>
              </TouchableOpacity>
            )}
            
            {participantStatus === 'arrived' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.completeButton]}
                onPress={handleCompleteJourney}
              >
                <Text style={styles.statusButtonText}>Complete Journey</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Show driver promotion if no driver */}
          {!hasDriverInJourney && (
            <NoDriverPromotion 
              onShare={handleShareWithDriver}
              onDriverSignup={handleDriverSignup}
              routeName={activeJourney.routes.name}
              transportType={activeJourney.routes.transport_type}
            />
          )}


          
          <UserStopHighlight stopName={userStopName} />
          
          <RouteProgress
            stops={journeyStops}
            onPingPassengers={pingPassengersAhead}
          />
          
          <PassengersList
            passengers={otherPassengers}
            getPassengerWaitingTime={getPassengerWaitingTime}
          />
        </>
      );
    } else {
      return (
        <JourneyChat
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          currentUserId={currentUserId}
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <JourneyHeader title="Active Journey" />
      
      <JourneyTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadMessages={unreadMessages}
      />
      
      {activeTab === 'chat' ? (
        <View style={{ flex: 1 }}>
          <JourneyChat
            messages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={sendMessage}
            currentUserId={currentUserId}
            onlineCount={(otherPassengers?.length || 0) + 1}
          />
        </View>
      ) : (
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
          {connectionError && <ConnectionError />}
          {renderContent()}
          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  bottomSpace: {
    height: 20,
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  arrivedButton: {
    backgroundColor: '#fbbf24',
  },
  completeButton: {
    backgroundColor: '#4ade80',
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // No Driver Promotion Styles
  noDriverContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noDriverHeader: {
    marginBottom: 16,
  },
  noDriverTitle: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noDriverSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  pointsHighlight: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350f',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  pointsText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  noDriverBenefits: {
    marginBottom: 20,
  },
  noDriverBenefit: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 4,
  },
  shareButton: {
    backgroundColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  driverSignupButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  driverSignupButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
});