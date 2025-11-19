import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { supabase } from '@/lib/supabase';

interface SharedJourneyData {
  id: string;
  current_stop_sequence: number;
  routes: {
    name: string;
    transport_type: string;
    start_point: string;
    end_point: string;
  };
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
  const [error, setError] = useState<string | null>(null);

  // Use 'id' instead of 'journeyId' since that's what Expo Router is providing
  const journeyId = Array.isArray(params.id) 
    ? params.id[0] 
    : params.id;

  console.log('🔍 [DEBUG] Route params received:', params);
  console.log('🔍 [DEBUG] Extracted journeyId:', journeyId);

  useEffect(() => {
    if (journeyId && isValidUUID(journeyId)) {
      console.log('✅ [DEBUG] journeyId is valid UUID, loading data...');
      loadJourneyData();
    } else {
      console.log('❌ [DEBUG] Invalid journeyId:', journeyId);
      setError('Invalid journey link');
      setLoading(false);
    }
  }, [journeyId]);

  // Helper function to validate UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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

      // STEP 2: Get user's current stop from stop_waiting
      console.log('📍 [DEBUG] STEP 2: Fetching stop_waiting data...');
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

      // STEP 3: Get next stop in sequence
      console.log('➡️ [DEBUG] STEP 3: Fetching next stop data...');
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

      // STEP 4: Combine all data
      const journeyData = {
        ...journey,
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
    }
  };

  const openInMaps = () => {
    if (!journeyData) return;
    
    // Open in OpenStreetMap
    const url = `https://www.openstreetmap.org/?mlat=${journeyData.user_stop.latitude}&mlon=${journeyData.user_stop.longitude}#map=15/${journeyData.user_stop.latitude}/${journeyData.user_stop.longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1ea2b1" />
        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Uthutho Location</Text>
        <Text style={styles.subtitle}>Real-time Location Sharing</Text>
      </View>

      {/* OpenStreetMap */}
      <View style={styles.mapContainer}>
        <iframe
          src={generateOpenStreetMapUrl(journeyData)}
          style={styles.mapIframe}
          frameBorder="0"
          scrolling="no"
          title="Journey Location Map"
        />
      </View>

      {/* Journey Info */}
      <View style={styles.infoContainer}>
        <View style={styles.routeCard}>
          <Text style={styles.routeName}>{journeyData.routes.name}</Text>
          <Text style={styles.routeType}>{journeyData.routes.transport_type}</Text>
          <View style={styles.routeEndpoints}>
            <Text style={styles.endpoint}>From: {journeyData.routes.start_point}</Text>
            <Text style={styles.endpoint}>To: {journeyData.routes.end_point}</Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationItem}>
            <View style={[styles.statusDot, styles.currentDot]} />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Current Location</Text>
              <Text style={styles.locationName}>{journeyData.user_stop.name}</Text>
            </View>
          </View>

          {journeyData.next_stop ? (
            <View style={styles.locationItem}>
              <View style={[styles.statusDot, styles.nextDot]} />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Heading To</Text>
                <Text style={styles.locationName}>{journeyData.next_stop.name}</Text>
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

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Need Directions?</Text>
          <Text style={styles.actionsText} onPress={openInMaps}>
            Open in OpenStreetMap →
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Shared via Uthutho • Location updates automatically
          </Text>
        </View>
      </View>
    </View>
  );
}

// Generate OpenStreetMap URL with markers
const generateOpenStreetMapUrl = (journey: SharedJourneyData) => {
  const baseUrl = 'https://www.openstreetmap.org/export/embed.html';
  
  if (journey.next_stop) {
    // Calculate bounds to fit both markers
    const minLon = Math.min(journey.user_stop.longitude, journey.next_stop.longitude) - 0.01;
    const minLat = Math.min(journey.user_stop.latitude, journey.next_stop.latitude) - 0.01;
    const maxLon = Math.max(journey.user_stop.longitude, journey.next_stop.longitude) + 0.01;
    const maxLat = Math.max(journey.user_stop.latitude, journey.next_stop.latitude) + 0.01;
    
    return `${baseUrl}?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${journey.user_stop.latitude},${journey.user_stop.longitude}&marker=${journey.next_stop.latitude},${journey.next_stop.longitude}`;
  } else {
    // Just show current location with zoom
    const lon = journey.user_stop.longitude;
    const lat = journey.user_stop.latitude;
    return `${baseUrl}?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
  }
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 4,
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
  infoContainer: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1ea2b1',
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
    borderRadius: 12,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  currentDot: {
    backgroundColor: '#1ea2b1',
  },
  nextDot: {
    backgroundColor: '#fbbf24',
  },
  finalDot: {
    backgroundColor: '#10b981',
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
  actionsCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  actionsText: {
    fontSize: 14,
    color: '#1ea2b1',
  },
  footer: {
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
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