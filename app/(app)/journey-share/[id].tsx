import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Navigation, Users, Clock, User, Bus } from 'lucide-react-native';

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
      const allLocations = [
        ...usersWithGPS.map(u => ({ lat: u.latitude!, lng: u.longitude!, type: 'user', data: u })),
        ...(nextStop ? [{ lat: nextStop.latitude, lng: nextStop.longitude, type: 'next_stop', data: nextStop }] : []),
        ...(usersWithGPS.length === 0 ? [{ lat: userStop.latitude, lng: userStop.longitude, type: 'current_stop', data: userStop }] : [])
      ];

      if (allLocations.length === 0) return '';

      // Calculate bounds
      const lats = allLocations.map(loc => loc.lat);
      const lngs = allLocations.map(loc => loc.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Add padding
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;

      const bounds = `${minLng - lngPadding},${minLat - latPadding},${maxLng + lngPadding},${maxLat + latPadding}`;

      return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Journey Map</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { height: 100vh; width: 100%; }
                
                /* User Marker with Profile Picture */
                .user-profile-marker {
                    border-radius: 50%;
                    border: 3px solid #1ea2b1;
                    box-shadow: 0 4px 12px rgba(30, 162, 177, 0.4), 0 2px 8px rgba(0,0,0,0.3);
                    width: 50px;
                    height: 50px;
                    overflow: hidden;
                    position: relative;
                    animation: pulse 2s infinite;
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
                    font-size: 18px;
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
                
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 4px 12px rgba(30, 162, 177, 0.4), 0 2px 8px rgba(0,0,0,0.3);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 6px 16px rgba(30, 162, 177, 0.6), 0 3px 10px rgba(0,0,0,0.4);
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: 0 4px 12px rgba(30, 162, 177, 0.4), 0 2px 8px rgba(0,0,0,0.3);
                    }
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
                
                /* Stop Markers */
                .stop-marker {
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .next-stop-marker { 
                    background-color: #fbbf24; 
                    color: white;
                }
                
                .current-stop-marker { 
                    background-color: #10b981; 
                    color: white;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                // Initialize map
                const map = L.map('map').setView([${(minLat + maxLat) / 2}, ${(minLng + maxLng) / 2}], 13);
                
                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                
                // Create custom icons
                function createUserIcon(avatarUrl, firstName, lastName, status) {
                    const initials = (firstName?.[0] || '') + (lastName?.[0] || '');
                    
                    // Status-based border colors
                    const statusColors = {
                        'waiting': '#fbbf24',
                        'picked_up': '#10b981',
                        'arrived': '#6b7280'
                    };
                    const borderColor = statusColors[status] || '#1ea2b1';
                    
                    if (avatarUrl) {
                        return L.divIcon({
                            html: \`
                                <div class="user-profile-marker" style="border-color: \${borderColor};">
                                    <img src="\${avatarUrl}" 
                                         alt="\${firstName} \${lastName}"
                                         class="user-profile-image"
                                         onerror="this.onerror=null; 
                                                  this.style.display='none'; 
                                                  this.parentNode.innerHTML='<div class=\"user-profile-fallback\" style=\"background-color: \${borderColor};\">\${initials.toUpperCase()}</div>';" />
                                </div>
                            \`,
                            className: '',
                            iconSize: [50, 50],
                            iconAnchor: [25, 50]
                        });
                    } else {
                        return L.divIcon({
                            html: \`
                                <div class="user-profile-marker" style="border-color: \${borderColor}; background-color: \${borderColor};">
                                    <div class="user-profile-fallback">\${initials.toUpperCase()}</div>
                                </div>
                            \`,
                            className: '',
                            iconSize: [50, 50],
                            iconAnchor: [25, 50]
                        });
                    }
                }
                
                function createStopIcon(color, type) {
                    const emoji = type === 'next_stop' ? '➡️' : '🟢';
                    const label = type === 'next_stop' ? 'Next Stop' : 'Current Stop';
                    return L.divIcon({
                        html: \`
                            <div class="stop-marker \${type}-marker" style="background-color: \${color};">
                                <span>\${emoji}</span>
                                <div style="
                                    position: absolute;
                                    bottom: -8px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: \${color};
                                    color: white;
                                    font-size: 9px;
                                    padding: 1px 6px;
                                    border-radius: 10px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                    border: 2px solid white;
                                ">\${label}</div>
                            </div>
                        \`,
                        className: '',
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    });
                }
                
                // Add markers
                const locations = ${JSON.stringify(allLocations)};
                const bounds = L.latLngBounds();
                
                locations.forEach(location => {
                    let marker;
                    
                    if (location.type === 'user') {
                        marker = L.marker([location.lat, location.lng], {
                            icon: createUserIcon(
                                location.data.profiles.avatar_url,
                                location.data.profiles.first_name,
                                location.data.profiles.last_name,
                                location.data.status
                            )
                        });
                        
                        // Enhanced popup with better styling
                        const statusText = location.data.status === 'waiting' ? 'Waiting for pickup' :
                                          location.data.status === 'picked_up' ? 'On the way' :
                                          location.data.status === 'arrived' ? 'Arrived at destination' : location.data.status;
                        
                        const statusColors = {
                            'waiting': '#fbbf24',
                            'picked_up': '#10b981',
                            'arrived': '#6b7280'
                        };
                        const statusColor = statusColors[location.data.status] || '#666';
                        
                        const initials = (location.data.profiles.first_name?.[0] || '') + 
                                       (location.data.profiles.last_name?.[0] || '');
                        
                        marker.bindPopup(
                            '<div style="padding: 12px; min-width: 200px;">' +
                                '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
                                    (location.data.profiles.avatar_url ? 
                                        '<img src="' + location.data.profiles.avatar_url + '" style="width: 32px; height: 32px; border-radius: 16px; object-fit: cover;" />' : 
                                        '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: ' + statusColor + '; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">' + 
                                        initials.toUpperCase() + '</div>'
                                    ) +
                                    '<div style="flex: 1;">' +
                                        '<div style="font-weight: 600; font-size: 14px; color: #1f2937;">' + 
                                        location.data.profiles.first_name + ' ' + location.data.profiles.last_name + '</div>' +
                                        '<div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">' +
                                            '<div style="width: 8px; height: 8px; border-radius: 4px; background-color: ' + statusColor + ';"></div>' +
                                            '<span style="font-size: 12px; color: #6b7280;">' + statusText + '</span>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                (location.data.last_location_update ? 
                                    '<div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">' +
                                        '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) + '<br>' +
                                        'Updated ' + new Date(location.data.last_location_update).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) +
                                    '</div>' : 
                                    '<div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">' +
                                        '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                                    '</div>'
                                ) +
                            '</div>'
                        );
                        
                    } else if (location.type === 'next_stop') {
                        marker = L.marker([location.lat, location.lng], {
                            icon: createStopIcon('#fbbf24', 'next_stop')
                        });
                        
                        marker.bindPopup(
                            '<div style="padding: 12px; min-width: 200px;">' +
                                '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
                                    '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #fbbf24; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">➡️</div>' +
                                    '<div style="flex: 1;">' +
                                        '<div style="font-weight: 600; font-size: 14px; color: #1f2937;">Next Stop</div>' +
                                        '<div style="font-size: 13px; color: #6b7280;">' + location.data.name + '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">' +
                                    '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                                '</div>' +
                            '</div>'
                        );
                        
                    } else if (location.type === 'current_stop') {
                        marker = L.marker([location.lat, location.lng], {
                            icon: createStopIcon('#10b981', 'current_stop')
                        });
                        
                        marker.bindPopup(
                            '<div style="padding: 12px; min-width: 200px;">' +
                                '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
                                    '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">🟢</div>' +
                                    '<div style="flex: 1;">' +
                                        '<div style="font-weight: 600; font-size: 14px; color: #1f2937;">Current Stop</div>' +
                                        '<div style="font-size: 13px; color: #6b7280;">' + location.data.name + '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">' +
                                    '📍 ' + location.lat.toFixed(6) + ', ' + location.lng.toFixed(6) +
                                '</div>' +
                            '</div>'
                        );
                    }
                    
                    if (marker) {
                        marker.addTo(map);
                        bounds.extend([location.lat, location.lng]);
                    }
                });
                
                // Fit map to bounds
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [20, 20] });
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
            </script>
        </body>
        </html>
      `;
    };

    setMapHtml(generateMapHtml());
  }, [usersWithGPS, nextStop, userStop]);

  return (
    <View style={styles.mapContainer}>
      {mapHtml ? (
        <iframe
          srcDoc={mapHtml}
          style={styles.mapIframe}
          title="Interactive Journey Map"
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
        {user.profiles.avatar_url ? (
          <Image 
            source={{ uri: user.profiles.avatar_url }} 
            style={styles.userAvatar}
          />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {user.profiles.first_name?.[0]}{user.profiles.last_name?.[0]}
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
        <Text style={styles.userName}>
          {user.profiles.first_name} {user.profiles.last_name}
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
        <Bus size={20} color="#1ea2b1" />
        <Text style={styles.routeTitle}>Route Information</Text>
      </View>
      
      <View style={styles.routeDetails}>
        <Text style={styles.routeName}>{journeyData.routes.name}</Text>
        <Text style={styles.routeType}>
          {journeyData.routes.transport_type || 'Transport'} • Stop {journeyData.user_stop.order_number}
        </Text>
        
        <View style={styles.routeStops}>
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.startDot]} />
            <Text style={styles.stopText}>{journeyData.routes.start_point}</Text>
          </View>
          
          <View style={styles.stopConnector} />
          
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.currentDot]} />
            <Text style={styles.stopText}>
              Current: {journeyData.user_stop.name}
            </Text>
          </View>
          
          {journeyData.next_stop && (
            <>
              <View style={styles.stopConnector} />
              <View style={styles.stopItem}>
                <View style={[styles.stopDot, styles.nextDot]} />
                <Text style={styles.stopText}>
                  Next: {journeyData.next_stop.name}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.stopConnector} />
          
          <View style={styles.stopItem}>
            <View style={[styles.stopDot, styles.endDot]} />
            <Text style={styles.stopText}>{journeyData.routes.end_point}</Text>
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

      if (journeyError) throw journeyError;
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

      if (participantsError) throw participantsError;

      const { data: userWaiting, error: waitingError } = await supabase
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
        .single();

      if (waitingError) throw waitingError;
      if (!userWaiting || !userWaiting.stops) {
        throw new Error('No active users found for this journey');
      }

      let nextStop = null;
      const currentStopOrder = userWaiting.stops.order_number || 0;

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
          .single();

        if (nextStopData) {
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
        user_stop: {
          name: userWaiting.stops.name,
          latitude: userWaiting.stops.latitude,
          longitude: userWaiting.stops.longitude,
          order_number: userWaiting.stops.order_number,
        },
        next_stop: nextStop,
      };

      setJourneyData(journeyData);
      setLastUpdate(new Date().toLocaleTimeString());

    } catch (err: any) {
      console.error('Error loading journey data:', err);
      setError('Failed to load journey data');
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
      </View>
    );
  }

  const usersWithGPS = journeyData.participants.filter(p => p.latitude && p.longitude);
  const waitingUsers = journeyData.participants.filter(p => p.status === 'waiting');
  const pickedUpUsers = journeyData.participants.filter(p => p.status === 'picked_up');
  const arrivedUsers = journeyData.participants.filter(p => p.status === 'arrived');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Uthutho Live Location</Text>
            <Text style={styles.subtitle}>
              {usersWithGPS.length > 0 ? 'Real-time GPS Tracking' : 'Route-based Location'}
              {lastUpdate && ` • Updated ${lastUpdate}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
            <RefreshCw size={20} color="#1ea2b1" style={refreshing ? styles.refreshing : null} />
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
              <Text style={styles.legendText}>User Locations ({usersWithGPS.length})</Text>
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
            <Users size={20} color="#ffffff" />
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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  refreshing: {
    opacity: 0.5,
  },
  // Map Container
  mapContainer: {
    height: 400,
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
    fontSize: 16,
  },
  // Legend
  legendContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 12,
    color: '#cccccc',
  },
  infoContainer: {
    flex: 1,
  },
  // Sections
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Status Summary
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
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
    padding: 12,
    marginBottom: 8,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  userStatus: {
    fontSize: 14,
    color: '#cccccc',
  },
  locationTime: {
    fontSize: 12,
    color: '#666666',
  },
  // Route Card
  routeCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  routeDetails: {
    gap: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeType: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 12,
  },
  routeStops: {
    gap: 4,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    height: 12,
    backgroundColor: '#666666',
    marginLeft: 3,
  },
  stopText: {
    fontSize: 14,
    color: '#cccccc',
  },
  // Update Container
  updateContainer: {
    padding: 16,
    alignItems: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#666666',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skeletonMap: {
    height: 400,
    backgroundColor: '#2a2a2a',
  },
  skeletonLegend: {
    backgroundColor: '#1a1a1a',
    padding: 12,
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
    gap: 16,
  },
  skeletonLegendItem: {
    width: 80,
    height: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  skeletonSection: {
    padding: 16,
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
    padding: 12,
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
});