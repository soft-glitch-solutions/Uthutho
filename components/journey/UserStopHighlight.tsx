import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface UserStopHighlightProps {
  stopName: string;
}

export const UserStopHighlight = ({ stopName }: UserStopHighlightProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Stop</Text>
      <View style={[styles.stopItem, styles.yourStopHighlight]}>
        <View style={[styles.stopIndicator, styles.yourStopIndicator]}>
          <MapPin size={16} color="#ffffff" />
        </View>
        
        <View style={styles.stopInfo}>
          <Text style={[styles.stopName, styles.yourStopName]}>
            {stopName}
          </Text>
          <Text style={styles.stopNumber}>Your boarding stop</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  yourStopHighlight: {
    backgroundColor: '#1ea2b115',
    borderColor: '#1ea2b1',
  },
  stopIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  yourStopIndicator: {
    backgroundColor: '#1ea2b1',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 2,
  },
  yourStopName: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  stopNumber: {
    fontSize: 12,
    color: '#666666',
  },
});