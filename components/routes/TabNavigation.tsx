import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Navigation, Flag, Route as RouteIcon, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { TabType } from '@/services/gifPrefetchService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_HEADLINES: Record<TabType, { label: string; sub: string }> = {
  planner: { label: 'Plan Your Journey', sub: 'search real addresses' },
  stops: { label: 'Stops', sub: 'find nearby stops' },
  routes: { label: 'Routes', sub: 'explore all routes' },
  hubs: { label: 'Transport Hubs', sub: 'major stations & ranks' },
};

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDesktop?: boolean;
}

export default function TabNavigation({ activeTab, onTabChange, isDesktop }: TabNavigationProps) {
  const { colors } = useTheme();

  const tabs: { key: TabType; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'planner', label: 'Planner', icon: (c) => <Navigation size={16} color={c} /> },
    { key: 'stops', label: 'Stops', icon: (c) => <Flag size={16} color={c} /> },
    { key: 'routes', label: 'Routes', icon: (c) => <RouteIcon size={16} color={c} /> },
    { key: 'hubs', label: 'Hubs', icon: (c) => <MapPin size={16} color={c} /> },
  ];

  return (
    <View style={styles.container}>

      {/* Tab pills */}
      <View style={[styles.tabBar, { backgroundColor: colors.card || '#1A1D1E' }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && [styles.activeTab, { backgroundColor: colors.primary || '#1ea2b1' }],
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive ? '#fff' : '#666')}
              {SCREEN_WIDTH > 380 && (
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 5,
  },
  activeTab: {
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
});