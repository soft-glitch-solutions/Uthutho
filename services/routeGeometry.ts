// services/routeGeometry.ts
import { taxiRoutesData, haversineDistance, RouteMatch } from '@/data/taxiRoutes';

export interface RouteGeometry {
    points: Array<{ latitude: number; longitude: number }>;
    distance: number;
    duration: number;
    polyline: string;
}

// Match user location to nearest taxi route point
export const matchToTaxiRoute = (
    userLat: number,
    userLng: number,
    route: { coordinates: [number, number][] }
): { pointIndex: number; distanceKm: number } | null => {
    let minDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < route.coordinates.length; i++) {
        const [routeLng, routeLat] = route.coordinates[i];
        const distance = haversineDistance(userLat, userLng, routeLat, routeLng);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    if (minDistance <= 1.5) { // Within 1.5km of a route point
        return { pointIndex: closestIndex, distanceKm: minDistance };
    }
    return null;
};

// Get route from user to taxi pickup point, then taxi route to destination
export const getHybridRoute = async (
    userLocation: { latitude: number; longitude: number },
    destination: string,
    selectedRoute: TaxiRoute
): Promise<{ walkingPath: RouteGeometry; taxiPath: RouteGeometry; combinedPoints: any[] } | null> => {

    // Find closest point on taxi route to user
    const match = matchToTaxiRoute(userLocation.latitude, userLocation.longitude, selectedRoute);

    if (!match) return null;

    // Get walking route from user to pickup point
    const pickupPoint = {
        latitude: selectedRoute.coordinates[match.pointIndex][1],
        longitude: selectedRoute.coordinates[match.pointIndex][0],
    };

    // Simulate walking path (in real app, use Google Directions API)
    const walkingPath = simulateWalkingPath(userLocation, pickupPoint);

    // Convert taxi route coordinates to point format
    const taxiPath = {
        points: selectedRoute.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
        })),
        distance: selectedRoute.shapeLength / 1000,
        duration: (selectedRoute.shapeLength / 1000) / 30 * 60, // 30 km/h avg
        polyline: '',
    };

    // Combine paths
    const combinedPoints = [...walkingPath.points, ...taxiPath.points];

    return { walkingPath, taxiPath, combinedPoints };
};

// Simulate walking path (for demo - replace with actual Directions API)
const simulateWalkingPath = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
): RouteGeometry => {
    const points = [from, to];
    const distance = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    return {
        points,
        distance,
        duration: distance / 5 * 60, // 5 km/h walking speed
        polyline: '',
    };
};

// Fallback to Google Directions API when needed
export const getRouteGeometry = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: 'DRIVING' | 'WALKING' | 'TRANSIT' = 'DRIVING'
): Promise<RouteGeometry | null> => {
    // In a real app, call Google Directions API here
    // For now, return a direct line between points
    const points = [origin, destination];
    const distance = haversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

    return {
        points,
        distance,
        duration: mode === 'WALKING' ? distance / 5 * 60 : distance / 30 * 60,
        polyline: '',
    };
};