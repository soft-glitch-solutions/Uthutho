


























































































































































































































































































import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Navigation, Users, Clock, User, Bus } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 375; // iPhone 6/7/8 size

interface SharedJourneyData {
  id: string;
  current_stop_sequence: number;
  routes: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
  participants: Array<{
    id: string;
    user_id: string;
    status: 'waiting' | 'picked_up' | 'arrived';
    latitude: number | null;
    longitude: number | null;
    last_location_update: string | null;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  }>;
  user_stop: {
    name: string;
    latitude: number;
    longitude: number;
    order_number: number;
  };
  next_stop: {
    name: string;
    latitude: number;
    longitude: number;
    order_number: number;
  } | null;
}

// Helper function for location age
const getLocationAge = (updateTime: string | null) => {
  if (!updateTime) return 'Unknown';
  const updateDate = new Date(updateTime);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
};

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Map Skeleton */}
      <View style={styles.skeletonMap} />
      
      {/* Legend Skeleton */}
      <View style={styles.skeletonLegend}>
        <View style={styles.skeletonText} />
        <View style={styles.skeletonLegendItems}>
          <View style={styles.skeletonLegendItem} />
          <View style={styles.skeletonLegendItem} />
        </View>
      </View>

      {/* Info Cards Skeleton */}
      <View style={styles.skeletonSection}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '60%' }]} />
          </View>
        </View>
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '60%' }]} />
          </View>
        </View>
      </View>

      {/* Route Info Skeleton */}
      <View style={styles.skeletonSection}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '80%' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Simple interactive map using OpenStreetMap
