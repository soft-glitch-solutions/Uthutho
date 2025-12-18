import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Make sure Text is imported here
import { ChevronRight } from 'lucide-react-native';

interface CompactHeaderProps {
  routeName: string;
  transportType: string;
  startPoint: string;
  endPoint: string;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  routeName,
  transportType,
  startPoint,
  endPoint
}) => {
  return (
    <View style={styles.compactHeader}>
      <View style={styles.routeRow}>
        <Text style={styles.routeName} numberOfLines={1}>
          {routeName}
        </Text>
        <View style={styles.transportBadge}>
          <Text style={styles.transportText}>
            {transportType}
          </Text>
        </View>
      </View>
      
      <View style={styles.routeEndpoints}>
        <Text style={styles.startPoint} numberOfLines={1}>
          {startPoint}
        </Text>
        <ChevronRight size={12} color="#666666" style={styles.chevron} />
        <Text style={styles.endPoint} numberOfLines={1}>
          {endPoint}
        </Text>
      </View>
    </View>
  );
};

// Use StyleSheet.create instead of plain objects
const styles = StyleSheet.create({
  compactHeader: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  transportText: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '600',
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startPoint: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  endPoint: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  chevron: {
    marginHorizontal: 4,
  },
});