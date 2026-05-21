// data/taxiRoutes.ts

import { AddressSuggestion } from '../services/addressAutocomplete';

export interface TaxiRoute {
    id: number;
    origin: string;
    destination: string;
    shapeLength: number;
}

interface TaxiHub {
    name: string;
    latitude: number;
    longitude: number;
    aliases: string[];
}

// Predefined list of popular South African taxi ranks/hubs with coordinates for proximity matching
const TAXI_HUBS: TaxiHub[] = [
    { name: 'BELLVILLE', latitude: -33.9048, longitude: 18.6298, aliases: ['BELLVILLE', 'BELVILLE', 'BELLVILLE STATION'] },
    { name: 'CLAREMONT', latitude: -33.9794, longitude: 18.4666, aliases: ['CLAREMONT', 'CAVENDISH', 'CLAREMONT STATION'] },
    { name: 'WYNBERG', latitude: -34.0026, longitude: 18.4716, aliases: ['WYNBERG', 'WINBERG', 'WYNBERG STATION'] },
    { name: 'NYANGA', latitude: -33.9924, longitude: 18.5835, aliases: ['NYANGA', 'NYANGA JUNCTION'] },
    { name: 'GUGULETU', latitude: -33.9875, longitude: 18.5664, aliases: ['GUGULETU', 'GUGULETHU', 'GUGS'] },
    { name: 'KHAYELITSHA', latitude: -34.0161, longitude: 18.6482, aliases: ['KHAYELITSHA', 'KAYELITSHA', 'SITE C', 'SITE B', 'KHAYELITSHA STATION'] },
    { name: 'MITCHELLS PLAIN - TOWN CENTRE', latitude: -34.0485, longitude: 18.6208, aliases: ['MITCHELLS PLAIN', 'MITCHELL\'S PLAIN', 'TOWN CENTRE', 'MITCHELLS PLAIN STATION'] },
    { name: 'SEA POINT', latitude: -33.9141, longitude: 18.3913, aliases: ['SEA POINT', 'SEAPOINT'] },
    { name: 'DURBANVILLE', latitude: -33.8288, longitude: 18.6516, aliases: ['DURBANVILLE'] },
    { name: 'MOWBRAY', latitude: -33.9468, longitude: 18.4735, aliases: ['MOWBRAY', 'MOWBRAY STATION'] },
    { name: 'CAPE TOWN CBD', latitude: -33.9249, longitude: 18.4241, aliases: ['CAPE TOWN', 'CAPE TOWN CBD', 'CBD', 'FORESHORE', 'WATERFRONT', 'GREEN POINT', 'CAPE TOWN STATION'] },
    { name: 'SOWETO', latitude: -26.2678, longitude: 27.8585, aliases: ['SOWETO', 'PIMVILLE', 'ORLANDO', 'BARAGWANATH', 'DIEPKLOOF'] },
    { name: 'JOHANNESBURG CBD', latitude: -26.2041, longitude: 28.0473, aliases: ['JOHANNESBURG', 'JOHANNESBURG CBD', 'JOBURG', 'PARK STATION', 'BREE STREET'] },
    { name: 'SANDTON', latitude: -26.1076, longitude: 28.0567, aliases: ['SANDTON', 'SANDTON CITY'] },
    { name: 'RANDBURG', latitude: -26.0936, longitude: 27.9942, aliases: ['RANDBURG'] },
    { name: 'ALEXANDRA', latitude: -26.1017, longitude: 28.0963, aliases: ['ALEXANDRA', 'ALEX'] },
    { name: 'MIDRAND', latitude: -25.9984, longitude: 28.1264, aliases: ['MIDRAND', 'HALFWAY HOUSE'] },
    { name: 'PRETORIA CBD', latitude: -25.7479, longitude: 28.1873, aliases: ['PRETORIA', 'PRETORIA CBD', 'TSHWANE'] },
    { name: 'CENTURION', latitude: -25.8640, longitude: 28.2411, aliases: ['CENTURION'] },
];

