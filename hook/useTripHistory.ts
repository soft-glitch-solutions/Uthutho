// hooks/useTripHistory.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type CompletedJourney = {
  id: string;
  journey_id: string;
  route_name: string;
  transport_type: string;
  start_point: string;
  end_point: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  points_earned: number;
  co2_saved_kg: number;
  passenger_count: number;
  was_driving: boolean;
  rating?: number;
  notes?: string;
};

export const useTripHistory = () => {
  const [trips, setTrips] = useState<CompletedJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalCo2Saved: 0,
    totalPoints: 0,
    favoriteTransport: '',
  });

  const fetchTripHistory = async (limit = 20, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrips([]);
        return;
      }

      // Fetch trips with pagination
      const { data, error: fetchError } = await supabase
        .from('completed_journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fetchError) throw fetchError;

      setTrips(data || []);

      // Calculate statistics
      if (data && data.length > 0) {
        const stats = {
          totalTrips: data.length,
          totalDistance: data.reduce((sum, trip) => sum + (trip.distance_km || 0), 0),
          totalCo2Saved: data.reduce((sum, trip) => sum + (trip.co2_saved_kg || 0), 0),
          totalPoints: data.reduce((sum, trip) => sum + (trip.points_earned || 0), 0),
          favoriteTransport: getMostFrequentTransport(data),
        };
        setStats(stats);
      }

    } catch (err) {
      console.error('Error fetching trip history:', err);
      setError('Failed to load trip history');
    } finally {
      setLoading(false);
    }
  };

  const getMostFrequentTransport = (trips: CompletedJourney[]): string => {
    const transportCounts = trips.reduce((acc, trip) => {
      acc[trip.transport_type] = (acc[trip.transport_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(transportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  };

  const addRating = async (tripId: string, rating: number, notes?: string) => {
    try {
      const { error } = await supabase
        .from('completed_journeys')
        .update({ 
          rating,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) throw error;

      // Update local state
      setTrips(prevTrips =>
        prevTrips.map(trip =>
          trip.id === tripId ? { ...trip, rating, notes } : trip
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error adding rating:', err);
      return { success: false, error: 'Failed to add rating' };
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('completed_journeys')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      // Update local state
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting trip:', err);
      return { success: false, error: 'Failed to delete trip' };
    }
  };

  useEffect(() => {
    fetchTripHistory();
  }, []);

  return {
    trips,
    loading,
    error,
    stats,
    refresh: fetchTripHistory,
    addRating,
    deleteTrip,
    loadMore: (limit: number) => fetchTripHistory(limit, trips.length),
  };
};