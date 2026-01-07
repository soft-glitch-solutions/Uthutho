// components/school-transport/TransportFilters.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { X, MapPin, DollarSign, Car, Check } from 'lucide-react-native';

interface TransportFiltersProps {
  filters: {
    schoolArea: string;
    pickupArea: string;
    minPrice: string;
    maxPrice: string;
    vehicleType: string;
    verifiedOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

const vehicleTypes = [
  { id: '', label: 'All Types' },
  { id: 'car', label: 'Car' },
  { id: 'minibus', label: 'Minibus' },
  { id: 'bus', label: 'Bus' },
];

export default function TransportFilters({
  filters,
  onFiltersChange,
  onClose,
}: TransportFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      schoolArea: '',
      pickupArea: '',
      minPrice: '',
      maxPrice: '',
      vehicleType: '',
      verifiedOnly: false,
    });
  };

  const updateFilter = (key: keyof typeof filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.schoolArea ||
      filters.pickupArea ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.vehicleType ||
      filters.verifiedOnly
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* School Area Filter */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#1ea2b1" />
            <Text style={styles.sectionTitle}>School Area</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter school area/suburb"
            placeholderTextColor="#666666"
            value={filters.schoolArea}
            onChangeText={(text) => updateFilter('schoolArea', text)}
          />
        </View>

        {/* Pickup Area Filter */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#1ea2b1" />
            <Text style={styles.sectionTitle}>Pickup Area</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup area/suburb"
            placeholderTextColor="#666666"
            value={filters.pickupArea}
            onChangeText={(text) => updateFilter('pickupArea', text)}
          />
        </View>

        {/* Price Range Filter */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <DollarSign size={18} color="#1ea2b1" />
            <Text style={styles.sectionTitle}>Price Range (R)</Text>
          </View>
          <View style={styles.priceRangeContainer}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="Min"
              placeholderTextColor="#666666"
              value={filters.minPrice}
              onChangeText={(text) => updateFilter('minPrice', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={styles.priceSeparator}>to</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="Max"
              placeholderTextColor="#666666"
              value={filters.maxPrice}
              onChangeText={(text) => updateFilter('maxPrice', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Vehicle Type Filter */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Car size={18} color="#1ea2b1" />
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
          </View>
          <View style={styles.vehicleTypesContainer}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.vehicleTypeButton,
                  filters.vehicleType === type.id && styles.vehicleTypeButtonActive,
                ]}
                onPress={() => updateFilter('vehicleType', type.id)}
              >
                <Text
                  style={[
                    styles.vehicleTypeText,
                    filters.vehicleType === type.id && styles.vehicleTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
                {filters.vehicleType === type.id && (
                  <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Verified Only Filter */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verified Services Only</Text>
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              Show only verified transport services
            </Text>
            <Switch
              value={filters.verifiedOnly}
              onValueChange={(value) => updateFilter('verifiedOnly', value)}
              trackColor={{ false: '#333333', true: '#1ea2b1' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {hasActiveFilters() && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.applyButton} onPress={onClose}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  vehicleTypeText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 6,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});