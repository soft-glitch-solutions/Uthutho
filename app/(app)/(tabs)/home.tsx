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
  RefreshControl,
  Dimensions
} from 'react-native';
import { useRouter, useNavigation , useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, Bus, Brain as Train, Navigation, Users, Clock, Flag, Route, BookmarkCheck, Plus, Menu, Map, User, Target } from 'lucide-react-native';
import { useJourney } from '@/hook/useJourney';
import HeaderSection from '@/components/home/HeaderSection';
import NearbySection from '@/components/home/NearbySection';
import FavoritesSection from '@/components/home/FavoritesSection';
import GamificationSection from '@/components/home/GamificationSection';
import ScreenTransition from '@/components/ScreenTransition';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import LottieView from 'lottie-react-native';
import RateTripModal from '@/components/home/RateTripModal';
import SimpleDebugPanel from '@/components/debug/SimpleDebugPanel';
import WelcomeOverlay from '@/components/home/WelcomeOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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

// MOVED OUTSIDE COMPONENT: findNearestLocation is now a pure function
const findNearestLocation = (userLocation: LocationCoords, locations: any[]) => {
  if (!userLocation || !locations || locations.length === 0) return null;
  
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

const getIconForType = (type: string, size: number = 20) => {
  switch (type) {
    case 'stop':
      return <MapPin size={size} color="#1ea2b1" />;
    case 'hub':
      return <Navigation size={size} color="#1ea2b1" />;
    case 'route':
      return <Bus size={size} color="#1ea2b1" />;
    default:
      return <MapPin size={size} color="#1ea2b1" />;
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

// Desktop Grid Layout Component
const CommunityGrid = ({ 
  favorites, 
  favoriteDetails, 
  colors, 
  router, 
  toggleFavorite, 
  favoritesCountMap 
}) => {
  if (favorites.length === 0) {
    return (
      <View style={styles.emptyGridContainer}>
        <View style={styles.emptyGridIllustration}>
          <Map size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyGridText, { color: colors.text }]}>
          Your community grid is empty
        </Text>
        <Text style={[styles.emptyGridSubtext, { color: colors.text, opacity: 0.7 }]}>
          Add locations to see them here
        </Text>
        <TouchableOpacity 
          style={[styles.emptyGridButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/favorites')}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.emptyGridButtonText}>Explore Locations</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {favorites.map((favorite, index) => {
        const details = favoriteDetails.find(detail => detail.id === favorite.id);
        const type = details?.type || favorite.type;
        const followerCount = favoritesCountMap[details?.id] || 0;
        
        return (
          <Pressable
            key={favorite.id}
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
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
            <View style={styles.gridItemHeader}>
              <View style={[styles.gridItemIcon, { backgroundColor: `${colors.primary}15` }]}>
                {getIconForType(type, 18)}
              </View>
              <View style={styles.gridItemActions}>
                <TouchableOpacity
                  onPress={() => toggleFavorite(favorite)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <BookmarkCheck size={16} color={colors.primary} fill={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.gridItemName, { color: colors.text }]} numberOfLines={2}>
              {favorite.name}
            </Text>
            
            <View style={styles.gridItemMeta}>
              <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                  {getTypeLabel(type)}
                </Text>
              </View>
              
              {followerCount > 0 && (
                <View style={styles.followerBadge}>
                  <Users size={12} color="#1ea2b1" />
                  <Text style={styles.followerBadgeText}>{followerCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

// Desktop Skeleton Grid
const GridSkeletonLoader = ({ colors }) => {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4].map((item) => (
        <View 
          key={item} 
          style={[styles.gridItemSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.gridItemHeaderSkeleton}>
            <View style={[styles.gridItemIconSkeleton, { backgroundColor: colors.border }]} />
            <View style={[styles.gridItemActionSkeleton, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.gridItemNameSkeleton, { backgroundColor: colors.border }]} />
          <View style={styles.gridItemMetaSkeleton}>
            <View style={[styles.typeBadgeSkeleton, { backgroundColor: colors.border }]} />
            <View style={[styles.followerBadgeSkeleton, { backgroundColor: colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const hasCheckedForRating = useRef(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [journeyRatingId, setJourneyRatingId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [modalQueue, setModalQueue] = useState<string[]>([]);
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
  const { activeJourney, loading: journeyLoading, refreshActiveJourney } = useJourney();
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesCountMap, setFavoritesCountMap] = useState<Record<string, number>>({});
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const hasCheckedWelcome = useRef(false);

  // FIXED: Properly memoized fetchNearestLocations
  const fetchNearestLocations = useCallback(async () => {
    if (!userLocation) {
      console.log('No user location available');
      return;
    }
    
    console.log('Fetching nearest locations...');
    setIsNearestLoading(true);
    try {
      const [stopsResult, hubsResult] = await Promise.allSettled([
        supabase.from('stops').select('*'),
        supabase.from('hubs').select('*')
      ]);

      const stops = stopsResult.status === 'fulfilled' ? stopsResult.value.data : [];
      const hubs = hubsResult.status === 'fulfilled' ? hubsResult.value.data : [];

      console.log(`Found ${stops?.length || 0} stops and ${hubs?.length || 0} hubs`);

      const nearestStop = findNearestLocation(userLocation, stops || []);
      const nearestHub = findNearestLocation(userLocation, hubs || []);

      console.log('Nearest stop:', nearestStop?.name);
      console.log('Nearest hub:', nearestHub?.name);

      setNearestLocations({ nearestStop, nearestHub });
    } catch (error) {
      console.error('Error fetching nearest locations:', error);
    } finally {
      setIsNearestLoading(false);
      console.log('Finished fetching nearest locations');
    }
  }, [userLocation]); // Only depends on userLocation

  const handleWelcomeClose = () => {
    setShowWelcomeOverlay(false);
  };

  const handleGetStarted = () => {
    setShowWelcomeOverlay(false);
  };

  const handleShowWelcomeOverlay = () => {
    setShowWelcomeOverlay(true);
  };

  const handleHideWelcomeOverlay = () => {
    setShowWelcomeOverlay(false);
  };

  const [streakVisible, setStreakVisible] = useState(false);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (hasCheckedWelcome.current) return;
      hasCheckedWelcome.current = true;

      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session?.user.id) return;

        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        
        if (!hasSeenWelcome) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setShowWelcomeOverlay(true);
          await AsyncStorage.setItem('hasSeenWelcome', 'true');
          
          const count = await AsyncStorage.getItem('welcomeShownCount') || '0';
          await AsyncStorage.setItem('welcomeShownCount', (parseInt(count) + 1).toString());
        }
      } catch (error) {
        console.error('Error checking welcome overlay:', error);
      }
    };

    if (!isProfileLoading && userProfile) {
      checkFirstTimeUser();
    }
  }, [isProfileLoading, userProfile]);

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
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      console.log('User location set:', newLocation);
      setUserLocation(newLocation);
    })();
  }, []);

  // FIXED: This useEffect now has stable dependencies
  useEffect(() => {
    if (!userLocation) {
      console.log('Waiting for user location...');
      return;
    }
    
    console.log('Running fetchNearestLocations effect');
    
    // Add a small debounce to prevent too frequent calls
    const timer = setTimeout(() => {
      fetchNearestLocations();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userLocation, fetchNearestLocations]);

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

  useEffect(() => {
    if (params.refresh) {
      loadUserStats();
      if (userLocation) {
        fetchNearestLocations();
      }
    }
  }, [params.refresh]);

  useEffect(() => {
    const checkForRating = async () => {
      try {
        if (params.showRatingForJourney) {
          console.log('🎯 Rating triggered from URL parameter:', params.showRatingForJourney);
          
          setJourneyRatingId(params.showRatingForJourney as string);
          setShowRatingModal(true);
          
          await AsyncStorage.setItem(
            'handled_rating_param',
            params.showRatingForJourney as string
          );
          
          return;
        }
        
        const pendingRating = await AsyncStorage.getItem('pending_journey_rating');
        if (pendingRating) {
          console.log('🎯 Found rating in storage:', pendingRating);
          await AsyncStorage.removeItem('pending_journey_rating');
          setJourneyRatingId(pendingRating);
          setShowRatingModal(true);
        }
      } catch (error) {
        console.error('Error checking for rating:', error);
      }
    };

    checkForRating();
  }, [params.showRatingForJourney]);

  useEffect(() => {
    return () => {
      const clearParams = async () => {
        try {
          if (params.showRatingForJourney) {
            console.log('🗑️ Clearing rating parameter on unmount');
            
            const handledParam = await AsyncStorage.getItem('handled_rating_param');
            
            if (handledParam === params.showRatingForJourney) {
              await AsyncStorage.removeItem('handled_rating_param');
              console.log('✅ Successfully cleared handled rating parameter');
            }
          }
        } catch (error) {
          console.error('Error clearing params on unmount:', error);
        }
      };
      
      clearParams();
    };
  }, []);

  useEffect(() => {
    const preventDoubleShow = async () => {
      try {
        if (params.showRatingForJourney) {
          const handledParam = await AsyncStorage.getItem('handled_rating_param');
          
          if (handledParam === params.showRatingForJourney) {
            console.log('⏭️ Parameter already handled, preventing double show');
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Error checking for double show:', error);
        return true;
      }
    };
    
    preventDoubleShow();
  }, [params.showRatingForJourney]);

  const handleCloseModal = () => {
    console.log('Closing rating modal');
    setShowRatingModal(false);
    setJourneyRatingId(null);
    
    AsyncStorage.removeItem('handled_rating_param').catch(console.error);
  };

  const handleRatingSubmitted = (journeyId: string, rating: number) => {
    console.log('Rating submitted for journey:', journeyId, 'Rating:', rating);
    
    handleCloseModal();
    
    AsyncStorage.removeItem('pending_journey_rating').catch(console.error);
    AsyncStorage.removeItem('handled_rating_param').catch(console.error);
    
    Alert.alert(
      'Thanks for Your Feedback!',
      `You rated your trip ${rating} stars!`,
      [{ text: 'OK' }]
    );
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshPromises = [
        fetchUserProfile(),
        fetchNearestLocations(),
        loadUserStats(),
      ];
      
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

  useEffect(() => {
    const resolved = favoriteDetails
      .filter(Boolean)
      .map(d => ({ id: d.id as string, type: d.type as 'route'|'hub'|'stop' }));
    if (resolved.length) loadFavoriteFollowerCounts(resolved);
    else setFavoritesCountMap({});
  }, [favoriteDetails]);

  useEffect(() => {
    console.log('🏠 HomeScreen state updated:', {
      showRatingModal,
      journeyRatingId: journeyRatingId ? `${journeyRatingId.substring(0, 8)}...` : 'null'
    });
  }, [showRatingModal, journeyRatingId]);

  // Debug logging to track re-renders
  useEffect(() => {
    console.log('🔄 HomeScreen rendered');
  });

  if (isDesktop) {
    return (
      <ScreenTransition>
        <ScrollView
          style={[styles.container, styles.containerDesktop, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.desktopContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary || '#1ea2b1']}
              tintColor={colors.primary || '#1ea2b1'}
            />
          }
        >
          <View style={styles.desktopHeader}>
            <Pressable onPress={openSidebar}    onLongPress={() => setShowDebugPanel(true)}
  delayLongPress={2000} style={styles.logoContainer}>
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

          <View style={styles.desktopLayout}>
            <View style={styles.leftColumn}>
              <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
                <View style={styles.profileHeader}>
                  <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                    <User size={24} color="#ffffff" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileWelcome, { color: colors.text }]}>
                      Welcome back,
                    </Text>
                    <Text style={[styles.profileName, { color: colors.text }]}>
                      {userProfile?.first_name || 'Explorer'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Target size={20} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {userStats.points}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text, opacity: 0.7 }]}>
                      Points
                    </Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Map size={20} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      Level {userStats.level}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text, opacity: 0.7 }]}>
                      {userStats.title}
                    </Text>
                  </View>
                </View>
              </View>

              {!journeyLoading && activeJourney && (
                <Pressable 
                  style={[styles.journeyCard, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/journey')}
                >
                  <View style={styles.journeyContent}>
                    <Navigation size={24} color="#ffffff" />
                    <View style={styles.journeyInfo}>
                      <Text style={styles.journeyTitle}>Active Journey</Text>
                      <Text style={styles.journeyRoute} numberOfLines={1}>
                        {activeJourney.routes.name}
                      </Text>
                      <Text style={styles.journeyProgress}>
                        Stop {activeJourney.current_stop_sequence || 0} of {activeJourney.stops?.length || 0}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}

              <GamificationSection
                isStatsLoading={isStatsLoading}
                userStats={userStats}
                colors={colors}
              />
            </View>

            <View style={styles.middleColumn}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleDesktop, { color: colors.text }]}>
                  Explore Map
                </Text>
              </View>


              
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
                compact={true}
              />
            </View>

            <View style={styles.rightColumn}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleDesktop, { color: colors.text }]}>
                  Your Community
                </Text>
                <TouchableOpacity 
                  style={[styles.addCommunityButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/favorites')}
                >
                  <Plus size={18} color="#ffffff" />
                  <Text style={styles.addCommunityText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {isProfileLoading || isFavoritesLoading ? (
                <GridSkeletonLoader colors={colors} />
              ) : (
                <CommunityGrid
                  favorites={favorites}
                  favoriteDetails={favoriteDetails}
                  colors={colors}
                  router={router}
                  toggleFavorite={toggleFavorite}
                  favoritesCountMap={favoritesCountMap}
                />
              )}

              <View style={[styles.quickActions, { backgroundColor: colors.card, marginTop: 20 }]}>
                <Text style={[styles.quickActionsTitle, { color: colors.text }]}>
                  Quick Actions
                </Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.background }]}
                    onPress={() => router.push('/Map')}
                  >
                    <Map size={20} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      Explore Map
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.background }]}
                    onPress={() => router.push('/favorites')}
                  >
                    <BookmarkCheck size={20} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      All Favorites
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.background }]}
                    onPress={() => router.push('/Leaderboard')}
                  >
                    <Users size={20} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      Leaderboard
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.background }]}
                    onPress={() => router.push('/profile')}
                  >
                    <User size={20} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenTransition>
    );
  }

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
          <Pressable onPress={openSidebar}  onLongPress={() => setShowDebugPanel(true)}
  delayLongPress={2000} style={styles.logoContainer}>
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
            style={[styles.journeyBanner]}
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
    Services
  </Text>
  
  <View style={styles.servicesGrid}>
    <TouchableOpacity 
      style={[styles.serviceCard, { backgroundColor: colors.background }]}
      onPress={() => router.push('/school-transport')}
    >
      <View style={[styles.serviceIcon, { backgroundColor: '#1ea2b1' }]}>
        <Bus size={24} color="#FFFFFF" />
      </View>
      <Text style={[styles.serviceTitle, { color: colors.text }]}>
        School Transport
      </Text>

    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.serviceCard, { backgroundColor: colors.background }]}
      onPress={() => router.push('/carpool')}
    >
      <View style={[styles.serviceIcon, { backgroundColor: '#10B981' }]}>
        <Users size={24} color="#FFFFFF" />
      </View>
      <Text style={[styles.serviceTitle, { color: colors.text }]}>
        Carpool
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.serviceCard, { backgroundColor: colors.background }]}
      onPress={() => router.push('/long-distance')}
    >
      <View style={[styles.serviceIcon, { backgroundColor: '#fbbf24' }]}>
        <Route size={24} color="#FFFFFF" />
      </View>
      <Text style={[styles.serviceTitle, { color: colors.text }]}>
        Long Distance
      </Text>
    </TouchableOpacity>
  </View>