const InteractiveMap = ({ 
  usersWithGPS, 
  nextStop, 
  userStop 
}: { 
  usersWithGPS: any[];
  nextStop: any;
  userStop: any;
}) => {
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    const generateMapHtml = () => {
      // FIX: Filter out users with null/undefined coordinates
      const validUsersWithGPS = usersWithGPS.filter(u => 
        u.latitude != null && u.longitude != null && 
        !isNaN(u.latitude) && !isNaN(u.longitude)
      );

      const allLocations = [
        ...validUsersWithGPS.map(u => ({ 
          lat: u.latitude, 
          lng: u.longitude, 
          type: 'user', 
          data: u,
          avatarUrl: u.profiles?.avatar_url,
          firstName: u.profiles?.first_name || '',
          lastName: u.profiles?.last_name || '',
          status: u.status
        })),
        ...(nextStop && nextStop.latitude && nextStop.longitude ? [{ 
          lat: nextStop.latitude, 
          lng: nextStop.longitude, 
          type: 'next_stop', 
          data: nextStop,
          name: nextStop.name
        }] : []),
        ...(validUsersWithGPS.length === 0 && userStop && userStop.latitude && userStop.longitude ? [{ 
          lat: userStop.latitude, 
          lng: userStop.longitude, 
          type: 'current_stop', 
          data: userStop,
          name: userStop.name
        }] : [])
      ];

      if (allLocations.length === 0) {
        return generateEmptyMapHtml();
      }

      // Calculate bounds with valid coordinates only
      const validLocations = allLocations.filter(loc => 
        loc.lat != null && loc.lng != null && 
        !isNaN(loc.lat) && !isNaN(loc.lng)
      );

      if (validLocations.length === 0) {
        return generateEmptyMapHtml();
      }

      const lats = validLocations.map(loc => loc.lat);
      const lngs = validLocations.map(loc => loc.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Add padding
      const latPadding = (maxLat - minLat) * 0.1 || 0.01;
      const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

      const bounds = `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`;

      return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Journey Map</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  overflow: hidden;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                #map { 
                  height: 100vh; 
                  width: 100%; 
                  touch-action: pan-x pan-y;
                }
                
                /* User Marker with Profile Picture */
                .user-profile-marker {
                    border-radius: 50%;
                    border: 3px solid #1ea2b1;
                    box-shadow: 0 2px 6px rgba(30, 162, 177, 0.4), 0 1px 4px rgba(0,0,0,0.2);
                    width: ${IS_SMALL_SCREEN ? '40px' : '48px'};
                    height: ${IS_SMALL_SCREEN ? '40px' : '48px'};
                    overflow: hidden;
                    position: relative;
                    background-color: #1ea2b1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .user-profile-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .user-profile-fallback {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${IS_SMALL_SCREEN ? '14px' : '16px'};
                }
                
                .pulsing-marker::before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background-color: rgba(30, 162, 177, 0.2);
                    animation: pulse-ring 2s infinite;
                    z-index: -1;
                }
                
                /* Stop Markers */
                .stop-marker {
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: ${IS_SMALL_SCREEN ? '36px' : '40px'};
                    height: ${IS_SMALL_SCREEN ? '36px' : '40px'};
                    font-weight: bold;
                    font-size: ${IS_SMALL_SCREEN ? '14px' : '16px'};
                }
                
                @keyframes pulse-ring {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }
                
                .next-stop-marker { 
                    background-color: #fbbf24; 
                    color: white;
                }
                
                .current-stop-marker { 
                    background-color: #10b981; 
                    color: white;
                }

                .leaflet-popup-content {
                  font-size: ${IS_SMALL_SCREEN ? '12px' : '14px'};
                  max-width: 250px !important;
                }

                .leaflet-popup-content-wrapper {
                  border-radius: 8px;
                  max-width: 280px;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                // Initialize map
                const map = L.map('map', {
                  tap: false,
                  dragging: true,
                  touchZoom: true,
                  scrollWheelZoom: false,
                  doubleClickZoom: false,
                  boxZoom: false,
                  keyboard: false,
                  zoomControl: true
                }).setView([${(minLat + maxLat) / 2}, ${(minLng + maxLng) / 2}], 15);
                
                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                    minZoom: 10
                }).addTo(map);
                
                // Default avatar fallback
                const defaultAvatar = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop';
                
                // Create custom icons function
                function createCustomIcon(location) {
                  if (location.type === 'user') {
                    // User profile icon
                    const avatarUrl = location.avatarUrl || defaultAvatar;
                    const firstName = location.firstName || '';
                    const lastName = location.lastName || '';
                    const initials = (firstName?.[0] || '') + (lastName?.[0] || '') || 'U';
                    
                    // Status-based border colors
                    const statusColors = {
                        'waiting': '#fbbf24',
                        'picked_up': '#10b981',
                        'arrived': '#6b7280'
                    };
                    const borderColor = statusColors[location.status] || '#1ea2b1';
                    
                    return L.divIcon({
                      html: \`<div class="user-profile-marker pulsing-marker" style="border-color: \${borderColor};">
                                <img src="\${avatarUrl}" 
                                     alt="\${firstName} \${lastName}" 
                                     class="user-profile-image" 
                                     onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<div class=\\"user-profile-fallback\\" style=\\"background-color: \${borderColor};\\">\${initials.toUpperCase()}</div>';" />
                              </div>\`,
                      className: '',
                      iconSize: [${IS_SMALL_SCREEN ? 40 : 48}, ${IS_SMALL_SCREEN ? 40 : 48}],
                      iconAnchor: [${IS_SMALL_SCREEN ? 20 : 24}, ${IS_SMALL_SCREEN ? 40 : 48}]
                    });
                  } else if (location.type === 'next_stop') {
                    return L.divIcon({
                      html: \`<div class="stop-marker next-stop-marker">
                                <span>➡️</span>
                                <div style="
                                    position: absolute;
                                    bottom: -6px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: #fbbf24;
                                    color: white;
                                    font-size: ${IS_SMALL_SCREEN ? '8px' : '9px'};
                                    padding: 1px 4px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                    border: 2px solid white;
                                ">Next</div>
                              </div>\`,
                      className: '',
                      iconSize: [${IS_SMALL_SCREEN ? 36 : 40}, ${IS_SMALL_SCREEN ? 36 : 40}],
                      iconAnchor: [${IS_SMALL_SCREEN ? 18 : 20}, ${IS_SMALL_SCREEN ? 36 : 40}]
                    });
                  } else if (location.type === 'current_stop') {
                    return L.divIcon({
                      html: \`<div class="stop-marker current-stop-marker">
                                <span>🟢</span>
                                <div style="
                                    position: absolute;
                                    bottom: -6px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: #10b981;
                                    color: white;
                                    font-size: ${IS_SMALL_SCREEN ? '8px' : '9px'};
                                    padding: 1px 4px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                    border: 2px solid white;
                                ">Current</div>
                              </div>\`,
                      className: '',
                      iconSize: [${IS_SMALL_SCREEN ? 36 : 40}, ${IS_SMALL_SCREEN ? 36 : 40}],
                      iconAnchor: [${IS_SMALL_SCREEN ? 18 : 20}, ${IS_SMALL_SCREEN ? 36 : 40}]
                    });
                  }
                }
                
                // Add markers
                const locations = ${JSON.stringify(validLocations)};
                const bounds = L.latLngBounds();
                
                locations.forEach(location => {
                  try {
                    const marker = L.marker([location.lat, location.lng], {
                      icon: createCustomIcon(location)
                    });
                    
                    // Create popup content based on location type
                    if (location.type === 'user') {
                      const statusText = location.status === 'waiting' ? 'Waiting for pickup' :
                                        location.status === 'picked_up' ? 'On the way' :
                                        location.status === 'arrived' ? 'Arrived at destination' : location.status;
                      
                      const statusColors = {
                          'waiting': '#fbbf24',
                          'picked_up': '#10b981',
                          'arrived': '#6b7280'
                      };
                      const statusColor = statusColors[location.status] || '#666';
                      
                      const initials = (location.firstName?.[0] || '') + (location.lastName?.[0] || '') || 'U';
                      
                      marker.bindPopup(
                        '<div style="padding: 10px; max-width: 250px;">' +
                            '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
                                (location.avatarUrl ? 
                                    '<img src="' + location.avatarUrl + '" style="width: 32px; height: 32px; border-radius: 16px; object-fit: cover;" />' : 
                                    '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: ' + statusColor + '; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">' + 
                                    initials.toUpperCase() + '</div>'
                                ) +
                                '<div style="flex: 1; min-width: 0;">' +
                                    '<div style="font-weight: 600; font-size: 13px; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + 
                                    location.firstName + ' ' + location.lastName + '</div>' +
                                    '<div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">' +
                                        '<div style="width: 6px; height: 6px; border-radius: 3px; background-color: ' + statusColor + ';"></div>' +
                                        '<span style="font-size: 11px; color: #6b7280;">' + statusText + '</span>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            (location.data.last_location_update ? 
                                '<div style="font-size: 10px; color: #9ca3af; margin-top: 6px; line-height: 1.3;">' +
                                    '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) + '<br>' +
                                    'Updated ' + new Date(location.data.last_location_update).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) +
                                '</div>' : 
                                '<div style="font-size: 10px; color: #9ca3af; margin-top: 6px;">' +
                                    '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                                '</div>'
                            ) +
                        '</div>'
                      );
                    } else if (location.type === 'next_stop') {
                      marker.bindPopup(
                        '<div style="padding: 10px; max-width: 250px;">' +
                            '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
                                '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #fbbf24; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">➡️</div>' +
                                '<div style="flex: 1; min-width: 0;">' +
                                    '<div style="font-weight: 600; font-size: 13px; color: #1f2937;">Next Stop</div>' +
                                    '<div style="font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + location.name + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="font-size: 10px; color: #9ca3af; margin-top: 6px;">' +
                                '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                            '</div>' +
                        '</div>'
                      );
                    } else if (location.type === 'current_stop') {
                      marker.bindPopup(
                        '<div style="padding: 10px; max-width: 250px;">' +
                            '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
                                '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">🟢</div>' +
                                '<div style="flex: 1; min-width: 0;">' +
                                    '<div style="font-weight: 600; font-size: 13px; color: #1f2937;">Current Stop</div>' +
                                    '<div style="font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + location.name + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="font-size: 10px; color: #9ca3af; margin-top: 6px;">' +
                                '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                            '</div>' +
                        '</div>'
                      );
                    }
                    
                    marker.addTo(map);
                    bounds.extend([location.lat, location.lng]);
                  } catch (error) {
                    console.error('Error adding marker:', error);
                  }
                });
                
                // Fit map to bounds
                if (bounds.isValid()) {
                  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 });
                }
                
                // Auto-open popups for user markers if there are only a few
                if (locations.filter(l => l.type === 'user').length <= 3) {
                  setTimeout(() => {
                    locations.forEach(location => {
                      if (location.type === 'user') {
                        const marker = L.marker([location.lat, location.lng]).getPopup();
                        if (marker) marker.openPopup();
                      }
                    });
                  }, 1000);
                }

                // Disable map interaction on touch devices to prevent scrolling issues
                map.touchZoom.disable();
                map.doubleClickZoom.disable();
                map.scrollWheelZoom.disable();
                map.boxZoom.disable();
                map.keyboard.disable();

                // Handle map load
                map.whenReady(function() {
                  console.log('Map loaded successfully');
                });
              </script>
        </body>
        </html>
      `;
    };

    setMapHtml(generateMapHtml());
  }, [usersWithGPS, nextStop, userStop]);

  // Function for empty map
  const generateEmptyMapHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Journey Map</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: #1a1a1a;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .no-location {
                text-align: center;
                color: #666;
                padding: 20px;
              }
              .no-location h3 {
                color: #ccc;
                margin-bottom: 8px;
              }
          </style>
      </head>
      <body>
          <div class="no-location">
              <h3>No Active Locations</h3>
              <p>Waiting for users to share their location...</p>
          </div>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.mapContainer}>
      {mapHtml ? (
        <iframe
          srcDoc={mapHtml}
          style={styles.mapIframe}
          title="Interactive Journey Map"
          onError={(e) => {
            console.error('Map iframe error:', e);
            setMapHtml(generateEmptyMapHtml());
          }}
        />
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#1ea2b1" />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
};

// User Status Card Component
const UserStatusCard = ({ user }: { user: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#fbbf24';
      case 'picked_up': return '#10b981';
      case 'arrived': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for pickup';
      case 'picked_up': return 'On the way';
      case 'arrived': return 'Arrived at destination';
      default: return status;
    }
  };

  return (
    <View style={styles.userCard}>
      <View style={styles.userAvatarContainer}>
        {user.profiles?.avatar_url ? (
          <Image 
            source={{ uri: user.profiles.avatar_url }} 
            style={styles.userAvatar}
            onError={() => console.log('Failed to load avatar')}
          />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {user.profiles?.first_name?.[0] || 'U'}{user.profiles?.last_name?.[0] || ''}
            </Text>
          </View>
        )}
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(user.status) }
          ]} 
        />
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.profiles?.first_name || 'Unknown'} {user.profiles?.last_name || ''}
        </Text>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: getStatusColor(user.status) }
            ]} 
          />
          <Text style={styles.userStatus}>{getStatusText(user.status)}</Text>
        </View>
        {user.last_location_update && (
          <Text style={styles.locationTime}>
            Updated {getLocationAge(user.last_location_update)}
          </Text>
        )}
      </View>
    </View>
  );
};

