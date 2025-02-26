import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// Add the Shimmer component
const Shimmer = ({ children, colors }) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmerAnimation());
    };

    shimmerAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

// Add skeleton components
const RouteDetailsSkeleton = ({ colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonText, { width: '60%' }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonText, { width: '80%' }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonText, { width: '40%' }]} />
      </Shimmer>
    </View>
  );
};

export default function RouteDetailsScreen() {
  const { routeId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouteDetails();
  }, [routeId]);

  const fetchRouteDetails = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;
      setRoute(routeData);

      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId);

      if (stopsError) throw stopsError;

      // Fetch waiting count for each stop
      const stopsWithWaitingCount = await Promise.all(
        stopsData.map(async (stop) => {
          const { data: waitingData, error: waitingError } = await supabase
            .from('stop_waiting')
            .select('id')
            .eq('stop_id', stop.id)
            .gt('expires_at', new Date().toISOString());

          if (waitingError) throw waitingError;
          return { ...stop, waitingCount: waitingData.length };
        })
      );

      setStops(stopsWithWaitingCount);
    } catch (error) {
      console.error('Error fetching route details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{route?.name}</Text>
        <Text style={[styles.details, { color: colors.text }]}>
          {route?.start_point} → {route?.end_point}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          Price: R{route?.cost}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stops</Text>
          {stops.map((stop) => (
            <Pressable
              key={stop.id}
              style={styles.stopItem}
              onPress={() => router.push(`/stop-details?stopId=${stop.id}`)}
            >
              <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
              <Text style={[styles.stopDetails, { color: colors.text }]}>
                {stop.latitude}, {stop.longitude}
              </Text>
              <Text style={[styles.waitingPeople, { color: colors.text }]}>
                People waiting: {stop.waitingCount}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  details: {
    fontSize: 16,
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  stopItem: {
    marginBottom: 15,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stopDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  waitingPeople: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
    backgroundColor: '#ccc',
  },
}); 