import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter, useNavigation , useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, Bus, Brain as Train, Navigation, Users, Clock, Flag, Route, BookmarkCheck, Plus } from 'lucide-react-native';
import { useJourney } from '@/hook/useJourney';
import HeaderSection from '@/components/home/HeaderSection';
import NearbySection from '@/components/home/NearbySection';
import FavoritesSection from '@/components/home/FavoritesSection';
import GamificationSection from '@/components/home/GamificationSection';
import StreakOverlay from '@/components/StreakOverlay';
import ScreenTransition from '@/components/ScreenTransition';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}

interface UserStats {
  points: number;
  level: number;
  streak: number;
  title: string;
}

interface LocationCoords {
  lat: number;
  lng: number;
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
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [nearestLocations, setNearestLocations] = useState<any>(null);
  const [isNearestLoading, setIsNearestLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    level: 1,
    streak: 0,
    title: 'Newbie Explorer'
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteDetails, setFavoriteDetails] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const navigation = useNavigation();
// Update the useJourney import to include refresh function if available
  const { activeJourney, loading: journeyLoading, refreshActiveJourney } = useJourney();
  const [showStreakOverlay, setShowStreakOverlay] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});

  const fetchNearestLocations = useCallback(async () => {
    if (!userLocation) return;
    
    setIsNearestLoading(true);
    try {
      const [stopsResult, hubsResult] = await Promise.allSettled([
        supabase.from('stops').select('*'),
        supabase.from('hubs').select('*')
      ]);

      const stops = stopsResult.status === 'fulfilled' ? stopsResult.value.data : [];
      const hubs = hubsResult.status === 'fulfilled' ? hubsResult.value.data : [];

      const nearestStop = findNearestLocation(userLocation, stops || []);
      const nearestHub = findNearestLocation(userLocation, hubs || []);

      setNearestLocations({ nearestStop, nearestHub });
    } catch (error) {
      console.error('Error fetching nearest locations:', error);
    } finally {
      setIsNearestLoading(false);
    }
  }, [userLocation]);

  const FlyboxAnimation = ({ style }) => {
    const animationRef = useRef(null);
    const isMobile = Platform.OS !== 'web';
  
    useEffect(() => {
      if (animationRef.current) {
        animationRef.current.play();
      }
    }, []);
  
    if (isMobile) {
      return (
        <LottieView
          ref={animationRef}
          source={require('../../../assets/animations/flybox.json')}
          autoPlay
          loop
          style={style}
        />
      );
    } else {
      return (
        <DotLottieReact
          src="https://lottie.host/b3c284ec-320e-4f2d-8cf4-3f95eea57111/x4PxKADBXK.lottie"
          loop
          autoplay
          style={style}
        />
      );
    }
  };

  const findNearestLocation = useCallback((userLocation: LocationCoords, locations: any[]) => {
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
  }, []);

  const toggleFavorite = async (item: FavoriteItem) => {
    setIsFavoritesLoading(true);
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
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async () => {
    let isMounted = true;
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
      
      if (isMounted) {
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
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (isMounted) {
        router.replace('/auth');
      }
    } finally {
      if (isMounted) {
        setIsProfileLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
    fetchNearestLocations();
  }, [userLocation, fetchNearestLocations]);

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
        let streakData = null;
        
        try {
          const { data: streakResult } = await supabase
            .from('login_streaks')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();
          streakData = streakResult;
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
  if (userProfile) {
    loadUserStats();
  }
}, [userProfile]);

// Keep the refresh functionality for manual refreshes
useEffect(() => {
  if (params.refresh) {
    loadUserStats();
    if (userLocation) {
      fetchNearestLocations();
    }
  }
}, [params.refresh]);

  const openSidebar = () => {
    navigation.toggleDrawer();
  };

  const handleFavoritePress = async (favoriteName: string) => {
    try {
      const [hubResult, stopResult] = await Promise.allSettled([
        supabase.from('hubs').select('id').eq('name', favoriteName).maybeSingle(),
        supabase.from('stops').select('id').eq('name', favoriteName).maybeSingle()
      ]);

      if (hubResult.status === 'fulfilled' && hubResult.value.data) {
        return { type: 'hub', id: hubResult.value.data.id };
      }

      if (stopResult.status === 'fulfilled' && stopResult.value.data) {
        return { type: 'stop', id: stopResult.value.data.id };
      }

      return null;
    } catch (error) {
      console.error('Error fetching favorite details:', error);
      return null;
    }
  };

  const handleNearestStopPress = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  const handleNearestHubPress = (hubId: string) => {
    router.push(`/hub/${hubId}`);
  };

  const handleMarkAsWaiting = async (locationId: string, locationType: string, locationName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to mark yourself as waiting.");
        return;
      }

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

      if (existingJourneys && existingJourneys.length > 0) {
        journeyId = existingJourneys[0].id;
      } else {
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

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const { error: waitingError } = await supabase
        .from('stop_waiting')
        .upsert({
          user_id: user.id,
          stop_id: locationId,
          journey_id: journeyId,
          route_id: stopData.route_id,
          transport_type: 'bus',
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

  // Pull-to-refresh handler
// Pull-to-refresh handler
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    const refreshPromises = [
      fetchUserProfile(),
      fetchNearestLocations(),
      loadUserStats(),
    ];
    
    // Add journey refresh if available
    if (refreshActiveJourney) {
      refreshPromises.push(refreshActiveJourney());
    }
    
    await Promise.all(refreshPromises);
  } catch (error) {
    console.error('Error during refresh:', error);
  } finally {
    setRefreshing(false);
  }
}, [fetchUserProfile, fetchNearestLocations, loadUserStats, refreshActiveJourney]);

  // helper: fetch counts from favorites table for all resolved favorites
  const loadFavoriteFollowerCounts = async (items: Array<{ id: string; type: 'route'|'hub'|'stop' }>) => {
    try {
      const byType: Record<'route'|'hub'|'stop', string[]> = { route: [], hub: [], stop: [] };
      items.forEach(it => byType[it.type]?.push(it.id));

      const newMap: Record<string, number> = {};

      const fetchType = async (type: 'route'|'hub'|'stop') => {
        if (!byType[type].length) return;
        const { data } = await supabase
          .from('favorites')
          .select('entity_id')
          .eq('entity_type', type)
          .in('entity_id', byType[type]);
        (data || []).forEach(row => {
          newMap[row.entity_id] = (newMap[row.entity_id] || 0) + 1;
        });
      };

      await Promise.all([fetchType('route'), fetchType('hub'), fetchType('stop')]);
      setFavoritesCountMap(newMap);
    } catch (e) {
      console.error('Failed loading favorites follower counts:', e);
    }
  };

  // reload counts whenever resolved favorite IDs/types change
  useEffect(() => {
    const resolved = favoriteDetails
      .filter(Boolean)
      .map(d => ({ id: d.id as string, type: d.type as 'route'|'hub'|'stop' }));
    if (resolved.length) loadFavoriteFollowerCounts(resolved);
    else setFavoritesCountMap({});
  }, [favoriteDetails]);

  return (
    <ScreenTransition>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary || '#1ea2b1']}
            tintColor={colors.primary || '#1ea2b1'}
          />
        }
      >
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

        <HeaderSection
          isProfileLoading={isProfileLoading}
          userProfile={userProfile}
          colors={colors}
        />

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

        <NearbySection
          locationError={locationError}
          isNearestLoading={isNearestLoading}
          userLocation={userLocation}
          nearestLocations={nearestLocations}
          colors={colors}
          handleNearestStopPress={handleNearestStopPress}
          handleNearestHubPress={handleNearestHubPress}
          calculateWalkingTime={calculateWalkingTime}
          hasActiveJourney={!!activeJourney}
          onMarkAsWaiting={handleMarkAsWaiting}
        />

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Community
          </Text>
          
          {isProfileLoading || isFavoritesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading your community...
              </Text>
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FlyboxAnimation style={styles.lottieAnimation} />
              <Text style={[styles.emptyText, { color: colors.text}]}>
                You haven't added any locations to your community yet.
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/favorites')}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Community</Text>
              </TouchableOpacity>
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
                        router.push(`/hub/${favorite.id}`);
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

                        {details?.id && (
                          <View style={{
                            marginTop: 6,
                            alignSelf: 'flex-start',
                            backgroundColor: '#1ea2b120',
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}>
                            <Text style={{ color: '#1ea2b1', fontSize: 12 }}>
                              Followers: {favoritesCountMap[details.id] || 0}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      style={[styles.removeButton, { backgroundColor: colors.border }]}
                      onPress={() => {
                        const removedId = (details?.id as string) || favorite.id;
                        setFavoritesCountMap(prev => ({
                          ...prev,
                          [removedId]: Math.max(0, (prev[removedId] || 0) - 1),
                        }));
                        toggleFavorite(favorite);
                      }}
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
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
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
   addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
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