// Route Info Component
const RouteInfoCard = ({ journeyData }: { journeyData: SharedJourneyData }) => {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Bus size={IS_SMALL_SCREEN ? 18 : 20} color="#1ea2b1" />
        <Text style={styles.routeTitle}>Route Information</Text>
      </View>
      
      <View style={styles.routeDetails}>
        <Text style={styles.routeName} numberOfLines={1}>
          {journeyData.routes.name}
        </Text>
        <Text style={styles.routeType}>
          {journeyData.routes.transport_type || 'Transport'} • Stop {journeyData.user_stop.order_number}
        </Text>
        
        <View style={styles.routeStops}>
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.startDot]} />
            <Text style={styles.stopText} numberOfLines={1}>
              {journeyData.routes.start_point}
            </Text>
          </View>
          
          <View style={styles.stopConnector} />
          
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.currentDot]} />
            <Text style={styles.stopText} numberOfLines={1}>
              Current: {journeyData.user_stop.name}
            </Text>
          </View>
          
          {journeyData.next_stop && (
            <>
              <View style={styles.stopConnector} />
              <View style={styles.stopItem}>
                <View style={[styles.stopDot, styles.nextDot]} />
                <Text style={styles.stopText} numberOfLines={1}>
                  Next: {journeyData.next_stop.name}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.stopConnector} />
          
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.endDot]} />
            <Text style={styles.stopText} numberOfLines={1}>
              {journeyData.routes.end_point}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function JourneyShareScreen() {
  const params = useLocalSearchParams();
  const [journeyData, setJourneyData] = useState<SharedJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const journeyId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (journeyId && isValidUUID(journeyId)) {
      loadJourneyData();
      const subscription = setupRealtimeUpdates();
      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setError('Invalid journey link');
      setLoading(false);
    }
  }, [journeyId]);

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const setupRealtimeUpdates = () => {
    if (!journeyId) return;

    return supabase
      .channel(`journey-location-${journeyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journey_participants',
          filter: `journey_id=eq.${journeyId}`
        },
        (payload) => {
          loadJourneyData();
        }
      )
      .subscribe();
  };

  const loadJourneyData = async () => {
    try {
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select(`
          id,
          current_stop_sequence,
          route_id,
          routes (
            name,
            transport_type,
            start_point,
            end_point
          )
        `)
        .eq('id', journeyId)
        .single();

      if (journeyError) {
        console.error('Journey error:', journeyError);
        throw journeyError;
      }
      if (!journey) throw new Error('Journey not found');

      const { data: participants, error: participantsError } = await supabase
        .from('journey_participants')
        .select(`
          id,
          user_id,
          status,
          latitude,
          longitude,
          last_location_update,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('journey_id', journeyId)
        .eq('is_active', true);

      if (participantsError) {
        console.error('Participants error:', participantsError);
        throw participantsError;
      }

      // FIX: Get any user waiting, not just the first one
      const { data: waitingData, error: waitingError } = await supabase
        .from('stop_waiting')
        .select(`
          stops (
            id,
            name,
            latitude,
            longitude,
            order_number
          )
        `)
        .eq('journey_id', journeyId)
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single

      let userStop = null;
      if (waitingData && waitingData.stops) {
        userStop = {
          name: waitingData.stops.name,
          latitude: waitingData.stops.latitude,
          longitude: waitingData.stops.longitude,
          order_number: waitingData.stops.order_number,
        };
      } else if (participants && participants.length > 0) {
        // If no waiting data, use the first participant's info if available
        const firstParticipant = participants[0];
        // Try to get a stop from route_stops based on journey's current_stop_sequence
        const { data: currentStopData } = await supabase
          .from('route_stops')
          .select(`
            stops (id, name, latitude, longitude),
            order_number
          `)
          .eq('route_id', journey.route_id)
          .eq('order_number', journey.current_stop_sequence || 0)
          .maybeSingle();

        if (currentStopData && currentStopData.stops) {
          userStop = {
            name: currentStopData.stops.name,
            latitude: currentStopData.stops.latitude,
            longitude: currentStopData.stops.longitude,
            order_number: currentStopData.order_number,
          };
        }
      }

      if (!userStop) {
        throw new Error('Could not determine current stop');
      }

      let nextStop = null;
      const currentStopOrder = userStop.order_number || 0;

      try {
        const { data: nextStopData } = await supabase
          .from('route_stops')
          .select(`
            order_number,
            stops (
              id,
              name,
              latitude,
              longitude
            )
          `)
          .eq('route_id', journey.route_id)
          .eq('order_number', currentStopOrder + 1)
          .maybeSingle();

        if (nextStopData && nextStopData.stops) {
          nextStop = {
            name: nextStopData.stops.name,
            latitude: nextStopData.stops.latitude,
            longitude: nextStopData.stops.longitude,
            order_number: nextStopData.order_number,
          };
        }
      } catch (nextStopErr) {
        console.log('No next stop found');
      }

      const journeyData = {
        ...journey,
        participants: participants || [],
        user_stop: userStop,
        next_stop: nextStop,
      };

      setJourneyData(journeyData);
      setLastUpdate(new Date().toLocaleTimeString());

    } catch (err: any) {
      console.error('Error loading journey data:', err);
      setError('Failed to load journey data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJourneyData();
  };

  if (loading && !journeyData) {
    return <SkeletonLoader />;
  }

  if (error || !journeyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Journey not found'}</Text>
        <Text style={styles.subText}>
          The share link may have expired or the journey is no longer active.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // FIX: Filter participants with valid GPS coordinates
  const usersWithGPS = journeyData.participants.filter(p => 
    p.latitude != null && p.longitude != null && 
    !isNaN(p.latitude) && !isNaN(p.longitude)
  );
  
  const waitingUsers = journeyData.participants.filter(p => p.status === 'waiting');
  const pickedUpUsers = journeyData.participants.filter(p => p.status === 'picked_up');
  const arrivedUsers = journeyData.participants.filter(p => p.status === 'arrived');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title} numberOfLines={1}>
              Uthutho Live Location
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {usersWithGPS.length > 0 ? 'Real-time GPS Tracking' : 'Route-based Location'}
              {lastUpdate && ` • Updated ${lastUpdate}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
            <RefreshCw size={IS_SMALL_SCREEN ? 18 : 20} color="#1ea2b1" style={refreshing ? styles.refreshing : null} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map */}
      <InteractiveMap
        usersWithGPS={usersWithGPS}
        nextStop={journeyData.next_stop}
        userStop={journeyData.user_stop}
      />

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Map Markers:</Text>
        <View style={styles.legendItems}>
          {usersWithGPS.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.userMarker]} />
              <Text style={styles.legendText}>
                Users ({usersWithGPS.length})
              </Text>
            </View>
          )}
          {journeyData.next_stop && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.nextStopMarker]} />
              <Text style={styles.legendText}>Next Stop</Text>
            </View>
          )}
          {usersWithGPS.length === 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.currentStopMarker]} />
              <Text style={styles.legendText}>Current Stop</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.infoContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={["#1ea2b1"]}
          />
        }
      >
        {/* User Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={IS_SMALL_SCREEN ? 18 : 20} color="#ffffff" />
            <Text style={styles.sectionTitle}>
              Passengers ({journeyData.participants.length})
            </Text>
          </View>

          {/* Status Summary */}
          <View style={styles.statusSummary}>
            <View style={styles.statusItem}>
              <Text style={styles.statusCount}>{waitingUsers.length}</Text>
              <Text style={styles.statusLabel}>Waiting</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusCount}>{pickedUpUsers.length}</Text>
              <Text style={styles.statusLabel}>On Trip</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusCount}>{arrivedUsers.length}</Text>
              <Text style={styles.statusLabel}>Arrived</Text>
            </View>
          </View>

          {/* User Cards */}
          {journeyData.participants.map((user) => (
            <UserStatusCard key={user.id} user={user} />
          ))}
        </View>

        {/* Route Information */}
        <RouteInfoCard journeyData={journeyData} />

        {/* Last Update */}
        <View style={styles.updateContainer}>
          <Text style={styles.updateText}>
            Last updated: {lastUpdate}
          </Text>
        </View>
        
        {/* Extra padding for small screens */}
        {IS_SMALL_SCREEN && <View style={{ height: 20 }} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingTop: IS_SMALL_SCREEN ? 35 : 40,
    paddingBottom: IS_SMALL_SCREEN ? 16 : 20,
    paddingHorizontal: IS_SMALL_SCREEN ? 16 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: IS_SMALL_SCREEN ? 20 : 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    color: '#cccccc',
    marginTop: 4,
    lineHeight: IS_SMALL_SCREEN ? 16 : 18,
  },
  refreshButton: {
    padding: IS_SMALL_SCREEN ? 6 : 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    minWidth: 40,
    alignItems: 'center',
  },
  refreshing: {
    opacity: 0.5,
  },
  // Map Container
  mapContainer: {
    height: IS_SMALL_SCREEN ? 300 : 350,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  mapLoadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
  },
  // Legend
  legendContainer: {
    backgroundColor: '#1a1a1a',
    padding: IS_SMALL_SCREEN ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  legendTitle: {
    fontSize: IS_SMALL_SCREEN ? 13 : 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: IS_SMALL_SCREEN ? 6 : 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: IS_SMALL_SCREEN ? 12 : 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_SMALL_SCREEN ? 5 : 6,
  },
  legendMarker: {
    width: IS_SMALL_SCREEN ? 10 : 12,
    height: IS_SMALL_SCREEN ? 10 : 12,
    borderRadius: IS_SMALL_SCREEN ? 5 : 6,
  },
  userMarker: {
    backgroundColor: '#1ea2b1',
  },
  nextStopMarker: {
    backgroundColor: '#fbbf24',
  },
  currentStopMarker: {
    backgroundColor: '#10b981',
  },
  legendText: {
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    color: '#cccccc',
  },
  infoContainer: {
    flex: 1,
  },
  // Sections
  section: {
    padding: IS_SMALL_SCREEN ? 14 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_SMALL_SCREEN ? 6 : 8,
    marginBottom: IS_SMALL_SCREEN ? 14 : 16,
  },
  sectionTitle: {
    fontSize: IS_SMALL_SCREEN ? 16 : 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Status Summary
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: IS_SMALL_SCREEN ? 14 : 16,
    marginBottom: IS_SMALL_SCREEN ? 14 : 16,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusCount: {
    fontSize: IS_SMALL_SCREEN ? 20 : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: IS_SMALL_SCREEN ? 10 : 12,
    color: '#cccccc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // User Cards
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: IS_SMALL_SCREEN ? 10 : 12,
    marginBottom: IS_SMALL_SCREEN ? 8 : 10,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: IS_SMALL_SCREEN ? 10 : 12,
  },
  userAvatar: {
    width: IS_SMALL_SCREEN ? 44 : 48,
    height: IS_SMALL_SCREEN ? 44 : 48,
    borderRadius: IS_SMALL_SCREEN ? 22 : 24,
  },
  userAvatarPlaceholder: {
    width: IS_SMALL_SCREEN ? 44 : 48,
    height: IS_SMALL_SCREEN ? 44 : 48,
    borderRadius: IS_SMALL_SCREEN ? 22 : 24,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: IS_SMALL_SCREEN ? 10 : 12,
    height: IS_SMALL_SCREEN ? 10 : 12,
    borderRadius: IS_SMALL_SCREEN ? 5 : 6,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  userInfo: {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  userName: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: IS_SMALL_SCREEN ? 7 : 8,
    height: IS_SMALL_SCREEN ? 7 : 8,
    borderRadius: IS_SMALL_SCREEN ? 3.5 : 4,
    marginRight: IS_SMALL_SCREEN ? 5 : 6,
  },
  userStatus: {
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    color: '#cccccc',
    flex: 1,
  },
  locationTime: {
    fontSize: IS_SMALL_SCREEN ? 10 : 12,
    color: '#666666',
  },
  // Route Card
  routeCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: IS_SMALL_SCREEN ? 14 : 16,
    margin: IS_SMALL_SCREEN ? 14 : 16,
    marginTop: 0,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_SMALL_SCREEN ? 6 : 8,
    marginBottom: IS_SMALL_SCREEN ? 10 : 12,
  },
  routeTitle: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  routeDetails: {
    gap: IS_SMALL_SCREEN ? 6 : 8,
  },
  routeName: {
    fontSize: IS_SMALL_SCREEN ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeType: {
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    color: '#cccccc',
    marginBottom: IS_SMALL_SCREEN ? 10 : 12,
  },
  routeStops: {
    gap: 4,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_SMALL_SCREEN ? 6 : 8,
    minHeight: 24,
  },
  stopDot: {
    width: IS_SMALL_SCREEN ? 7 : 8,
    height: IS_SMALL_SCREEN ? 7 : 8,
    borderRadius: IS_SMALL_SCREEN ? 3.5 : 4,
    flexShrink: 0,
  },
  startDot: {
    backgroundColor: '#10b981',
  },
  currentDot: {
    backgroundColor: '#1ea2b1',
  },
  nextDot: {
    backgroundColor: '#fbbf24',
  },
  endDot: {
    backgroundColor: '#ef4444',
  },
  stopConnector: {
    width: 2,
    height: IS_SMALL_SCREEN ? 10 : 12,
    backgroundColor: '#666666',
    marginLeft: IS_SMALL_SCREEN ? 2.5 : 3,
    flexShrink: 0,
  },
  stopText: {
    fontSize: IS_SMALL_SCREEN ? 13 : 14,
    color: '#cccccc',
    flex: 1,
    flexWrap: 'wrap',
  },
  // Update Container
  updateContainer: {
    padding: IS_SMALL_SCREEN ? 14 : 16,
    alignItems: 'center',
  },
  updateText: {
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    color: '#666666',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 16 : 18,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subText: {
    color: '#cccccc',
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skeletonMap: {
    height: IS_SMALL_SCREEN ? 300 : 350,
    backgroundColor: '#2a2a2a',
  },
  skeletonLegend: {
    backgroundColor: '#1a1a1a',
    padding: IS_SMALL_SCREEN ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLegendItems: {
    flexDirection: 'row',
    gap: IS_SMALL_SCREEN ? 12 : 16,
  },
  skeletonLegendItem: {
    width: 80,
    height: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  skeletonSection: {
    padding: IS_SMALL_SCREEN ? 14 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 16,
    width: '60%',
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: IS_SMALL_SCREEN ? 10 : 12,
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: IS_SMALL_SCREEN ? 44 : 48,
    height: IS_SMALL_SCREEN ? 44 : 48,
    borderRadius: IS_SMALL_SCREEN ? 22 : 24,
    backgroundColor: '#333333',
    marginRight: IS_SMALL_SCREEN ? 10 : 12,
  },
  skeletonContent: {
    flex: 1,
  },
});