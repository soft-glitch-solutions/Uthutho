import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ZoomIn, ZoomOut, MapPin, Navigation, Users, Clock, User } from 'lucide-react-native';

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

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <View style={[styles.skeleton, styles.skeletonTitle]} />
            <View style={[styles.skeleton, styles.skeletonSubtitle]} />
          </View>
          <View style={[styles.skeleton, styles.skeletonButton]} />
        </View>
      </View>

      {/* Map Skeleton */}
      <View style={styles.mapContainer}>
        <View style={[styles.skeleton, styles.skeletonMap]} />
        <View style={styles.zoomControls}>
          <View style={[styles.skeleton, styles.skeletonZoomButton]} />
          <View style={[styles.skeleton, styles.skeletonZoomButton]} />
        </View>
      </View>

      {/* Legend Skeleton */}
      <View style={styles.legendContainer}>
        <View style={[styles.skeleton, styles.skeletonText]} />
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.skeleton, styles.skeletonDot]} />
            <View style={[styles.skeleton, styles.skeletonLegendText]} />
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.skeleton, styles.skeletonDot]} />
            <View style={[styles.skeleton, styles.skeletonLegendText]} />
          </View>
        </View>
      </View>

      {/* Content Skeleton */}
      <ScrollView style={styles.infoContainer}>
        {/* Status Card Skeleton */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.skeleton, styles.skeletonDot]} />
            <View style={[styles.skeleton, styles.skeletonStatusTitle]} />
          </View>
          <View style={[styles.skeleton, styles.skeletonText]} />
          <View style={[styles.skeleton, styles.skeletonSmallText]} />
        </View>

        {/* Participants Skeleton */}
        <View style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <View style={[styles.skeleton, styles.skeletonIcon]} />
            <View style={[styles.skeleton, styles.skeletonParticipantsTitle]} />
          </View>
          {[1, 2].map((item) => (
            <View key={item} style={styles.participantItem}>
              <View style={[styles.skeleton, styles.skeletonAvatar]} />
              <View style={styles.participantInfo}>
                <View style={[styles.skeleton, styles.skeletonText]} />
                <View style={[styles.skeleton, styles.skeletonSmallText]} />
                <View style={[styles.skeleton, styles.skeletonCoordinates]} />
              </View>
            </View>
          ))}
        </View>

        {/* Route Card Skeleton */}
        <View style={styles.routeCard}>
          <View style={[styles.skeleton, styles.skeletonRouteName]} />
          <View style={[styles.skeleton, styles.skeletonRouteType]} />
          <View style={[styles.skeleton, styles.skeletonText]} />
          <View style={[styles.skeleton, styles.skeletonText]} />
        </View>

        {/* Location Card Skeleton */}
        <View style={styles.locationCard}>
          {[1, 2].map((item) => (
            <View key={item} style={styles.locationItem}>
              <View style={[styles.skeleton, styles.skeletonDot]} />
              <View style={styles.locationText}>
                <View style={[styles.skeleton, styles.skeletonText]} />
                <View style={[styles.skeleton, styles.skeletonLocationName]} />
                <View style={[styles.skeleton, styles.skeletonCoordinates]} />
              </View>
            </View>
          ))}
        </View>

        {/* Actions Skeleton */}
        <View style={styles.actionsCard}>
          <View style={[styles.skeleton, styles.skeletonActionsTitle]} />
          <View style={styles.actionButtons}>
            <View style={[styles.skeleton, styles.skeletonActionButton]} />
            <View style={[styles.skeleton, styles.skeletonActionButton]} />
          </View>
        </View>

        {/* Footer Skeleton */}
        <View style={styles.footer}>
          <View style={[styles.skeleton, styles.skeletonSmallText]} />
          <View style={[styles.skeleton, styles.skeletonSmallText]} />
        </View>
      </ScrollView>
    </View>
  );
};

