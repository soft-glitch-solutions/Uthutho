import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Users, Clock, Star, Shield, Car, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface SchoolTransportCardProps {
  transport: {
    id: string;
    school_name: string;
    school_area: string;
    pickup_areas: string[];
    pickup_times: string[];
    capacity: number;
    current_riders: number;
    price_per_month: number;
    price_per_week: number;
    vehicle_info: string;
    vehicle_type: string;
    features: string[];
    is_verified: boolean;
    driver: {
      profiles: {
        first_name: string;
        last_name: string;
        rating: number;
      };
    };
  };
  onApply: () => void;
  onViewDetails: () => void;
}

export default function SchoolTransportCard({
  transport,
  onApply,
  onViewDetails,
}: SchoolTransportCardProps) {
  const { colors } = useTheme();
  const isFull = transport.current_riders >= transport.capacity;
  const availableSpots = transport.capacity - transport.current_riders;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onViewDetails}
      activeOpacity={0.9}
    >
      {/* Top Section: School & Status */}
      <View style={styles.cardHeader}>
        <View style={styles.schoolInfo}>
          <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1}>
            {transport.school_name}
          </Text>
          <View style={styles.areaRow}>
            <MapPin size={12} color={colors.primary} />
            <Text style={[styles.schoolArea, { color: colors.text, opacity: 0.6 }]}>
              {transport.school_area}
            </Text>
          </View>
        </View>
        {transport.is_verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
            <Shield size={10} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>VERIFIED</Text>
          </View>
        )}
      </View>

      {/* Middle Section: Capacity & Driver */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Users size={14} color={isFull ? '#EF4444' : '#10B981'} />
          <Text style={[styles.statText, { color: isFull ? '#EF4444' : '#10B981' }]}>
            {isFull ? 'FULL' : `${availableSpots} SPOTS LEFT`}
          </Text>
        </View>
        <View style={styles.dot} />
        <View style={styles.driverRating}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.ratingValue, { color: colors.text }]}>
            {transport.driver.profiles.rating > 0 ? transport.driver.profiles.rating.toFixed(1) : 'New'}
          </Text>
        </View>
      </View>

      {/* Info Section: Pickup & Price */}
      <View style={styles.footer}>
        <View style={styles.pickupBrief}>
          <Clock size={14} color={colors.primary} />
          <Text style={[styles.pickupText, { color: colors.text }]} numberOfLines={1}>
            {transport.pickup_times[0]} · {transport.pickup_areas[0]}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceValue, { color: colors.text }]}>
            R{transport.price_per_month || transport.price_per_week}
          </Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
      </View>

      {/* Minimal Action Line */}
      <View style={[styles.actionLine, { borderTopColor: colors.border }]}>
        <Text style={[styles.actionLabel, { color: colors.primary }]}>View details & apply</Text>
        <ChevronRight size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolArea: {
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#333',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickupBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickupText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  actionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});