// services/googlePlaces.ts
import { Platform } from 'react-native';

// Supabase Edge Function URLs (your deployed functions)
const SUPABASE_FUNCTIONS_URL = 'https://ygkhmcnpjjvmbrbyybik.supabase.co/functions/v1';

export interface GooglePlace {
    id: string;
    description: string;
    place_id: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
    terms: Array<{ value: string }>;
    types: string[];
}

export interface PlaceDetails {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    vicinity: string;
    types: string[];
    rating?: number;
    user_ratings_total?: number;
    photos?: Array<{ photo_reference: string }>;
}

let sessionToken = '';

const generateSessionToken = () => {
    if (!sessionToken) {
        sessionToken = Math.random().toString(36).substring(2, 15);
    }
    return sessionToken;
};

export const resetSessionToken = () => {
    sessionToken = '';
};

// Search places using your Supabase Edge Function (public - no auth required)
export const searchPlaces = async (input: string, sessionTokenParam?: string): Promise<GooglePlace[]> => {
    if (!input || input.length < 2) return [];

    try {
        const token = sessionTokenParam || generateSessionToken();

        // Call your Supabase Edge Function
        const url = `${SUPABASE_FUNCTIONS_URL}/google-places?input=${encodeURIComponent(input)}&sessiontoken=${token}`;

        console.log('Calling Supabase Edge Function for places:', input);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.predictions) {
            console.log(`Found ${data.predictions.length} results`);
            return data.predictions;
        } else if (data.status === 'ZERO_RESULTS') {
            console.log('No results found');
            return [];
        } else if (data.status === 'INVALID_REQUEST') {
            console.error('Invalid request:', data.error_message);
            return [];
        } else if (data.status === 'REQUEST_DENIED') {
            console.error('Request denied:', data.error_message);
            return [];
        }
        return [];
    } catch (error) {
        console.error('Error searching places:', error);
        return [];
    }
};

// Get place details using your Supabase Edge Function (public - no auth required)
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    try {
        const url = `${SUPABASE_FUNCTIONS_URL}/google-place-details?placeId=${placeId}`;

        console.log('Getting place details from Edge Function for:', placeId);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            console.log('Place details retrieved:', data.result.name);
            return data.result;
        } else if (data.status === 'ZERO_RESULTS') {
            console.log('No place details found');
            return null;
        } else if (data.status === 'INVALID_REQUEST') {
            console.error('Invalid request:', data.error_message);
            return null;
        } else if (data.status === 'REQUEST_DENIED') {
            console.error('Request denied:', data.error_message);
            return null;
        }
        return null;
    } catch (error) {
        console.error('Error getting place details:', error);
        return null;
    }
};

// Reverse geocode (get address from coordinates) - Direct call (works on mobile)
export const reverseGeocodeGoogle = async (latitude: number, longitude: number): Promise<PlaceDetails | null> => {
    try {
        // Using direct Google API for reverse geocoding (or you can create another Edge Function)
        const GOOGLE_MAPS_API_KEY = 'AIzaSyCNhnn5T_4Hq2ZRwK6JTBC0ju0anA99jA4';
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

        console.log('Reverse geocoding:', latitude, longitude);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            console.log('Reverse geocode result:', result.formatted_address);
            return {
                place_id: result.place_id,
                name: result.address_components[0]?.long_name || 'Current Location',
                formatted_address: result.formatted_address,
                geometry: {
                    location: {
                        lat: latitude,
                        lng: longitude,
                    },
                },
                vicinity: result.formatted_address,
                types: result.types,
            };
        }
        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

// Get place photo URL (direct - works on mobile)
export const getPlacePhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
    const GOOGLE_PLACES_API_KEY = 'AIzaSyCNhnn5T_4Hq2ZRwK6JTBC0ju0anA99jA4';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Helper function to get distance between two coordinates (in km)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m away`;
    }
    return `${distanceKm.toFixed(1)}km away`;
};

// Extract main text from place (for display)
export const getPlaceDisplayName = (place: GooglePlace): string => {
    return place.structured_formatting?.main_text || place.description.split(',')[0];
};

// Extract secondary text from place (for display)
export const getPlaceSecondaryText = (place: GooglePlace): string => {
    return place.structured_formatting?.secondary_text ||
        place.terms.slice(1).map(t => t.value).join(', ');
};

// Check if place is a transit station (bus/train station, etc.)
export const isTransitStation = (place: GooglePlace): boolean => {
    const transitTypes = ['bus_station', 'train_station', 'transit_station', 'subway_station'];
    return place.types?.some(type => transitTypes.includes(type)) || false;
};

// Check if place is an address or neighborhood
export const isAddress = (place: GooglePlace): boolean => {
    const addressTypes = ['street_address', 'route', 'neighborhood', 'sublocality', 'locality'];
    return place.types?.some(type => addressTypes.includes(type)) || false;
};

// Get icon name based on place type
export const getPlaceIconName = (place: GooglePlace): string => {
    if (isTransitStation(place)) return 'bus';
    if (isAddress(place)) return 'map-pin';
    return 'map-pin';
};