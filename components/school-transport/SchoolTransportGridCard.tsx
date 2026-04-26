import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MapPin, Star, Shield, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 64) / 2; // Accounting for 24px padding on each side and 16px gap

interface SchoolTransportGridCardProps {
  transport: {
    id: string;
    school_name: string;
    school_area: string;
    capacity: number;
    current_riders: number;
    price_per_month: number;
    is_verified: boolean;
    driver: {
      profiles: {
        first_name: string;
        last_name: string;
        rating: number;
      };
    };
  };
  onViewDetails: () => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop';

export default function SchoolTransportGridCard({
  transport,
  onViewDetails,
}: SchoolTransportGridCardProps) {
  const { colors } = useTheme();
  const isFull = transport.current_riders >= transport.capacity;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onViewDetails}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: FALLBACK_IMAGE }} 
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
        {transport.is_verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: `${colors.primary}CC` }]}>
            <Shield size={10} color="#fff" fill="#fff" />
          </View>
        )}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>R{transport.price_per_month}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.schoolName, { color: colors.text }]} numberOfLines={1}>
          {transport.school_name}
        </Text>
        
        <View style={styles.areaRow}>
          <MapPin size={10} color={colors.primary} />
          <Text style={[styles.areaText, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
            {transport.school_area}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {transport.driver.profiles.rating > 0 ? transport.driver.profiles.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
            <Text style={[styles.statusText, { color: isFull ? '#EF4444' : '#10B981' }]}>
              {isFull ? 'Full' : 'Open'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: COLUMN_WIDTH,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  priceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  areaText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
