import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import MapLegend from './MapLegend';

interface InteractiveNearbyMapProps {
  userLocation: {
    lat: number;
    lng: number;
  };
  nearestLocations: {
    nearestStop: any;
    nearestHub: any;
  } | null;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  handleNearestStopPress: (stopId: string) => void;
  handleNearestHubPress: (hubId: string) => void;
}

interface LocationData {
  lat: number;
  lng: number;
  type: 'user' | 'stop' | 'hub';
  name: string;
  color: string;
  id: string;
  distance?: number;
  isNearest?: boolean;
}

// SVG paths for lucide-react-native icons
const SVG_ICONS = {
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  flag: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  route: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12"/></svg>`
};

const InteractiveNearbyMap: React.FC<InteractiveNearbyMapProps> = ({
  userLocation,
  nearestLocations,
  calculateWalkingTime,
  handleNearestStopPress,
  handleNearestHubPress
}) => {
  const { colors } = useTheme();
  const [mapHtml, setMapHtml] = useState<string>('');
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [allStops, setAllStops] = useState<any[]>([]);
  const [allHubs, setAllHubs] = useState<any[]>([]);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState<boolean>(true);

  useEffect(() => {
    const loadAdditionalLocations = async () => {
      try {
        setLoadingAdditionalData(true);
        
        const [stopsResult, hubsResult] = await Promise.allSettled([
          supabase
            .from('stops')
            .select('*')
            .limit(100),
          supabase
            .from('hubs')
            .select('*')
            .limit(50)
        ]);

        let stops: any[] = [];
        let hubs: any[] = [];

        if (stopsResult.status === 'fulfilled' && stopsResult.value.data) {
          stops = stopsResult.value.data;
        }

        if (hubsResult.status === 'fulfilled' && hubsResult.value.data) {
          hubs = hubsResult.value.data;
        }

        const MAX_DISTANCE_KM = 1;
        
        const filteredStops = stops.filter(stop => {
          if (!userLocation) return true;
          const distance = calculateWalkingTime(
            userLocation.lat,
            userLocation.lng,
            stop.latitude,
            stop.longitude
          );
          return distance <= (MAX_DISTANCE_KM * 12);
        });

        const filteredHubs = hubs.filter(hub => {
          if (!userLocation) return true;
          const distance = calculateWalkingTime(
            userLocation.lat,
            userLocation.lng,
            hub.latitude,
            hub.longitude
          );
          return distance <= (MAX_DISTANCE_KM * 12);
        });

        setAllStops(filteredStops);
        setAllHubs(filteredHubs);
      } catch (error) {
        console.error('Error loading additional locations:', error);
      } finally {
        setLoadingAdditionalData(false);
      }
    };

    if (userLocation) {
      loadAdditionalLocations();
    }
  }, [userLocation, nearestLocations]);

  useEffect(() => {
    const generateMapHtml = () => {
      if (!userLocation) return '';

      const locations: LocationData[] = [
        {
          lat: userLocation.lat,
          lng: userLocation.lng,
          type: 'user',
          name: 'Your Location',
          color: '#1ea2b1',
          id: 'user_location'
        },
        ...allStops.map(stop => ({
          lat: stop.latitude,
          lng: stop.longitude,
          type: 'stop' as const,
          name: stop.name,
          color: '#1ea2b1',
          distance: calculateWalkingTime(
            userLocation.lat,
            userLocation.lng,
            stop.latitude,
            stop.longitude
          ),
          id: stop.id,
          isNearest: stop.id === nearestLocations?.nearestStop?.id
        })),
        ...allHubs.map(hub => ({
          lat: hub.latitude,
          lng: hub.longitude,
          type: 'hub' as const,
          name: hub.name,
          color: '#1ea2b1',
          distance: calculateWalkingTime(
            userLocation.lat,
            userLocation.lng,
            hub.latitude,
            hub.longitude
          ),
          id: hub.id,
          isNearest: hub.id === nearestLocations?.nearestHub?.id
        }))
      ];

      const validLocations = locations.filter(loc => 
        loc.lat && loc.lng && 
        !isNaN(loc.lat) && !isNaN(loc.lng) &&
        Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180
      );

      if (validLocations.length === 0) {
        return generateErrorHtml(colors.background);
      }

      const lats = validLocations.map(loc => loc.lat);
      const lngs = validLocations.map(loc => loc.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const latPadding = (maxLat - minLat) * 0.1 || 0.01;
      const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

      return generateMapHtmlContent(validLocations, colors, {
        bounds: `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`,
        center: `${(minLat + maxLat) / 2},${(minLng + maxLng) / 2}`
      });
    };

    if (!loadingAdditionalData) {
      setMapHtml(generateMapHtml());
      setMapLoading(true);
    }
  }, [userLocation, allStops, allHubs, colors, loadingAdditionalData]);

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'navigate') {
        const { screen, id } = data.payload;
        
        if (screen === 'stop-details') {
          handleNearestStopPress(id);
        } else if (screen === 'hub') {
          handleNearestHubPress(id);
        }
      } else if (data === 'mapLoaded') {
        setMapLoading(false);
      }
    } catch (error) {
      if (event.nativeEvent.data === 'mapLoaded') {
        setMapLoading(false);
      }
    }
  };

  if (!userLocation) {
    return (
      <View style={[styles.mapContainer, { backgroundColor: colors.card }]}>
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.mapLoadingText, { color: colors.text }]}>
            Loading your location...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      {loadingAdditionalData ? (
        <View style={[styles.mapContainer, { backgroundColor: colors.card }]}>
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.mapLoadingText, { color: colors.text }]}>
              Loading nearby locations...
            </Text>
            <Text style={[styles.mapSubText, { color: colors.text }]}>
              {allStops.length} stops • {allHubs.length} hubs
            </Text>
          </View>
        </View>
      ) : mapHtml ? (
        <View style={styles.mapWrapper}>
          {mapLoading && (
            <View style={styles.mapOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.mapLoadingText, { color: colors.text }]}>
                Loading map...
              </Text>
            </View>
          )}
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={styles.mapIframe}
              title="Interactive Nearby Map"
              onLoad={() => setMapLoading(false)}
            />
          ) : (
            <View style={styles.webViewFallback}>
              <Text style={[styles.mapLoadingText, { color: colors.text }]}>
                Interactive map only available on web
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.mapContainer, { backgroundColor: colors.card }]}>
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.mapLoadingText, { color: colors.text }]}>
              Preparing map...
            </Text>
          </View>
        </View>
      )}
      
      <MapLegend stopsCount={allStops.length} hubsCount={allHubs.length} />
    </View>
  );
};

