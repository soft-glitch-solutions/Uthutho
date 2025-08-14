import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Flag, MapPin, Route, Search, Plus , Award , Trophy , Heart} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import StopBlock from '../../../components/stop/StopBlock';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';
import { useNavigation } from 'expo-router';

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}


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

const calculateWalkingTime = (lat1, lng1, lat2, lng2) => {
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
  const distanceKm = R * c; // Distance in km
  
  // Average walking speed is 5 km/h = 0.0833 km/min
  const walkingTimeMinutes = Math.round(distanceKm / 0.0833);
  
  return walkingTimeMinutes;
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [nearestLocations, setNearestLocations] = useState(null);
  const [isNearestLoading, setIsNearestLoading] = useState(false);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [userStats, setUserStats] = useState({
    points: 0,
    level: 1,
    streak: 0,
    title: 'Newbie Explorer'
  });
  const [userId, setUserId] = useState(null);
  const [favoriteDetails, setFavoriteDetails] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setTestDeviceIDAsync('EMULATOR');
    }
  }, []);

    const toggleFavorite = async (item: FavoriteItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isFavorite = favorites.some(fav => fav.id === item.id);
      let newFavorites;

      if (isFavorite) {
        newFavorites = favorites.filter(fav => fav.id !== item.id);
      } else {
        newFavorites = [...favorites, item];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', user.id);

      if (!error) {
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

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

        if (data?.favorites?.length) {
          const details = await Promise.all(
            data.favorites.map(async (favorite) => {
              const details = await handleFavoritePress(favorite);
              return details ? { name: favorite, ...details } : null;
            })
          );
          setFavoriteDetails(details.filter(Boolean)); // Remove nulls
        }
      } catch (error) {
        router.replace('/auth');
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

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

  const findNearestLocation = (userLocation, locations) => {
    let nearestLocation = null;
    let minDistance = Infinity;

    locations.forEach((location) => {
      const distance = calculateWalkingTime(
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


    useEffect(() => {
    loadUserStats();
  }, []);
    const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, selected_title')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserStats({
            points: profile.points || 0,
            level: Math.floor((profile.points || 0) / 100) + 1,
            streak: 5, // This would come from login_streaks table
            title: profile.selected_title || 'Newbie Explorer'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const openSidebar = () => {
    navigation.toggleDrawer();
  };

  const handleFavoritePress = async (favoriteName) => {
    try {
      const { data: hubData, error: hubError } = await supabase
        .from('hubs')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (hubData && !hubError) return { type: 'hub', id: hubData.id };

      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (stopData && !stopError) return { type: 'stop', id: stopData.id };

      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('name', favoriteName)
        .single();

      if (routeData && !routeError) return { type: 'route', id: routeData.id };

      Alert.alert('Error', 'Favorite type not recognized.');
      return null;
    } catch (error) {
      console.error('Error fetching favorite details:', error);
      Alert.alert('Error', 'Failed to fetch favorite details.');
      return null;
    }
  };

  const handleNearestStopPress = (stopId) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  const handleNearestHubPress = (hubId) => {
    router.push(`/hub-details?hubId=${hubId}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topHeader}>
        <Pressable onPress={openSidebar} style={styles.logoContainer}>
          <Image
            source={require('../../../assets/uthutho-logo.png')}
            style={styles.logo}
          />
          <Text style={[styles.uthuthoText, { color: colors.text }]}>Uthutho</Text>
        </Pressable>
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, { color: colors.text }]}>TP - {userProfile?.points || 0}</Text>
        </View>
      </View>


      <View style={styles.header}>
        <View>
          <View style={styles.firstRow}>
            <Pressable onPress={() => router.push('/profile')}>
              <Text style={[styles.title, { color: colors.text }]}>
                 Hi {isProfileLoading ? '.......' :  userProfile?.first_name || 'User'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/favorites')} style={styles.addButton}>
              <Search size={24} color={colors.text} />
            </Pressable>
          </View>
          {!isProfileLoading && userProfile?.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {userProfile.selected_title}
            </Text>
          )}
        </View>
      </View>

            {Platform.OS !== 'web' ? (
        <View style={styles.bannerContainer}>
          <AdMobBanner
            bannerSize="smartBannerPortrait"
            adUnitID="ca-app-pub-3940256099942544/6300978111"
            servePersonalizedAds
            onDidFailToReceiveAdWithError={(error) => console.log(error)}
          />
        </View>
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Text style={styles.bannerPlaceholderText}>Ad placeholder for web</Text>
        </View>
      )}


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
            <Pressable
              style={[styles.card, { backgroundColor: colors.primary }]}
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
                    {calculateWalkingTime(
                      userLocation.lat,
                      userLocation.lng,
                      nearestLocations.nearestStop.latitude,
                      nearestLocations.nearestStop.longitude
                    )} min walk
                  </Text>
                  <StopBlock
                    stopId={nearestLocations.nearestStop.id}
                    stopName={nearestLocations.nearestStop.name}
                    stopLocation={{
                      latitude: nearestLocations.nearestStop.latitude,
                      longitude: nearestLocations.nearestStop.longitude,
                    }}
                    colors={colors}
                    radius={0.5}
                  />
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text }]}>No stops found.</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.card, { backgroundColor: colors.primary }]}
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
                    {calculateWalkingTime(
                      userLocation.lat,
                      userLocation.lng,
                      nearestLocations.nearestHub.latitude,
                      nearestLocations.nearestHub.longitude
                    )} min walk
                  </Text>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: colors.text }]}>No hubs found.</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Favorites</Text>

              {/* Favorites */}
      {favorites.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Favorites</Text>
          {favorites.map((favorite) => (
            <View key={favorite.id} style={styles.favoriteItem}>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>{favorite.name}</Text>
                <Text style={styles.favoriteType}>{favorite.type} {favorite.distance && `• ${favorite.distance}`}</Text>
              </View>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(favorite)}
              >
                <Heart size={20} color="#1ea2b1" fill="#1ea2b1" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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
                  {favorite.type === 'hub' && <MapPin size={24} color={colors.primary} />}
                  {favorite.type === 'stop' && <Flag size={24} color={colors.primary} />}
                  {favorite.type === 'route' && <Route size={24} color={colors.primary} />}
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


       {/* Gamification Section */}
      <View style={styles.gamificationCard}>
        <View style={styles.gamificationHeader}>
          <Text style={[styles.gamificationTitle, { color: colors.text }]}>Your Progress</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userStats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Level {userStats.level}</Text>
            <Text style={styles.statLabel}>Explorer</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userStats.streak} days</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.titleBadge}>
          <Award size={16} color="#1ea2b1" />
          <Text style={styles.titleText}>{userStats.title}</Text>
        </View>
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
    textTransform: 'uppercase',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
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
  bannerPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  bannerPlaceholderText: {
    color: '#666',
  },

    gamificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1ea2b120',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  titleText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
    gamificationCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  gamificationHeader: {
    flexDirection: 'row',
    color: '#1ea2b1',
    alignItems: 'center',
    marginBottom: 16,
  },
});