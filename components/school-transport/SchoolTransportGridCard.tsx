// components/school-transport/SchoolTransportGridCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Users, Star, Shield, Clock } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface SchoolTransportGridCardProps {
  transport: {
    id: string;
    school_name: string;
    school_area: string;
    capacity: number;
    current_riders: number;
    price_per_month: number;
    is_verified: boolean;
    pickup_times: string[];
    driver: {
      profiles: {
        rating: number;
      };
    };
  };
  onViewDetails: () => void;
}

export default function SchoolTransportGridCard({ transport, onViewDetails }: SchoolTransportGridCardProps) {
  const { colors } = useTheme();
  const isFull = transport.current_riders >= transport.capacity;
  const spotsLeft = transport.capacity - transport.current_riders;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onViewDetails}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1}>
          {transport.school_name}
        </Text>
        <View style={styles.areaRow}>
          <MapPin size={10} color={colors.primary} />
          <Text style={[styles.schoolArea, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
            {transport.school_area}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Users size={12} color={isFull ? '#EF4444' : '#10B981'} />
          <Text style={[styles.statText, { color: isFull ? '#EF4444' : '#10B981' }]}>
            {isFull ? 'FULL' : `${spotsLeft} SPOTS`}
          </Text>
        </View>
        {transport.is_verified && (
          <View style={styles.verifiedIcon}>
            <Shield size={10} color={colors.primary} fill={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceValue, { color: colors.text }]}>
            R{transport.price_per_month}
          </Text>
          <Text style={styles.pricePeriod}>/mo</Text>
        </View>
        <View style={styles.ratingRow}>
          <Star size={10} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.ratingValue, { color: colors.text }]}>
            {transport.driver?.profiles?.rating?.toFixed(1) || '0.0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolArea: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedIcon: {
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
