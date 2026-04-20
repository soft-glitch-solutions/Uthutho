import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Navigation, Flag, Route as RouteIcon, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TabType = 'planner' | 'stops' | 'routes' | 'hubs';

// Keep requiring the assets to get their URIs
const TAB_ASSETS: Record<TabType, any> = {
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

  // Store cached URIs for each GIF
  const [cachedURIs, setCachedURIs] = useState<Record<TabType, string | null>>({
    planner: null,
    stops: null,
    routes: null,
    hubs: null,
  });

  const [isPreloading, setIsPreloading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pre-cache all GIFs when component mounts
  useEffect(() => {
    const cacheAllGIFs = async () => {
      const cacheDir = `${FileSystem.cacheDirectory}gifs/`;

      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const newCachedURIs = { ...cachedURIs };

      // Cache each GIF
      for (const [tab, assetModule] of Object.entries(TAB_ASSETS)) {
        const tabKey = tab as TabType;
        const filename = `${tabKey}.gif`;
        const cachedPath = `${cacheDir}${filename}`;

        // Check if already cached
        const cachedFile = await FileSystem.getInfoAsync(cachedPath);

        if (cachedFile.exists) {
          // Use cached version
          newCachedURIs[tabKey] = cachedPath;
        } else {
          // Copy from bundle to cache
          const asset = Asset.fromModule(assetModule);
          await asset.downloadAsync();

          // Copy to our cache directory for faster access
          await FileSystem.copyAsync({
            from: asset.localUri || asset.uri,
            to: cachedPath,
          });

          newCachedURIs[tabKey] = cachedPath;
        }
      }

      setCachedURIs(newCachedURIs);
      setIsPreloading(false);
    };

    cacheAllGIFs();
  }, []);

  // Pre-load adjacent tabs when current tab changes
  useEffect(() => {
    if (isPreloading) return;

    const preloadAdjacentTabs = async () => {
      const tabs: TabType[] = ['planner', 'stops', 'routes', 'hubs'];
      const currentIndex = tabs.indexOf(activeTab);
      const adjacentTabs = [
        tabs[currentIndex - 1],
        tabs[currentIndex + 1]
      ].filter(Boolean) as TabType[];

      // Preload images for adjacent tabs into memory
      for (const tab of adjacentTabs) {
        if (cachedURIs[tab]) {
          // This forces the image to load into memory cache
          await Image.prefetch(`file://${cachedURIs[tab]}`);
        }
      }
    };

    preloadAdjacentTabs();
  }, [activeTab, cachedURIs, isPreloading]);

  const tabs: { key: TabType; label: string; icon: (c: string) => React.ReactNode }[] = [
    { key: 'planner', label: 'Planner', icon: (c) => <Navigation size={16} color={c} /> },
    { key: 'stops', label: 'Stops', icon: (c) => <Flag size={16} color={c} /> },
    { key: 'routes', label: 'Routes', icon: (c) => <RouteIcon size={16} color={c} /> },
    { key: 'hubs', label: 'Hubs', icon: (c) => <MapPin size={16} color={c} /> },
  ];

  const currentImageURI = cachedURIs[activeTab];

  return (
    <View style={styles.container}>
      {/* Hero image with loading state */}
      <View style={styles.heroWrap}>
        {isPreloading || !currentImageURI ? (
          <View style={[styles.heroImage, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary || '#1ea2b1'} />
          </View>
        ) : (
          <>
            <Image
              source={{ uri: `file://${currentImageURI}` }}
              style={styles.heroImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoaded(false)}
              onLoadEnd={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <View style={[styles.heroImage, styles.loadingOverlay]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </>
        )}
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
    position: 'relative',
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
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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