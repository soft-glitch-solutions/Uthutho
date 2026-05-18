import { Platform } from 'react-native';

/**
 * Address Autocomplete Service
 * Uses Google Places API and Google Geocoding API.
 */

export interface AddressSuggestion {
  id: string;
  label: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'address' | 'poi' | 'transport';
  distance?: number; // Add distance field for sorting
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    building?: string;
  };
  type?: string;
  class?: string;
}

// Debounce timer reference
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Search for address suggestions using Google Places API.
 * Results are prioritized by proximity to user's location if provided.
 */
export async function searchAddresses(
  query: string,
  options?: {
    limit?: number;
    countryCode?: string;
    userLat?: number;
    userLon?: number;
  }
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = options?.limit || 8;
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('Google Places API key is missing. Ensure EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is set in .env');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: trimmed,
      key: apiKey,
      region: options?.countryCode || 'za',
    });

    // Add location bias to prioritize nearby results
    if (options?.userLat && options?.userLon) {
      params.append('location', `${options.userLat},${options.userLon}`);
      params.append('radius', '50000'); // 50km radius bias
    }

    let targetUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    const url = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` : targetUrl;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Google Places API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API returned status:', data.status);
      return [];
    }

    // Map results and calculate distances if user location is provided
    let results = data.results.slice(0, limit * 2).map((item: any) => {
      const addressParts = item.formatted_address ? item.formatted_address.split(', ') : [];
      const label = item.name || addressParts[0] || '';
      const address = addressParts.length > 1 ? addressParts.slice(1).join(', ') : item.formatted_address || '';

      let type: 'address' | 'poi' | 'transport' = 'address';
      if (item.types) {
        if (item.types.includes('transit_station') || item.types.includes('bus_station')) {
          type = 'transport';
        } else if (item.types.includes('point_of_interest') || item.types.includes('establishment')) {
          type = 'poi';
        }
      }

      const suggestion: AddressSuggestion = {
        id: item.place_id,
        label,
        address,
        city: '',
        latitude: item.geometry.location.lat,
        longitude: item.geometry.location.lng,
        type,
      };

      // Calculate distance if user location is available
      if (options?.userLat && options?.userLon) {
        suggestion.distance = calculateDistance(
          options.userLat,
          options.userLon,
          suggestion.latitude,
          suggestion.longitude
        );
      }

      return suggestion;
    });

    // Sort by distance if user location is provided (closest first)
    if (options?.userLat && options?.userLon) {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Return limited results after sorting
    return results.slice(0, limit);
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

/**
 * Debounced version of searchAddresses.
 * Cancels previous requests when called in rapid succession.
 */
export function searchAddressesDebounced(
  query: string,
  callback: (results: AddressSuggestion[]) => void,
  delayMs: number = 350,
  options?: {
    limit?: number;
    countryCode?: string;
    userLat?: number;
    userLon?: number;
  }
): () => void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const results = await searchAddresses(query, options);
    callback(results);
  }, delayMs);

  // Return cancel function
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
}

/**
 * Reverse geocode coordinates to get an address string.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<AddressSuggestion | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('Google Places API key is missing. Ensure EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is set in .env');
    return null;
  }

  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lon}`,
      key: apiKey,
    });

    let targetUrl = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    const url = Platform.OS === 'web' ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` : targetUrl;

    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) return null;

    const item = data.results[0];
    const addressParts = item.formatted_address ? item.formatted_address.split(', ') : [];
    const label = addressParts[0] || '';
    const address = addressParts.length > 1 ? addressParts.slice(1).join(', ') : '';

    return {
      id: item.place_id,
      label,
      address,
      city: '',
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng,
      type: 'address',
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}