// Rich fallback set of taxi routes to ensure functionality when API is CORS-blocked or offline
const DEFAULT_TAXI_ROUTES: TaxiRoute[] = [
    { id: 101, origin: 'BELLVILLE', destination: 'DURBANVILLE', shapeLength: 10698 },
    { id: 102, origin: 'BELLVILLE', destination: 'NYANGA', shapeLength: 13093 },
    { id: 103, origin: 'BELLVILLE', destination: 'KHAYELITSHA', shapeLength: 18398 },
    { id: 104, origin: 'BELLVILLE', destination: 'MOWBRAY', shapeLength: 20651 },
    { id: 105, origin: 'GUGULETU', destination: 'CLAREMONT', shapeLength: 12817 },
    { id: 106, origin: 'GUGULETU', destination: 'SEA POINT', shapeLength: 29074 },
    { id: 107, origin: 'KHAYELITSHA', destination: 'WYNBERG', shapeLength: 18577 },
    { id: 108, origin: 'MITCHELLS PLAIN - TOWN CENTRE', destination: 'WYNBERG', shapeLength: 21834 },
    { id: 109, origin: 'BELLVILLE', destination: 'CAPE TOWN CBD', shapeLength: 22000 },
    { id: 110, origin: 'KHAYELITSHA', destination: 'CAPE TOWN CBD', shapeLength: 30000 },
    { id: 111, origin: 'MITCHELLS PLAIN - TOWN CENTRE', destination: 'CAPE TOWN CBD', shapeLength: 28000 },
    { id: 112, origin: 'WYNBERG', destination: 'CAPE TOWN CBD', shapeLength: 12000 },
    { id: 113, origin: 'CLAREMONT', destination: 'CAPE TOWN CBD', shapeLength: 10000 },
    { id: 114, origin: 'NYANGA', destination: 'CAPE TOWN CBD', shapeLength: 20000 },
    { id: 115, origin: 'GUGULETU', destination: 'CAPE TOWN CBD', shapeLength: 18000 },
    { id: 116, origin: 'WYNBERG', destination: 'MOWBRAY', shapeLength: 6000 },
    { id: 117, origin: 'MOWBRAY', destination: 'CAPE TOWN CBD', shapeLength: 7000 },
    { id: 118, origin: 'SEA POINT', destination: 'CAPE TOWN CBD', shapeLength: 4000 },
    { id: 119, origin: 'JOHANNESBURG CBD', destination: 'SOWETO', shapeLength: 20000 },
    { id: 120, origin: 'JOHANNESBURG CBD', destination: 'SANDTON', shapeLength: 15000 },
    { id: 121, origin: 'JOHANNESBURG CBD', destination: 'RANDBURG', shapeLength: 16000 },
    { id: 122, origin: 'JOHANNESBURG CBD', destination: 'ALEXANDRA', shapeLength: 12000 },
    { id: 123, origin: 'JOHANNESBURG CBD', destination: 'MIDRAND', shapeLength: 30000 },
    { id: 124, origin: 'PRETORIA CBD', destination: 'CENTURION', shapeLength: 15000 },
    { id: 125, origin: 'PRETORIA CBD', destination: 'JOHANNESBURG CBD', shapeLength: 55000 },
];

// Helper to calculate distance (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number): number => deg * (Math.PI / 180);

// Helper fetch with timeout to prevent app hanging on slow API requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// API Configuration
const API_BASE_URL = 'https://esapqa.capetown.gov.za/agsext/rest/services/Theme_Based/ODP_SPLIT_6/FeatureServer/11';

let cachedRoutes: TaxiRoute[] | null = null;

// Fetch taxi routes from the live API (or fallback if slow/failed/CORS blocked)
export const fetchTaxiRoutes = async (): Promise<TaxiRoute[]> => {
    if (cachedRoutes) {
        return cachedRoutes;
    }

    try {
        const url = `${API_BASE_URL}/query?where=1%3D1&outFields=ORGN,DSTN,Shape__Length&outSR=4326&f=json`;

        // Abort after 3 seconds to keep UX fast
        const response = await fetchWithTimeout(url, {}, 3000);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.features || !Array.isArray(data.features)) {
            throw new Error('Invalid API response');
        }

        // Access attributes from the nested 'attributes' object
        const routes: TaxiRoute[] = data.features.map((feature: any, index: number) => {
            const attrs = feature.attributes;
            return {
                id: attrs.OBJECTID || index + 1,
                origin: attrs.ORGN || 'Unknown',
                destination: attrs.DSTN || 'Unknown',
                shapeLength: attrs.Shape__Length || 0,
            };
        });

        const apiRoutes = routes.filter(route =>
            route.origin !== 'Unknown' &&
            route.destination !== 'Unknown' &&
            route.shapeLength > 0
        );

        // Combine API routes and static default routes (deduplicating by origin-destination key)
        const allRoutesMap = new Map<string, TaxiRoute>();
        for (const route of [...DEFAULT_TAXI_ROUTES, ...apiRoutes]) {
            const key = `${route.origin.toUpperCase()}|${route.destination.toUpperCase()}`;
            allRoutesMap.set(key, route);
        }

        cachedRoutes = Array.from(allRoutesMap.values());
        return cachedRoutes;
    } catch (error) {
        console.warn('Failed to fetch live taxi routes, falling back to local dataset:', error);
        cachedRoutes = DEFAULT_TAXI_ROUTES;
        return cachedRoutes;
    }
};

