import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Route } from './RoutesScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface RouteItemProps {
  route: Route;
  followerCount?: number;
  isDesktop?: boolean;
}

export default function RouteItem({ route, followerCount = 0, isDesktop: propIsDesktop = false }: RouteItemProps) {
  const router = useRouter();
  const desktopMode = isDesktop || propIsDesktop;

  const navigateToRoute = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  return (
    <TouchableOpacity
      style={[styles.routeCard, desktopMode && styles.routeCardDesktop]}
      onPress={() => navigateToRoute(route.id)}
    >
      <View style={[styles.routeHeader, desktopMode && styles.routeHeaderDesktop]}>
        <View style={styles.routeInfo}>
          <Text style={[styles.routeTitle, desktopMode && styles.routeTitleDesktop]}>{route.name}</Text>
          <View style={styles.followersContainer}>
            <Text style={[styles.coordinatesText, { marginTop: 4, color: '#1ea2b1' }]}>
              Followers: {followerCount}
            </Text>
          </View>
        </View>
        <View style={[styles.routeType, desktopMode && styles.routeTypeDesktop]}>
          <Text style={[styles.routeTypeText, desktopMode && styles.routeTypeTextDesktop]}>
            {route.transport_type}
          </Text>
        </View>
      </View>

      <View style={[styles.routeFooter, desktopMode && styles.routeFooterDesktop]}>
        <View style={styles.routeDetail}>
          <Clock size={desktopMode ? 14 : 16} color="#1ea2b1" />
          <Text style={[styles.routeDetailText, desktopMode && styles.routeDetailTextDesktop]}>
            Est. 45-60 min
          </Text>
        </View>
        <Text style={[styles.routeCost, desktopMode && styles.routeCostDesktop]}>
          R {route.cost}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeCardDesktop: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    marginBottom: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeHeaderDesktop: {
    marginBottom: 10,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeTitleDesktop: {
    fontSize: 15,
  },
  followersContainer: {
    backgroundColor: '#1ea2b110',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  routeType: {
    backgroundColor: '#1ea2b120',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeTypeDesktop: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  routeTypeText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  routeTypeTextDesktop: {
    fontSize: 11,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeFooterDesktop: {
    marginTop: 2,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailText: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 4,
  },
  routeDetailTextDesktop: {
    fontSize: 13,
  },
  routeCost: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeCostDesktop: {
    fontSize: 15,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});