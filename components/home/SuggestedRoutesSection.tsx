import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Bus, Zap, ChevronRight, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

interface SuggestedRoute {
  id: string;
  name: string;
  nearestStopName: string;
  distanceToStop: number;
}

interface SuggestedRoutesSectionProps {
  colors: any;
  router: any;
  routes: SuggestedRoute[];
  loading: boolean;
}

const SuggestedRoutesSection: React.FC<SuggestedRoutesSectionProps> = ({
  colors,
  router,
  routes,
  loading
}) => {
  if (!loading && routes.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Suggested for You
        </Text>
        {!loading && (
          <TouchableOpacity onPress={() => router.push('/routes')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text, opacity: 0.6 }]}>
            Finding nearby routes...
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        >
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/route-details?routeId=${route.id}`)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[`${colors.primary}10`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
                  <Zap size={12} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.primary }]}>NEARBY</Text>
                </View>
                <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                  <Bus size={20} color={colors.primary} />
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={[styles.routeTitle, { color: colors.text }]} numberOfLines={1}>
                  {route.name}
                </Text>
                <View style={styles.stopRow}>
                  <MapPin size={12} color={colors.text} style={{ opacity: 0.5 }} />
                  <Text style={[styles.stopText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                    {route.nearestStopName} · {route.distanceToStop.toFixed(1)}km
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.actionText, { color: colors.primary }]}>View Route</Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    marginVertical: 12,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SuggestedRoutesSection;
