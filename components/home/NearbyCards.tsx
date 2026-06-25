import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { MapPin, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import StopBlock from '@/components/stop/StopBlock';
import SuggestStopToStopsModal from './SuggestStopToStopsModal';

const PINK = '#e91e8c';
const TEAL_OVERLAY = 'rgba(0, 77, 64, 0.85)';
const PINK_OVERLAY  = 'rgba(140, 10, 80, 0.82)';

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
  userLocation: { lat: number; lng: number };
  colors: any;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  onPress: () => void;
  isSuggested?: boolean;
}

const NearbyCards: React.FC<NearbyCardsProps> = ({
  userLocation,
  nearestLocations,
  handleNearestStopPress,
  calculateWalkingTime,
}) => {
  const { colors } = useTheme();
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  const stops = nearestLocations?.nearestStops || (nearestLocations?.nearestStop ? [nearestLocations.nearestStop] : []);

  if (stops.length === 0) {
    return (
      <>
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No stops found nearby.</Text>
        </View>
        <SuggestStopToStopsModal
          visible={showSuggestModal}
          onClose={() => setShowSuggestModal(false)}
          userLocation={userLocation}
          onSuccess={() => setShowSuggestModal(false)}
        />
      </>
    );
  }

  return (
    <>
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
            isSuggested={!!stop.Suggested}
          />
        ))}

        {/* ── Suggest Stop card ─────────────────────────────────────────── */}
        <SuggestStopCard onPress={() => setShowSuggestModal(true)} />
      </ScrollView>

      <SuggestStopToStopsModal
        visible={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        userLocation={userLocation}
        onSuccess={() => setShowSuggestModal(false)}
      />
    </>
  );
};

// ── Suggest Stop CTA card ──────────────────────────────────────────────────
const SuggestStopCard: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.timing(scaleAnim, { toValue: 0.96, duration: 130, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.timing(scaleAnim, { toValue: 1, duration: 130, useNativeDriver: true }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[styles.suggestCard, { transform: [{ scale: scaleAnim }] }]}>
        {/* Glow background */}
        <View style={styles.suggestGlow} />

        {/* Plus icon */}
        <View style={styles.suggestIconWrap}>
          <Plus size={28} color={PINK} strokeWidth={2.5} />
        </View>

        {/* Text */}
        <Text style={styles.suggestTitle}>Suggest a Stop</Text>
        <Text style={styles.suggestSub}>Missing a stop?{'\n'}Put it on the map</Text>

        {/* Badge */}
        <View style={styles.suggestBadge}>
          <Text style={styles.suggestBadgeText}>50 TP</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ── Regular stop card ──────────────────────────────────────────────────────
const LocationCard: React.FC<LocationCardProps> = ({
  location,
  userLocation,
  colors,
  calculateWalkingTime,
  onPress,
  isSuggested,
}) => {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.parallel([
      Animated.timing(scaleAnim,   { toValue: 0.97, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.8,  duration: 150, useNativeDriver: true }),
    ]).start();

  const handlePressOut = () =>
    Animated.parallel([
      Animated.timing(scaleAnim,   { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

  const handlePress = () => setTimeout(() => onPress(), 150);

  const imageUrl = location.image_url ||
    'https://images.caxton.co.za/wp-content/uploads/sites/10/2023/03/IMG_9281_07602-e1680074626338-780x470.jpg';

  const overlayColor = isSuggested ? PINK_OVERLAY : TEAL_OVERLAY;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <View style={[styles.darkOverlay, { backgroundColor: overlayColor }]} />

          {/* Suggested badge */}
          {isSuggested && (
            <View style={styles.suggestedBadge}>
              <MapPin size={10} color="#fff" />
              <Text style={styles.suggestedBadgeText}>Community</Text>
            </View>
          )}

          <View style={styles.contentOverlay}>
            <View style={styles.leftContent}>
              <View style={styles.pinContainer}>
                <MapPin size={22} color={isSuggested ? '#ffb3d9' : '#ffffff'} strokeWidth={2.5} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardText} numberOfLines={2} ellipsizeMode="tail">
                  {location.name}
                </Text>
                <Text style={styles.distanceText}>
                  {calculateWalkingTime(
                    userLocation.lat, userLocation.lng,
                    location.latitude, location.longitude,
                  )} min walk
                </Text>
              </View>
            </View>

            <View style={styles.rightContent}>
              <StopBlock
                stopId={location.id}
                stopName={location.name}
                stopLocation={{ latitude: location.latitude, longitude: location.longitude }}
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
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Regular stop card
  cardContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#004d40',
  },
  imageBackground: {
    width: '100%',
    minHeight: 140,
  },
  imageStyle: { borderRadius: 12 },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  suggestedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PINK,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  suggestedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  contentOverlay: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: { flex: 1, justifyContent: 'space-between', height: '100%', paddingRight: 12 },
  pinContainer: { marginBottom: 8 },
  rightContent: { justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginTop: 'auto' },
  cardText: { fontSize: 20, fontWeight: '800', color: '#ffffff', lineHeight: 24, marginBottom: 8 },
  distanceText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  pressed: { opacity: 0.8 },

  emptyContainer: { padding: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, opacity: 0.8 },

  // Suggest stop card
  suggestCard: {
    width: 160,
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${PINK}50`,
    borderStyle: 'dashed',
    backgroundColor: `${PINK}0d`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    overflow: 'hidden',
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${PINK}06`,
    borderRadius: 16,
  },
  suggestIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${PINK}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: `${PINK}30`,
  },
  suggestTitle: {
    color: PINK,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  suggestSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
  },
  suggestBadge: {
    backgroundColor: `${PINK}22`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${PINK}40`,
  },
  suggestBadgeText: { color: PINK, fontSize: 11, fontWeight: '700' },
});

export default NearbyCards;
