import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert, Animated, Platform  } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Flag, MapPin, Route, Search, Plus, ChevronRight } from 'lucide-react-native'; // Updated icon imports
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import StopBlock from '../../../components/stop/StopBlock';
import LoginStreakTracker from '@/components/LoginStreakTracker';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';

import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

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
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [nearestLocations, setNearestLocations] = useState(null);
  const [isNearestLoading, setIsNearestLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteDetails, setFavoriteDetails] = useState([]); // State to store favorite details
  const navigation = useNavigation();


  useEffect(() => {
    // Initialize AdMob for testing (only on mobile)
    if (Platform.OS !== 'web') {
      setTestDeviceIDAsync('EMULATOR');
    }
  }, []);
  // Fetch the user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user.id;

        if (!userId) {
          router.replace('/auth');
          return;
        }

        setUserId(userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, selected_title, favorites, points')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUserProfile(data);

        // Fetch favorite details after profile is loaded
        if (data?.favorites?.length) {
          const details = await Promise.all(
            data.favorites.map(async (favorite) => {
              const details = await handleFavoritePress(favorite);
              return { name: favorite, ...details };
            })
          );
          setFavoriteDetails(details);
        }
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

  const openSidebar = () => {
    navigation.toggleDrawer();
  };

  // Navigate to favorite details based on type
  const handleFavoritePress = async (favoriteName) => {
    try {
      // Check if the favorite is a hub
      const { data: hubData, error: hubError } = await supabase
        .from('hubs')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (hubData && !hubError) {
        return { type: 'hub', id: hubData.id };
      }

      // Check if the favorite is a stop
      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (stopData && !stopError) {
        return { type: 'stop', id: stopData.id };
      }

      // Check if the favorite is a route
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (routeData && !routeError) {
        return { type: 'route', id: routeData.id };
      }

      // If the favorite type is unknown, show an error
      Alert.alert('Error', 'Favorite type not recognized.');
      return null;
    } catch (error) {
      console.error('Error fetching favorite details:', error);
      Alert.alert('Error', 'Failed to fetch favorite details.');
      return null;
    }
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
<View style={styles.topHeader}>
        {/* Left Side: Logo and UTHUTHO Text */}
        <Pressable onPress={openSidebar} style={styles.logoContainer}>
          <Image
            source={require('../../../assets/uthutho-logo.png')} // Replace with your logo path
            style={styles.logo}
          />
          <Text style={[styles.uthuthoText, { color: colors.text }]}>Uthutho</Text>
        </Pressable>
        {/* Right Side: User Points */}
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, { color: colors.text }]}>TP - {userProfile?.points || 0}</Text>
        </View>
      </View>

      {/* Banner Ad (only on mobile) */}
      {Platform.OS !== 'web' ? (
        <View style={styles.bannerContainer}>
          <AdMobBanner
            bannerSize="smartBannerPortrait"
            adUnitID="ca-app-pub-3940256099942544/6300978111" // Test ID for Android
            servePersonalizedAds
            onDidFailToReceiveAdWithError={(error) => console.log(error)}
          />
        </View>
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Text style={styles.bannerPlaceholderText}>Ad placeholder for web</Text>
        </View>
      )}

      {/* Personalized Greeting */}
      <View style={styles.header}>
        <View>
          {/* First Row: Greeting and Plus Button */}
          <View style={styles.firstRow}>
            <Pressable onPress={() => router.push('/profile')}>
              <Text style={[styles.title, { color: colors.text }]}>
                Hi, {isProfileLoading ? 'Loading...' : userProfile?.first_name || 'User'}!
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/favorites')} style={styles.addButton}>
              <Search size={24} color={colors.text} />
            </Pressable>
          </View>
          {/* Second Row: Selected Title */}
          {!isProfileLoading && userProfile?.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {userProfile.selected_title}
            </Text>
          )}
        </View>
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
        onPress={() => nearestLocations?.nearestStop && handleNearestStopPress(nearestLocations.nearestStop.id)}
      >
        <View style={styles.favoriteItem}>
          <Flag size={24} color={colors.text} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>Nearest Stop</Text>
        </View>
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
            {/* Add the StopBlock component here */}
            <StopBlock
              stopId={nearestLocations.nearestStop.id}
              stopName={nearestLocations.nearestStop.name}
              stopLocation={{
                latitude: nearestLocations.nearestStop.latitude,
                longitude: nearestLocations.nearestStop.longitude,
              }}
              colors={colors}
              radius={0.5} // Adjust the radius as needed
            />
          </>
        ) : (
          <Text style={[styles.emptyText, { color: colors.text }]}>No stops found.</Text>
        )}
      </Pressable>

      {/* Nearest Hub */}
      <Pressable
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => nearestLocations?.nearestHub && handleNearestHubPress(nearestLocations.nearestHub.id)}
      >
        <View style={styles.favoriteItem}>
          <MapPin size={24} color={colors.text} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>Nearest Hub</Text>
        </View>
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

      {/* Favorites List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Favorites</Text>
        {isProfileLoading ? (
          <FavoritesSkeleton colors={colors} />
        ) : favoriteDetails.length ? (
          <View style={styles.grid}>
            {favoriteDetails.map((favorite, index) => (
              <Pressable
                key={index}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => {
                  if (favorite.type === 'hub') {
                    router.push(`/hub-details?hubId=${favorite.id}`);
                  } else if (favorite.type === 'stop') {
                    router.push(`/stop-details?stopId=${favorite.id}`);
                  } else if (favorite.type === 'route') {
                    router.push(`/route-details?routeId=${favorite.id}`);
                  }
                }}
              >
                <View style={styles.favoriteItem}>
                  {favorite.type === 'hub' && (
                    <MapPin size={24} color={colors.text} /> 
                  )}
                  {favorite.type === 'stop' && (
                    <Flag size={24} color={colors.text} /> // 
                  )}
                  {favorite.type === 'route' && (
                    <Route size={24} color={colors.text} /> // Use Route icon for routes
                  )}
                  <Text style={[styles.cardText, { color: colors.text, marginLeft: 8 }]}>
                    {favorite.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFavoritesContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No favorites added yet.</Text>
            <Pressable
              onPress={() => router.push('/favorites')}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={24} color="white" />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  uthuthoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    marginBottom: 20,
  },
  firstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedTitle: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
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
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyFavoritesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
});