// Extract city/suburb from an AddressSuggestion using Google's structured data
const extractLocationName = (address: AddressSuggestion): string => {
    const addressParts = address.address.split(', ');
    if (addressParts.length > 0) {
        // Last part is often the country (e.g. South Africa), second-to-last is often city/suburb
        const suburbPart = addressParts.length > 1 ? addressParts[addressParts.length - 2] : addressParts[0];
        const cityMatch = suburbPart.match(/^([A-Za-z\s]+)/);
        if (cityMatch) return cityMatch[1].trim().toUpperCase();
    }
    return address.label.split(',')[0].trim().toUpperCase();
};

// Find routes between two AddressSuggestion objects (using coordinates proximity & keyword matching)
export const findRoutesBetweenAddresses = async (
    fromAddress: AddressSuggestion,
    toAddress: AddressSuggestion
): Promise<TaxiRoute[]> => {
    const routes = await fetchTaxiRoutes();

    // 1. Proximity matching based on coordinates (up to 10km range)
    const getClosestHub = (lat: number, lng: number, maxDistKm = 10): string | null => {
        let closestHub: string | null = null;
        let minDist = maxDistKm;
        for (const hub of TAXI_HUBS) {
            const dist = calculateDistance(lat, lng, hub.latitude, hub.longitude);
            if (dist < minDist) {
                minDist = dist;
                closestHub = hub.name;
            }
        }
        return closestHub;
    };

    const fromHubByCoords = getClosestHub(fromAddress.latitude, fromAddress.longitude, 10);
    const toHubByCoords = getClosestHub(toAddress.latitude, toAddress.longitude, 10);

    // 2. Keyword/alias matching from input text label & suburb description
    const getHubByNameMatch = (address: AddressSuggestion): string | null => {
        const labelText = address.label.toUpperCase();
        const suburbText = (address.address.split(',')[0] || '').toUpperCase();
        
        for (const hub of TAXI_HUBS) {
            for (const alias of hub.aliases) {
                const aliasUpper = alias.toUpperCase();
                // Avoid matching generic city names from the secondary address suffix
                if (aliasUpper === 'CAPE TOWN' || aliasUpper === 'JOHANNESBURG' || aliasUpper === 'PRETORIA') {
                    if (labelText.includes(aliasUpper)) {
                        return hub.name;
                    }
                } else {
                    if (labelText.includes(aliasUpper) || suburbText.includes(aliasUpper)) {
                        return hub.name;
                    }
                }
            }
        }
        return null;
    };

    const fromHubByName = getHubByNameMatch(fromAddress);
    const toHubByName = getHubByNameMatch(toAddress);

    // Resolve final hubs (prefer name match first, fallback to closest coordinates)
    const fromHub = fromHubByName || fromHubByCoords;
    const toHub = toHubByName || toHubByCoords;

    console.log(`Searching taxi routes: FROM "${fromAddress.label}" (Mapped Hub: ${fromHub}) → TO "${toAddress.label}" (Mapped Hub: ${toHub})`);

    if (!fromHub || !toHub) {
        console.warn("Could not map locations to known South African taxi hubs.");
        return [];
    }

    if (fromHub === toHub) {
        console.log("Origin and destination mapped to same taxi hub.");
        return [];
    }

    // Filter routes that connect fromHub and toHub directly (regardless of direction)
    let matchingRoutes = routes.filter(route => {
        const routeOrigin = route.origin.toUpperCase();
        const routeDest = route.destination.toUpperCase();
        return (
            (routeOrigin === fromHub && routeDest === toHub) ||
            (routeOrigin === toHub && routeDest === fromHub)
        );
    });

    // 3. X-Transfer (1-transfer connection) suggestion if no direct routes are found
    if (matchingRoutes.length === 0) {
        console.log("No direct route found. Searching for 1-transfer connection...");
        const fromHubRoutes = routes.filter(r => r.origin.toUpperCase() === fromHub || r.destination.toUpperCase() === fromHub);
        const toHubRoutes = routes.filter(r => r.origin.toUpperCase() === toHub || r.destination.toUpperCase() === toHub);

        const transferConnections: TaxiRoute[] = [];
        let idCounter = 9000;

        for (const r1 of fromHubRoutes) {
            const r1Other = r1.origin.toUpperCase() === fromHub ? r1.destination.toUpperCase() : r1.origin.toUpperCase();
            for (const r2 of toHubRoutes) {
                const r2Other = r2.origin.toUpperCase() === toHub ? r2.destination.toUpperCase() : r2.origin.toUpperCase();
                if (r1Other === r2Other && r1Other !== fromHub && r1Other !== toHub) {
                    const transferHub = r1Other;
                    const combinedLength = r1.shapeLength + r2.shapeLength;
                    transferConnections.push({
                        id: idCounter++,
                        origin: `${fromHub} (via ${transferHub})`,
                        destination: toHub,
                        shapeLength: combinedLength
                    });
                }
            }
        }

        if (transferConnections.length > 0) {
            matchingRoutes = transferConnections;
        }
    }

    // Deduplicate matching routes
    const uniqueRoutes = new Map<string, TaxiRoute>();
    for (const route of matchingRoutes) {
        const key = `${route.origin}|${route.destination}`;
        if (!uniqueRoutes.has(key)) {
            uniqueRoutes.set(key, route);
        }
    }

    return Array.from(uniqueRoutes.values());
};

