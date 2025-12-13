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

      const { data: staleParticipants, error } = await supabase
        .from('journey_participants')
        .select(`
          id,
          journey:journeys (
            id,
            status,
            last_ping_time
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('journeys.status.neq.in_progress,journeys.last_ping_time.lt.2024-01-01T00:00:00Z')
        .limit(10);

      if (error) {
        console.error('Error finding stale participants:', error);
        return;
      }

      if (staleParticipants && staleParticipants.length > 0) {
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

// In useJourney.ts, update the loadActiveJourney function:
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

  // UPDATED: Modified to accept specific journey ID
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
    console.log('Starting completeJourney', { activeJourneyId: activeJourney?.id, userId: user?.id });

    if (!activeJourney?.id || !user?.id) {
      console.log('Missing activeJourney or user');
      return { success: false, error: 'Missing activeJourney or user' };
    }

    try {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      if (driverData && activeJourney.driver_id === driverData.id) {
        await completeDriverJourney(driverData.id, activeJourney.id);
      }

      const { data: waitingRow, error: waitingError } = await supabase
        .from('stop_waiting')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('journey_id', activeJourney.id)
        .single();

      if (waitingError && waitingError.code !== 'PGRST116') {
        console.warn('Warning fetching stop_waiting:', waitingError);
      }

      let rideDuration = 0;
      if (waitingRow?.created_at) {
        const started = new Date(waitingRow.created_at).getTime();
        const now = Date.now();
        rideDuration = Math.max(0, Math.floor((now - started) / 1000));
      }

      const { error: deleteError } = await supabase
        .from('stop_waiting')
        .delete()
        .eq('user_id', user.id)
        .eq('journey_id', activeJourney.id);
      if (deleteError) throw deleteError;
      console.log('Removed user from stop_waiting');

      const { error: deactivateError } = await supabase
        .from('journey_participants')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString(),
          status: 'arrived'
        })
        .eq('journey_id', activeJourney.id)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating journey participant:', deactivateError);
      } else {
        console.log('Deactivated user from journey participants');
      }

      let newTrips: number | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase
          .rpc('increment_trip', { user_id: user.id, ride_time: rideDuration });

        if (rpcErr) throw rpcErr;

        if (Array.isArray(rpcData) && rpcData.length > 0) {
          newTrips = rpcData[0].new_trips ?? rpcData[0].cur_trips ?? null;
        } else if (rpcData && typeof rpcData === 'object') {
          newTrips = (rpcData as any).new_trips ?? null;
        }

        await supabase
          .from('profiles')
          .update({ points: supabase.raw('points + 10') })
          .eq('id', user.id);
        console.log('Added 10 points to user');
      } catch (rpcFallbackErr) {
        console.warn('RPC increment_trip failed, falling back to inline update:', rpcFallbackErr);

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('trips, total_ride_time, points')
          .eq('id', user.id)
          .single();
        if (profileErr) throw profileErr;

        const nextTrips = (profile?.trips ?? 0) + 1;
        const nextTotal = (profile?.total_ride_time ?? 0) + rideDuration;
        const nextPoints = (profile?.points ?? 0) + 10;

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ trips: nextTrips, total_ride_time: nextTotal, points: nextPoints })
          .eq('id', user.id);
        if (updateErr) throw updateErr;

        newTrips = nextTrips;
        console.log('Updated trips, total_ride_time, and points inline');
      }

      const { data: remainingUsers, error: remainingError } = await supabase
        .from('stop_waiting')
        .select('id')
        .eq('journey_id', activeJourney.id);
      if (remainingError) throw remainingError;

      // FIXED: Removed the extra single quote from 'true'
      const { data: activeParticipants, error: participantsError } = await supabase
        .from('journey_participants')
        .select('id')
        .eq('journey_id', activeJourney.id)
        .eq('is_active', true);

      if (participantsError) {
        console.error('Error checking active participants:', participantsError);
      }

      const hasActiveUsers = (remainingUsers && remainingUsers.length > 0) || 
                            (activeParticipants && activeParticipants.length > 0);

      if (!hasActiveUsers) {
        const { error: deleteJourneyError } = await supabase
          .from('journeys')
          .delete()
          .eq('id', activeJourney.id);
        if (deleteJourneyError) throw deleteJourneyError;

        console.log(`Journey ${activeJourney.id} deleted (all users completed)`);
      } else {
        console.log('Journey still has waiting users; not deleting');
      }

      setActiveJourney(null);

      return { success: true, rideDuration, newTrips };
    } catch (err: any) {
      console.error('Error completing journey:', err);
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
  };
}