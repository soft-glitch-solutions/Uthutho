import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Navigation, Users, Clock } from 'lucide-react-native';

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
      // Set up real-time updates
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
          console.log('📍 Real-time location update:', payload);
          // Refresh data when location updates
          loadJourneyData();
        }
      )
      .subscribe();
  };

  const loadJourneyData = async () => {
    try {
      console.log('🚀 Loading journey data for ID:', journeyId);

      // STEP 1: Get journey with route info
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

      // STEP 2: Get ALL active participants with their real-time locations
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

      console.log('📍 Participants with locations:', participants);

      // STEP 3: Get user's current stop from stop_waiting (fallback)
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

      // STEP 4: Get next stop in sequence
      let nextStop = null;
      if (userWaiting && !waitingError) {
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
            .eq('order_number', (userWaiting.stops.order_number || 0) + 1)
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
      }

      // STEP 5: Find the user with the most recent location
      const userWithLocation = participants?.find(p => p.latitude && p.longitude);
      const userStop = userWaiting?.stops;

      const journeyData = {
        ...journey,
        participants: participants || [],
        user_stop: {
          name: userWithLocation ? 'Current GPS Location' : (userStop?.name || 'Unknown Location'),
          latitude: userWithLocation?.latitude || userStop?.latitude || -33.9249,
          longitude: userWithLocation?.longitude || userStop?.longitude || 18.4241,
          order_number: userStop?.order_number || 0,
        },
        next_stop: nextStop,
      };

      setJourneyData(journeyData);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('✅ Journey data loaded with real-time locations');

    } catch (err: any) {
      console.error('💥 Error loading journey data:', err);
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

  const openInMaps = () => {
    if (!journeyData) return;
    
    const url = `https://www.openstreetmap.org/?mlat=${journeyData.user_stop.latitude}&mlon=${journeyData.user_stop.longitude}#map=17/${journeyData.user_stop.latitude}/${journeyData.user_stop.longitude}`;
    Linking.openURL(url);
  };

  const openDirections = () => {
    if (!journeyData) return;
    
    const url = `https://www.openstreetmap.org/directions?from=&to=${journeyData.user_stop.latitude},${journeyData.user_stop.longitude}#map=17/${journeyData.user_stop.latitude}/${journeyData.user_stop.longitude}`;
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1ea2b1" />
        <Text style={styles.loadingText}>Loading real-time location...</Text>
      </View>
    );
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

  const userWithGPS = journeyData.participants.find(p => p.latitude && p.longitude);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Uthutho Live Location</Text>
            <Text style={styles.subtitle}>
              {userWithGPS ? 'Real-time GPS Tracking' : 'Route-based Location'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={20} color="#1ea2b1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* OpenStreetMap with Custom Markers */}
      <View style={styles.mapContainer}>
        <iframe
          src={generateOpenStreetMapUrl(journeyData)}
          style={styles.mapIframe}
          frameBorder="0"
          scrolling="no"
          title="Live Location Map"
        />
      </View>

      {/* Profile Pictures Display Below Map */}
      <View style={styles.profileMarkersContainer}>
        <Text style={styles.profileMarkersTitle}>Live Locations:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileMarkersScroll}>
          {journeyData.participants
            .filter(p => p.latitude && p.longitude)
            .map((participant) => (
              <View key={participant.id} style={styles.profileMarker}>
                {participant.profiles.avatar_url ? (
                  <img 
                    src={participant.profiles.avatar_url} 
                    style={styles.profileMarkerImage}
                    alt={`${participant.profiles.first_name}'s location`}
                  />
                ) : (
                  <View style={[styles.profileMarkerImage, styles.profileMarkerPlaceholder]}>
                    <Text style={styles.profileMarkerText}>
                      {participant.profiles.first_name?.[0]}{participant.profiles.last_name?.[0]}
                    </Text>
                  </View>
                )}
                <Text style={styles.profileMarkerName}>
                  {participant.profiles.first_name}
                </Text>
              </View>
            ))}
        </ScrollView>
      </View>

      {/* Journey Info */}
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
            <View style={[styles.statusDot, userWithGPS ? styles.liveDot : styles.estimatedDot]} />
            <Text style={styles.statusTitle}>
              {userWithGPS ? 'Live GPS Location' : 'Estimated Location'}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {userWithGPS 
              ? 'Tracking real-time position via GPS' 
              : 'Showing scheduled stop location'
            }
          </Text>
          {userWithGPS?.last_location_update && (
            <View style={styles.updateTime}>
              <Clock size={12} color="#666" />
              <Text style={styles.updateTimeText}>
                Updated {getLocationAge(userWithGPS.last_location_update)}
              </Text>
            </View>
          )}
        </View>

        {/* Participants List */}
        {journeyData.participants.length > 0 && (
          <View style={styles.participantsCard}>
            <View style={styles.participantsHeader}>
              <Users size={16} color="#1ea2b1" />
              <Text style={styles.participantsTitle}>
                Traveling Together ({journeyData.participants.length})
              </Text>
            </View>
            {journeyData.participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                {participant.profiles.avatar_url ? (
                  <img 
                    src={participant.profiles.avatar_url} 
                    style={styles.avatar}
                    alt="Profile"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {participant.profiles.first_name?.[0]}{participant.profiles.last_name?.[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.profiles.first_name} {participant.profiles.last_name}
                  </Text>
                  <Text style={styles.participantStatus}>
                    {participant.status === 'waiting' ? 'Waiting' : 
                     participant.status === 'picked_up' ? 'On the way' : 'Arrived'}
                    {participant.latitude && ' • Live Location'}
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

        {/* Location Details */}
        <View style={styles.locationCard}>
          <View style={styles.locationItem}>
            <View style={[styles.statusDot, styles.currentDot]} />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>
                {userWithGPS ? 'Current GPS Position' : 'Current Stop'}
              </Text>
              <Text style={styles.locationName}>{journeyData.user_stop.name}</Text>
              <Text style={styles.coordinates}>
                {journeyData.user_stop.latitude.toFixed(6)}, {journeyData.user_stop.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          {journeyData.next_stop && (
            <View style={styles.locationItem}>
              <View style={[styles.statusDot, styles.nextDot]} />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Next Stop</Text>
                <Text style={styles.locationName}>{journeyData.next_stop.name}</Text>
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
            {userWithGPS 
              ? 'Live GPS tracking active • Pull down to refresh' 
              : 'Route-based tracking • Enable GPS for live location'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Generate OpenStreetMap URL with multiple markers
const generateOpenStreetMapUrl = (journey: SharedJourneyData) => {
  const baseUrl = 'https://www.openstreetmap.org/export/embed.html';
  
  const userWithGPS = journey.participants.find(p => p.latitude && p.longitude);
  const userLat = journey.user_stop.latitude;
  const userLon = journey.user_stop.longitude;
  
  // Calculate bounds to include all markers
  const allCoordinates = [
    { lat: userLat, lon: userLon },
    ...journey.participants
      .filter(p => p.latitude && p.longitude)
      .map(p => ({ lat: p.latitude!, lon: p.longitude! })),
    ...(journey.next_stop ? [{ lat: journey.next_stop.latitude, lon: journey.next_stop.longitude }] : [])
  ];

  const lats = allCoordinates.map(c => c.lat);
  const lons = allCoordinates.map(c => c.lon);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  
  const padding = 0.01;
  const bbox = `${minLon - padding},${minLat - padding},${maxLon + padding},${maxLat + padding}`;
  
  // Build markers - using different colors to distinguish
  let markers = '';
  
  // Add user location markers (blue)
  journey.participants
    .filter(p => p.latitude && p.longitude)
    .forEach((participant, index) => {
      if (markers) markers += '&';
      markers += `marker=${participant.latitude},${participant.longitude}`;
    });
  
  // Add next stop marker (yellow) if available
  if (journey.next_stop) {
    if (markers) markers += '&';
    markers += `marker=${journey.next_stop.latitude},${journey.next_stop.longitude}`;
  }
  
  // Add current stop marker (green) as fallback when no GPS
  if (!userWithGPS) {
    if (markers) markers += '&';
    markers += `marker=${journey.user_stop.latitude},${journey.user_stop.longitude}`;
  }
  
  return `${baseUrl}?bbox=${bbox}&layer=mapnik&${markers}`;
};

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
  mapContainer: {
    height: 300,
    width: '100%',
  },
  mapIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  // Profile markers below map
  profileMarkersContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  profileMarkersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  profileMarkersScroll: {
    flexDirection: 'row',
  },
  profileMarker: {
    alignItems: 'center',
    marginRight: 16,
  },
  profileMarkerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#1ea2b1',
  },
  profileMarkerPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMarkerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileMarkerName: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 4,
    fontWeight: '500',
  },
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
    alignItems: 'center',
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
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  currentDot: {
    backgroundColor: '#1ea2b1',
  },
  nextDot: {
    backgroundColor: '#fbbf24',
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
  },
  coordinates: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
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
});