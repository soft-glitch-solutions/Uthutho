import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Flag, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import StopBlock from '@/components/stop/StopBlock';
import HubFollowButton from '@/components/hub/HubFollowButton';

interface NearbyCardsProps {
  userLocation: {
    lat: number;
    lng: number;
  };
  nearestLocations: {
    nearestStop: any;
    nearestHub: any;
  } | null;
  handleNearestStopPress: (stopId: string) => void;
  handleNearestHubPress: (hubId: string) => void;
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
  type: 'stop' | 'hub';
}

const NearbyCards: React.FC<NearbyCardsProps> = ({
  userLocation,
  nearestLocations,
  handleNearestStopPress,
  handleNearestHubPress,
  calculateWalkingTime,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      <LocationCard
        location={nearestLocations?.nearestStop}
        userLocation={userLocation}
        colors={colors}
        calculateWalkingTime={calculateWalkingTime}
        onPress={() => nearestLocations?.nearestStop && handleNearestStopPress(nearestLocations.nearestStop.id)}
        type="stop"
      />
      
      <LocationCard
        location={nearestLocations?.nearestHub}
        userLocation={userLocation}
        colors={colors}
        calculateWalkingTime={calculateWalkingTime}
        onPress={() => nearestLocations?.nearestHub && handleNearestHubPress(nearestLocations.nearestHub.id)}
        type="hub"
      />
    </View>
  );
};

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  userLocation,
  colors,
  calculateWalkingTime,
  onPress,
  type
}) => {
  const isStop = type === 'stop';
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
    // Add a small delay to ensure animation completes before navigation
    setTimeout(() => {
      onPress();
    }, 150);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      android_ripple={{ color: colors.ripple || 'rgba(255, 255, 255, 0.2)', borderless: false }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed // iOS fallback
      ]}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.card,
            { 
              backgroundColor: colors.primary,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <View style={styles.favoriteItem}>
            {isStop ? (
              <Flag size={24} color={colors.text} />
            ) : (
              <MapPin size={24} color={colors.text} />
            )}
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              Nearest {isStop ? 'Stop' : 'Hub'}
            </Text>
          </View>
          
          {location ? (
            <>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {location.name}
              </Text>
              <Text style={[styles.distanceText, { color: colors.text }]}>
                {calculateWalkingTime(
                  userLocation.lat,
                  userLocation.lng,
                  location.latitude,
                  location.longitude
                )} min walk
              </Text>
              
              {isStop ? (
                <StopBlock
                  stopId={location.id}
                  stopName={location.name}
                  stopLocation={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  colors={colors}
                  radius={0.5}
                />
              ) : (
                <HubFollowButton
                  hubId={location.id}
                  hubName={location.name}
                  colors={colors}
                />
              )}
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No {isStop ? 'stops' : 'hubs'} found.
            </Text>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pressable: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 8,
    overflow: 'hidden', // Important for ripple effect
  },
  card: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8, // Fallback for iOS when animated driver fails
  },
});

export default NearbyCards;