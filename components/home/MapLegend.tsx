import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface MapLegendProps {
  stopsCount: number;
  hubsCount: number;
}

interface LegendItem {
  color: string;
  label: string;
  svg: string;
  style?: any;
}

const MapLegend: React.FC<MapLegendProps> = ({ stopsCount, hubsCount }) => {
  const { colors } = useTheme();

  // SVG strings for the icons
  const svgIcons = {
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    flag: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  };

  const legendItems: LegendItem[] = [
    { 
      color: '#1ea2b1', 
      label: 'Your Location', 
      svg: svgIcons.user 
    },
    { 
      color: '#1ea2b1', 
      label: `Stops (${stopsCount})`, 
      svg: svgIcons.flag 
    },
    { 
      color: '#1a8c9a', 
      label: 'Nearest Stop', 
      svg: svgIcons.flag,
      style: { borderColor: '#ffffff', borderWidth: 2 }
    },
    { 
      color: '#1ea2b1', 
      label: `Hubs (${hubsCount})`, 
      svg: svgIcons.mapPin 
    },
    { 
      color: '#1a8c9a', 
      label: 'Nearest Hub', 
      svg: svgIcons.mapPin,
      style: { borderColor: '#ffffff', borderWidth: 2 }
    },
  ];

  return (
    <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.legendTitle, { color: colors.text }]}>Map Legend</Text>
      <View style={styles.legendItems}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[
              styles.legendMarker, 
              { backgroundColor: item.color },
              item.style
            ]}>
              <div 
                dangerouslySetInnerHTML={{ __html: item.svg }}
                style={styles.legendSvg}
              />
            </View>
            <Text style={[styles.legendText, { color: colors.text }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendSvg: {
    width: 12,
    height: 12,
  },
  legendText: {
    fontSize: 12,
  },
});

export default MapLegend;