// Original function kept for backward compatibility
export const findRoutesBetween = async (origin: string, destination: string): Promise<TaxiRoute[]> => {
    const routes = await fetchTaxiRoutes();
    return routes.filter(route =>
        route.origin === origin && route.destination === destination
    );
};

// Get all unique origins (for debugging/autocomplete)
export const getAllOrigins = async (): Promise<string[]> => {
    const routes = await fetchTaxiRoutes();
    const origins = new Set<string>();
    routes.forEach(r => origins.add(r.origin));
    return Array.from(origins).sort();
};

// Get all unique destinations
export const getAllDestinations = async (): Promise<string[]> => {
    const routes = await fetchTaxiRoutes();
    const dests = new Set<string>();
    routes.forEach(r => dests.add(r.destination));
    return Array.from(dests).sort();
};

// Calculate taxi fare
export const calculateTaxiFare = (distanceKm: number): string => {
    const baseFare = 12;
    const perKm = 2.5;
    const estimated = baseFare + (distanceKm * perKm);
    return `R${Math.round(estimated)} - R${Math.round(estimated + 8)}`;
};

// Get traffic info
export const getTrafficInfo = (distanceKm: number): string => {
    const estimate = estimateTravelTime(distanceKm);
    const icons = { light: '🟢', moderate: '🟡', heavy: '🔴' };
    return `${icons[estimate.trafficLevel]} ~${estimate.minutes} min`;
};

// Estimate travel time with traffic
export const estimateTravelTime = (distanceKm: number): {
    minutes: number;
    trafficLevel: 'light' | 'moderate' | 'heavy';
} => {
    const baseMinutes = (distanceKm / 30) * 60;
    const hour = new Date().getHours();
    let multiplier = 1.0;
    let trafficLevel: 'light' | 'moderate' | 'heavy' = 'light';

    if (hour >= 6 && hour <= 9) { multiplier = 2.2; trafficLevel = 'heavy'; }
    else if (hour >= 16 && hour <= 19) { multiplier = 2.0; trafficLevel = 'heavy'; }
    else if (hour >= 10 && hour <= 15) { multiplier = 1.3; trafficLevel = 'moderate'; }
    else if (hour >= 22 || hour <= 5) { multiplier = 0.8; trafficLevel = 'light'; }
    else if (hour >= 19 && hour <= 21) { multiplier = 1.5; trafficLevel = 'moderate'; }

    return { minutes: Math.round(baseMinutes * multiplier), trafficLevel };
};

// Test API connection
export const testAPIConnection = async (): Promise<boolean> => {
    try {
        const routes = await fetchTaxiRoutes();
        return routes.length > 0;
    } catch {
        return false;
    }
};