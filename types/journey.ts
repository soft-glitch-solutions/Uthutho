export interface Journey {
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

export interface JourneyWithRelations extends Journey {
  routes?: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
}

export interface CreateJourneyParams {
  route_id: string;
  current_stop_sequence: number;
  created_by: string;
}

// Add these missing interfaces:
export interface JourneyStop {
  id: string;
  name: string;
  order_number: number;
  passed: boolean;
  current: boolean;
  upcoming: boolean;
  route_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface Passenger {
  id: string;
  user_id: string;
  journey_id: string;
  stop_id: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  stops?: {
    id: string;
    name: string;
    order_number: number;
    latitude: number;
    longitude: number;
  };
}

export interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    selected_title: string; // Add this
    avatar_url?: string;    // Add this
  };
}

export interface StopWaiting {
  id: string;
  user_id: string;
  stop_id: string;
  journey_id?: string;
  route_id?: string;
  transport_type?: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  stops?: {
    name: string;
    order_number: number;
  };
}

export interface JourneyStats {
  total_distance?: number;
  total_duration?: number;
  average_speed?: number;
  carbon_saved?: number;
  points_earned?: number;
}

export interface JourneyCompletionResult {
  success: boolean;
  error?: string;
  rideDuration?: number;
  newTrips?: number;
  pointsEarned?: number;
}