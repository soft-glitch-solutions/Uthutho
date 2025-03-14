import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const SkeletonLoader = ({ colors }) => (
  <View style={styles.skeletonContainer}>
    <View style={[styles.skeletonCard, { backgroundColor: colors.card }]} />
    <View style={[styles.skeletonCard, { backgroundColor: colors.card }]} />
    <View style={[styles.skeletonCard, { backgroundColor: colors.card }]} />
  </View>
);

// ... existing imports ...

export default function RequestScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [hubRequests, setHubRequests] = useState([]);
    const [stopRequests, setStopRequests] = useState([]);
    const [routeRequests, setRouteRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  
    // Fetch requests for the signed-in user
    useEffect(() => {
      const fetchRequests = async () => {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.user) return;
  
          // Fetch hub requests
          const { data: hubData, error: hubError } = await supabase
            .from('hub_requests')
            .select('*')
            .eq('user_id', session.user.id);
  
          if (hubError) throw hubError;
  
          // Fetch stop requests
          const { data: stopData, error: stopError } = await supabase
            .from('stop_requests')
            .select('*')
            .eq('user_id', session.user.id);
  
          if (stopError) throw stopError;
  
          // Fetch route requests
          const { data: routeData, error: routeError } = await supabase
            .from('route_requests')
            .select('*')
            .eq('user_id', session.user.id);
  
          if (routeError) throw routeError;
  
          setHubRequests(hubData || []);
          setStopRequests(stopData || []);
          setRouteRequests(routeData || []);
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
              </View>
            ))}
          </View>
        )}
  
        {/* No Requests */}
        {hubRequests.length === 0 && stopRequests.length === 0 && routeRequests.length === 0 && (
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