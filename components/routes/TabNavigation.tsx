import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flag, Route as RouteIcon, MapPin } from 'lucide-react-native';

interface TabNavigationProps {
  activeTab: 'stops' | 'routes' | 'hubs';
  onTabChange: (tab: 'stops' | 'routes' | 'hubs') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <View style={styles.tabNavigation}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stops' && styles.activeTab]}
        onPress={() => onTabChange('stops')}
      >
        <Flag size={20} color={activeTab === 'stops' ? '#1ea2b1' : '#666666'} />
        <Text style={[styles.tabText, activeTab === 'stops' && styles.activeTabText]}>
          Stops
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
        onPress={() => onTabChange('routes')}
      >
        <RouteIcon size={20} color={activeTab === 'routes' ? '#1ea2b1' : '#666666'} />
        <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
          Routes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'hubs' && styles.activeTab]}
        onPress={() => onTabChange('hubs')}
      >
        <MapPin size={20} color={activeTab === 'hubs' ? '#1ea2b1' : '#666666'} />
        <Text style={[styles.tabText, activeTab === 'hubs' && styles.activeTabText]}>
          Hubs
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1ea2b1',
  },
});