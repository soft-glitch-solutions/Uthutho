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
    <View style={styles.headerContainer}>
      <Text style={styles.routeNameText} numberOfLines={1}>
        Route <Text style={styles.routeIdText}>{routeName}</Text>
      </Text>
      <Text style={styles.destinationText} numberOfLines={1}>
        Heading to {endPoint}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  routeNameText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#dddddd',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  routeIdText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  destinationText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  }
});