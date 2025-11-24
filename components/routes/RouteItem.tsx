import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Route } from './RoutesScreen';

interface RouteItemProps {
  route: Route;
}

export default function RouteItem({ route }: RouteItemProps) {
  const router = useRouter();

  const navigateToRoute = (routeId: string) => {
    router.push(`/route-details?routeId=${routeId}`);
  };

  return (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => navigateToRoute(route.id)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{route.name}</Text>
          <Text style={[styles.coordinatesText, { marginTop: 4, color: '#1ea2b1' }]}>
            Followers: {0} {/* You can add follower counts later */}
          </Text>
        </View>
        <View style={styles.routeType}>
          <Text style={styles.routeTypeText}>{route.transport_type}</Text>
        </View>
      </View>

      <View style={styles.routeFooter}>
        <View style={styles.routeDetail}>
          <Clock size={16} color="#1ea2b1" />
          <Text style={styles.routeDetailText}>Est. 45-60 min</Text>
        </View>
        <Text style={styles.routeCost}>R {route.cost}</Text>
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  routeType: {
    backgroundColor: '#1ea2b120',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeTypeText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  routeCost: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});