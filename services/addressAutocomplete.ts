// services/addressAutocomplete.ts
import { Platform } from 'react-native';

export interface AddressSuggestion {
  id: string;
  label: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'address' | 'poi' | 'transport';
  distance?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// Get the appropriate API key based on platform
const getApiKey = (): string => {
  if (Platform.OS === 'web') {
    // Use web-specific API key
    return process.env.EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY || '';
  } else {
    // Use native (Android/iOS) API key
    return process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  }
};

// Global references for Google Maps API (web only)
let googleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Load Google Maps API (only for web)
const loadGoogleMapsAPI = (): Promise<void> => {
  // For native, don't load
  if (Platform.OS !== 'web') {
    return Promise.resolve();
  }

  // If already loaded
  if (googleMapsLoaded && window.google) {
    return Promise.resolve();
  }

  // If already loading, return existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const apiKey = getApiKey();

    if (!apiKey) {
      reject(new Error('Google Places API key missing for web'));
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById('google-maps-api');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          googleMapsLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }

    // Create callback
    const callbackName = 'initGoogleMaps_' + Date.now();
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      googleMapsLoaded = true;
      resolve();
    };

    // Load script
    const script = document.createElement('script');
    script.id = 'google-maps-api';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

// Get autocomplete service (web only)
const getAutocompleteService = (): Promise<any> => {
  return loadGoogleMapsAPI().then(() => {
    return new window.google.maps.places.AutocompleteService();
  });
};

// Get places service (web only)
const getPlacesService = (): Promise<any> => {
  return loadGoogleMapsAPI().then(() => {
    return new window.google.maps.places.PlacesService(document.createElement('div'));
  });
};

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

  try {
    // WEB PLATFORM - Use Google Maps JavaScript API
    if (Platform.OS === 'web') {
      const autocompleteService = await getAutocompleteService();
      const placesService = await getPlacesService();

      return new Promise((resolve) => {
        const request: any = {
          input: trimmed,
          componentRestrictions: { country: options?.countryCode || 'za' },
          types: ['geocode', 'establishment'],
        };

        autocompleteService.getPlacePredictions(request, (predictions: any[], status: string) => {
          if (status !== 'OK' || !predictions || predictions.length === 0) {
            resolve([]);
            return;
          }

          const batchPromises = predictions.slice(0, limit).map((prediction) => {
            return new Promise<AddressSuggestion | null>((resolveDetail) => {
              placesService.getDetails(
                { placeId: prediction.place_id, fields: ['geometry', 'formatted_address', 'name'] },
                (place: any, detailStatus: string) => {
                  if (detailStatus === 'OK' && place?.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    let distance;
                    if (options?.userLat && options?.userLon) {
                      distance = calculateDistance(options.userLat, options.userLon, lat, lng);
                    }

                    resolveDetail({
                      id: prediction.place_id,
                      label: prediction.structured_formatting.main_text,
                      address: prediction.structured_formatting.secondary_text || '',
                      city: '',
                      latitude: lat,
                      longitude: lng,
                      type: 'address',
                      distance,
                    });
                  } else {
                    resolveDetail(null);
                  }
                }
              );
            });
          });

          Promise.all(batchPromises).then((results) => {
            let validResults = results.filter(r => r !== null) as AddressSuggestion[];

            // Sort by distance if user location provided
            if (options?.userLat && options?.userLon) {
              validResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            }

            resolve(validResults.slice(0, limit));
          });
        });
      });
    }

    // NATIVE PLATFORM (Android/iOS) - Use REST API directly
    else {
      const apiKey = getApiKey();
      if (!apiKey) {
        console.warn('Google Places API key is missing for native');
        return [];
      }

      const params = new URLSearchParams({
        query: trimmed,
        key: apiKey,
        region: options?.countryCode || 'za',
      });

      if (options?.userLat && options?.userLon) {
        params.append('location', `${options.userLat},${options.userLon}`);
        params.append('radius', '50000');
      }

      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status);
        return [];
      }

      let results = data.results.slice(0, limit).map((item: any) => {
        const addressParts = item.formatted_address ? item.formatted_address.split(', ') : [];
        const label = item.name || addressParts[0] || '';
        const address = addressParts.length > 1 ? addressParts.slice(1).join(', ') : item.formatted_address || '';

        return {
          id: item.place_id,
          label,
          address,
          city: '',
          latitude: item.geometry.location.lat,
          longitude: item.geometry.location.lng,
          type: 'address' as const,
          distance: options?.userLat && options?.userLon ? calculateDistance(
            options.userLat,
            options.userLon,
            item.geometry.location.lat,
            item.geometry.location.lng
          ) : undefined,
        };
      });

      if (options?.userLat && options?.userLon) {
        results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      return results;
    }
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<AddressSuggestion | null> {
  try {
    // WEB PLATFORM
    if (Platform.OS === 'web') {
      await loadGoogleMapsAPI();

      return new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        const latLng = new window.google.maps.LatLng(lat, lon);

        geocoder.geocode({ location: latLng }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const item = results[0];
            const addressParts = item.formatted_address ? item.formatted_address.split(', ') : [];
            const label = addressParts[0] || '';
            const address = addressParts.length > 1 ? addressParts.slice(1).join(', ') : '';

            resolve({
              id: item.place_id,
              label,
              address,
              city: '',
              latitude: lat,
              longitude: lon,
              type: 'address',
            });
          } else {
            resolve(null);
          }
        });
      });
    }

    // NATIVE PLATFORM
    else {
      const apiKey = getApiKey();
      if (!apiKey) {
        console.warn('Google Places API key is missing for native');
        return null;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
      const response = await fetch(url);
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
    }
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}