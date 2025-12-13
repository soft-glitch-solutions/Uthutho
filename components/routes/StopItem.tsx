import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Flag, Users, MapPin, Navigation } from 'lucide-react-native';
import { Stop } from './RoutesScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface StopItemProps {
  stop: Stop;
  followerCount?: number;
  isDesktop?: boolean;
  showDistance?: boolean;
  distance?: string;
  showRoutes?: boolean;
}

export default function StopItem({ 
  stop, 
  followerCount = 0, 
  isDesktop: propIsDesktop = false,
  showDistance = false,
  distance = '0 km',
  showRoutes = true
}: StopItemProps) {
  const router = useRouter();
  const desktopMode = isDesktop || propIsDesktop;

  const navigateToStop = (stopId: string) => {
    router.push(`/stop-details?stopId=${stopId}`);
  };

  // Default image if none is provided
  const imageUrl = stop.image_url || 'https://images.caxton.co.za/wp-content/uploads/sites/10/2023/03/IMG_9281_07602-e1680074626338-780x470.jpg';

  return (
    <TouchableOpacity
      style={[styles.stopCard, desktopMode && styles.stopCardDesktop]}
      onPress={() => navigateToStop(stop.id)}
      activeOpacity={0.8}
    >
      {/* Side Image */}
      <View style={styles.imageContainerSide}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.stopImageSide}
          resizeMode="cover"
        />

      </View>

      {/* Content Section */}
      <View style={styles.contentContainerSide}>
        <View style={styles.stopHeader}>
          <Flag size={16} color="#1ea2b1" />
          <View style={styles.stopInfo}>
            <Text style={styles.stopName} numberOfLines={2}>
              {stop.name}
            </Text>
            {stop.address && (
              <View style={styles.addressContainer}>
                <MapPin size={12} color="#666666" />
                <Text style={styles.stopAddress} numberOfLines={1}>
                  {stop.address}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Stop Details */}
        <View style={styles.stopDetails}>
          {/* Followers */}
          <View style={styles.detailItem}>
            <Users size={12} color="#1ea2b1" />
            <Text style={styles.detailText}>{followerCount} followers</Text>
          </View>
          
          {/* Routes Count */}
          {showRoutes && stop.routes_count && stop.routes_count > 0 && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailText, styles.routesText]}>
                {stop.routes_count} route{stop.routes_count !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {/* Distance (if provided) */}
          {showDistance && (
            <View style={styles.detailItem}>
              <Navigation size={12} color="#fbbf24" />
              <Text style={[styles.detailText, styles.distanceText]}>{distance}</Text>
            </View>
          )}
          
          {/* Cost (if available) */}
          {stop.cost && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailText, styles.costText]}>
                R{stop.cost.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Coordinates */}

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stopCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopCardDesktop: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    marginBottom: 12,
  },
  imageContainerSide: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  stopImageSide: {
    width: '100%',
    height: '100%',
  },
  stopNumberBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#1ea2b1',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  stopNumberText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainerSide: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stopInfo: {
    marginLeft: 10,
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 18,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopAddress: {
    fontSize: 12,
    color: '#999999',
    flex: 1,
  },
  stopDetails: {
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
  routesText: {
    color: '#1ea2b1',
    backgroundColor: '#1ea2b110',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
  },
  distanceText: {
    color: '#fbbf24',
  },
  costText: {
    color: '#34d399',
    backgroundColor: '#065f4620',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  coordinatesText: {
    fontSize: 10,
    color: '#444444',
    fontFamily: 'monospace',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});