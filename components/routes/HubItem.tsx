import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Hub } from './RoutesScreen';

interface HubItemProps {
  hub: Hub;
}

export default function HubItem({ hub }: HubItemProps) {
  const router = useRouter();

  const navigateToHub = (hubId: string) => {
    router.push(`/hub/${hubId}`);
  };

  return (
    <TouchableOpacity
      style={styles.hubCard}
      onPress={() => navigateToHub(hub.id)}
    >
      <View style={styles.hubHeader}>
        <MapPin size={24} color="#1ea2b1" />
        <View style={styles.hubInfo}>
          <Text style={styles.hubName}>{hub.name}</Text>
          {hub.address && (
            <Text style={styles.hubAddress}>{hub.address}</Text>
          )}
          {hub.transport_type && (
            <Text style={styles.hubType}>{hub.transport_type}</Text>
          )}
        </View>
      </View>
      <View style={styles.hubCoordinates}>
        <Text style={[styles.coordinatesText, { marginTop: 4, color: '#1ea2b1' }]}>
          Followers: {0} {/* You can add follower counts later */}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hubCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hubInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  hubAddress: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  hubType: {
    fontSize: 12,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hubCoordinates: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});