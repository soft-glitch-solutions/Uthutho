import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { Stop } from './RoutesScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface StopItemProps {
  stop: Stop;
  followerCount?: number;
  isDesktop?: boolean;
}

export default function StopItem({ stop, followerCount = 0, isDesktop: propIsDesktop = false }: StopItemProps) {
  const router = useRouter();
  const desktopMode = isDesktop || propIsDesktop;

  const navigateToStop = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  return (
    <TouchableOpacity
      style={[styles.stopCard, desktopMode && styles.stopCardDesktop]}
      onPress={() => navigateToStop(stop.id)}
    >
      <View style={styles.stopHeader}>
        <Flag size={desktopMode ? 20 : 24} color="#1ea2b1" />
        <View style={[styles.stopInfo, desktopMode && styles.stopInfoDesktop]}>
          <Text style={[styles.stopName, desktopMode && styles.stopNameDesktop]}>{stop.name}</Text>
          {stop.address && (
            <Text style={[styles.stopAddress, desktopMode && styles.stopAddressDesktop]}>
              {stop.address}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.stopFooter, desktopMode && styles.stopFooterDesktop]}>
        <View style={styles.followersContainer}>
          <Text style={[styles.coordinatesText, { color: '#1ea2b1' }]}>
            Followers: {followerCount}
          </Text>
        </View>
        {stop.routes_count && (
          <Text style={[styles.routesCount, desktopMode && styles.routesCountDesktop]}>
            {stop.routes_count} routes
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stopCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stopCardDesktop: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    marginBottom: 16,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stopInfoDesktop: {
    marginLeft: 10,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  stopNameDesktop: {
    fontSize: 15,
  },
  stopAddress: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  stopAddressDesktop: {
    fontSize: 13,
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  stopFooterDesktop: {
    paddingTop: 6,
  },
  followersContainer: {
    backgroundColor: '#1ea2b110',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  routesCount: {
    fontSize: 12,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  routesCountDesktop: {
    fontSize: 11,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});