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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flag, MapPin, Route, Search, Plus , Award , Trophy , Heart} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../../context/ThemeContext';
import StopBlock from '../../../components/stop/StopBlock';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';
import { useNavigation } from 'expo-router';
import StreakOverlay from '@/components/StreakOverlay'; // Import the StreakOverlay component

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}

// Skeleton Loading Components
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

const HeaderSkeleton = ({ colors }) => (
  <View style={styles.header}>
    <View style={styles.firstRow}>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonTitle, { 
          backgroundColor: colors.border,
          width: 150,
          height: 30 
        }]} />
      </Shimmer>
      <Shimmer colors={colors}>
        <View style={[styles.skeletonIcon, { 
          backgroundColor: colors.border,
          width: 30,
          height: 30 
        }]} />
      </Shimmer>
    </View>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonSubtitle, { 
        backgroundColor: colors.border,
        width: 100,
        height: 20,
        marginTop: 8
      }]} />
    </Shimmer>
  </View>
);

const FavoritesSkeleton = ({ colors }) => (
  <View style={styles.grid}>
    {[1, 2].map((i) => (
      <Shimmer key={i} colors={colors}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.favoriteItemSkeleton}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '70%' }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '50%', marginTop: 4 }]} />
            </View>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          </View>
        </View>
      </Shimmer>
    ))}
  </View>
);

const NearestLocationsSkeleton = ({ colors }) => (
  <View style={styles.grid}>
    {[1, 2].map((i) => (
      <Shimmer key={i} colors={colors}>
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
          <View style={styles.favoriteItemSkeleton}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
            <View style={[styles.skeletonTitle, { 
              backgroundColor: colors.text,
              width: 100,
              marginLeft: 8
            }]} />
          </View>
          <View style={[styles.skeletonText, { 
            backgroundColor: colors.text,
            width: '80%',
            marginTop: 8
          }]} />
          <View style={[styles.skeletonText, { 
            backgroundColor: colors.text,
            width: '60%',
            marginTop: 8
          }]} />
          <View style={{ height: 40, marginTop: 12 }} />
        </View>
      </Shimmer>
    ))}
  </View>
);

const GamificationSkeleton = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.gamificationCard, { borderColor: colors.border }]}>
      <View style={styles.gamificationHeader}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonTitle, { 
          backgroundColor: colors.border,
          width: 100,
          marginLeft: 8
        }]} />
      </View>
      
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statBox}>
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.border,
              width: 60,
              height: 20,
              marginBottom: 4
            }]} />
            <View style={[styles.skeletonText, { 
              backgroundColor: colors.border,
              width: 40,
              height: 12
            }]} />
          </View>
        ))}
      </View>

      <View style={[styles.titleBadge, { backgroundColor: colors.border }]}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
        <View style={[styles.skeletonText, { 
          backgroundColor: colors.text,
          width: 80,
          marginLeft: 4
        }]} />
      </View>
    </View>
  </Shimmer>
);

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
      // Check if we've already shown the streak overlay for this user in this session
      const shownKey = `streakOverlayShown_${userId}`;
      const hasShown = await AsyncStorage.getItem(shownKey);
      
      if (!hasShown) {
        setShowStreakOverlay(true);
        // Mark as shown for this session
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

        // Check if we should show the streak overlay
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
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, selected_title')
          .eq('id', user.id)
          .single();
        
        // Get streak data from login_streaks table
        const { data: streakData } = await supabase
          .from('login_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserStats({
            points: profile.points || 0,
            level: Math.floor((profile.points || 0) / 100) + 1,
            streak: streakData?.current_streak || 0, // Use actual streak from login_streaks table
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
          <Shimmer colors={colors}>
            <View style={[styles.pointsContainer, { 
              backgroundColor: colors.border,
              width: 80,
              height: 30,
              borderRadius: 15
            }]} />
          </Shimmer>
        ) : (
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsText, { color: colors.text }]}>TP - {userProfile?.points || 0}</Text>
          </View>
        )}
      </View>

      {/* User Header */}
      {isProfileLoading ? (
        <HeaderSkeleton colors={colors} />
      ) : (
        <View style={styles.header}>
          <View>
            <View style={styles.firstRow}>
              <Pressable onPress={() => router.push('/profile')}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Hi {userProfile?.first_name || 'User'}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push('/favorites')} style={styles.addButton}>
                <Search size={24} color={colors.text} />
              </Pressable>
            </View>
            {userProfile?.selected_title && (
              <Text style={[styles.selectedTitle, { color: colors.primary }]}>
                {userProfile.selected_title}
              </Text>
            )}
          </View>
        </View>
      )}

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

      {/* Favorites Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Favorites</Text>
        
        {isProfileLoading ? (
          <FavoritesSkeleton colors={colors} />
        ) : favorites.length > 0 ? (
          <View style={styles.grid}>
            {favorites.map((favorite, index) => {
              const details = favoriteDetails.find(d => d.id === favorite.id) || {};
              
              return (
                <Pressable
                  key={`${favorite.id}-${index}`}
                  style={[styles.card, { backgroundColor: colors.card }]}
                  onPress={() => {
                    if (details.type === 'hub') {
                      router.push(`/hub-details?hubId=${details.id}`);
                    } else if (details.type === 'stop') {
                      router.push(`/stop-details?stopId=${details.id}`);
                    } else if (details.type === 'route') {
                      router.push(`/route-details?routeId=${details.id}`);
                    } else {
                      Alert.alert('Info', `Favorite: ${favorite.name}`);
                    }
                  }}
                >
                  <View style={styles.favoriteItem}>
                    {details.type === 'hub' && <MapPin size={24} color={colors.primary} />}
                    {details.type === 'stop' && <Flag size={24} color={colors.primary} />}
                    {details.type === 'route' && <Route size={24} color={colors.primary} />}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardText, { color: colors.text }]}>
                        {favorite.name}
                      </Text>
                      {favorite.distance && (
                        <Text style={[styles.distanceText, { color: colors.text }]}>
                          {favorite.distance} away
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(favorite)}
                      style={{ padding: 4 }}
                    >
                      <Heart
                        size={20}
                        color={colors.primary}
                        fill={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              );
            })}
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
      {isStatsLoading ? (
        <GamificationSkeleton colors={colors} />
      ) : (
        <View style={styles.gamificationCard}>
          <View style={styles.gamificationHeader}>
            <Trophy size={24} color="#fbbf24" />
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
      )}
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
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 16,
    borderRadius: 4,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  favoriteItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerPlaceholder: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    marginBottom: 16,
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