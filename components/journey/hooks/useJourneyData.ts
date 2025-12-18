// components/journey/hooks/useJourneyData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyStop, Passenger, ChatMessage } from '@/types/journey';
import { useJourney } from '@/hook/useJourney';

export function useJourneyData() {
  const { activeJourney, refreshActiveJourney } = useJourney();
  
  const [journeyStops, setJourneyStops] = useState<JourneyStop[]>([]);
  const [otherPassengers, setOtherPassengers] = useState<Passenger[]>([]);
  const [waitingTime, setWaitingTime] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userStopName, setUserStopName] = useState<string>('');
  const [participantStatus, setParticipantStatus] = useState<'waiting' | 'picked_up' | 'arrived'>('waiting');
  const [isDriver, setIsDriver] = useState(false);
  const [hasDriverInJourney, setHasDriverInJourney] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [connectionError, setConnectionError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const checkStoredJourney = async () => {
      try {
        const stored = await AsyncStorage.getItem('active_journey_id');
        if (stored) {
          setDebugInfo(`Found stored journey: ${stored}`);
        }
      } catch (error) {
        console.error('Error checking stored journey:', error);
      }
    };
    
    checkStoredJourney();
  }, []);

  useEffect(() => {
    if (activeJourney) {
      getCurrentUser();
      checkIfDriver();
      loadJourneyData();
      subscribeToDriverChanges();
      subscribeToOnlineCount();
    } else {
      setJourneyStops([]);
    }
  }, [activeJourney]);

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
      // subscribeToChat handled separately
    } catch (error) {
      console.error('Error loading journey data:', error);
      setConnectionError(true);
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

  return {
    // State
    journeyStops,
    otherPassengers,
    waitingTime,
    currentUserId,
    chatMessages,
    setChatMessages,
    userStopName,
    participantStatus,
    setParticipantStatus,
    isDriver,
    hasDriverInJourney,
    userProfile,
    onlineCount,
    connectionError,
    debugInfo,
    
    // Journey context
    activeJourney,
    refreshActiveJourney,
    
    // Load functions
    loadJourneyData,
    loadOtherPassengers,
    loadJourneyStops,
    loadChatMessages,
  };
}