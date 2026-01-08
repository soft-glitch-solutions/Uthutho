export interface DriverProfile {
  first_name: string;
  last_name: string;
  rating: number;
  total_trips: number;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface Driver {
  id: string;
  user_id: string;
  is_verified: boolean;
  profiles: DriverProfile;
}

export interface SchoolTransport {
  id: string;
  school_name: string;
  school_area: string;
  pickup_areas: string[];
  pickup_times: string[];
  capacity: number;
  current_riders: number;
  price_per_month: number;
  price_per_week: number;
  vehicle_info: string;
  vehicle_type: string;
  features: string[];
  description: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  driver: Driver;
}

export interface TransportRequestParams {
  transportId: string;
  driverId: string;
  transportName: string;
  schoolArea: string;
}