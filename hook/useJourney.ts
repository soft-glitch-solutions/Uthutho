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
  routes: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
  stops?: Array<{
    id: string;
    name: string;
    order_number: number;
  }>;
}

export function useJourney() {
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadActiveJourney();
      
      // Subscribe to journey updates
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

  const loadActiveJourney = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has active waiting status with journey
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
            )
          )
        `)
        .eq('user_id', user.id)
        .not('journey_id', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (waitingError) {
        console.error('Error loading active journey:', waitingError);
        setActiveJourney(null);
        setLoading(false);
        return;
      }

      if (waitingData?.journeys) {
        // Load route stops for progress tracking
        const { data: stopsData } = await supabase
          .from('stops')
          .select('id, name, order_number')
          .eq('route_id', waitingData.journeys.route_id)
          .order('order_number', { ascending: true });

        setActiveJourney({
          ...waitingData.journeys,
          stops: stopsData || [],
        });
      } else {
        setActiveJourney(null);
      }
    } catch (error) {
      console.error('Error loading active journey:', error);
      setActiveJourney(null);
    }
    
    setLoading(false);
  };

  // In useJourney.ts - replace the existing createOrJoinJourney with this:
const createOrJoinJourney = async (stopId: string, routeId: string, transportType: string) => {
  if (!user) return { success: false, error: 'User not authenticated' };

  try {
    // First check if user is already in a journey by looking at stop_waiting
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

    // Check for existing journeys for this route
    const { data: existingJourneys, error: fetchError } = await supabase
      .from('journeys')
      .select('*')
      .eq('route_id', routeId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    let journeyId;

    // If there are existing journeys, join the first one
    if (existingJourneys && existingJourneys.length > 0) {
      journeyId = existingJourneys[0].id;
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
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      }, {
        onConflict: 'user_id,stop_id'
      });

    if (waitingUpsertError) throw waitingUpsertError;

    // Reload active journey
    await loadActiveJourney();

    return { success: true, journeyId };
  } catch (error) {
    console.error('Error in createOrJoinJourney:', error);
    return { success: false, error: error.message };
  }
};

const completeJourney = async () => {
  console.log('Starting completeJourney', { activeJourneyId: activeJourney?.id, userId: user?.id });

  if (!activeJourney?.id || !user?.id) {
    console.log('Missing activeJourney or user');
    return { success: false, error: 'Missing activeJourney or user' };
  }

  try {
    // 1) Get the stop_waiting record to compute ride duration
    const { data: waitingRow, error: waitingError } = await supabase
      .from('stop_waiting')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('journey_id', activeJourney.id)
      .single();

    if (waitingError && waitingError.code !== 'PGRST116') {
      console.warn('Warning fetching stop_waiting:', waitingError);
    }

    let rideDuration = 0; // seconds
    if (waitingRow?.created_at) {
      const started = new Date(waitingRow.created_at).getTime();
      const now = Date.now();
      rideDuration = Math.max(0, Math.floor((now - started) / 1000));
    }

    // 2) Remove user from stop_waiting
    const { error: deleteError } = await supabase
      .from('stop_waiting')
      .delete()
      .eq('user_id', user.id)
      .eq('journey_id', activeJourney.id);
    if (deleteError) throw deleteError;
    console.log('Removed user from stop_waiting');

    // 3) Increment trips, total ride time, and add points
    let newTrips: number | null = null;
    try {
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('increment_trip', { user_id: user.id, ride_time: rideDuration });

      if (rpcErr) throw rpcErr;

      // Extract trips
      if (Array.isArray(rpcData) && rpcData.length > 0) {
        newTrips = rpcData[0].new_trips ?? rpcData[0].cur_trips ?? null;
      } else if (rpcData && typeof rpcData === 'object') {
        newTrips = (rpcData as any).new_trips ?? null;
      }

      // Add points for completing journey
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

    // 4) Check remaining users for this journey
    const { data: remainingUsers, error: remainingError } = await supabase
      .from('stop_waiting')
      .select('id')
      .eq('journey_id', activeJourney.id);
    if (remainingError) throw remainingError;

    if (!remainingUsers || remainingUsers.length === 0) {
      // 5) Delete journey completely
      const { error: deleteJourneyError } = await supabase
        .from('journeys')
        .delete()
        .eq('id', activeJourney.id);
      if (deleteJourneyError) throw deleteJourneyError;

      console.log(`Journey ${activeJourney.id} deleted (all users completed)`);
    } else {
      console.log('Journey still has waiting users; not deleting');
    }

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
    refreshJourney: loadActiveJourney,
  };
}