export default function JourneyShareScreen() {
  const params = useLocalSearchParams();
  const [journeyData, setJourneyData] = useState<SharedJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const journeyId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (journeyId && isValidUUID(journeyId)) {
      console.log('✅ [DEBUG] journeyId is valid UUID, loading data...');
      loadJourneyData();
      
      // Set up real-time subscriptions for location updates
      const subscription = setupRealtimeUpdates();
      return () => {
        subscription?.unsubscribe();
      };
    } else {
      console.log('❌ [DEBUG] Invalid journeyId:', journeyId);
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
          console.log('📍 Real-time location update:', payload);
          loadJourneyData(); // Reload data when locations update
        }
      )
      .subscribe();
  };

  const loadJourneyData = async () => {
    try {
      console.log('🚀 [DEBUG] Starting to load journey data for ID:', journeyId);

      // STEP 1: Get journey with route info
      console.log('📋 [DEBUG] STEP 1: Fetching journey data...');
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

      console.log('📋 [DEBUG] Journey query result:', { journey, journeyError });

      if (journeyError) {
        console.error('❌ [DEBUG] Journey fetch error:', journeyError);
        throw journeyError;
      }

      if (!journey) {
        console.log('❌ [DEBUG] No journey found with ID:', journeyId);
        throw new Error('Journey not found');
      }

      console.log('✅ [DEBUG] Journey found:', journey);

      // STEP 2: Get participants with GPS locations
      console.log('👥 [DEBUG] STEP 2: Fetching participants with locations...');
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

      console.log('👥 [DEBUG] Participants query result:', { participants, participantsError });

      if (participantsError) {
        console.error('❌ [DEBUG] Participants fetch error:', participantsError);
        throw participantsError;
      }

      // STEP 3: Get user's current stop from stop_waiting
      console.log('📍 [DEBUG] STEP 3: Fetching stop_waiting data...');
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

      console.log('📍 [DEBUG] Stop waiting query result:', { userWaiting, waitingError });

      if (waitingError) {
        console.error('❌ [DEBUG] Stop waiting fetch error:', waitingError);
        throw waitingError;
      }

      if (!userWaiting || !userWaiting.stops) {
        console.log('❌ [DEBUG] No active users found for this journey');
        throw new Error('No active users found for this journey');
      }

      console.log('✅ [DEBUG] User waiting data:', userWaiting);

      // STEP 4: Get next stop in sequence
      console.log('➡️ [DEBUG] STEP 4: Fetching next stop data...');
      let nextStop = null;
      const currentStopOrder = userWaiting.stops.order_number || 0;

      try {
        const { data: nextStopData, error: nextStopError } = await supabase
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

        console.log('➡️ [DEBUG] Next stop query result:', { nextStopData, nextStopError });

        if (!nextStopError && nextStopData) {
          nextStop = {
            name: nextStopData.stops.name,
            latitude: nextStopData.stops.latitude,
            longitude: nextStopData.stops.longitude,
            order_number: nextStopData.order_number,
          };
          console.log('✅ [DEBUG] Next stop found:', nextStop);
        } else {
          console.log('ℹ️ [DEBUG] No next stop found - probably final destination');
        }
      } catch (nextStopErr) {
        console.log('ℹ️ [DEBUG] Next stop query error (this is okay):', nextStopErr);
      }

      // STEP 5: Combine all data
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

      console.log('🎯 [DEBUG] Final journey data:', journeyData);
      setJourneyData(journeyData);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('✅ [DEBUG] Journey data loaded successfully!');

    } catch (err: any) {
      console.error('💥 [DEBUG] Error loading journey data:', err);
      
      if (err.code === '22P02') {
        setError('Invalid journey ID format');
      } else if (err.message?.includes('not found')) {
        setError('Journey not found or no longer active');
      } else if (err.message?.includes('No active users')) {
        setError('No one is currently active on this journey');
      } else {
        setError('Failed to load journey data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJourneyData();
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 10));
  };

  const openInMaps = () => {
    if (!journeyData) return;
    
    const url = `https://www.openstreetmap.org/?mlat=${journeyData.user_stop.latitude}&mlon=${journeyData.user_stop.longitude}#map=15/${journeyData.user_stop.latitude}/${journeyData.user_stop.longitude}`;
    Linking.openURL(url);
  };

  const openDirections = () => {
    if (!journeyData) return;
    
    const url = `https://www.openstreetmap.org/directions?from=&to=${journeyData.user_stop.latitude},${journeyData.user_stop.longitude}`;
    Linking.openURL(url);
  };

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

  // Generate custom markers with user profile photos
  const generateCustomMarkerUrl = (avatarUrl: string | null, firstName: string, lastName: string) => {
    if (avatarUrl) {
      // For users with avatars, we'll use a custom marker with their photo
      // Note: LocationIQ doesn't support custom image URLs directly
      // So we'll use different colored markers and show photos in the list
      return 'large-blue-cutout'; // Default blue marker for users with photos
    } else {
      // For users without avatars, use initial-based markers
      const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
      if (initials) {
        return `large-blue-${initials}`;
      }
      return 'large-blue-cutout';
    }
  };

  // Generate LocationIQ Static Map URL with multiple markers
  const generateLocationIQMapUrl = (journey: SharedJourneyData) => {
    const baseUrl = 'https://maps.locationiq.com/v3/staticmap';
    
    const markers = [];
    
    // User GPS locations with custom markers
    const usersWithGPS = journey.participants.filter(p => p.latitude && p.longitude);
    usersWithGPS.forEach((user, index) => {
      const markerType = generateCustomMarkerUrl(
        user.profiles.avatar_url,
        user.profiles.first_name,
        user.profiles.last_name
      );
      markers.push(`icon:${markerType}|${user.latitude},${user.longitude}`);
    });
    
    // Next stop (yellow marker) - if exists
    if (journey.next_stop) {
      markers.push(`icon:large-yellow-cutout|${journey.next_stop.latitude},${journey.next_stop.longitude}`);
    }
    
    // Current stop (green marker) - only show if no GPS users
    if (usersWithGPS.length === 0) {
      markers.push(`icon:large-green-cutout|${journey.user_stop.latitude},${journey.user_stop.longitude}`);
    }
    
    // Use the first GPS location or fallback to user stop for center
    const primaryLocation = usersWithGPS[0] || journey.user_stop;
    
    const params = new URLSearchParams({
      key: 'pk.b2d15bd53c7924b147a7acac22ee3e3e',
      center: `${primaryLocation.latitude},${primaryLocation.longitude}`,
      zoom: zoomLevel.toString(),
      size: '600x300',
      markers: markers.join('|'),
      format: 'png'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Show skeleton loader while loading
  if (loading && !journeyData) {
    return <SkeletonLoader />;
  }

  if (error || !journeyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {error || 'Journey not found'}
        </Text>
        <Text style={styles.subText}>
          The share link may have expired or the journey is no longer active.
        </Text>
      </View>
    );
  }

  const usersWithGPS = journeyData.participants.filter(p => p.latitude && p.longitude);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Uthutho Live Location</Text>
            <Text style={styles.subtitle}>
              {usersWithGPS.length > 0 ? 'Real-time GPS Tracking' : 'Route-based Location'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
            <RefreshCw size={20} color="#1ea2b1" style={refreshing ? styles.refreshing : null} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LocationIQ Static Map with Zoom Controls */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: generateLocationIQMapUrl(journeyData) }}
          style={styles.staticMap}
          resizeMode="cover"
        />
        
        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <ZoomIn size={16} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <ZoomOut size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapOverlay}>
          <Text style={styles.mapOverlayText}>Zoom: {zoomLevel}x • Powered by LocationIQ</Text>
        </View>
      </View>

      {/* Map Legend */}
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

      {/* Journey Info with Refresh Control */}
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
        {/* Location Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, usersWithGPS.length > 0 ? styles.liveDot : styles.estimatedDot]} />
            <Text style={styles.statusTitle}>
              {usersWithGPS.length > 0 ? 'Live GPS Location' : 'Estimated Location'}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {usersWithGPS.length > 0 
              ? `Tracking ${usersWithGPS.length} user${usersWithGPS.length > 1 ? 's' : ''} via GPS` 
              : 'Showing scheduled stop location'
            }
          </Text>
          {usersWithGPS.length > 0 && (
            <View style={styles.updateTime}>
              <Clock size={12} color="#666" />
              <Text style={styles.updateTimeText}>
                Updated {lastUpdate}
              </Text>
            </View>
          )}
        </View>

        {/* Participants with GPS Locations */}
        {usersWithGPS.length > 0 && (
          <View style={styles.participantsCard}>
            <View style={styles.participantsHeader}>
              <Users size={16} color="#1ea2b1" />
              <Text style={styles.participantsTitle}>
                Live Locations ({usersWithGPS.length})
              </Text>
            </View>
            {usersWithGPS.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                {participant.profiles.avatar_url ? (
                  <Image 
                    source={{ uri: participant.profiles.avatar_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <User size={20} color="#ffffff" />
                  </View>
                )}
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.profiles.first_name} {participant.profiles.last_name}
                  </Text>
                  <Text style={styles.participantStatus}>
                    {participant.status === 'waiting' ? 'Waiting' : 
                     participant.status === 'picked_up' ? 'On the way' : 'Arrived'}
                    {' • '}{getLocationAge(participant.last_location_update)}
                  </Text>
                  <Text style={styles.coordinates}>
                    {participant.latitude?.toFixed(6)}, {participant.longitude?.toFixed(6)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Route Information */}
        <View style={styles.routeCard}>
          <Text style={styles.routeName}>{journeyData.routes.name}</Text>
          <Text style={styles.routeType}>{journeyData.routes.transport_type}</Text>
          <View style={styles.routeEndpoints}>
            <Text style={styles.endpoint}>From: {journeyData.routes.start_point}</Text>
            <Text style={styles.endpoint}>To: {journeyData.routes.end_point}</Text>
          </View>
        </View>

        {/* Stop Information */}
        <View style={styles.locationCard}>
          <View style={styles.locationItem}>
            <View style={[styles.statusDot, styles.currentDot]} />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Current Location</Text>
              <Text style={styles.locationName}>{journeyData.user_stop.name}</Text>
              <Text style={styles.coordinates}>
                {journeyData.user_stop.latitude.toFixed(6)}, {journeyData.user_stop.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          {journeyData.next_stop ? (
            <View style={styles.locationItem}>
              <View style={[styles.statusDot, styles.nextDot]} />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Next Stop</Text>
                <Text style={styles.locationName}>{journeyData.next_stop.name}</Text>
                <Text style={styles.coordinates}>
                  {journeyData.next_stop.latitude.toFixed(6)}, {journeyData.next_stop.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.locationItem}>
              <View style={[styles.statusDot, styles.finalDot]} />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Status</Text>
                <Text style={styles.locationName}>Final Destination Reached</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Map Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
              <MapPin size={16} color="#1ea2b1" />
              <Text style={styles.actionButtonText}>View on Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={openDirections}>
              <Navigation size={16} color="#1ea2b1" />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {lastUpdate}
          </Text>
          <Text style={styles.footerText}>
            {usersWithGPS.length > 0 
              ? 'Live GPS tracking active • Pull down to refresh' 
              : 'Route-based tracking • Enable GPS for live location'
            }
          </Text>
          <Text style={styles.footerNote}>
            Map powered by LocationIQ • Zoom: {zoomLevel}x
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
    height: 300,
    width: '100%',
    position: 'relative',
  },
  staticMap: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    gap: 8,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#cccccc',
    fontSize: 10,
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
    backgroundColor: '#1ea2b1', // Blue
  },
  nextStopMarker: {
    backgroundColor: '#fbbf24', // Yellow
  },
  currentStopMarker: {
    backgroundColor: '#10b981', // Green
  },
  legendText: {
    fontSize: 12,
    color: '#cccccc',
  },
  // Info Container
  infoContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1ea2b1',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveDot: {
    backgroundColor: '#10b981',
  },
  estimatedDot: {
    backgroundColor: '#f59e0b',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  updateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateTimeText: {
    fontSize: 12,
    color: '#666666',
  },
  participantsCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace',
  },
  routeCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeType: {
    fontSize: 14,
    color: '#1ea2b1',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  routeEndpoints: {
    gap: 4,
  },
  endpoint: {
    fontSize: 14,
    color: '#cccccc',
  },
  locationCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  actionsCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 10,
    color: '#444444',
    textAlign: 'center',
    marginTop: 8,
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
  // Skeleton Loading Styles
  skeleton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 200,
    height: 24,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 150,
    height: 14,
  },
  skeletonButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  skeletonMap: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  skeletonZoomButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  skeletonText: {
    height: 14,
    width: '60%',
  },
  skeletonSmallText: {
    height: 12,
    width: '40%',
    marginTop: 4,
  },
  skeletonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  skeletonLegendText: {
    height: 12,
    width: 80,
  },
  skeletonStatusTitle: {
    height: 16,
    width: 120,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  skeletonParticipantsTitle: {
    height: 16,
    width: 140,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonCoordinates: {
    height: 11,
    width: 120,
  },
  skeletonRouteName: {
    height: 18,
    width: '70%',
    marginBottom: 4,
  },
  skeletonRouteType: {
    height: 14,
    width: '40%',
    marginBottom: 8,
  },
  skeletonLocationName: {
    height: 16,
    width: '80%',
    marginBottom: 4,
  },
  skeletonActionsTitle: {
    height: 16,
    width: 100,
    marginBottom: 12,
  },
  skeletonActionButton: {
    height: 44,
    flex: 1,
  },
});