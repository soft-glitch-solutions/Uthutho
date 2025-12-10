import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import InteractiveNearbyMap from './InteractiveNearbyMap';
import NearbyCards from './NearbyCards';
import NearestLocationsSkeleton from './skeletons/NearestLocationsSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface NearbySectionProps {
  locationError: string | null;
  isNearestLoading: boolean;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
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

const NearbySection: React.FC<NearbySectionProps> = (props) => {
  const { colors } = useTheme();
  const { 
    locationError, 
    isNearestLoading, 
    userLocation 
  } = props;

  return (
    <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
      <Text style={[styles.sectionTitle, { color: colors.text }, isDesktop && styles.sectionTitleDesktop]}>
        Nearby You
      </Text>
      
      {locationError ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.errorText, { color: colors.error || '#ef4444' }]}>{locationError}</Text>
        </View>
      ) : isNearestLoading || !userLocation ? (
        <NearestLocationsSkeleton colors={colors} />
      ) : isDesktop ? (
        <InteractiveNearbyMap
          userLocation={userLocation}
          nearestLocations={props.nearestLocations}
          calculateWalkingTime={props.calculateWalkingTime}
          handleNearestStopPress={props.handleNearestStopPress}
          handleNearestHubPress={props.handleNearestHubPress}
        />
      ) : (
        <NearbyCards {...props} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionDesktop: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionTitleDesktop: {
    fontSize: 16,
    marginBottom: 10,
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
  errorText: {
    fontSize: 14,
  },
});

export default NearbySection;