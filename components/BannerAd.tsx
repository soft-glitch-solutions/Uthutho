// components/BannerAd.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  size?: BannerAdSize;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  position?: 'top' | 'bottom';
}

// Use test IDs during development, production ID when deploying
const AD_UNIT_ID = __DEV__ 
  ? TestIds.BANNER 
  : 'ca-app-pub-1853756758292263/2482412191';

export default function AdBanner({ 
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  onAdLoaded,
  onAdFailedToLoad,
  position = 'bottom'
}: AdBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false);

  const handleAdLoaded = () => {
    console.log('[AdBanner] Ad loaded successfully');
    setAdLoaded(true);
    onAdLoaded?.();
  };

  const handleAdFailedToLoad = (error: any) => {
    console.error('[AdBanner] Ad failed to load:', error);
    setAdLoaded(false);
    onAdFailedToLoad?.(error);
  };

  return (
    <View style={[
      styles.container,
      position === 'top' ? styles.topPosition : styles.bottomPosition
    ]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={size}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          // Add any additional request options here
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  topPosition: {
    marginTop: Platform.OS === 'ios' ? 44 : 0, // Account for status bar/notch
  },
  bottomPosition: {
    marginBottom: Platform.OS === 'ios' ? 34 : 0, // Account for home indicator
  },
});