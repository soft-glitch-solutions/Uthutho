import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  Alert
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { supabase } from '../../../lib/supabase'; // Fixed path
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useJourney } from '@/hook/useJourney';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext'; // Fixed path
import StreakOverlay from '../../../components/StreakOverlay'; // Fixed path
import { MapPin, Bus, Train, Navigation } from 'lucide-react-native'; // Import icons

// Import components
import HeaderSection from '../../../components/home/HeaderSection'; // Fixed path
import NearbySection from '../../../components/home/NearbySection'; // Fixed path
import FavoritesSection from '../../../components/home/FavoritesSection'; // Fixed path
import GamificationSection from '../../../components/home/GamificationSection'; // Fixed path

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}

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

// Function to get icon based on type
const getIconForType = (type: string) => {
  switch (type) {
    case 'stop':
      return <MapPin size={16} color="#1ea2b1" />;
    case 'hub':
      return <Navigation size={16} color="#1ea2b1" />;
    case 'route':
      return <Bus size={16} color="#1ea2b1" />;
    default:
      return <MapPin size={16} color="#1ea2b1" />;
  }
};

// Function to get type label
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'stop':
      return 'Stop';
    case 'hub':
      return 'Hub';
    case 'route':
      return 'Route';
    default:
      return type;
  }
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
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [showStreakOverlay, setShowStreakOverlay] = useState(false);
  const navigation = useNavigation();

  // REMOVED AdMob initialization

  const checkAndShowStreakOverlay = async (userId: string) => {
    try {
      const shownKey = `streakOverlayShown_${userId}`;
      const hasShown = await AsyncStorage.getItem(shownKey);
      
      if (!hasShown) {
        setShowStreakOverlay(true);
        await AsyncStorage.setItem(shownKey, 'true');
      }
    } catch (error) {
      console.error('Error checking streak overlay status:', error);
    }
  };

  const toggleFavorite = async (item: FavoriteItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const isFavorite = favorites.some(fav => fav.id === item.id);
      let newFavorites;
  
      if (isFavorite) {
        newFavorites = favorites.filter(fav => fav.id !== item.id);
      } else {
        newFavorites = [...favorites, {
          id: item.id,
          name: item.name,
          type: item.type,
          distance: item.distance
        }];
      }
  
      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', user.id);
  
      if (!error) {
        setFavorites(newFavorites);
        if (!isFavorite) {
          const details = await handleFavoritePress(item.name || item.id);
          if (details) {
            setFavoriteDetails(prev => [...prev, { ...item, ...details }]);
          }
        } else {
          setFavoriteDetails(prev => prev.filter(fav => fav.id !== item.id));
        }
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
          const processedFavorites = data.favorites.map(fav => {
            if (typeof fav === 'object' && fav.id && fav.name && fav.type) {
              return fav;
            }
            
            if (typeof fav === 'string') {
              return {
                id: fav,
                name: fav,
                type: 'stop'
              };
            }
            
            if (typeof fav === 'object') {
              return {
                id: fav.id || String(Math.random()),
                name: fav.name || 'Unknown',
                type: fav.type || 'stop'
              };
            }
            
            return {
              id: String(Math.random()),
              name: 'Unknown',
              type: 'stop'
            };
          });
    
          setFavorites(processedFavorites);
    
          const details = await Promise.all(
            processedFavorites.map(async (favorite) => {
              try {
                const details = await handleFavoritePress(favorite.name || favorite.id);
                return details ? { 
                  ...favorite,
                  ...details 
                } : null;
              } catch (error) {
                console.error('Error fetching favorite details:', error);
                return null;
              }
            })
          );
          setFavoriteDetails(details.filter(Boolean));
        }

        checkAndShowStreakOverlay(userId);
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
        // Only fetch stops and hubs to avoid foreign key errors
        const { data: stops } = await supabase.from('stops').select('*');
        const { data: hubs } = await supabase.from('hubs').select('*');
        // REMOVED routes query to avoid foreign key error

        const nearestStop = findNearestLocation(userLocation, stops || []);
        const nearestHub = findNearestLocation(userLocation, hubs || []);
        // const nearestRoute = findNearestLocation(userLocation, routes || []); // REMOVED

        setNearestLocations({ nearestStop, nearestHub }); // REMOVED nearestRoute
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

  const loadUserStats = async () => {
    setIsStatsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, selected_title')
          .eq('id', user.id)
          .single();
        
        // Use try-catch for streak data since the table might not exist
        let streak = 0;
        try {
          const { data: streakData } = await supabase
            .from('login_streaks')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();
          streak = streakData?.current_streak || 0;
        } catch (streakError) {
          console.log('Streak table not available, using default');
        }
        
        if (profile) {
          setUserStats({
            points: profile.points || 0,
            level: Math.floor((profile.points || 0) / 100) + 1,
            streak: streak,
            title: profile.selected_title || 'Newbie Explorer'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };
  
  useEffect(() => {
    loadUserStats();
  }, []);

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

      // Skip routes to avoid foreign key errors
      console.log('Skipping route check');
      return null;
    } catch (error) {
      console.error('Error fetching favorite details:', error);
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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={openSidebar} style={styles.logoContainer}>
          <Image
            source={require('../../../assets/uthutho-logo.png')}
            style={styles.logo}
          />
          <Text style={[styles.uthuthoText, { color: colors.text }]}>Uthutho</Text>
        </Pressable>
        {isProfileLoading ? (
          <View style={[styles.pointsContainer, { 
            backgroundColor: colors.border,
            width: 80,
            height: 30,
            borderRadius: 15
          }]} />
        ) : (
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsText, { color: colors.text }]}>TP - {userProfile?.points || 0}</Text>
          </View>
        )}
      </View>

      {/* User Header */}
      <HeaderSection
        isProfileLoading={isProfileLoading}
        userProfile={userProfile}
        colors={colors}
      />

      {/* Streak Overlay */}
      <StreakOverlay
        visible={showStreakOverlay}
        userId={userId}
        onClose={() => setShowStreakOverlay(false)}
      />

      {/* REMOVED Ad Banner completely */}

      {/* Nearby Locations Section */}
      <NearbySection
        locationError={locationError}
        isNearestLoading={isNearestLoading}
        userLocation={userLocation}
        nearestLocations={nearestLocations}
        colors={colors}
        handleNearestStopPress={handleNearestStopPress}
        handleNearestHubPress={handleNearestHubPress}
        calculateWalkingTime={calculateWalkingTime}
      />

      {/* Your Community Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Community
        </Text>
        
        {isProfileLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your community...
            </Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You haven't added any locations to your community yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add stops, hubs, or routes to see them here.
            </Text>
          </View>
        ) : (
          <View style={styles.communityList}>
            {favorites.map((favorite, index) => {
              const details = favoriteDetails.find(detail => detail.id === favorite.id);
              const type = details?.type || favorite.type;
              
              return (
                <Pressable
                  key={favorite.id}
                  style={[styles.communityItem, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }]}
                  onPress={() => {
                    if (type === 'stop') {
                      router.push(`/stop-details?stopId=${favorite.id}`);
                    } else if (type === 'hub') {
                      router.push(`/hub-details?hubId=${favorite.id}`);
                    } else if (type === 'route') {
                      router.push(`/route-details?routeId=${favorite.id}`);
                    }
                  }}
                >
                  <View style={styles.communityItemContent}>
                    <View style={styles.communityIcon}>
                      {getIconForType(type)}
                    </View>
                    <View style={styles.communityInfo}>
                      <Text style={[styles.communityName, { color: colors.text }]}>{favorite.name}
                      </Text>
                      <View style={styles.communityTypeContainer}>
                        <Text style={[styles.communityType, { color: colors.text }]}>
                          {getTypeLabel(type)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.removeButton, { backgroundColor: colors.border }]}
                    onPress={() => toggleFavorite(favorite)}
                  >
                    <Text style={[styles.removeButtonText, { color: colors.text }]}>
                      Remove
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Gamification Section */}
      <GamificationSection
        isStatsLoading={isStatsLoading}
        userStats={userStats}
        colors={colors}
      />
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
    paddingTop: 30,
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
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  communityList: {
    gap: 12,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  communityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityIcon: {
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  communityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityType: {
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});