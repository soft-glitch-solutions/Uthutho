// components/school-transport/SchoolTransportCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Users, Clock, Star, Shield, Car } from 'lucide-react-native';

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
  const isFull = transport.current_riders >= transport.capacity;
  const availableSpots = transport.capacity - transport.current_riders;

  return (
    <TouchableOpacity style={styles.card} onPress={onViewDetails}>
      {/* Header with school info */}
      <View style={styles.cardHeader}>
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName} numberOfLines={1}>
            {transport.school_name}
          </Text>
          <Text style={styles.schoolArea} numberOfLines={1}>
            {transport.school_area}
          </Text>
        </View>
        {transport.is_verified && (
          <View style={styles.verifiedBadge}>
            <Shield size={14} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Driver info */}
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>
          {transport.driver.profiles.first_name} {transport.driver.profiles.last_name}
        </Text>
        {transport.driver.profiles.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{transport.driver.profiles.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Pickup info */}
      <View style={styles.pickupInfo}>
        <View style={styles.infoItem}>
          <MapPin size={14} color="#1ea2b1" />
          <Text style={styles.infoText} numberOfLines={1}>
            {transport.pickup_areas[0]}
            {transport.pickup_areas.length > 1 && ` +${transport.pickup_areas.length - 1}`}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={14} color="#1ea2b1" />
          <Text style={styles.infoText}>{transport.pickup_times[0]}</Text>
        </View>
      </View>

      {/* Capacity and pricing */}
      <View style={styles.capacityContainer}>
        <View style={styles.capacityInfo}>
          <Users size={14} color={isFull ? "#EF4444" : "#10B981"} />
          <Text style={[
            styles.capacityText,
            isFull && styles.fullText
          ]}>
            {isFull ? 'Full' : `${availableSpots} spots left`}
          </Text>
        </View>
        
        {(transport.price_per_month || transport.price_per_week) && (
          <Text style={styles.priceText}>
            R{transport.price_per_month || transport.price_per_week}/month
          </Text>
        )}
      </View>

      {/* Vehicle info */}
      {transport.vehicle_info && (
        <View style={styles.vehicleInfo}>
          <Car size={14} color="#888888" />
          <Text style={styles.vehicleText} numberOfLines={1}>
            {transport.vehicle_type} • {transport.vehicle_info}
          </Text>
        </View>
      )}

      {/* Features preview */}
      {transport.features && transport.features.length > 0 && (
        <View style={styles.featuresContainer}>
          {transport.features.slice(0, 2).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {transport.features.length > 2 && (
            <Text style={styles.moreFeaturesText}>
              +{transport.features.length - 2} more
            </Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.detailsButton, isFull && styles.disabledButton]}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.applyButton,
            isFull && styles.disabledButton
          ]}
          onPress={onApply}
          disabled={isFull}
        >
          <Text style={styles.applyButtonText}>
            {isFull ? 'Full' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  schoolArea: {
    fontSize: 14,
    color: '#888888',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickupInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  capacityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  fullText: {
    color: '#EF4444',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleText: {
    color: '#888888',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 6,
  },
  featureTag: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  featureText: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: '500',
  },
  moreFeaturesText: {
    color: '#888888',
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});