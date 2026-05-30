import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, MapPin, Route, Globe, Navigation } from 'lucide-react-native';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { SuggestStopModal, SuggestRouteModal } from './SuggestionModals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HeaderSectionProps {
  isProfileLoading: boolean;
  userProfile: any;
  colors: any;
  onSearchPress?: (y: number) => void;
  isUnsupportedRegion?: boolean;
  userLat?: number | null;
  userLng?: number | null;
}

interface LocationInfo {
  city: string;
  country: string;
  displayName: string;
}

const HeaderSection = ({
  isProfileLoading,
  userProfile,
  colors,
  onSearchPress,
  isUnsupportedRegion = false,
  userLat = null,
  userLng = null,
}: HeaderSectionProps) => {
  const searchBarRef = React.useRef<View>(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode to get city and country for unsupported region
  useEffect(() => {
    const getLocationName = async () => {
      if (!isUnsupportedRegion || !userLat || !userLng) return;

      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&addressdetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'UthuthoApp/1.0'
            }
          }
        );

        const data = await response.json();

        const city = data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'Your Area';

        const country = data.address?.country || 'Your Country';

        setLocationInfo({
          city: city,
          country: country,
          displayName: `${city}, ${country}`,
        });
      } catch (error) {
        console.error('Geocoding error:', error);
        setLocationInfo({
          city: 'Your Area',
          country: 'Your Country',
          displayName: 'Your Area',
        });
      } finally {
        setIsGeocoding(false);
      }
    };

    getLocationName();
  }, [isUnsupportedRegion, userLat, userLng]);

  if (isProfileLoading) {
    return <HeaderSkeleton colors={colors} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handlePress = () => {
    if (onSearchPress && searchBarRef.current) {
      searchBarRef.current.measureInWindow((x, y) => {
        onSearchPress(y);
      });
    }
  };

  const nameString = userProfile?.first_name ? `, ${userProfile.first_name}` : '';

  // ── Unsupported Region UI ─────────────────────────────────────────────────
  if (isUnsupportedRegion) {
    return (
      <>
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          {/* Greeting */}
          <Text style={[styles.greetingText, { color: colors.text }]}>
            {getGreeting()}{nameString}
          </Text>

          {/* Location detection indicator or display */}
          {isGeocoding ? (
            <View style={styles.locationLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.locationLoadingText, { color: colors.text, opacity: 0.7 }]}>
                Detecting your location...
              </Text>
            </View>
          ) : locationInfo && (
            <View style={[styles.locationContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Navigation size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primary }]}>
                {locationInfo.displayName}
              </Text>
            </View>
          )}

          {/* Main message with location name */}
          <Text style={styles.unsupportedTitle}>
            Uthutho isn't fully functional in {locationInfo?.city || 'your area'} yet.
          </Text>
          <Text style={styles.unsupportedSubtitle}>
            But you can start the movement.
          </Text>

          <Text style={styles.unsupportedBody}>
            Help us map {locationInfo?.city || 'your city'} by suggesting stops and routes. Once your area gets enough community votes, we will go live.
          </Text>

          {/* CTA Buttons - Removed as requested */}
        </View>
      </>
    );
  }

  // ── Normal UI ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <Text style={[styles.greetingText, { color: colors.text }]}>
        {getGreeting()}{nameString}
      </Text>

      <Text style={[styles.headingText, { color: '#fed43f' }]}>
        Where are we heading?
      </Text>

      <Pressable
        ref={searchBarRef}
        style={[styles.searchBar, { backgroundColor: colors.card || '#1A1D1E' }]}
        onPress={handlePress}
      >
        <Search size={22} color="#888888" />
        <Text style={styles.searchPlaceholder}>Search destinations, stations</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerDesktop: {
    marginBottom: 32,
    paddingTop: 16,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headingText: {
    fontSize: 30,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1A1D1E',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#888888',
    marginLeft: 12,
  },

  // ── Unsupported region styles ─────────────────────────────────────────────
  locationLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  locationLoadingText: {
    fontSize: 13,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unsupportedTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 10,
  },
  unsupportedSubtitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1ea2b1',
    letterSpacing: -0.5,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  unsupportedBody: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 0,
  },
});

export default HeaderSection;