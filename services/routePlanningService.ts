import { supabase } from '@/lib/supabase';
import { calculateDistance } from '@/utils/distance';

interface Location {
  lat: number;
  lon: number;
  display_name: string;
  place_id: string;
}

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_number: number;
  route_id: string;
  cost?: number;
  image_url?: string;
}

interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  cost: number;
  transport_type: string;
  hub_id?: string;
}

interface Hub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  transport_type?: string;
  image?: string;
}

interface RouteWithStops extends Route {
  stops: Stop[];
  hub?: Hub;
}

interface RouteStep {
  instruction: string;
  transport_type: string;
  duration: string;
  distance?: number;
  cost?: number;
  stopName?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  entityId?: string;
  entityType?: 'stop' | 'hub' | 'route';
  navigationLink?: string;
}

interface RoutePlan {
  fromLocation: string;
  toLocation: string;
  totalDuration: string;
  totalDistance: number;
  totalCost: number;
  steps: RouteStep[];
  isMultiModal: boolean;
  routes: Array<{
    routeId: string;
    routeName: string;
    transportType: string;
    navigationLink: string;
  }>;
  hasValidRoute: boolean;
  message?: string;
}

// Find nearest stop to a location
async function findNearestStop(
  lat: number,
  lon: number,
  maxDistance: number = 2
): Promise<{ stop: Stop; distance: number } | null> {
  const { data: stops, error } = await supabase
    .from('stops')
    .select('*');

  if (error || !stops) {
    console.error('Error fetching stops:', error);
    return null;
  }

  let nearestStop: { stop: Stop; distance: number } | null = null;
  let minDistance = maxDistance;

  for (const stop of stops) {
    const distance = calculateDistance(lat, lon, stop.latitude, stop.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStop = { stop, distance };
    }
  }

  return nearestStop;
}

// Find stops near a location with a larger radius
async function findStopsNearLocation(
  lat: number,
  lon: number,
  maxDistance: number = 5
): Promise<Array<{ stop: Stop; distance: number }>> {
  const { data: stops, error } = await supabase
    .from('stops')
    .select('*');

  if (error || !stops) {
    console.error('Error fetching stops:', error);
    return [];
  }

  const nearbyStops: Array<{ stop: Stop; distance: number }> = [];

  for (const stop of stops) {
    const distance = calculateDistance(lat, lon, stop.latitude, stop.longitude);
    if (distance <= maxDistance) {
      nearbyStops.push({ stop, distance });
    }
  }

  // Sort by distance (closest first)
  return nearbyStops.sort((a, b) => a.distance - b.distance);
}

// Find nearest hub to a location
async function findNearestHub(
  lat: number,
  lon: number,
  maxDistance: number = 5
): Promise<{ hub: Hub; distance: number } | null> {
  const { data: hubs, error } = await supabase
    .from('hubs')
    .select('*');

  if (error || !hubs) {
    console.error('Error fetching hubs:', error);
    return null;
  }

  let nearestHub: { hub: Hub; distance: number } | null = null;
  let minDistance = maxDistance;

  for (const hub of hubs) {
    const distance = calculateDistance(lat, lon, hub.latitude, hub.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestHub = { hub, distance };
    }
  }

  return nearestHub;
}

// Find routes that go through a specific stop
async function findRoutesByStop(stopId: string): Promise<RouteWithStops[]> {
  const { data: routeStops, error } = await supabase
    .from('route_stops')
    .select(`
      route:routes(
        *,
        stops:route_stops(
          stop:stops(*)
        ),
        hub:hubs(*)
      )
    `)
    .eq('stop_id', stopId);

  if (error || !routeStops) {
    console.error('Error finding routes by stop:', error);
    return [];
  }

  return routeStops.map(rs => ({
    ...rs.route,
    stops: rs.route.stops.map(rs => rs.stop).sort((a, b) => a.order_number - b.order_number),
    hub: rs.route.hub
  }));
}

