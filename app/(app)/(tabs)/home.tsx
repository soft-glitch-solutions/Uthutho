import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert
} from 'react-native';
import { useRouter, useNavigation , useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, Bus, Brain as Train, Navigation, Users, Clock, Flag } from 'lucide-react-native';
import { useJourney } from '@/hook/useJourney';
import HeaderSection from '@/components/home/HeaderSection';
import NearbySection from '@/components/home/NearbySection';
import FavoritesSection from '@/components/home/FavoritesSection';
import GamificationSection from '@/components/home/GamificationSection';
import StreakOverlay from '@/components/StreakOverlay';

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}

const calculateWalkingTime = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  const walkingTimeMinutes = Math.round(distanceKm / 0.0833);
  
  return walkingTimeMinutes;
};

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
  const params = useLocalSearchParams();
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
  const navigation = useNavigation();
  const { activeJourney, loading: journeyLoading } = useJourney();
  const [showStreakOverlay, setShowStreakOverlay] = useState(false);

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

    const fetchNearestLocations = async () => {
    setIsNearestLoading(true);
    try {
      const { data: stops } = await supabase.from('stops').select('*');
      const { data: hubs } = await supabase.from('hubs').select('*');

      const nearestStop = findNearestLocation(userLocation, stops || []);
      const nearestHub = findNearestLocation(userLocation, hubs || []);

      setNearestLocations({ nearestStop, nearestHub });
    } catch (error) {
      console.error('Error fetching nearest locations:', error);
    } finally {
      setIsNearestLoading(false);
    }
  };

  useEffect(() => {
    if (!userLocation) return;
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
            streak: streakData?.current_streak || 0,
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
  // This will run whenever the refresh parameter changes
  if (params.refresh) {
    // Refresh your data here
    loadUserStats();
    if (userLocation) {
      fetchNearestLocations();
    }
    // If you have other data that needs refreshing, add it here
  }
}, [params.refresh]);

  const openSidebar = () => {
    navigation.toggleDrawer();
  };

  const handleFavoritePress = async (favoriteName) => {
    try {
      const { data: hubData, error: hubError } = await supabase
        .from('hubs')
        .select('id')
        .eq('name', favoriteName)
        .maybeSingle();

      if (hubData && !hubError) return { type: 'hub', id: hubData.id };

      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('id')
        .eq('name', favoriteName)
        .maybeSingle();

      if (stopData && !stopError) return { type: 'stop', id: stopData.id };

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
    router.push(`/hub/${hubId}`);
  };

  // Function to handle marking as waiting with validation
  const handleMarkAsWaiting = async (locationId, locationType, locationName) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to mark yourself as waiting.");
        return;
      }

      // Check if user already has an active journey (server-side validation)
      const { data: existingWaiting } = await supabase
        .from('stop_waiting')
        .select('id')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingWaiting) {
        Alert.alert(
          "Active Journey",
          "You already have an active journey. Complete your current journey before starting a new one.",
          [{ text: "OK" }]
        );
        return;
      }

      // Get route information for the stop
      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('route_id')
        .eq('id', locationId)
        .single();

      if (stopError) {
        console.error('Error fetching stop details:', stopError);
        Alert.alert("Error", "Could not find stop details.");
        return;
      }

      // Check for existing journeys for this route
      const { data: existingJourneys, error: journeyError } = await supabase
        .from('journeys')
        .select('id')
        .eq('route_id', stopData.route_id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      if (journeyError) {
        console.error('Error checking existing journeys:', journeyError);
      }

      let journeyId;

      // If there are existing journeys, join the first one
      if (existingJourneys && existingJourneys.length > 0) {
        journeyId = existingJourneys[0].id;
      } else {
        // Create new journey
        const { data: newJourney, error: createError } = await supabase
          .from('journeys')
          .insert({
            route_id: stopData.route_id,
            current_stop_sequence: 0,
            status: 'in_progress'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating journey:', createError);
          Alert.alert("Error", "Could not start journey.");
          return;
        }
        journeyId = newJourney.id;
      }

      // Mark user as waiting at the stop
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expire in 30 minutes

      const { error: waitingError } = await supabase
        .from('stop_waiting')
        .upsert({
          user_id: user.id,
          stop_id: locationId,
          journey_id: journeyId,
          route_id: stopData.route_id,
          transport_type: 'bus', // You might want to get this from somewhere
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id,stop_id'
        });

      if (waitingError) {
        console.error('Error marking as waiting:', waitingError);
        Alert.alert("Error", "Could not mark you as waiting.");
        return;
      }

      Alert.alert(
        "Waiting Status Updated",
        `You've been marked as waiting at ${locationName}.`,
        [{ text: "OK", onPress: () => router.push('/journey') }]
      );
    } catch (error) {
      console.error('Error in handleMarkAsWaiting:', error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
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

      {/* Active Journey Banner */}
      {!journeyLoading && activeJourney && (
        <Pressable 
          style={styles.journeyBanner}
          onPress={() => router.push('/journey')}
        >
          <View style={styles.journeyBannerContent}>
            <View style={styles.journeyIcon}>
              <Navigation size={20} color="#ffffff" />
            </View>
            <View style={styles.journeyInfo}>
              <Text style={styles.journeyTitle}>Active Journey</Text>
              <Text style={styles.journeyRoute}>{activeJourney.routes.name}</Text>
              <Text style={styles.journeyProgress}>
                Stop {activeJourney.current_stop_sequence || 0} of {activeJourney.stops?.length || 0}
              </Text>
            </View>
            <View style={styles.journeyStats}>
              <View style={styles.journeyStatItem}>
                <Users size={14} color="#1ea2b1" />
                <Text style={styles.journeyStatText}>Live</Text>
              </View>
              <View style={styles.journeyStatItem}>
                <Clock size={14} color="#1ea2b1" />
                <Text style={styles.journeyStatText}>Active</Text>
              </View>
            </View>
          </View>
          <View style={styles.journeyArrow}>
            <Text style={styles.journeyArrowText}>›</Text>
          </View>
        </Pressable>
      )}

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
        hasActiveJourney={!!activeJourney} // Pass whether user has active journey
        onMarkAsWaiting={handleMarkAsWaiting} // Pass the mark as waiting handler
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

      <StreakOverlay
        visible={showStreakOverlay}
        userId={userId}
        onClose={() => setShowStreakOverlay(false)}
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
  journeyBanner: {
    backgroundColor: '#1ea2b1',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  journeyBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journeyInfo: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  journeyRoute: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 2,
  },
  journeyProgress: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  journeyStats: {
    alignItems: 'flex-end',
  },
  journeyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  journeyStatText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    opacity: 0.9,
  },
  journeyArrow: {
    marginLeft: 12,
  },
  journeyArrowText: {
    fontSize: 24,
    color: '#ffffff',
    opacity: 0.7,
  },
});