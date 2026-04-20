import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Clock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface PickupAreasProps {
  areas: string[];
  onOpenMaps: (area: string) => void;
}

export const PickupAreas: React.FC<PickupAreasProps> = ({
  areas,
  onOpenMaps,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Areas</Text>
      <View style={styles.list}>
        {areas.map((area, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.item, { borderBottomColor: index === areas.length - 1 ? 'transparent' : colors.border }]}
            onPress={() => onOpenMaps(area)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
              <MapPin size={16} color={colors.primary} />
            </View>
            <Text style={[styles.itemText, { color: colors.text }]}>{area}</Text>
            <ArrowRight size={16} color={colors.text} opacity={0.3} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface PickupTimesProps {
  times: string[];
}

export const PickupTimes: React.FC<PickupTimesProps> = ({ times }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Times</Text>
      <View style={styles.grid}>
        {times.map((time, index) => (
          <View key={index} style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Clock size={14} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.text }]}>{time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  list: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
});