// Find stops that belong to routes from a specific hub
async function findStopsByHub(hubId: string): Promise<Stop[]> {
  const { data: routes, error } = await supabase
    .from('routes')
    .select(`
      stops:route_stops(
        stop:stops(*)
      )
    `)
    .eq('hub_id', hubId);

  if (error || !routes) {
    console.error('Error finding stops by hub:', error);
    return [];
  }

  const stops: Stop[] = [];
  routes.forEach(route => {
    route.stops.forEach(rs => {
      stops.push(rs.stop);
    });
  });

  return stops;
}

// Find the best hub route combination based on ACTUAL destination
async function findBestHubRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  destinationName: string
): Promise<{
  startStop: Stop;
  hub: Hub;
  route: RouteWithStops;
  endStop: Stop;
  totalDistance: number;
} | null> {
  console.log('🔍 Finding best route for destination:', destinationName);
  console.log('📍 Destination coordinates:', toLat, toLon);

  // Step 1: Find ALL stops near the destination (not just the closest one)
  const nearbyDestinationStops = await findStopsNearLocation(toLat, toLon, 3); // 3km radius
  console.log('🚏 Nearby stops to destination:', nearbyDestinationStops.length);
  
  if (nearbyDestinationStops.length === 0) {
    console.log('❌ No stops found within 3km of destination');
    return null;
  }

  // Log nearby stops for debugging
  nearbyDestinationStops.forEach((stopInfo, index) => {
    console.log(`  ${index + 1}. ${stopInfo.stop.name} - ${stopInfo.distance.toFixed(2)}km`);
  });

  // Step 2: For each nearby destination stop, find routes that go there
  const allPossibleRoutes: Array<{
    destinationStop: Stop;
    route: RouteWithStops;
    hub: Hub;
  }> = [];

  for (const destinationStopInfo of nearbyDestinationStops) {
    const routesToDestination = await findRoutesByStop(destinationStopInfo.stop.id);
    console.log(`🛣️ Routes to ${destinationStopInfo.stop.name}:`, routesToDestination.length);
    
    for (const route of routesToDestination) {
      if (route.hub) {
        allPossibleRoutes.push({
          destinationStop: destinationStopInfo.stop,
          route,
          hub: route.hub
        });
      }
    }
  }

  if (allPossibleRoutes.length === 0) {
    console.log('❌ No routes found to any nearby stops');
    return null;
  }

  console.log('🏁 Total possible route combinations:', allPossibleRoutes.length);

  // Step 3: For each possible route, find the best starting point
  let bestCombination: {
    startStop: Stop;
    hub: Hub;
    route: RouteWithStops;
    endStop: Stop;
    totalDistance: number;
  } | null = null;
  let minTotalDistance = Infinity;

  for (const possibleRoute of allPossibleRoutes) {
    const { destinationStop, route, hub } = possibleRoute;

    console.log(`🔍 Checking route ${route.name} via hub ${hub.name} to ${destinationStop.name}`);

    // Step 4: Find stops that connect to this hub
    const hubStops = await findStopsByHub(hub.id);
    if (hubStops.length === 0) continue;

    // Find nearest stop to user from hub's stops
    let nearestStartStop: Stop | null = null;
    let minStartDistance = Infinity;

    for (const stop of hubStops) {
      const distance = calculateDistance(fromLat, fromLon, stop.latitude, stop.longitude);
      if (distance < minStartDistance) {
        minStartDistance = distance;
        nearestStartStop = stop;
      }
    }

    if (!nearestStartStop) continue;

    console.log(`📍 Nearest start stop: ${nearestStartStop.name} (${minStartDistance.toFixed(2)}km)`);

    // Step 5: Calculate total journey distance
    const walkToStartStop = minStartDistance;
    const routeDistance = calculateDistance(
      hub.latitude,
      hub.longitude,
      destinationStop.latitude,
      destinationStop.longitude
    );
    const walkFromStopDistance = calculateDistance(
      destinationStop.latitude,
      destinationStop.longitude,
      toLat,
      toLon
    );
    
    const totalDistance = walkToStartStop + routeDistance + walkFromStopDistance;

    console.log(`📏 Total distance for this route: ${totalDistance.toFixed(2)}km`);

    if (totalDistance < minTotalDistance) {
      minTotalDistance = totalDistance;
      bestCombination = {
        startStop: nearestStartStop,
        hub,
        route,
        endStop: destinationStop,
        totalDistance
      };
      
      console.log(`✅ New best route found! Total: ${totalDistance.toFixed(2)}km`);
    }
  }

  if (bestCombination) {
    console.log('🎯 Final best route:', {
      startStop: bestCombination.startStop.name,
      hub: bestCombination.hub.name,
      route: bestCombination.route.name,
      endStop: bestCombination.endStop.name,
      totalDistance: bestCombination.totalDistance.toFixed(2) + 'km'
    });
  } else {
    console.log('❌ No viable route combination found');
  }

  return bestCombination;
}

