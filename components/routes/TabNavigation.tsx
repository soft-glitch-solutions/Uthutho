import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Navigation, Flag, Route as RouteIcon, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TabType = 'planner' | 'stops' | 'routes' | 'hubs';

// Default image used for all tabs — user will replace per tab later
const TAB_IMAGES: Record<TabType, any> = {
  planner: require('@/assets/images/planner.gif'),
  stops: require('@/assets/images/stop.gif'),
  routes: require('@/assets/images/route.gif'),
  hubs: require('@/assets/images/hub.gif'),
};

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
  const headline = TAB_HEADLINES[activeTab];

  const tabs: { key: TabType; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'planner', label: 'Planner', icon: (c) => <Navigation size={16} color={c} /> },
    { key: 'stops', label: 'Stops', icon: (c) => <Flag size={16} color={c} /> },
    { key: 'routes', label: 'Routes', icon: (c) => <RouteIcon size={16} color={c} /> },
    { key: 'hubs', label: 'Hubs', icon: (c) => <MapPin size={16} color={c} /> },
  ];

  return (
    <View style={styles.container}>
      {/* Hero image */}
      <View style={styles.heroWrap}>
        <Image source={TAB_IMAGES[activeTab]} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>{headline.label}</Text>
          <Text style={styles.heroSub}>{headline.sub}</Text>
        </View>
      </View>

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
    paddingTop: 50,
  },

  // Hero image
  heroWrap: {
    marginHorizontal: 20,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
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