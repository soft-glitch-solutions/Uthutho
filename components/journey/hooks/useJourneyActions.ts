// components/journey/hooks/useJourneyActions.ts
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useJourney } from '@/hook/useJourney';
import Constants from 'expo-constants';

export function useJourneyActions(
  currentUserId: string,
  participantStatus: string,
  setParticipantStatus: (status: 'waiting' | 'picked_up' | 'arrived') => void,
  locationPermission: boolean,
  setLocationPermission: (permission: boolean) => void,
  activeJourney: any,
  refreshActiveJourney?: () => Promise<void>,
  loadOtherPassengers?: () => Promise<void>,
  loadJourneyStops?: () => Promise<void>,
  setUserStopName?: (name: string) => void
) {
  const router = useRouter();
  const { completeJourney } = useJourney();

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
            await refreshActiveJourney?.();
          }
        }
        
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id);
        
        setUserStopName?.('');
        
        await Promise.all([
          loadOtherPassengers?.(),
          loadJourneyStops?.()
        ]);
        
      } else if (newStatus === 'arrived') {
        await awardPoints(5);
        
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('user_id', currentUserId)
          .eq('journey_id', activeJourney.id);
          
        // Store journey data before completing
        const currentJourneyData = {
          id: activeJourney?.id,
          routeName: activeJourney?.routes?.name,
          transportType: activeJourney?.routes?.transport_type,
          startPoint: activeJourney?.routes?.start_point,
          endPoint: activeJourney?.routes?.end_point,
          stops: activeJourney?.stops || [],
          driverName: activeJourney?.driver_journeys?.[0]?.drivers?.profiles 
            ? `${activeJourney.driver_journeys[0].drivers.profiles.first_name} ${activeJourney.driver_journeys[0].drivers.profiles.last_name}`
            : null,
          createdAt: activeJourney?.created_at,
          currentStopSequence: activeJourney?.current_stop_sequence || 0
        };
        
        // Now complete the journey
        const result = await completeJourney();
        console.log('Complete Journey result:', result);

        if (result.success) {
          // Use router.replace instead of router.push to prevent going back
          router.replace({
            pathname: '/journey-complete', // Fixed: changed from '/journeyComplete'
            params: {
              duration: String(result.rideDuration ?? 0),
              trips: result.newTrips?.toString(),
              routeName: currentJourneyData.routeName ?? '',
              transportMode: currentJourneyData.transportType ?? '',
              journeyId: result.journeyId ?? currentJourneyData.id,
              startPoint: currentJourneyData.startPoint ?? '',
              endPoint: currentJourneyData.endPoint ?? '',
              stopsCount: String(currentJourneyData.stops.length),
              driverName: currentJourneyData.driverName ?? '',
              startedAt: currentJourneyData.createdAt ?? '',
              currentStop: String(currentJourneyData.currentStopSequence),
              ratingJourneyId: result.journeyId ?? currentJourneyData.id
            },
          });
        } else {
          Alert.alert('Error', result.error || 'Could not complete journey');
        }
      }
    } catch (error) {
      console.error('Error updating participant status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCompleteJourney = async () => {
    if (!activeJourney) {
      Alert.alert('Error', 'No active journey found');
      return;
    }

    try {
      console.log('🚀 Starting handleCompleteJourney...');
      console.log('Active Journey:', {
        id: activeJourney.id,
        routeName: activeJourney.routes?.name,
        hasDriver: !!activeJourney.driver_journeys?.[0]
      });
      
      // Store journey data before completing
      const currentJourneyData = {
        id: activeJourney.id,
        routeName: activeJourney.routes?.name || 'Unknown Route',
        transportType: activeJourney.routes?.transport_type || 'Unknown',
        startPoint: activeJourney.routes?.start_point || 'Unknown',
        endPoint: activeJourney.routes?.end_point || 'Unknown',
        stops: activeJourney.stops || [],
        driverName: activeJourney.driver_journeys?.[0]?.drivers?.profiles 
          ? `${activeJourney.driver_journeys[0].drivers.profiles.first_name} ${activeJourney.driver_journeys[0].drivers.profiles.last_name}`
          : null,
        createdAt: activeJourney.created_at || new Date().toISOString(),
        currentStopSequence: activeJourney.current_stop_sequence || 0
      };
      
      console.log('📦 Journey data prepared:', currentJourneyData);
      
      // Call the completeJourney function from useJourney hook
      console.log('📞 Calling completeJourney()...');
      const result = await completeJourney();
      console.log('✅ Complete Journey result:', result);

      if (result.success) {
        console.log('🎉 Journey completed successfully!');
        console.log('📊 Duration:', result.rideDuration, 'seconds');
        console.log('📍 Navigation params:', {
          duration: String(result.rideDuration ?? 0),
          routeName: currentJourneyData.routeName,
          transportMode: currentJourneyData.transportType,
          journeyId: result.journeyId ?? currentJourneyData.id,
          startPoint: currentJourneyData.startPoint,
          endPoint: currentJourneyData.endPoint,
          stopsCount: String(currentJourneyData.stops.length),
          driverName: currentJourneyData.driverName || '',
          startedAt: currentJourneyData.createdAt,
          ratingJourneyId: result.journeyId ?? currentJourneyData.id
        });

        // Navigate to journey complete screen
        router.replace({
          pathname: '/journey-complete', // Fixed: changed from '/journeyComplete'
          params: {
            duration: String(result.rideDuration ?? 0),
            trips: result.newTrips?.toString(),
            routeName: currentJourneyData.routeName,
            transportMode: currentJourneyData.transportType,
            journeyId: result.journeyId ?? currentJourneyData.id,
            startPoint: currentJourneyData.startPoint,
            endPoint: currentJourneyData.endPoint,
            stopsCount: String(currentJourneyData.stops.length),
            driverName: currentJourneyData.driverName || '',
            startedAt: currentJourneyData.createdAt,
            currentStop: String(currentJourneyData.currentStopSequence),
            ratingJourneyId: result.journeyId ?? currentJourneyData.id
          },
        });
      } else {
        console.error('❌ Journey completion failed:', result.error);
        Alert.alert('Error', result.error || 'Could not complete journey');
      }
    } catch (err: any) {
      console.error('💥 Unexpected error completing journey:', err);
      Alert.alert('Error', 'Something went wrong while completing the journey.');
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

  const shareJourney = async () => {
    if (!activeJourney) return;

    try {
      // Get the base URL based on environment
      const getBaseUrl = () => {
        if (__DEV__) {
          // For development, try to get the local IP
          const debuggerHost = Constants.expoConfig?.hostUri;
          if (debuggerHost) {
            const host = debuggerHost.split(':')[0];
            return `http://${host}:8081`;
          }
          return 'http://localhost:8081';
        }
        // For production, use your actual domain
        return 'https://mobile.uthutho.co.za';
      };
      
      const baseUrl = getBaseUrl();
      const shareUrl = `${baseUrl}/journey-share/${activeJourney.id}`;
      
      const shareMessage = `📍 My Current Location - Uthutho

I'm currently on the ${activeJourney.routes?.name ? activeJourney.routes.name : 'journey'}.

View my real-time location and journey details:
${shareUrl}

Shared via Uthutho`;

      await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: 'Share My Journey'
      });

    } catch (error) {
      console.error('Error sharing journey:', error);
      Alert.alert('Error', 'Failed to share journey.');
    }
  };

  // Add a debug function to test journey completion
  const debugCompleteJourney = async () => {
    console.log('🔧 DEBUG: Testing journey completion...');
    
    if (!activeJourney) {
      console.log('❌ No active journey');
      return;
    }
    
    try {
      // Test with a fixed duration
      const testDuration = 900; // 15 minutes
      const testJourneyId = activeJourney.id || 'test-journey-123';
      
      console.log('🧪 Test data:', {
        duration: testDuration,
        journeyId: testJourneyId,
        routeName: activeJourney.routes?.name
      });
      
      router.replace({
        pathname: '/journey-complete',
        params: {
          duration: testDuration.toString(),
          routeName: activeJourney.routes?.name || 'Test Route',
          transportMode: activeJourney.routes?.transport_type || 'Bus',
          journeyId: testJourneyId,
          startPoint: activeJourney.routes?.start_point || 'Start Point',
          endPoint: activeJourney.routes?.end_point || 'End Point',
          stopsCount: String(activeJourney.stops?.length || 5),
          driverName: activeJourney.driver_journeys?.[0]?.drivers?.profiles 
            ? `${activeJourney.driver_journeys[0].drivers.profiles.first_name} ${activeJourney.driver_journeys[0].drivers.profiles.last_name}`
            : 'Test Driver',
          startedAt: activeJourney.created_at || new Date().toISOString(),
          ratingJourneyId: testJourneyId
        }
      });
    } catch (error) {
      console.error('💥 Debug error:', error);
    }
  };

  return {
    updateParticipantStatus,
    pingPassengersAhead,
    handleCompleteJourney,
    shareJourney,
    requestLocationPermission,
    debugCompleteJourney // Added for testing
  };
}