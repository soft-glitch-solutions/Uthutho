import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { X, MapPin, DollarSign, Car, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface TransportFiltersProps {
  visible: boolean;
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
  visible,
  filters,
  onFiltersChange,
  onClose,
}: TransportFiltersProps) {
  const { colors } = useTheme();

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
              <Text style={[styles.subtitle, { color: colors.text, opacity: 0.5 }]}>Refine your search</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* School Area Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>School Area</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MapPin size={16} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter school area/suburb"
                  placeholderTextColor="#666"
                  value={filters.schoolArea}
                  onChangeText={(text) => updateFilter('schoolArea', text)}
                />
              </View>
            </View>

            {/* Pickup Area Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Area</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MapPin size={16} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter pickup area/suburb"
                  placeholderTextColor="#666"
                  value={filters.pickupArea}
                  onChangeText={(text) => updateFilter('pickupArea', text)}
                />
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Range (R/mo)</Text>
              <View style={styles.priceRangeContainer}>
                <View style={[styles.inputContainer, styles.priceInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Min"
                    placeholderTextColor="#666"
                    value={filters.minPrice}
                    onChangeText={(text) => updateFilter('minPrice', text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={[styles.priceSeparator, { color: colors.text }]}>—</Text>
                <View style={[styles.inputContainer, styles.priceInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Max"
                    placeholderTextColor="#666"
                    value={filters.maxPrice}
                    onChangeText={(text) => updateFilter('maxPrice', text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Vehicle Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Type</Text>
              <View style={styles.vehicleTypesContainer}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.vehicleTypeButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      filters.vehicleType === type.id && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                    ]}
                    onPress={() => updateFilter('vehicleType', type.id)}
                  >
                    <Text
                      style={[
                        styles.vehicleTypeText,
                        { color: colors.text, opacity: 0.6 },
                        filters.vehicleType === type.id && { color: colors.primary, opacity: 1 },
                      ]}
                    >
                      {type.label}
                    </Text>
                    {filters.vehicleType === type.id && (
                      <Check size={14} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Verified Only Filter */}
            <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
              <View style={styles.switchContainer}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>Verified Only</Text>
                  <Text style={[styles.switchLabel, { color: colors.text, opacity: 0.5 }]}>
                    Only show verified transport
                  </Text>
                </View>
                <Switch
                  value={filters.verifiedOnly}
                  onValueChange={(value) => updateFilter('verifiedOnly', value)}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
            {hasActiveFilters() && (
              <TouchableOpacity
                style={[styles.clearButton, { borderColor: colors.border }]}
                onPress={handleClearFilters}
              >
                <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.applyButtonText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '700',
  },
  vehicleTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleTypeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
