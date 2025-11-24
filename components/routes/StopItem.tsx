import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { Stop } from './RoutesScreen';

interface StopItemProps {
  stop: Stop;
}

export default function StopItem({ stop }: StopItemProps) {
  const router = useRouter();

  const navigateToStop = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  return (
    <TouchableOpacity
      style={styles.stopCard}
      onPress={() => navigateToStop(stop.id)}
    >
      <View style={styles.stopHeader}>
        <Flag size={24} color="#1ea2b1" />
        <View style={styles.stopInfo}>
          <Text style={styles.stopName}>{stop.name}</Text>
          {stop.address && (
            <Text style={styles.stopAddress}>{stop.address}</Text>
          )}
        </View>
      </View>
      <View style={styles.stopFooter}>
        <Text style={[styles.coordinatesText, { color: '#1ea2b1' }]}>
          Followers: {0} {/* You can add follower counts later */}
        </Text>
        {stop.routes_count && (
          <Text style={styles.routesCount}>
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
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  routesCount: {
    fontSize: 12,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});