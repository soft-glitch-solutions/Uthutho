import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Journey {
  id: string;
  route_id: string;
  current_stop_sequence: number;
  status: string;
  last_ping_time: string;
  created_at: string;
  driver_id?: string;
  has_driver?: boolean;
  routes: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
  stops: Array<{
    id: string;
    name: string;
    order_number: number;
    latitude?: number;
    longitude?: number;
  }>;
  driver_journeys?: {
    driver_id: string;
    status: string;
    drivers: {
      user_id: string;
      profiles: {
        first_name: string;
        last_name: string;
      };
    };
  }[];
}

export function useJourney() {
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Helper function to properly complete a journey
  const completeJourneyProperly = async (journeyId: string, routeId?: string) => {
    try {
      // If routeId is not provided, fetch it
      let targetRouteId = routeId;
      if (!targetRouteId) {
        const { data: journeyData, error: fetchError } = await supabase
          .from('journeys')
          .select('route_id, current_stop_sequence')
          .eq('id', journeyId)
          .single();

        if (fetchError) {
          console.error('Error fetching journey:', fetchError);
          return false;
        }
        targetRouteId = journeyData.route_id;
      }

      // Get total number of stops for this route
      const { data: routeStops, error: stopsError } = await supabase
        .from('route_stops')
        .select('stops(id)')
        .eq('route_id', targetRouteId);

      if (stopsError) {
        console.error('Error fetching route stops:', stopsError);
      }

      const totalStops = routeStops?.length || 0;
      const finalStopSequence = totalStops > 0 ? totalStops - 1 : 0;

      const { error: updateError } = await supabase
        .from('journeys')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_stop_sequence: finalStopSequence
        })
        .eq('id', journeyId);

      if (updateError) {
        console.error('Error completing journey:', updateError);
        return false;
      }

      console.log(`✅ Journey ${journeyId} completed at stop ${finalStopSequence} of ${totalStops}`);
      return true;
    } catch (error) {
      console.error('Error in completeJourneyProperly:', error);
      return false;
    }
  };

  const checkAndUpdateJourneyCompletion = async (journeyId: string) => {
    try {
      const { data: activeParticipants, error: participantsError } = await supabase
        .from('journey_participants')
        .select('id, status, is_active')
        .eq('journey_id', journeyId)
        .eq('is_active', true)
        .neq('status', 'arrived');

      if (participantsError) {
        console.error('Error checking active participants:', participantsError);
        return;
      }

      // If no active participants, mark journey as completed
      if (!activeParticipants || activeParticipants.length === 0) {
        await completeJourneyProperly(journeyId);
      }
    } catch (error) {
      console.error('Error in checkAndUpdateJourneyCompletion:', error);
    }
  };

  // Function to save completed journey to history
  const saveJourneyToHistory = async (
    userId: string,
    journey: any,
    rideDuration: number
  ) => {
    console.log('📝 Starting saveJourneyToHistory', { userId, journeyId: journey?.id, rideDuration });
    
    try {
      // First, check if we have journey data with routes
      if (!journey || !journey.id) {
        console.error('❌ Invalid journey object:', journey);
        return false;
      }

      // Use the journey data we already have from activeJourney
      // journey already contains routes info from your useJourney hook
      const routeName = journey.routes?.name || 'Unknown Route';
      const transportType = journey.routes?.transport_type || 'Unknown';
      const startPoint = journey.routes?.start_point;
      const endPoint = journey.routes?.end_point;

      console.log('✅ Using existing journey data:', {
        routeName,
        transportType,
        startPoint,
        endPoint
      });

      // Fetch journey participants separately to avoid nested query issues
      const { data: participants, error: participantsError } = await supabase
        .from('journey_participants')
        .select('user_id, status, is_driver')
        .eq('journey_id', journey.id)
        .eq('is_active', true);

      if (participantsError) {
        console.warn('⚠️ Could not fetch participants:', participantsError);
      }

      const participant = participants?.find(p => p.user_id === userId);
      const isDriver = participant?.is_driver || false;
      const passengerCount = participants?.length || 1;

      // Calculate metrics
      const pointsEarned = isDriver ? 10 : 5; // Drivers get more points
      const co2Saved = rideDuration > 0 ? (rideDuration / 60) * 2.5 : 0; // 2.5kg CO2 per hour saved

      console.log('📊 Saving with data:', {
        pointsEarned,
        co2Saved,
        passengerCount,
        isDriver
      });

      // Save to completed_journeys
      const { error: saveError } = await supabase
        .from('completed_journeys')
        .insert({
          user_id: userId,
          journey_id: journey.id,
          route_name: routeName,
          transport_type: transportType,
          start_point: startPoint,
          end_point: endPoint,
          started_at: journey.created_at,
          completed_at: new Date().toISOString(),
          duration_seconds: rideDuration,
          points_earned: pointsEarned,
          co2_saved_kg: parseFloat(co2Saved.toFixed(2)),
          passenger_count: passengerCount,
          was_driving: isDriver,
        });

      if (saveError) {
        console.error('❌ Error saving journey to history:', saveError);
        console.error('Full error details:', JSON.stringify(saveError, null, 2));
        return false;
      }

      console.log('✅ Journey saved to completed_journeys table');

      // Update user's total trips count in profiles
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_trips')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ 
              total_trips: (profile.total_trips || 0) + 1 
            })
            .eq('id', userId);
          console.log('✅ Updated user total_trips');
        }
      } catch (profileError) {
        console.warn('⚠️ Could not update user total_trips:', profileError);
        // Don't fail the whole operation if this fails
      }

      return true;
    } catch (error) {
      console.error('❌ Unexpected error in saveJourneyToHistory:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadActiveJourney();
      cleanupStaleJourneyParticipants();
      
      const subscription = supabase
        .channel('user_journey')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stop_waiting',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadActiveJourney();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Driver assignment function using driver_journeys table
  const checkAndAssignJourneyDriver = async (journeyId: string) => {
    try {
      const { data: existingDriverJourney, error: existingError } = await supabase
        .from('driver_journeys')
        .select(`
          driver_id,
          status,
          drivers (
            user_id,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('journey_id', journeyId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing driver journey:', existingError);
        return;
      }

      if (existingDriverJourney) {
        await updateJourneyWithDriver(journeyId, existingDriverJourney.driver_id);
        return;
      }

      const { data: participants, error } = await supabase
        .from('journey_participants')
        .select(`
          user_id,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('journey_id', journeyId)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking journey participants:', error);
        return;
      }

      if (!participants || participants.length === 0) {
        return;
      }

      const participantUserIds = participants.map(p => p.user_id);

      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          profiles (
            first_name,
            last_name
          )
        `)
        .in('user_id', participantUserIds)
        .eq('is_verified', true)
        .eq('is_active', true)
        .limit(1);

      if (driversError) {
        console.error('Error checking drivers:', driversError);
        return;
      }

      if (drivers && drivers.length > 0) {
        const driver = drivers[0];
        await createDriverJourney(journeyId, driver);
      }
    } catch (error) {
      console.error('Error in checkAndAssignJourneyDriver:', error);
    }
  };

  const createDriverJourney = async (journeyId: string, driverParticipant: any) => {
    try {
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('route_id')
        .eq('id', journeyId)
        .single();

      if (journeyError) {
        console.error('Error getting journey details:', journeyError);
        return;
      }

      const { data: firstStop, error: stopError } = await supabase
        .from('stops')
        .select('id')
        .eq('route_id', journey.route_id)
        .order('order_number', { ascending: true })
        .limit(1)
        .single();

      if (stopError) {
        console.error('Error getting first stop:', stopError);
      }

      const { error: createError } = await supabase
        .from('driver_journeys')
        .insert({
          driver_id: driverParticipant.drivers.id,
          journey_id: journeyId,
          route_id: journey.route_id,
          current_stop_id: firstStop?.id || null,
          status: 'active'
        });

      if (createError) {
        console.error('Error creating driver journey:', createError);
        return;
      }

      await updateJourneyWithDriver(journeyId, driverParticipant.drivers.id);
      await notifyPassengersDriverJoined(journeyId, driverParticipant.profiles);

      console.log('Driver journey created for:', driverParticipant.user_id);
    } catch (error) {
      console.error('Error in createDriverJourney:', error);
    }
  };

  const updateJourneyWithDriver = async (journeyId: string, driverId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('journeys')
        .update({
          driver_id: driverId,
          has_driver: true
        })
        .eq('id', journeyId);

      if (updateError) {
        console.error('Error updating journey with driver:', updateError);
      }
    } catch (error) {
      console.error('Error in updateJourneyWithDriver:', error);
    }
  };

  const notifyPassengersDriverJoined = async (journeyId: string, driverProfile: any) => {
    try {
      const { data: passengers, error } = await supabase
        .from('journey_participants')
        .select('user_id')
        .eq('journey_id', journeyId)
        .eq('is_active', true)
        .neq('user_id', user?.id);

      if (error || !passengers) return;

      const driverName = `${driverProfile.first_name} ${driverProfile.last_name}`;
      const notifications = passengers.map(passenger => ({
        user_id: passenger.user_id,
        type: 'driver_joined',
        title: 'Driver Joined! 🎉',
        message: `${driverName} has joined as your driver`,
        data: { 
          journey_id: journeyId,
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

const cleanupStaleJourneyParticipants = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clean up journeys older than 1 day
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Using a different approach - get all active participants first
    const { data: activeParticipants, error: fetchError } = await supabase
      .from('journey_participants')
      .select('id, journey:journeys(id, status, last_ping_time)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(10);

    if (fetchError) {
      console.error('Error fetching active participants:', fetchError);
      return;
    }

    if (!activeParticipants) return;

    // Filter locally in JavaScript
    const staleParticipants = activeParticipants.filter(participant => {
      const journey = participant.journey;
      if (!journey) return false;
      
      // Check if journey is stale
      const isStale = 
        journey.status !== 'in_progress' || 
        (journey.last_ping_time && new Date(journey.last_ping_time) < new Date(cutoffDate));
      
      return isStale;
    });

    if (staleParticipants.length > 0) {
      const participantIds = staleParticipants.map(p => p.id);
      
      const { error: updateError } = await supabase
        .from('journey_participants')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString(),
          status: 'arrived'
        })
        .in('id', participantIds);

      if (updateError) {
        console.error('Error cleaning up stale participants:', updateError);
      } else {
        console.log(`Cleaned up ${staleParticipants.length} stale journey participants`);
      }
    }
  } catch (error) {
    console.error('Error in cleanupStaleJourneyParticipants:', error);
  }
};
  const loadActiveJourney = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First check if user is in an active journey via journey_participants
      const { data: participantData, error: participantError } = await supabase
        .from('journey_participants')
        .select(`
          *,
          journey:journeys (
            *,
            routes (
              name,
              transport_type,
              start_point,
              end_point
            ),
            driver_journeys (
              driver_id,
              status,
              drivers (
                user_id,
                profiles (
                  first_name,
                  last_name
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('journey.status', 'in_progress')
        .maybeSingle();

      if (participantError && participantError.code !== 'PGRST116') {
        console.error('Error loading active journey participant:', participantError);
      }

      if (participantData?.journey) {
        // User is in an active journey (could be waiting, picked_up, or arrived but still active)
        const { data: routeStops, error: stopsError } = await supabase
          .from('route_stops')
          .select(`
            stops (*),
            order_number
          `)
          .eq('route_id', participantData.journey.route_id)
          .order('order_number', { ascending: true });

        if (stopsError) {
          console.error('Error loading route stops:', stopsError);
        }

        const processedStops = (routeStops || []).map(routeStop => ({
          ...routeStop.stops,
          order_number: routeStop.order_number
        }));

        const journeyWithStops = {
          ...participantData.journey,
          stops: processedStops,
        };

        setActiveJourney(journeyWithStops);
        await checkAndAssignJourneyDriver(participantData.journey.id);
        setLoading(false);
        return;
      }

      // Fallback: check stop_waiting (for backwards compatibility)
      const { data: waitingData, error: waitingError } = await supabase
        .from('stop_waiting')
        .select(`
          *,
          journeys (
            *,
            routes (
              name,
              transport_type,
              start_point,
              end_point
            ),
            driver_journeys (
              driver_id,
              status,
              drivers (
                user_id,
                profiles (
                  first_name,
                  last_name
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .not('journey_id', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (waitingError && waitingError.code !== 'PGRST116') {
        console.error('Error loading active journey:', waitingError);
        setActiveJourney(null);
        setLoading(false);
        return;
      }

      if (waitingData?.journeys) {
        const { data: routeStops, error: stopsError } = await supabase
          .from('route_stops')
          .select(`
            stops (*),
            order_number
          `)
          .eq('route_id', waitingData.journeys.route_id)
          .order('order_number', { ascending: true });

        if (stopsError) {
          console.error('Error loading route stops:', stopsError);
        }

        const processedStops = (routeStops || []).map(routeStop => ({
          ...routeStop.stops,
          order_number: routeStop.order_number
        }));

        const journeyWithStops = {
          ...waitingData.journeys,
          stops: processedStops,
        };

        setActiveJourney(journeyWithStops);
        await checkAndAssignJourneyDriver(waitingData.journeys.id);
      } else {
        setActiveJourney(null);
      }
    } catch (error) {
      console.error('Error loading active journey:', error);
      setActiveJourney(null);
    }
    
    setLoading(false);
  };

  const createOrJoinJourney = async (stopId: string, routeId: string, transportType: string, specificJourneyId?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      await cleanupStaleJourneyParticipants();

      const { data: existingWaiting, error: waitingError } = await supabase
        .from('stop_waiting')
        .select('journey_id')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (waitingError && waitingError.code !== 'PGRST116') {
        throw waitingError;
      }

      if (existingWaiting) {
        return { success: true, journeyId: existingWaiting.journey_id };
      }

      let journeyId;

      // NEW: If specific journey ID is provided, join that journey
      if (specificJourneyId) {
        journeyId = specificJourneyId;
        
        // Add user to the specific journey participants
        const { error: participantError } = await supabase
          .from('journey_participants')
          .upsert({
            journey_id: journeyId,
            user_id: user.id,
            is_active: true,
            status: 'waiting'
          }, {
            onConflict: 'journey_id,user_id'
          });

        if (participantError) {
          console.error('Error adding participant:', participantError);
        }
      } else {
        // Check for existing journeys for this route (original logic)
        const { data: existingJourneys, error: fetchError } = await supabase
          .from('journeys')
          .select('*')
          .eq('route_id', routeId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // If there are existing journeys, join the first one
        if (existingJourneys && existingJourneys.length > 0) {
          journeyId = existingJourneys[0].id;
          
          const { error: participantError } = await supabase
            .from('journey_participants')
            .upsert({
              journey_id: journeyId,
              user_id: user.id,
              is_active: true,
              status: 'waiting'
            }, {
              onConflict: 'journey_id,user_id'
            });

          if (participantError) {
            console.error('Error adding participant:', participantError);
          }
        } else {
          // Create new journey
          const { data: newJourney, error: insertError } = await supabase
            .from('journeys')
            .insert({
              route_id: routeId,
              current_stop_sequence: 0,
              status: 'in_progress'
            })
            .select()
            .single();

          if (insertError) throw insertError;
          journeyId = newJourney.id;

          const { error: participantError } = await supabase
            .from('journey_participants')
            .insert({
              journey_id: journeyId,
              user_id: user.id,
              is_active: true,
              status: 'waiting'
            });

          if (participantError) {
            console.error('Error adding participant:', participantError);
          }
        }
      }

      // Create stop_waiting entry
      const { error: waitingUpsertError } = await supabase
        .from('stop_waiting')
        .upsert({
          user_id: user.id,
          journey_id: journeyId,
          stop_id: stopId,
          route_id: routeId,
          transport_type: transportType,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }, {
          onConflict: 'user_id,stop_id'
        });

      if (waitingUpsertError) throw waitingUpsertError;

      await checkAndAssignJourneyDriver(journeyId);
      await loadActiveJourney();

      return { success: true, journeyId };
    } catch (error: any) {
      console.error('Error in createOrJoinJourney:', error);
      return { success: false, error: error.message };
    }
  };

  const updateDriverCurrentStop = async (driverId: string, journeyId: string, stopId: string) => {
    try {
      const { data: currentStop } = await supabase
        .from('stops')
        .select('order_number')
        .eq('id', stopId)
        .single();

      if (!currentStop) return;

      const { data: nextStop } = await supabase
        .from('stops')
        .select('id')
        .eq('route_id', activeJourney?.route_id)
        .eq('order_number', currentStop.order_number + 1)
        .single();

      const { error } = await supabase
        .from('driver_journeys')
        .update({
          current_stop_id: stopId,
          next_stop_id: nextStop?.id || null
        })
        .eq('driver_id', driverId)
        .eq('journey_id', journeyId)
        .eq('status', 'active');

      if (error) {
        console.error('Error updating driver current stop:', error);
      }
    } catch (error) {
      console.error('Error in updateDriverCurrentStop:', error);
    }
  };

  const completeDriverJourney = async (driverId: string, journeyId: string) => {
    try {
      const { error } = await supabase
        .from('driver_journeys')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .eq('journey_id', journeyId);

      if (error) {
        console.error('Error completing driver journey:', error);
      }
    } catch (error) {
      console.error('Error in completeDriverJourney:', error);
    }
  };

const completeJourney = async () => {
  console.log('🚀 Starting completeJourney', { 
    activeJourneyId: activeJourney?.id, 
    userId: user?.id,
    journeyCreatedAt: activeJourney?.created_at
  });

  if (!activeJourney?.id || !user?.id) {
    console.log('❌ Missing activeJourney or user');
    return { success: false, error: 'Missing activeJourney or user' };
  }

  try {
    // 🔥 FIXED: Calculate rideDuration from user's participation time
    let rideDuration = 0;
    try {
      console.log('📊 Calculating ride duration...');
      
      // FIRST: Try to get when user started this journey from journey_participants
      console.log('🔍 Checking journey_participants table...');
      const { data: participantData, error: participantError } = await supabase
        .from('journey_participants')
        .select('created_at, joined_at, status')
        .eq('user_id', user.id)
        .eq('journey_id', activeJourney.id)
        .maybeSingle();

      console.log('📋 Participant query result:', {
        hasData: !!participantData,
        error: participantError?.message,
        participantData
      });

      if (!participantError && (participantData?.created_at || participantData?.joined_at)) {
        // Use joined_at if available, otherwise created_at
        const startTime = participantData.joined_at || participantData.created_at;
        console.log('⏰ Found participant start time:', startTime);
        
        const started = new Date(startTime).getTime();
        const now = Date.now();
        rideDuration = Math.max(0, Math.floor((now - started) / 1000));
        console.log('✅ Calculated from journey_participants:', rideDuration, 'seconds');
        
        // If duration seems too short (less than 60 seconds), use journey creation time
        if (rideDuration < 60) {
          console.log('⚠️ Duration too short (<60s), checking journey creation time...');
          if (activeJourney.created_at) {
            const journeyStarted = new Date(activeJourney.created_at).getTime();
            rideDuration = Math.max(0, Math.floor((now - journeyStarted) / 1000));
            console.log('✅ Recalculated from journey creation:', rideDuration, 'seconds');
          }
        }
      } 
      // SECOND: Fallback to journey creation time
      else if (activeJourney.created_at) {
        console.log('🔍 Using journey creation time as fallback...');
        const started = new Date(activeJourney.created_at).getTime();
        const now = Date.now();
        rideDuration = Math.max(0, Math.floor((now - started) / 1000));
        console.log('✅ Calculated from journey creation:', rideDuration, 'seconds');
      } 
      // THIRD: Try stop_waiting as last resort
      else {
        console.log('🔍 Checking stop_waiting table as last resort...');
        const { data: waitingRow, error: waitingError } = await supabase
          .from('stop_waiting')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('journey_id', activeJourney.id)
          .maybeSingle();

        console.log('📋 stop_waiting query result:', {
          hasData: !!waitingRow,
          error: waitingError?.message
        });

        if (!waitingError && waitingRow?.created_at) {
          const started = new Date(waitingRow.created_at).getTime();
          const now = Date.now();
          rideDuration = Math.max(0, Math.floor((now - started) / 1000));
          console.log('✅ Calculated from stop_waiting:', rideDuration, 'seconds');
        } else {
          // FOURTH: Reasonable minimum fallback (10 minutes)
          rideDuration = 600; // 10 minutes default
          console.log('⚠️ Using reasonable default duration:', rideDuration, 'seconds');
        }
      }
    } catch (durationError) {
      console.error('❌ Duration calculation error:', durationError);
      // Use a reasonable minimum duration
      rideDuration = 600; // 10 minutes default
      console.log('⚠️ Using fallback duration due to error:', rideDuration, 'seconds');
    }

    console.log('🎯 Final rideDuration to use:', rideDuration, 'seconds');

    // 🔥 Check if user is a driver
    const { data: driverData } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_verified', true)
      .eq('is_active', true)
      .maybeSingle();

    console.log('👨‍✈️ Driver check:', { isDriver: !!driverData, driverId: driverData?.id });

    if (driverData && activeJourney.driver_id === driverData.id) {
      console.log('✅ Driver completing their driver journey...');
      await completeDriverJourney(driverData.id, activeJourney.id);
    }

    // 🔥 Save journey to history FIRST
    console.log('📝 Saving journey to history...');
    const savedToHistory = await saveJourneyToHistory(user.id, activeJourney, rideDuration);
    console.log('✅ Journey saved to history:', savedToHistory);

    // Remove user from stop_waiting
    console.log('🗑️ Removing from stop_waiting...');
    const { error: deleteError } = await supabase
      .from('stop_waiting')
      .delete()
      .eq('user_id', user.id)
      .eq('journey_id', activeJourney.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete from stop_waiting:', deleteError.message);
    } else {
      console.log('✅ Removed from stop_waiting');
    }

    // Deactivate user in journey_participants
    console.log('👥 Deactivating in journey_participants...');
    const { error: deactivateError } = await supabase
      .from('journey_participants')
      .update({ 
        is_active: false,
        left_at: new Date().toISOString(),
        status: 'arrived'
      })
      .eq('journey_id', activeJourney.id)
      .eq('user_id', user.id);

    if (deactivateError) {
      console.error('❌ Error deactivating journey participant:', deactivateError.message);
    } else {
      console.log('✅ Deactivated from journey participants');
    }

    // Update user points and trips
    let newTrips: number | null = null;
    try {
      console.log('🏆 Updating user points and trips...');
      
      // Try RPC function first
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('increment_trip', { user_id: user.id, ride_time: rideDuration });

      if (rpcErr) {
        console.warn('⚠️ RPC increment_trip failed, falling back:', rpcErr.message);
        throw rpcErr;
      }

      console.log('📊 RPC result:', rpcData);

      if (Array.isArray(rpcData) && rpcData.length > 0) {
        newTrips = rpcData[0].new_trips ?? rpcData[0].cur_trips ?? null;
      } else if (rpcData && typeof rpcData === 'object') {
        newTrips = (rpcData as any).new_trips ?? null;
      }

      // Add points (10 points per journey)
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ points: supabase.raw('points + 10') })
        .eq('id', user.id);

      if (pointsError) {
        console.error('❌ Error adding points:', pointsError.message);
      } else {
        console.log('✅ Added 10 points to user');
      }
    } catch (rpcFallbackErr) {
      console.warn('⚠️ RPC increment_trip failed, falling back to manual update...');

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('trips, total_ride_time, points')
        .eq('id', user.id)
        .single();
      
      if (profileErr) {
        console.error('❌ Error fetching profile:', profileErr.message);
      } else {
        const nextTrips = (profile?.trips ?? 0) + 1;
        const nextTotal = (profile?.total_ride_time ?? 0) + rideDuration;
        const nextPoints = (profile?.points ?? 0) + 10;

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ 
            trips: nextTrips, 
            total_ride_time: nextTotal, 
            points: nextPoints 
          })
          .eq('id', user.id);
        
        if (updateErr) {
          console.error('❌ Error updating profile:', updateErr.message);
        } else {
          newTrips = nextTrips;
          console.log('✅ Updated trips, total_ride_time, and points manually');
        }
      }
    }

    // Check if ANY users are still active in this journey
    console.log('🔍 Checking for other active participants...');
    const { data: activeParticipants, error: participantsError } = await supabase
      .from('journey_participants')
      .select('id, user_id')
      .eq('journey_id', activeJourney.id)
      .eq('is_active', true);

    if (participantsError) {
      console.error('❌ Error checking active participants:', participantsError.message);
    } else {
      console.log(`👥 Active participants remaining: ${activeParticipants?.length || 0}`);
    }

    // Also check stop_waiting for this journey
    console.log('🔍 Checking for waiting users...');
    const { data: waitingUsers, error: waitingError } = await supabase
      .from('stop_waiting')
      .select('id, user_id')
      .eq('journey_id', activeJourney.id);

    if (waitingError) {
      console.error('❌ Error checking waiting users:', waitingError.message);
    } else {
      console.log(`⏳ Waiting users remaining: ${waitingUsers?.length || 0}`);
    }

    // Check if journey should be marked as completed
    const hasActiveParticipants = activeParticipants && activeParticipants.length > 0;
    const hasWaitingUsers = waitingUsers && waitingUsers.length > 0;

    // 🔥 Mark journey as completed if no active participants
    if (!hasActiveParticipants && !hasWaitingUsers) {
      console.log('🏁 No active participants or waiting users, marking journey as completed...');
      await completeJourneyProperly(activeJourney.id, activeJourney.route_id);
    } else {
      console.log(`⚠️ Journey still has ${activeParticipants?.length || 0} active participants and ${waitingUsers?.length || 0} waiting users - not marking as completed`);
    }

    // Also update driver_journeys if driver exists
    if (activeJourney.driver_id) {
      console.log('👨‍✈️ Updating driver_journeys...');
      const { error: driverJourneyError } = await supabase
        .from('driver_journeys')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('driver_id', activeJourney.driver_id)
        .eq('journey_id', activeJourney.id);

      if (driverJourneyError) {
        console.error('❌ Error updating driver journey:', driverJourneyError.message);
      } else {
        console.log('✅ Updated driver journey');
      }
    }

    // Store journey info before clearing
    const completedJourneyInfo = {
      id: activeJourney.id,
      routeName: activeJourney.routes?.name,
      transportType: activeJourney.routes?.transport_type,
      startPoint: activeJourney.routes?.start_point,
      endPoint: activeJourney.routes?.end_point,
      stops: activeJourney.stops || [],
      driverName: activeJourney.driver_journeys?.[0]?.drivers?.profiles 
        ? `${activeJourney.driver_journeys[0].drivers.profiles.first_name} ${activeJourney.driver_journeys[0].drivers.profiles.last_name}`
        : null,
      createdAt: activeJourney.created_at,
      currentStopSequence: activeJourney.current_stop_sequence || 0
    };

    console.log('🎉 Journey completion result:', {
      success: true,
      rideDuration,
      newTrips,
      savedToHistory,
      journeyInfo: completedJourneyInfo
    });

    setActiveJourney(null);

    return { 
      success: true, 
      rideDuration, 
      newTrips, 
      savedToHistory,
      journeyId: completedJourneyInfo.id,
      routeName: completedJourneyInfo.routeName,
      transportType: completedJourneyInfo.transportType,
      startPoint: completedJourneyInfo.startPoint,
      endPoint: completedJourneyInfo.endPoint,
      stopsCount: completedJourneyInfo.stops.length,
      driverName: completedJourneyInfo.driverName,
      startedAt: completedJourneyInfo.createdAt,
      currentStop: completedJourneyInfo.currentStopSequence
    };
  } catch (err: any) {
    console.error('💥 Error completing journey:', err);
    return { success: false, error: err?.message ?? String(err) };
  }
};

  return {
    activeJourney,
    loading,
    createOrJoinJourney,
    completeJourney,
    refreshActiveJourney: loadActiveJourney,
    cleanupStaleJourneyParticipants,
    checkAndAssignJourneyDriver,
    updateDriverCurrentStop,
    completeDriverJourney,
    checkAndUpdateJourneyCompletion,
  };
}