import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, Navigation } from 'lucide-react-native';
import { Hub } from './RoutesScreen';

interface HubItemProps {
  hub: Hub;
  followerCount?: number;
  showDistance?: boolean;
  distance?: string;
}

export default function HubItem({ 
  hub, 
  followerCount = 0,
  showDistance = false,
  distance = '0 km'
}: HubItemProps) {
  const router = useRouter();

  const navigateToHub = (hubId: string) => {
    router.push(`/hub/${hubId}`);
  };

  const imageUrl = hub.image || 'https://images.theconversation.com/files/347103/original/file-20200713-42-1scm7g7.jpg?ixlib=rb-4.1.0&q=45&auto=format&w=1356&h=668&fit=crop';

  return (
    <TouchableOpacity
      style={styles.hubCard}
      onPress={() => navigateToHub(hub.id)}
      activeOpacity={0.8}
    >
      {/* Side Image */}
      <View style={styles.imageContainerSide}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.hubImageSide}
          resizeMode="cover"
        />
        {hub.transport_type && (
          <View style={styles.transportTypeBadgeSide}>
            <Text style={styles.transportTypeTextSide}>{hub.transport_type.charAt(0)}</Text>
          </View>
        )}
      </View>

      {/* Hub Content */}
      <View style={styles.contentContainerSide}>
        <View style={styles.hubHeader}>
          <MapPin size={16} color="#1ea2b1" />
          <View style={styles.hubInfo}>
            <Text style={styles.hubName} numberOfLines={1}>{hub.name}</Text>
            <Text style={styles.hubAddress} numberOfLines={1}>
              {hub.address || 'Transport hub'}
            </Text>
          </View>
        </View>

        {/* Hub Details */}
        <View style={styles.hubDetails}>
          <View style={styles.detailItem}>
            <Users size={12} color="#1ea2b1" />
            <Text style={styles.detailText}>{followerCount} followers</Text>
          </View>
          
          {hub.transport_type && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailText, styles.transportType]}>
                {hub.transport_type}
              </Text>
            </View>
          )}
          
          {showDistance && (
            <View style={styles.detailItem}>
              <Navigation size={12} color="#fbbf24" />
              <Text style={[styles.detailText, styles.distanceText]}>{distance}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hubCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainerSide: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  hubImageSide: {
    width: '100%',
    height: '100%',
  },
  transportTypeBadgeSide: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#1ea2b1',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  transportTypeTextSide: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainerSide: {
    flex: 1,
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hubInfo: {
    marginLeft: 8,
    flex: 1,
  },
  hubName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  hubAddress: {
    fontSize: 12,
    color: '#cccccc',
  },
  hubDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#666666',
  },
  transportType: {
    color: '#1ea2b1',
    backgroundColor: '#1ea2b110',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    color: '#fbbf24',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 10,
    color: '#444444',
    fontFamily: 'monospace',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});