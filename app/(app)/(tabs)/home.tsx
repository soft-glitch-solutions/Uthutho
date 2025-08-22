import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';
import StreakOverlay from '@/components/StreakOverlay';

// Import components
import HeaderSection from '../../../components/home/HeaderSection';
import NearbySection from '../../../components/home/NearbySection';
import FavoritesSection from '../../../components/home/FavoritesSection';
import GamificationSection from '../../../components/home/GamificationSection';

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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setTestDeviceIDAsync('EMULATOR');
    }
  }, []);

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
        
        const { data: streakData } = await supabase
          .from('login_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();
        
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

      {/* Ad Banner */}
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
          <div 
            dangerouslySetInnerHTML={{
              __html: `
              <div style="width:100%;height:50px;background:#eee;display:flex;justify-content:center;align-items:center;">
                <!-- AdSense Script -->
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
                  crossorigin="anonymous"></script>
                <!-- Ad Unit -->
                <ins class="adsbygoogle"
                  style="display:block"
                  data-ad-client="ca-pub-1853756758292263"
                  data-ad-slot="YOUR_AD_SLOT_ID"
                  data-ad-format="auto"
                  data-full-width-responsive="true"></ins>
                <script>
                  (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
              </div>
              `
            }}
          />
        </View>
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
      />

      {/* Favorites Section */}
      <FavoritesSection
        isProfileLoading={isProfileLoading}
        favorites={favorites}
        favoriteDetails={favoriteDetails}
        colors={colors}
        toggleFavorite={toggleFavorite}
      />

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
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    marginBottom: 16,
  },
});