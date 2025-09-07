import { supabase } from './supabase';

interface Journey {
  id: string;
  route_id: string;
  current_stop_sequence: number;
  status: 'in_progress' | 'completed';
  last_ping_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export const createOrJoinJourney = async (
  userId: string, 
  stopId: string, 
  routeId: string, 
  stopSequence: number
): Promise<{ journeyId: string | null; error: Error | null }> => {
  try {
    // 1. Check for existing journeys on this route that haven't passed this stop
    const { data: existingJourneys, error: fetchError } = await supabase
      .from('journeys')
      .select('*')
      .eq('route_id', routeId)
      .eq('status', 'in_progress')
      .lt('current_stop_sequence', stopSequence)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw fetchError;
    }

    let journeyId: string;

    if (existingJourneys && existingJourneys.length > 0) {
      // Join existing journey
      journeyId = existingJourneys[0].id;
      
      // Update the journey's last ping time
      const { error: updateError } = await supabase
        .from('journeys')
        .update({ last_ping_time: new Date().toISOString() })
        .eq('id', journeyId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new journey
      const { data: newJourney, error: insertError } = await supabase
        .from('journeys')
        .insert({
          route_id: routeId,
          current_stop_sequence: stopSequence,
          status: 'in_progress',
          last_ping_time: new Date().toISOString(),
          created_by: userId
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      journeyId = newJourney.id;
    }

    return { journeyId, error: null };
  } catch (error) {
    console.error('Error in createOrJoinJourney:', error);
    return { 
      journeyId: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
};