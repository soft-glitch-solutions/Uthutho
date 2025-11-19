import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, RefreshControl, ScrollView, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RefreshCw, MapPin, Navigation, Users, Clock, User } from 'lucide-react-native';

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
          loadJourneyData();
        }
      )
      .subscribe();
  };

  const loadJourneyData = async () => {
    try {
      console.log('🚀 Loading journey data for ID:', journeyId);

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
    
    const url = `https://www.google.com/maps/search/?api=1&query=${journeyData.user_stop.latitude},${journeyData.user_stop.longitude}`;
    Linking.openURL(url);
  };

  const openDirections = () => {
    if (!journeyData) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${journeyData.user_stop.latitude},${journeyData.user_stop.longitude}`;
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

  const generateStaticMapUrl = (journey: SharedJourneyData) => {
    const usersWithGPS = journey.participants.filter(p => p.latitude && p.longitude);
    const primaryLocation = usersWithGPS[0] || journey.user_stop;
    
    // Base URL for Google Static Maps
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    
    // Map parameters
    const size = '600x300';
    const zoom = '15';
    const mapType = 'roadmap';
    const scale = '2'; // For better quality on mobile
    
    // Center map on primary location
    const center = `${primaryLocation.latitude},${primaryLocation.longitude}`;
    
    // Create markers for different locations
    const markers = [];
    
    // User GPS locations (blue markers)
    usersWithGPS.forEach((user, index) => {
      const label = String.fromCharCode(65 + index); // A, B, C, etc.
      markers.push(`color:blue|label:${label}|${user.latitude},${user.longitude}`);
    });
    
    // Next stop (yellow marker)
    if (journey.next_stop) {
      markers.push(`color:yellow|label:N|${journey.next_stop.latitude},${journey.next_stop.longitude}`);
    }
    
    // Current stop (green marker) - only show if no GPS users
    if (usersWithGPS.length === 0) {
      markers.push(`color:green|label:S|${journey.user_stop.latitude},${journey.user_stop.longitude}`);
    }
    
    // Combine all parameters
    const params = new URLSearchParams({
      center: center,
      zoom: zoom,
      size: size,
      maptype: mapType,
      scale: scale,
      markers: markers.join('&markers='),
    });
    
    return `${baseUrl}?${params.toString()}`;
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
  const usersWithLocations = journeyData.participants.filter(p => p.latitude && p.longitude);

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

      {/* Map Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Map Markers:</Text>
        <View style={styles.legendItems}>
          {usersWithLocations.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.userMarker]} />
              <Text style={styles.legendText}>User Locations ({usersWithLocations.length})</Text>
            </View>
          )}
          {journeyData.next_stop && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.nextStopMarker]} />
              <Text style={styles.legendText}>Next Stop (N)</Text>
            </View>
          )}
          {!userWithGPS && (
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, styles.currentStopMarker]} />
              <Text style={styles.legendText}>Current Stop (S)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Static Google Map */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: generateStaticMapUrl(journeyData) }}
          style={styles.staticMap}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.mapOverlay} onPress={openInMaps}>
          <Text style={styles.mapOverlayText}>Tap to open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Location Coordinates Display */}
      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesTitle}>All Locations:</Text>
        
        {/* User Locations with Labels */}
        {usersWithLocations.map((participant, index) => (
          <View key={participant.id} style={styles.coordinateItem}>
            <View style={styles.coordinateHeader}>
              <View style={[styles.coordinateLabel, styles.userLabel]}>
                <Text style={styles.coordinateLabelText}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              {participant.profiles.avatar_url ? (
                <img 
                  src={participant.profiles.avatar_url} 
                  style={styles.coordinateAvatar}
                  alt={`${participant.profiles.first_name}'s location`}
                />
              ) : (
                <View style={[styles.coordinateAvatar, styles.coordinateAvatarPlaceholder]}>
                  <Text style={styles.coordinateAvatarText}>
                    {participant.profiles.first_name?.[0]}{participant.profiles.last_name?.[0]}
                  </Text>
                </View>
              )}
              <View style={styles.coordinateInfo}>
                <Text style={styles.coordinateName}>
                  {participant.profiles.first_name} {participant.profiles.last_name}
                </Text>
                <Text style={styles.coordinateStatus}>
                  Live Location • {getLocationAge(participant.last_location_update)}
                </Text>
              </View>
            </View>
            <Text style={styles.coordinateText}>
              📍 {participant.latitude?.toFixed(6)}, {participant.longitude?.toFixed(6)}
            </Text>
          </View>
        ))}

        {/* Next Stop */}
        {journeyData.next_stop && (
          <View style={styles.coordinateItem}>
            <View style={styles.coordinateHeader}>
              <View style={[styles.coordinateLabel, styles.nextStopLabel]}>
                <Text style={styles.coordinateLabelText}>N</Text>
              </View>
              <View style={styles.coordinateInfo}>
                <Text style={styles.coordinateName}>Next Stop</Text>
                <Text style={styles.coordinateStatus}>Scheduled Stop</Text>
              </View>
            </View>
            <Text style={styles.coordinateText}>
              📍 {journeyData.next_stop.latitude.toFixed(6)}, {journeyData.next_stop.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationName}>{journeyData.next_stop.name}</Text>
          </View>
        )}

        {/* Current Stop (fallback) */}
        {!userWithGPS && (
          <View style={styles.coordinateItem}>
            <View style={styles.coordinateHeader}>
              <View style={[styles.coordinateLabel, styles.currentStopLabel]}>
                <Text style={styles.coordinateLabelText}>S</Text>
              </View>
              <View style={styles.coordinateInfo}>
                <Text style={styles.coordinateName}>Current Stop</Text>
                <Text style={styles.coordinateStatus}>Scheduled Location</Text>
              </View>
            </View>
            <Text style={styles.coordinateText}>
              📍 {journeyData.user_stop.latitude.toFixed(6)}, {journeyData.user_stop.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationName}>{journeyData.user_stop.name}</Text>
          </View>
        )}
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
              ? `Tracking ${usersWithLocations.length} user${usersWithLocations.length > 1 ? 's' : ''} via GPS` 
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
          <Text style={styles.footerNote}>
            Static map updates every refresh • Tap map for interactive version
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
  // Map Legend
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
  // Static Map
  mapContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  staticMap: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  // Coordinates Display
  coordinatesContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  coordinatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  coordinateItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  coordinateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinateLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userLabel: {
    backgroundColor: '#1ea2b1',
  },
  nextStopLabel: {
    backgroundColor: '#fbbf24',
  },
  currentStopLabel: {
    backgroundColor: '#10b981',
  },
  coordinateLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coordinateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  coordinateAvatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordinateAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coordinateInfo: {
    flex: 1,
  },
  coordinateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  coordinateStatus: {
    fontSize: 12,
    color: '#cccccc',
  },
  coordinateText: {
    fontSize: 12,
    color: '#1ea2b1',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    color: '#ffffff',
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
});