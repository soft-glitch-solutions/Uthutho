/**
 * Address Autocomplete Service
 * Uses OpenStreetMap Nominatim API for real address suggestions.
 * Focused on South Africa but works globally.
 * Free, no API key required, works on web and native.
 */

export interface AddressSuggestion {
  id: string;
  label: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'address' | 'poi' | 'transport';
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
 * Search for address suggestions using Nominatim.
 * Biased toward South Africa but returns results globally.
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
  const countryCode = options?.countryCode || 'za'; // South Africa bias

  try {
    // Build Nominatim URL with South Africa focus
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      addressdetails: '1',
      limit: String(limit),
      countrycodes: countryCode,
      'accept-language': 'en',
    });

    // Add viewbox for South Africa bounding box to prioritize local results
    // but don't restrict (bounded=0)
    params.set('viewbox', '16.3,-34.9,32.9,-22.1');
    params.set('bounded', '0');

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'Uthutho-TransitApp/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const data: NominatimResult[] = await response.json();

    return data.map((item) => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || '';
      
      // Build a clean label from the display_name
      const displayParts = item.display_name.split(',').map(p => p.trim());
      const label = displayParts[0] || item.display_name;
      
      // Build a shorter address line
      const addressParts: string[] = [];
      if (addr.road) addressParts.push(addr.road);
      if (addr.suburb && addr.suburb !== label) addressParts.push(addr.suburb);
      if (city && city !== label && city !== addr.suburb) addressParts.push(city);
      if (addr.postcode) addressParts.push(addr.postcode);
      const address = addressParts.length > 0 
        ? addressParts.join(', ') 
        : displayParts.slice(1, 4).join(', ');

      // Determine type
      let type: 'address' | 'poi' | 'transport' = 'address';
      if (item.class === 'amenity' || item.class === 'shop' || item.class === 'tourism') {
        type = 'poi';
      }
      if (
        item.type === 'station' ||
        item.type === 'bus_stop' ||
        item.type === 'taxi' ||
        item.type === 'bus_station' ||
        item.class === 'railway' ||
        item.class === 'public_transport'
      ) {
        type = 'transport';
      }

      return {
        id: String(item.place_id),
        label,
        address,
        city: city || addr.state || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type,
      };
    });
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
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'Uthutho-TransitApp/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const data: NominatimResult = await response.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    const displayParts = data.display_name.split(',').map(p => p.trim());

    return {
      id: String(data.place_id),
      label: displayParts[0] || data.display_name,
      address: displayParts.slice(1, 4).join(', '),
      city,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      type: 'address',
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}
