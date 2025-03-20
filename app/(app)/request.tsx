import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const SkeletonLoader = ({ colors }) => (
  <View style={styles.skeletonContainer}>
    <View style={[styles.skeletonCard, { backgroundColor: colors.text }]} />
    <View style={[styles.skeletonCard, { backgroundColor: colors.primary }]} />
    <View style={[styles.skeletonCard, { backgroundColor: colors.primary }]} />
  </View>
);

export default function RequestScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [hubRequests, setHubRequests] = useState([]);
  const [stopRequests, setStopRequests] = useState([]);
  const [routeRequests, setRouteRequests] = useState([]);
  const [priceChangeRequests, setPriceChangeRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch requests for the signed-in user
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.session) {
          throw new Error('No user session found. Please log in.');
        }

        const userId = session.session.user.id;

        // Fetch hub requests
        const { data: hubData, error: hubError } = await supabase
          .from('hub_requests')
          .select('*')
          .eq('user_id', userId);

        if (hubError) throw hubError;

        // Fetch stop requests
        const { data: stopData, error: stopError } = await supabase
          .from('stop_requests')
          .select('*')
          .eq('user_id', userId);

        if (stopError) throw stopError;

        // Fetch route requests
        const { data: routeData, error: routeError } = await supabase
          .from('route_requests')
          .select('*')
          .eq('user_id', userId);

        if (routeError) throw routeError;

        // Fetch price change requests
        const { data: priceChangeData, error: priceChangeError } = await supabase
          .from('price_change_requests')
          .select('*, routes(name)') 
          .eq('user_id', userId);

        if (priceChangeError) throw priceChangeError;

        setHubRequests(hubData || []);
        setStopRequests(stopData || []);
        setRouteRequests(routeData || []);
        setPriceChangeRequests(priceChangeData || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        Alert.alert('Error', 'Failed to fetch requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (isLoading) {
    return <SkeletonLoader colors={colors} />;
  }

  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString(); // Format as a readable date and time
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hub Requests */}
      {hubRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hub Requests</Text>
          {hubRequests.map((request) => (
            <View key={request.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{request.name}</Text>
              <Text style={[styles.cardStatus, { color: colors.primary }]}>Status: {request.status}</Text>
              <Text style={[styles.cardTimestamp, { color: colors.text }]}>
                Created: {formatTimestamp(request.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stop Requests */}
      {stopRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stop Requests</Text>
          {stopRequests.map((request) => (
            <View key={request.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{request.name}</Text>
              <Text style={[styles.cardStatus, { color: colors.primary }]}>Status: {request.status}</Text>
              <Text style={[styles.cardTimestamp, { color: colors.text }]}>
                Created: {formatTimestamp(request.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Route Requests */}
      {routeRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Route Requests</Text>
          {routeRequests.map((request) => (
            <View key={request.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {request.start_point} → {request.end_point}
              </Text>
              <Text style={[styles.cardStatus, { color: colors.primary }]}>Status: {request.status}</Text>
              <Text style={[styles.cardTimestamp, { color: colors.text }]}>
                Created: {formatTimestamp(request.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Price Change Requests */}
      {priceChangeRequests.length > 0 && (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Change Requests</Text>
    {priceChangeRequests.map((request) => (
      <View key={request.id} style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Current Price: {request.current_price} → New Price: {request.new_price}
        </Text>
        <Text style={[styles.cardStatus, { color: colors.primary }]}>Status: {request.status}</Text>
        <Pressable
          onPress={() => router.push(`/route-details?routeId=${request.route_id}`)} // Navigate to route details
        >
          <Text style={[styles.routeLink, { color: colors.primary }]}>
            Route: {request.routes?.name || 'Unknown Route'}
          </Text>
        </Pressable>
        <Text style={[styles.cardTimestamp, { color: colors.text }]}>
          Created: {formatTimestamp(request.created_at)}
        </Text>
        <Text style={[styles.cardTimestamp, { color: colors.text }]}>
          Updated: {formatTimestamp(request.updated_at)}
        </Text>
      </View>
    ))}
  </View>
)}

      {/* No Requests */}
      {hubRequests.length === 0 && stopRequests.length === 0 && routeRequests.length === 0 && priceChangeRequests.length === 0 && (
        <View style={styles.noRequestsContainer}>
          <Text style={[styles.noRequestsText, { color: colors.text }]}>
            Ooh, you don't have any requests yet. Get your TP points by exploring and updating our list!
          </Text>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/routes')}
          >
            <Text style={styles.exploreButtonText}>Explore Routes</Text>
          </Pressable>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/hubs')}
          >
            <Text style={styles.exploreButtonText}>Explore Hubs</Text>
          </Pressable>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/stops')}
          >
            <Text style={styles.exploreButtonText}>Explore Stops</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  cardTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: 'gray',
  },
  noRequestsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 20,
  },
  noRequestsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
});