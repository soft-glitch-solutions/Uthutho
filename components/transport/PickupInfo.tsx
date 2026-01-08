import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Clock, Navigation } from 'lucide-react-native';

interface PickupAreasProps {
  areas: string[];
  onOpenMaps: (area: string) => void;
}

export const PickupAreas: React.FC<PickupAreasProps> = ({
  areas,
  onOpenMaps,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Pickup Areas</Text>
    <View style={styles.pickupAreas}>
      {areas.map((area, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.pickupAreaItem}
          onPress={() => onOpenMaps(area)}
        >
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.pickupAreaText}>{area}</Text>
          <Navigation size={16} color="#666666" />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

interface PickupTimesProps {
  times: string[];
}

export const PickupTimes: React.FC<PickupTimesProps> = ({ times }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Pickup Times</Text>
    <View style={styles.pickupTimes}>
      {times.map((time, index) => (
        <View key={index} style={styles.timeSlot}>
          <Clock size={16} color="#1ea2b1" />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#111111',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pickupAreas: {
    gap: 8,
  },
  pickupAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pickupAreaText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  pickupTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
});