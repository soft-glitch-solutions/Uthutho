import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Journey {
  id: string;
  route_id: string;
  current_stop_sequence: number;
  status: 'in_progress' | 'completed';
  last_ping_time: string;
  routes?: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
}

export const useJourney = () => {
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveJourney();
  }, []);

  const loadActiveJourney = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has an active waiting request with a journey
      const { data: waitingRequest } = await supabase
        .from('stop_waiting')
        .select('journey_id')
        .eq('user_id', user.id)
        .eq('status', 'picked_up')
        .is('journey_id', null)
        .single();

      if (waitingRequest?.journey_id) {
        const { data: journey } = await supabase
          .from('journeys')
          .select(`
            *,
            routes (
              name,
              transport_type,
              start_point,
              end_point
            )
          `)
          .eq('id', waitingRequest.journey_id)
          .eq('status', 'in_progress')
          .single();

        if (journey) {
          setActiveJourney(journey);
        }
      }
    } catch (error) {
      console.error('Error loading active journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeJourney = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      if (!activeJourney) {
        return { success: false, error: 'No active journey' };
      }

      const { error } = await supabase
        .from('journeys')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', activeJourney.id);

      if (error) throw error;

      setActiveJourney(null);
      return { success: true };
    } catch (error) {
      console.error('Error completing journey:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  return {
    activeJourney,
    loading,
    completeJourney,
    refreshJourney: loadActiveJourney
  };
};