</View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Community
          </Text>
          
          {isProfileLoading || isFavoritesLoading ? (
            <View style={styles.communityList}>
              {[1, 2, 3].map((item) => (
                <View 
                  key={item} 
                  style={[styles.communityItemSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.communityItemContent}>
                    <View style={[styles.communityIconSkeleton, { backgroundColor: colors.border }]} />
                    <View style={styles.communityInfoSkeleton}>
                      <View style={[styles.skeletonTextLarge, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonTextSmall, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
                    </View>
                  </View>
                  <View style={[styles.removeButtonSkeleton, { backgroundColor: colors.border }]} />
                </View>
              ))}
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
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

      </ScrollView>

      <WelcomeOverlay
        visible={showWelcomeOverlay}
        onClose={handleWelcomeClose}
        onGetStarted={handleGetStarted}
      />
      <SimpleDebugPanel
        visible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        onShowWelcomeOverlay={handleShowWelcomeOverlay}
        onHideWelcomeOverlay={handleHideWelcomeOverlay}
        onShowStreakOverlay={() => setStreakVisible(true)}
        onHideStreakOverlay={() => setStreakVisible(false)}
      />

      <RateTripModal
        visible={showRatingModal}
        onClose={() => {
          console.log('Closing rating modal');
          setShowRatingModal(false);
          setJourneyRatingId(null);
        }}
        journeyId={journeyRatingId}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </ScreenTransition>
  );
}

// Styles remain exactly the same as your original code...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  containerDesktop: {
    width: '100%',
    padding: 20,
    paddingTop: 10,
  },
  desktopContentContainer: {
    paddingTop: 0,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  
  // Desktop Three-Column Layout
  desktopLayout: {
    flexDirection: 'row',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    gap: 20,
    minHeight: 'calc(100vh - 80px)',
  },
  leftColumn: {
    width: '25%',
    minWidth: 0,
  },
  middleColumn: {
    width: '40%',
    minWidth: 0,
  },
  rightColumn: {
    width: '35%',
    minWidth: 0,
  },
  
  // Profile Card
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileWelcome: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
    marginHorizontal: 20,
  },
  
  // Journey Card
  journeyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  journeyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  journeyTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  journeyRoute: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  journeyProgress: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  
  // Section Header with Add Button
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitleDesktop: {
    fontSize: 22,
  },
  addCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addCommunityText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Map Container Styles
  mapContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  mapPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(30, 162, 177, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  mapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  mapStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  mapStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  mapStatLabel: {
    fontSize: 12,
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  mapActionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Grid Layout for Community
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: 'calc(50% - 6px)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemActions: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  gridItemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  gridItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  followerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followerBadgeText: {
    fontSize: 11,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  
  // Empty Grid State
  emptyGridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyGridIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyGridText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyGridSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyGridButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyGridButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Quick Actions
  quickActions: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: 'calc(50% - 6px)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Skeleton Grid
  gridItemSkeleton: {
    width: 'calc(50% - 6px)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  gridItemHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridItemIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  gridItemActionSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  gridItemNameSkeleton: {
    height: 15,
    borderRadius: 4,
    width: '80%',
    marginBottom: 8,
  },
  gridItemMetaSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadgeSkeleton: {
    width: 50,
    height: 20,
    borderRadius: 6,
  },
  followerBadgeSkeleton: {
    width: 30,
    height: 20,
    borderRadius: 10,
  },
  
  // Mobile-only styles
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

  adContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
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
  communityItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  communityIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  communityInfoSkeleton: {
    flex: 1,
    gap: 6,
  },
  skeletonTextLarge: {
    height: 16,
    borderRadius: 4,
    width: '70%',
  },
  skeletonTextMedium: {
    height: 12,
    borderRadius: 4,
    width: '40%',
  },
  skeletonTextSmall: {
    height: 10,
    borderRadius: 4,
    width: '30%',
  },
  removeButtonSkeleton: {
    width: 60,
    height: 24,
    borderRadius: 6,
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

  servicesGrid: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},
serviceCard: {
  flex: 1,
  alignItems: 'center',
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#333333',
},
serviceCardDesktop: {
  padding: 20,
  borderRadius: 16,
},
serviceIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},
serviceTitle: {
  fontSize: 14,
  fontWeight: '600',
  textAlign: 'center',
  marginBottom: 4,
},
serviceSubtitle: {
  fontSize: 12,
  textAlign: 'center',
},
});