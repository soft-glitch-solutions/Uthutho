import { supabase } from '@/lib/supabase';
import { SchoolTransport } from '@/types/transport';

export const fetchTransportDetails = async (id: string): Promise<SchoolTransport | null> => {
  try {
    console.log('📡 Fetching transport details for ID:', id);

    // Try view first
    const { data: viewData, error: viewError } = await supabase
      .from('transport_with_driver')
      .select('*')
      .eq('id', id)
      .single();

    if (!viewError && viewData) {
      return formatTransportFromView(viewData);
    }

    // Fallback to separate queries
    const { data: transportData, error: transportError } = await supabase
      .from('school_transports')
      .select('*')
      .eq('id', id)
      .single();

    if (transportError || !transportData) {
      console.error('Failed to fetch transport:', transportError);
      return null;
    }

    const { data: driverProfileData } = await supabase
      .from('drivers')
      .select(`
        *,
        profiles!drivers_user_id_fkey (
          first_name,
          last_name,
          phone,
          email,
          avatar_url
        )
      `)
      .eq('id', transportData.driver_id)
      .single();

    return formatTransportFromSeparateQueries(transportData, driverProfileData);
  } catch (error) {
    console.error('Error fetching transport details:', error);
    return null;
  }
};

const formatTransportFromView = (data: any): SchoolTransport => {
  return {
    id: data.id || '',
    school_name: data.school_name || 'Unknown School',
    school_area: data.school_area || 'Unknown Area',
    pickup_areas: Array.isArray(data.pickup_areas) 
      ? data.pickup_areas 
      : (typeof data.pickup_areas === 'string' ? [data.pickup_areas] : []),
    pickup_times: Array.isArray(data.pickup_times) 
      ? data.pickup_times 
      : (typeof data.pickup_times === 'string' ? [data.pickup_times] : []),
    capacity: data.capacity || 0,
    current_riders: data.current_riders || 0,
    price_per_month: data.price_per_month || 0,
    price_per_week: data.price_per_week || 0,
    vehicle_info: data.vehicle_info || '',
    vehicle_type: data.vehicle_type || 'Standard Vehicle',
    features: Array.isArray(data.features) 
      ? data.features 
      : (typeof data.features === 'string' ? [data.features] : []),
    description: data.description || '',
    is_verified: data.is_verified || false,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    driver: {
      id: data.driver_id || '',
      user_id: data.driver_user_id || '',
      is_verified: data.driver_verified || false,
      profiles: {
        first_name: data.driver_first_name || 'Unknown',
        last_name: data.driver_last_name || 'Driver',
        rating: data.driver_rating || 0,
        total_trips: data.total_trips || 0,
        phone: '',
        email: '',
        avatar_url: data.driver_avatar_url
      }
    }
  };
};

const formatTransportFromSeparateQueries = (transportData: any, driverData: any): SchoolTransport => {
  let driverInfo = null;
  let profilesInfo = null;
  
  if (driverData) {
    driverInfo = driverData;
    
    if (Array.isArray(driverData.profiles) && driverData.profiles.length > 0) {
      profilesInfo = driverData.profiles[0];
    } else if (driverData.profiles && typeof driverData.profiles === 'object') {
      profilesInfo = driverData.profiles;
    }
  }

  return {
    id: transportData.id || '',
    school_name: transportData.school_name || 'Unknown School',
    school_area: transportData.school_area || 'Unknown Area',
    pickup_areas: Array.isArray(transportData.pickup_areas) 
      ? transportData.pickup_areas 
      : (typeof transportData.pickup_areas === 'string' ? [transportData.pickup_areas] : []),
    pickup_times: Array.isArray(transportData.pickup_times) 
      ? transportData.pickup_times 
      : (typeof transportData.pickup_times === 'string' ? [transportData.pickup_times] : []),
    capacity: transportData.capacity || 0,
    current_riders: transportData.current_riders || 0,
    price_per_month: transportData.price_per_month || 0,
    price_per_week: transportData.price_per_week || 0,
    vehicle_info: transportData.vehicle_info || '',
    vehicle_type: transportData.vehicle_type || 'Standard Vehicle',
    features: Array.isArray(transportData.features) 
      ? transportData.features 
      : (typeof transportData.features === 'string' ? [transportData.features] : []),
    description: transportData.description || '',
    is_verified: transportData.is_verified || false,
    created_at: transportData.created_at || new Date().toISOString(),
    updated_at: transportData.updated_at || new Date().toISOString(),
    driver: {
      id: driverInfo?.id || transportData.driver_id || '',
      user_id: driverInfo?.user_id || '',
      is_verified: driverInfo?.is_verified || false,
      profiles: {
        first_name: profilesInfo?.first_name || 'Unknown',
        last_name: profilesInfo?.last_name || 'Driver',
        rating: driverInfo?.rating || 0,
        total_trips: driverInfo?.total_trips || 0,
        phone: profilesInfo?.phone,
        email: profilesInfo?.email,
        avatar_url: profilesInfo?.avatar_url
      }
    }
  };
};