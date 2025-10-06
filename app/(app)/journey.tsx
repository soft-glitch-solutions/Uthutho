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
  StyleSheet
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  useEffect(() => {
    getCurrentUser();
    
    if (activeJourney) {
      loadJourneyData();
    }
  }, [activeJourney]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

  const loadJourneyData = async () => {
    setConnectionError(false);
    try {
      await Promise.all([
        loadJourneyStops(),
        loadOtherPassengers(),
        loadCurrentUserStop(),
        loadChatMessages()
      ]);
      startWaitingTimer();
      subscribeToChat();
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

  const startWaitingTimer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: waitingData, error } = await supabase
        .from('stop_waiting')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('journey_id', activeJourney?.id)
        .single();

      if (error) {
        console.error('Error getting waiting data:', error);
        return;
      }

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

  const loadJourneyStops = async () => {
    if (!activeJourney) return;

    try {
      const currentStopSequence = activeJourney.current_stop_sequence || 0;
      
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
        passed: stop.order_number < currentStopSequence,
        current: stop.order_number === currentStopSequence,
        upcoming: stop.order_number > currentStopSequence,
      }));

      setJourneyStops(processedStops);
    } catch (error) {
      console.error('Error loading journey stops:', error);
      throw error;
    }
  };

  const loadOtherPassengers = async () => {
    if (!activeJourney) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passengers, error } = await supabase
        .from('stop_waiting')
        .select('*, profiles (first_name, last_name), stops (name, order_number)')
        .eq('journey_id', activeJourney.id)
        .neq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error loading other passengers:', error);
        return;
      }

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
      .select('*, profiles (first_name, last_name, selected_title, avatar_url)') // Add selected_title and avatar_url
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
            .select('first_name, last_name, selected_title, avatar_url') // Add selected_title and avatar_url
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
      .from('journey_messages')  // Change from journey_chat to journey_messages
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
          totalStops={journeyStops.length}
        />

        <CompleteJourneyButton onPress={handleCompleteJourney} />
        
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
  chatContainer: {
    flex: 1,
  },
  onlineBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  onlineText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 80,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  sendButton: {
    padding: 10,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyChatSubtitle: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },
});