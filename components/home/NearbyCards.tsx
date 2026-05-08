import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, ImageBackground } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import StopBlock from '@/components/stop/StopBlock';

interface NearbyCardsProps {
  userLocation: {
    lat: number;
    lng: number;
  };
  nearestLocations: {
    nearestStop: any;
    nearestHub: any;
    nearestStops?: any[];
  } | null;
  handleNearestStopPress: (stopId: string) => void;
  handleNearestHubPress?: (hubId: string) => void;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  hasActiveJourney: boolean;
  onMarkAsWaiting: (locationId: string, locationType: string, locationName: string) => void;
}

interface LocationCardProps {
  location: any;
  userLocation: {
    lat: number;
    lng: number;
  };
  colors: any;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  onPress: () => void;
}

const NearbyCards: React.FC<NearbyCardsProps> = ({
  userLocation,
  nearestLocations,
  handleNearestStopPress,
  calculateWalkingTime,
}) => {
  const { colors } = useTheme();
  const stops = nearestLocations?.nearestStops || (nearestLocations?.nearestStop ? [nearestLocations.nearestStop] : []);

  if (stops.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>No stops found nearby.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
    >
      {stops.map((stop, index) => (
        <LocationCard
          key={stop.id || index}
          location={stop}
          userLocation={userLocation}
          colors={colors}
          calculateWalkingTime={calculateWalkingTime}
          onPress={() => handleNearestStopPress(stop.id)}
        />
      ))}
    </ScrollView>
  );
};

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  userLocation,
  colors,
  calculateWalkingTime,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    setTimeout(() => {
      onPress();
    }, 150);
  };

  const imageUrl = location.image_url || 'https://images.caxton.co.za/wp-content/uploads/sites/10/2023/03/IMG_9281_07602-e1680074626338-780x470.jpg';

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed // iOS fallback
      ]}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          { 
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <View style={styles.darkOverlay} />
          
          <View style={styles.contentOverlay}>
            <View style={styles.leftContent}>
              <View style={styles.pinContainer}>
                <MapPin size={22} color="#ffffff" strokeWidth={2.5} />
              </View>
              
              <View style={styles.textContainer}>
                <Text 
                  style={styles.cardText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {location.name}
                </Text>
                <Text style={styles.distanceText}>
                  {calculateWalkingTime(
                    userLocation.lat,
                    userLocation.lng,
                    location.latitude,
                    location.longitude
                  )} min walk
                </Text>
              </View>
            </View>

            <View style={styles.rightContent}>
              <StopBlock
                stopId={location.id}
                stopName={location.name}
                stopLocation={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                colors={colors}
                radius={0.5}
                variant="compact"
              />
            </View>
          </View>

        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    gap: 12,
    paddingRight: 16,
  },
  pressable: {
    width: 260,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#004d40', // Dark teal base
  },
  imageBackground: {
    width: '100%',
    minHeight: 140,
  },

  imageStyle: {
    borderRadius: 12,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 77, 64, 0.85)', // Very opaque dark teal
    borderRadius: 16,
  },
  contentOverlay: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 12,
  },
  pinContainer: {
    marginBottom: 8,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 'auto',
  },
  cardText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default NearbyCards;