function generateNavigationLink(entityType: 'stop' | 'hub' | 'route', entityId: string): string {
  switch (entityType) {
    case 'stop':
      return `/stop/${entityId}`;
    case 'hub':
      return `/hub/${entityId}`;
    case 'route':
      return `/route-details?routeId=${entityId}`;
    default:
      return '#';
  }
}

export async function calculateRoutePlan(
  from: Location,
  to: Location
): Promise<RoutePlan> {
  const fromLat = parseFloat(from.lat.toString());
  const fromLon = parseFloat(from.lon.toString());
  const toLat = parseFloat(to.lat.toString());
  const toLon = parseFloat(to.lon.toString());

  const directDistance = calculateDistance(fromLat, fromLon, toLat, toLon);

  console.log('🚗 Calculating route plan...');
  console.log('📍 From:', from.display_name, `(${fromLat}, ${fromLon})`);
  console.log('🎯 To:', to.display_name, `(${toLat}, ${toLon})`);
  console.log('📏 Direct distance:', directDistance.toFixed(2), 'km');

  // Try to find the best hub-based route first using ACTUAL destination
  const bestHubRoute = await findBestHubRoute(fromLat, fromLon, toLat, toLon, to.display_name);

  if (bestHubRoute) {
    console.log('✅ Found hub-based route to destination');
    return generateHubBasedRoutePlan(from, to, bestHubRoute, fromLat, fromLon, toLat, toLon);
  }

  console.log('❌ No hub-based route found, trying direct routes...');

  // Fallback: Try direct routes between stops
  const nearestStartStop = await findNearestStop(fromLat, fromLon);
  const nearestEndStop = await findNearestStop(toLat, toLon);

  if (nearestStartStop && nearestEndStop) {
    const directRoutes = await findDirectRoutes(nearestStartStop.stop.id, nearestEndStop.stop.id);
    if (directRoutes.length > 0) {
      console.log('✅ Found direct route');
      return generateSingleRoutePlan(from, to, directRoutes[0], fromLat, fromLon, toLat, toLon);
    }
  }

  console.log('❌ No routes found in our system');
  // Return a clear message that no route was found
  return {
    fromLocation: from.display_name.split(',')[0],
    toLocation: to.display_name.split(',')[0],
    totalDuration: 'Unknown',
    totalDistance: directDistance,
    totalCost: 0,
    steps: [],
    isMultiModal: false,
    routes: [],
    hasValidRoute: false,
    message: `We don't have route information for this journey yet. The direct distance is ${directDistance.toFixed(1)}km. Please check back later as we're constantly adding new routes.`
  };
}

