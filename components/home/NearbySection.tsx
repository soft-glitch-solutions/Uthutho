import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Flag, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import StopBlock from '@/components/stop/StopBlock';
import NearestLocationsSkeleton from './skeletons/NearestLocationsSkeleton';

interface NearbySectionProps {
  locationError: string | null;
  isNearestLoading: boolean;
  userLocation: any;
  nearestLocations: any;
  colors: any;
  handleNearestStopPress: (stopId: string) => void;
  handleNearestHubPress: (hubId: string) => void;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

const NearbySection = ({
  locationError,
  isNearestLoading,
  userLocation,
  nearestLocations,
  colors,
  handleNearestStopPress,
  handleNearestHubPress,
  calculateWalkingTime
}: NearbySectionProps) => {
  return (
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
  );
};

const styles = {
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
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
    fontWeight: 'bold' as 'bold',
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
  favoriteItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
};

export default NearbySection;