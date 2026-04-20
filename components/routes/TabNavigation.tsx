import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Navigation, Flag, Route as RouteIcon, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { gifPrefetchService, TabType, TAB_URLS } from '@/services/gifPrefetchService';

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
  const headline = TAB_HEADLINES[activeTab];

  // Force a re-render when GIFs are ready
  const [, setReady] = useState(false);

  useEffect(() => {
    // If not ready yet, wait for prefetch to complete
    if (!gifPrefetchService.isReady()) {
      gifPrefetchService.startPrefetching().then(() => {
        setReady(true); // Trigger re-render once all GIFs are cached
      });
    }
  }, []);

  const tabs: { key: TabType; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'planner', label: 'Planner', icon: (c) => <Navigation size={16} color={c} /> },
    { key: 'stops', label: 'Stops', icon: (c) => <Flag size={16} color={c} /> },
    { key: 'routes', label: 'Routes', icon: (c) => <RouteIcon size={16} color={c} /> },
    { key: 'hubs', label: 'Hubs', icon: (c) => <MapPin size={16} color={c} /> },
  ];

  // Get cached URI (will be available instantly after first load)
  const currentImageURI = gifPrefetchService.getCachedURI(activeTab);

  return (
    <View style={styles.container}>
      {/* Hero image - appears instantly with cached GIF */}
      <View style={styles.heroWrap}>
        <Image
          source={{ uri: currentImageURI || TAB_URLS[activeTab] }}
          style={styles.heroImage}
          resizeMode="cover"
        />
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