// Generate route plan using hub-based approach
function generateHubBasedRoutePlan(
  from: Location,
  to: Location,
  combination: {
    startStop: Stop;
    hub: Hub;
    route: RouteWithStops;
    endStop: Stop;
    totalDistance: number;
  },
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): RoutePlan {
  const steps: RouteStep[] = [];
  let totalCost = combination.route.cost || 0;
  let totalDistance = 0;

  const { startStop, hub, route, endStop } = combination;

  console.log('🗺️ Generating route plan:', {
    from: from.display_name,
    to: to.display_name,
    startStop: startStop.name,
    hub: hub.name,
    route: route.name,
    endStop: endStop.name
  });

  // Step 1: Walk to start stop
  const walkToStartStopDistance = calculateDistance(
    fromLat,
    fromLon,
    startStop.latitude,
    startStop.longitude
  );
  totalDistance += walkToStartStopDistance;

  if (walkToStartStopDistance > 0.05) {
    const walkMinutes = Math.ceil(walkToStartStopDistance * 15);
    steps.push({
      instruction: `Walk to ${startStop.name}`,
      transport_type: 'Walking',
      duration: `${walkMinutes} min`,
      distance: walkToStartStopDistance,
      stopName: startStop.name,
      coordinates: {
        lat: startStop.latitude,
        lon: startStop.longitude
      },
      entityId: startStop.id,
      entityType: 'stop',
      navigationLink: generateNavigationLink('stop', startStop.id)
    });
  }

  // Step 2: Travel from start stop to hub
  const toHubDistance = calculateDistance(
    startStop.latitude,
    startStop.longitude,
    hub.latitude,
    hub.longitude
  );
  totalDistance += toHubDistance;

  const toHubMinutes = Math.ceil(toHubDistance * 3);
  steps.push({
    instruction: `Take ${route.transport_type} to ${hub.name}`,
    transport_type: route.transport_type,
    duration: `${toHubMinutes} min`,
    distance: toHubDistance,
    stopName: hub.name,
    coordinates: {
      lat: hub.latitude,
      lon: hub.longitude
    },
    entityId: hub.id,
    entityType: 'hub',
    navigationLink: generateNavigationLink('hub', hub.id)
  });

  // Step 3: Take main route from hub to destination stop
  const routeDistance = calculateDistance(
    hub.latitude,
    hub.longitude,
    endStop.latitude,
    endStop.longitude
  );
  totalDistance += routeDistance;

  const routeMinutes = Math.ceil(routeDistance * 2.5); // Account for stops along the way
  steps.push({
    instruction: `Take ${route.name} from ${hub.name} to ${endStop.name}`,
    transport_type: route.transport_type,
    duration: `${routeMinutes} min`,
    distance: routeDistance,
    cost: route.cost,
    stopName: `${hub.name} → ${endStop.name}`,
    coordinates: {
      lat: endStop.latitude,
      lon: endStop.longitude
    },
    entityId: route.id,
    entityType: 'route',
    navigationLink: generateNavigationLink('route', route.id)
  });

  // Step 4: Walk from destination stop to final destination
  const walkToDestinationDistance = calculateDistance(
    endStop.latitude,
    endStop.longitude,
    toLat,
    toLon
  );
  totalDistance += walkToDestinationDistance;

  if (walkToDestinationDistance > 0.05) {
    const walkMinutes = Math.ceil(walkToDestinationDistance * 15);
    steps.push({
      instruction: `Walk to ${to.display_name.split(',')[0]}`,
      transport_type: 'Walking',
      duration: `${walkMinutes} min`,
      distance: walkToDestinationDistance,
      coordinates: {
        lat: toLat,
        lon: toLon
      }
    });
  }

  const totalMinutes = steps.reduce((sum, step) => {
    const mins = parseInt(step.duration);
    return sum + (isNaN(mins) ? 0 : mins);
  }, 0);

  return {
    fromLocation: from.display_name.split(',')[0],
    toLocation: to.display_name.split(',')[0],
    totalDuration: `${totalMinutes} min`,
    totalDistance,
    totalCost,
    steps,
    isMultiModal: true,
    routes: [{
      routeId: route.id,
      routeName: route.name,
      transportType: route.transport_type,
      navigationLink: generateNavigationLink('route', route.id)
    }],
    hasValidRoute: true
  };
}

// Helper function for direct routes between stops
async function findDirectRoutes(startStopId: string, endStopId: string): Promise<RouteWithStops[]> {
  const { data: routesData, error } = await supabase
    .from('routes')
    .select(`
      *,
      stops:route_stops(
        stop:stops(*)
      ),
      hub:hubs(*)
    `);

  if (error || !routesData) return [];

  const validRoutes: RouteWithStops[] = [];

  for (const route of routesData) {
    if (!route.stops || route.stops.length === 0) continue;

    const sortedStops = route.stops
      .map(rs => rs.stop)
      .sort((a, b) => a.order_number - b.order_number);

    const startIndex = sortedStops.findIndex(stop => stop.id === startStopId);
    const endIndex = sortedStops.findIndex(stop => stop.id === endStopId);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      validRoutes.push({
        ...route,
        stops: sortedStops,
        hub: route.hub
      });
    }
  }

  return validRoutes;
}

