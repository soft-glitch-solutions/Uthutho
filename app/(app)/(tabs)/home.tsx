import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';

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

const FavoritesSkeleton = ({ colors }) => {
  return (
    <View style={styles.grid}>
      {[1, 2, 3].map((i) => (
        <Shimmer key={i} colors={colors}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '60%' }]} />
          </View>
        </Shimmer>
      ))}
    </View>
  );
};

const NearestLocationsSkeleton = ({ colors }) => {
  return (
    <View style={styles.grid}>
      {[1, 2].map((i) => (
        <Shimmer key={i} colors={colors}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '80%' }]} />
            <View style={[styles.skeletonDistance, { backgroundColor: colors.border }]} />
          </View>
        </Shimmer>
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [favoriteInput, setFavoriteInput] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [nearestLocations, setNearestLocations] = useState(null);
  const [isNearestLoading, setIsNearestLoading] = useState(false);

  // Fetch the user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, selected_title, favorites')
          .eq('id', (await supabase.auth.getSession()).data.session?.user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        router.replace('/auth');
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch the user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    })();
  }, []);

  // Fetch nearest locations when userLocation changes
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearestLocations = async () => {
      setIsNearestLoading(true);
      try {
        const { data: stops } = await supabase.from('stops').select('*');
        const { data: hubs } = await supabase.from('hubs').select('*');
        const { data: routes } = await supabase.from('routes').select('*');

        const nearestStop = findNearestLocation(userLocation, stops || []);
        const nearestHub = findNearestLocation(userLocation, hubs || []);
        const nearestRoute = findNearestLocation(userLocation, routes || []);

        setNearestLocations({ nearestStop, nearestHub, nearestRoute });
      } catch (error) {
        console.error('Error fetching nearest locations:', error);
      } finally {
        setIsNearestLoading(false);
      }
    };

    fetchNearestLocations();
  }, [userLocation]);

  // Helper function to calculate the nearest location
  const findNearestLocation = (userLocation, locations) => {
    let nearestLocation = null;
    let minDistance = Infinity;

    locations.forEach((location) => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        location.latitude,
        location.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    });

    return nearestLocation;
  };

  // Helper function to calculate distance (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Navigate to favorite details
  const handleFavoritePress = (favorite) => {
    router.push(`/favorite-details?favoriteId=${favorite}`);
  };

  // Navigate to nearest stop details
  const handleNearestStopPress = (stopId) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  // Navigate to nearest hub details
  const handleNearestHubPress = (hubId) => {
    router.push(`/hub-details?hubId=${hubId}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Personalized Greeting */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Hi, {isProfileLoading ? 'Loading...' : userProfile?.first_name || 'User'}!
        </Text>
        {/* Navigate to Favorites when the plus button is pressed */}
        <Pressable onPress={() => router.push('/favorites')} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Favorites List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Favorites</Text>
        {isProfileLoading ? (
          <FavoritesSkeleton colors={colors} />
        ) : userProfile?.favorites?.length ? (
          <View style={styles.grid}>
            {userProfile.favorites.map((favorite, index) => (
              <Pressable
                key={index}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => handleFavoritePress(favorite)}
              >
                <Text style={[styles.cardText, { color: colors.text }]}>{favorite}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.text }]}>No favorites added yet.</Text>
        )}
      </View>

      {/* Nearest Locations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby You</Text>
        {locationError ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{locationError}</Text>
          </View>
        ) : isNearestLoading || !userLocation ? (
          <NearestLocationsSkeleton colors={colors} />
        ) : (
          <View style={styles.grid}>
            {/* Nearest Stop */}
            <Pressable
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => nearestLocations?.nearestStop && 
                handleNearestStopPress(nearestLocations.nearestStop.id)}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Nearest Stop</Text>
              {nearestLocations?.nearestStop ? (
                <>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    {nearestLocations.nearestStop.name}
                  </Text>
                  <Text style={[styles.distanceText, { color: colors.text }]}>
                    Distance: {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      nearestLocations.nearestStop.latitude,
                      nearestLocations.nearestStop.longitude
                    ).toFixed(2)} km
                  </Text>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text }]}>No stops found.</Text>
              )}
            </Pressable>

            {/* Nearest Hub */}
            <Pressable
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => nearestLocations?.nearestHub && 
                handleNearestHubPress(nearestLocations.nearestHub.id)}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Nearest Hub</Text>
              {nearestLocations?.nearestHub ? (
                <>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    {nearestLocations.nearestHub.name}
                  </Text>
                  <Text style={[styles.distanceText, { color: colors.text }]}>
                    Distance: {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      nearestLocations.nearestHub.latitude,
                      nearestLocations.nearestHub.longitude
                    ).toFixed(2)} km
                  </Text>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text }]}>No hubs found.</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: '48%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
  },
  distanceText: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
  skeletonTitle: {
    height: 18,
    width: '40%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDistance: {
    height: 12,
    width: '30%',
    borderRadius: 4,
    marginTop: 8,
  },
});