// Helper functions for HTML generation
const generateErrorHtml = (backgroundColor: string): string => `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Nearby Locations</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        margin: 0; 
        padding: 0; 
        background: ${backgroundColor};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .error-message {
        text-align: center;
        color: #6b7280;
        padding: 20px;
      }
    </style>
  </head>
  <body>
    <div class="error-message">
      <h3>No locations found</h3>
      <p>Unable to load nearby stops and hubs.</p>
    </div>
  </body>
  </html>
`;

const generateMapHtmlContent = (locations: LocationData[], colors: any, mapData: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nearby Locations</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: ${colors.background};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #map { 
              height: 300px; 
              width: 100%; 
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .custom-marker {
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
            }
            .user-marker { 
              background-color: #1ea2b1;
              animation: pulse 2s infinite;
            }
            .stop-marker { 
              background-color: #1ea2b1; 
            }
            .stop-marker-nearest {
              background-color: #1a8c9a;
              border: 3px solid #1ea2b1;
              animation: pulse 1.5s infinite;
            }
            .hub-marker { 
              background-color: #1ea2b1; 
            }
            .hub-marker-nearest {
              background-color: #1a8c9a;
              border: 3px solid #1ea2b1;
              animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.1);
                opacity: 0.8;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
            
            .leaflet-popup-content {
              margin: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .popup-content {
              min-width: 220px;
            }
            
            .popup-title {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 4px;
              color: #1f2937;
            }
            
            .popup-subtitle {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            
            .popup-distance {
              font-size: 11px;
              color: #1ea2b1;
              font-weight: 500;
              margin-bottom: 12px;
            }
            
            .popup-button {
              background-color: #1ea2b1;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              width: 100%;
              text-align: center;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            }
            
            .popup-button:hover {
              background-color: #1a8c9a;
            }
            
            .nearest-badge {
              background-color: #ef4444;
              color: white;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 10px;
              margin-left: 6px;
              font-weight: 600;
            }
            
            .marker-svg {
              width: 20px;
              height: 20px;
            }
            
            .type-label {
              font-size: 10px;
              color: #666;
              margin-top: 2px;
              text-align: center;
              text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map
            const map = L.map('map').setView([${mapData.center.split(',')[0]}, ${mapData.center.split(',')[1]}], 13);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Function to handle navigation
            function navigateToLocation(type, id) {
              if (type === 'stop') {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'navigate',
                  payload: { screen: 'stop-details', id: id }
                }));
              } else if (type === 'hub') {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'navigate',
                  payload: { screen: 'hub', id: id }
                }));
              }
            }
            
            // SVG icons
            const SVG_ICONS = {
              user: \`${SVG_ICONS.user}\`,
              flag: \`${SVG_ICONS.flag}\`,
              mapPin: \`${SVG_ICONS.mapPin}\`,
              route: \`${SVG_ICONS.route}\`
            };
            
            // Create custom icons with SVG
            function createCustomIcon(color, iconType, isNearest = false, label = '') {
              const className = isNearest ? 'custom-marker nearest-marker' : 'custom-marker';
              const typeClass = iconType === 'user' ? 'user-marker' : 
                               iconType === 'stop' ? 'stop-marker' : 
                               iconType === 'hub' ? 'hub-marker' : '';
              const iconSvg = SVG_ICONS[iconType] || SVG_ICONS.user;
              
              return L.divIcon({
                  html: \`<div class="\${className} \${typeClass}" style="background-color: \${color}; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <div class="marker-svg">\${iconSvg}</div>
                            \${label ? '<div class="type-label">' + label + '</div>' : ''}
                          </div>\`,
                  className: '',
                  iconSize: [40, 40],
                  iconAnchor: [20, 40]
              });
            }
            
            // Add markers
            const locations = ${JSON.stringify(locations)};
            const bounds = L.latLngBounds();
            
            locations.forEach(location => {
              let marker;
              let iconType = 'user';
              let label = '';
              
              if (location.type === 'user') {
                iconType = 'user';
                label = 'You';
              } else if (location.type === 'stop') {
                iconType = 'flag';
                label = 'Stop';
              } else if (location.type === 'hub') {
                iconType = 'mapPin';
                label = 'Hub';
              }
              
              marker = L.marker([location.lat, location.lng], {
                icon: createCustomIcon(location.color, iconType, location.isNearest, label)
              });
              
              // Popup content
              const nearestBadge = location.isNearest ? '<span class="nearest-badge">NEAREST</span>' : '';
              const typeLabel = location.type === 'stop' ? 'Bus Stop' : 
                               location.type === 'hub' ? 'Transportation Hub' : 
                               'Your Location';
              const buttonAction = location.type === 'stop' ? 'stop' : 
                                  location.type === 'hub' ? 'hub' : null;
              
              let popupContent = '<div class="popup-content">' +
                    '<div class="popup-title">' + location.name + nearestBadge + '</div>' +
                    '<div class="popup-subtitle">' + typeLabel + '</div>';
              
              if (location.distance) {
                popupContent += '<div class="popup-distance">' + location.distance + ' min walk</div>';
              }
              
              if (buttonAction) {
                popupContent += '<button class="popup-button" onclick="navigateToLocation(\\'' + buttonAction + '\\', \\'' + location.id + '\\')">' +
                                'View Details ↗' +
                              '</button>';
              }
              
              popupContent += '</div>';
              
              marker.bindPopup(popupContent);
              
              if (marker) {
                marker.addTo(map);
                bounds.extend([location.lat, location.lng]);
                
                // Auto-open popup for user location
                if (location.type === 'user') {
                  marker.openPopup();
                }
              }
            });
            
            // Fit map to bounds
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
            
            // Map loaded event
            map.whenReady(function() {
              window.ReactNativeWebView.postMessage('mapLoaded');
            });
        </script>
    </body>
    </html>
  `;
};

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapWrapper: {
    position: 'relative',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: 12,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    borderRadius: 12,
  },
  mapLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  mapSubText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  webViewFallback: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
});

export default InteractiveNearbyMap;