function generateSingleRoutePlan(
  from: Location,
  to: Location,
  route: RouteWithStops,
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): RoutePlan {
  const steps: RouteStep[] = [];
  let totalCost = route.cost || 0;
  let totalDistance = 0;

  const nearestStartStop = route.stops.reduce((nearest, stop) => {
    const distToStop = calculateDistance(fromLat, fromLon, stop.latitude, stop.longitude);
    const distToNearest = calculateDistance(fromLat, fromLon, nearest.latitude, nearest.longitude);
    return distToStop < distToNearest ? stop : nearest;
  });

  const nearestEndStop = route.stops.reduce((nearest, stop) => {
    const distToStop = calculateDistance(toLat, toLon, stop.latitude, stop.longitude);
    const distToNearest = calculateDistance(toLat, toLon, nearest.latitude, nearest.longitude);
    return distToStop < distToNearest ? stop : nearest;
  });

  // Walk to start stop
  const walkToStopDistance = calculateDistance(
    fromLat,
    fromLon,
    nearestStartStop.latitude,
    nearestStartStop.longitude
  );
  totalDistance += walkToStopDistance;

  if (walkToStopDistance > 0.05) {
    const walkMinutes = Math.ceil(walkToStopDistance * 15);
    steps.push({
      instruction: `Walk to ${nearestStartStop.name}`,
      transport_type: 'Walking',
      duration: `${walkMinutes} min`,
      distance: walkToStopDistance,
      stopName: nearestStartStop.name,
      coordinates: {
        lat: nearestStartStop.latitude,
        lon: nearestStartStop.longitude
      },
      entityId: nearestStartStop.id,
      entityType: 'stop',
      navigationLink: generateNavigationLink('stop', nearestStartStop.id)
    });
  }

  // Calculate route segment
  const routeStops = route.stops
    .filter(s => s.order_number >= nearestStartStop.order_number && s.order_number <= nearestEndStop.order_number)
    .sort((a, b) => a.order_number - b.order_number);

  let routeDistance = 0;
  for (let i = 0; i < routeStops.length - 1; i++) {
    routeDistance += calculateDistance(
      routeStops[i].latitude,
      routeStops[i].longitude,
      routeStops[i + 1].latitude,
      routeStops[i + 1].longitude
    );
  }
  totalDistance += routeDistance;

  const estimatedMinutes = Math.ceil(routeDistance * 3);
  const routeCost = route.cost || 0;

  steps.push({
    instruction: `Take ${route.name} from ${nearestStartStop.name} to ${nearestEndStop.name}`,
    transport_type: route.transport_type,
    duration: `${estimatedMinutes} min`,
    distance: routeDistance,
    cost: routeCost,
    stopName: `${nearestStartStop.name} → ${nearestEndStop.name}`,
    coordinates: {
      lat: nearestEndStop.latitude,
      lon: nearestEndStop.longitude
    },
    entityId: route.id,
    entityType: 'route',
    navigationLink: generateNavigationLink('route', route.id)
  });

  // Walk from end stop to destination
  const walkFromStopDistance = calculateDistance(
    nearestEndStop.latitude,
    nearestEndStop.longitude,
    toLat,
    toLon
  );
  totalDistance += walkFromStopDistance;

  if (walkFromStopDistance > 0.05) {
    const walkMinutes = Math.ceil(walkFromStopDistance * 15);
    steps.push({
      instruction: `Walk to ${to.display_name.split(',')[0]}`,
      transport_type: 'Walking',
      duration: `${walkMinutes} min`,
      distance: walkFromStopDistance,
      coordinates: {
        lat: toLat,
        lon: toLon
      }
    });
  }

  const totalMinutes = steps.reduce((sum, step) => {
    const mins = parseInt(step.duration);
    return sum + (isNaN(mins) ? 0 : mins);
  }, 0);

  return {
    fromLocation: from.display_name.split(',')[0],
    toLocation: to.display_name.split(',')[0],
    totalDuration: `${totalMinutes} min`,
    totalDistance,
    totalCost,
    steps,
    isMultiModal: false,
    routes: [{
      routeId: route.id,
      routeName: route.name,
      transportType: route.transport_type,
      navigationLink: generateNavigationLink('route', route.id)
    }],
    hasValidRoute: true
  };
}