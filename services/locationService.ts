import { supabase } from '../lib/supabase';

export interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  transport_type: string | null;
  image: string | null;
}

export interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
  hub_id: string | null;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_number: number;
  route_id: string;
  cost: number | null;
  image_url: string | null;
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getNearbyHubs = async (userLat: number, userLon: number, radiusKm: number = 10): Promise<Hub[]> => {
  try {
    const { data: hubs, error } = await supabase
      .from('hubs')
      .select('*');
    
    if (error) throw error;
    
    // Filter hubs within radius and sort by distance
    const nearbyHubs = hubs
      .map(hub => ({
        ...hub,
        distance: calculateDistance(userLat, userLon, hub.latitude, hub.longitude)
      }))
      .filter(hub => hub.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Limit to 5 closest hubs
    
    return nearbyHubs;
  } catch (error) {
    console.error('Error fetching nearby hubs:', error);
    return [];
  }
};

export const getNearbyRoutes = async (userLat: number, userLon: number, radiusKm: number = 15): Promise<Route[]> => {
  try {
    // Get routes that have hubs within the radius
    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        *,
        hubs!routes_hub_id_fkey (
          id,
          name,
          latitude,
          longitude,
          address,
          transport_type
        )
      `);
    
    if (error) throw error;
    
    // Filter routes based on hub proximity
    const nearbyRoutes = routes
      .filter(route => {
        if (!route.hubs) return false;
        const hub = route.hubs as any;
        const distance = calculateDistance(userLat, userLon, hub.latitude, hub.longitude);
        return distance <= radiusKm;
      })
      .slice(0, 5); // Limit to 5 routes
    
    return nearbyRoutes;
  } catch (error) {
    console.error('Error fetching nearby routes:', error);
    return [];
  }
};

export const getNearbyStops = async (userLat: number, userLon: number, radiusKm: number = 5): Promise<Stop[]> => {
  try {
    const { data: stops, error } = await supabase
      .from('stops')
      .select('*');
    
    if (error) throw error;
    
    // Filter stops within radius and sort by distance
    const nearbyStops = stops
      .map(stop => ({
        ...stop,
        distance: calculateDistance(userLat, userLon, stop.latitude, stop.longitude)
      }))
      .filter(stop => stop.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Limit to 5 closest stops
    
    return nearbyStops;
  } catch (error) {
    console.error('Error fetching nearby stops:', error);
    return [];
  }
};