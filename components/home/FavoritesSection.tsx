import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  Dimensions,
  Image,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Flag, Route, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import FavoritesSkeleton from './skeletons/FavoritesSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
  image_url?: string;
}

interface FavoritesSectionProps {
  isProfileLoading: boolean;
  favorites: FavoriteItem[];
  favoriteDetails: any[];
  colors: any;
  toggleFavorite: (item: FavoriteItem) => void;
  favoritesCountMap: Record<string, number>;
}

const FavoritesSection = ({
  isProfileLoading,
  favorites,
  favoriteDetails,
  colors,
  toggleFavorite,
  favoritesCountMap
}: FavoritesSectionProps) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (favorites.length > 1) {
      const interval = setInterval(() => {
        nextCommunity();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [favorites.length, currentIndex]);

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -50 : 50,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const nextCommunity = () => {
    if (favorites.length === 0) return;
    animateTransition('next', () => {
      setCurrentIndex((prev) => (prev + 1) % favorites.length);
    });
  };

  const prevCommunity = () => {
    if (favorites.length === 0) return;
    animateTransition('prev', () => {
      setCurrentIndex((prev) => (prev - 1 + favorites.length) % favorites.length);
    });
  };

  if (isProfileLoading) {
    return <FavoritesSkeleton colors={colors} />;
  }

  if (favorites.length === 0) {
    return (
      <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <Text style={[styles.sectionTitle, { color: colors.text }, isDesktop && styles.sectionTitleDesktop]}>
            Your Communities
          </Text>
        </View>
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }, isDesktop && styles.emptyContainerDesktop]}>
          <Text style={[styles.emptyText, { color: colors.text }, isDesktop && styles.emptyTextDesktop]}>
            No communities joined yet.
          </Text>
          <Pressable
            onPress={() => router.push('/explore')}
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.exploreButtonText}>Explore Communities</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentFavorite = favorites[currentIndex];
  const currentDetails = favoriteDetails.find(d => d.id === currentFavorite?.id) || {};
  const followerCount = favoritesCountMap[currentFavorite?.id] || 0;

  const getTypeIcon = (type: string, size: number) => {
    switch (type) {
      case 'hub':
        return <MapPin size={size} color={colors.primary} />;
      case 'stop':
        return <Flag size={size} color={colors.primary} />;
      case 'route':
        return <Route size={size} color={colors.primary} />;
      default:
        return <Users size={size} color={colors.primary} />;
    }
  };

  const getImageUrl = (favorite: FavoriteItem, details: any) => {
    if (favorite?.image_url) return favorite.image_url;
    if (details?.image || details?.image_url) return details.image || details.image_url;

    switch (favorite?.type) {
      case 'hub':
        return '@/assets/images/Community.jpg';
      case 'stop':
        return 'https://ygkhmcnpjjvmbrbyybik.supabase.co/storage/v1/object/public/stops/stop_default.png';
      default:
        return 'https://ygkhmcnpjjvmbrbyybik.supabase.co/storage/v1/object/public/stops/stop_default.png';
    }
  };

  const imageUrl = getImageUrl(currentFavorite, currentDetails);

  return (
    <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <Text style={[styles.sectionTitle, { color: colors.text }, isDesktop && styles.sectionTitleDesktop]}>
          Your Communities
        </Text>
        {favorites.length > 0 && (
          <Pressable onPress={() => router.push('/favorites')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See All ({favorites.length})
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.communityBlock, { backgroundColor: colors.card }, isDesktop && styles.communityBlockDesktop]}>
        {/* Navigation Arrows */}
        {favorites.length > 1 && (
          <>
            <Pressable
              onPress={prevCommunity}
              style={[styles.navArrow, styles.navArrowLeft, { backgroundColor: colors.background + 'CC' }]}
            >
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={nextCommunity}
              style={[styles.navArrow, styles.navArrowRight, { backgroundColor: colors.background + 'CC' }]}
            >
              <ChevronRight size={24} color={colors.text} />
            </Pressable>
          </>
        )}

        {/* Animated Content */}
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <Pressable
            onPress={() => {
              if (currentDetails.type === 'hub') {
                router.push(`/hub-details?hubId=${currentDetails.id}`);
              } else if (currentDetails.type === 'stop') {
                router.push(`/stop-details?stopId=${currentDetails.id}`);
              } else if (currentDetails.type === 'route') {
                router.push(`/route-details?routeId=${currentDetails.id}`);
              } else {
                Alert.alert('Info', `Community: ${currentFavorite?.name}`);
              }
            }}
            style={styles.communityPressable}
          >
            {/* Image Section */}
            <View style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                defaultSource={require('@/assets/images/school.jpg')}
              />
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                {getTypeIcon(currentFavorite?.type || 'hub', isDesktop ? 14 : 16)}
                <Text style={[styles.typeText, { color: colors.primary }]}>
                  {currentFavorite?.type?.charAt(0).toUpperCase() + currentFavorite?.type?.slice(1) || 'Community'}
                </Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentContainer}>
              <Text style={[styles.communityName, { color: colors.text }, isDesktop && styles.communityNameDesktop]} numberOfLines={1}>
                {currentFavorite?.name}
              </Text>

              {currentFavorite?.distance && (
                <Text style={[styles.distanceText, { color: colors.text }, isDesktop && styles.distanceTextDesktop]}>
                  📍 {currentFavorite.distance} away
                </Text>
              )}

              {/* Followers Section */}
              <View style={styles.followersContainer}>
                <Users size={isDesktop ? 14 : 16} color={colors.text} />
                <Text style={[styles.followerCount, { color: colors.text }, isDesktop && styles.followerCountDesktop]}>
                  {followerCount.toLocaleString()} followers
                </Text>
              </View>

              {/* Join/Leave Button */}
              <Pressable
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => toggleFavorite(currentFavorite)}
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Joined
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionDesktop: {
    marginBottom: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerDesktop: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitleDesktop: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  communityBlock: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  communityBlockDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  animatedContent: {
    width: '100%',
  },
  communityPressable: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  imageContainerDesktop: {
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
    gap: 8,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
  },
  communityNameDesktop: {
    fontSize: 17,
  },
  distanceText: {
    fontSize: 13,
  },
  distanceTextDesktop: {
    fontSize: 12,
  },
  followersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  followerCount: {
    fontSize: 13,
  },
  followerCountDesktop: {
    fontSize: 12,
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  navArrowLeft: {
    left: 10,
  },
  navArrowRight: {
    right: 10,
  },
  progressContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  emptyContainerDesktop: {
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTextDesktop: {
    fontSize: 14,
  },
  exploreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default FavoritesSection;