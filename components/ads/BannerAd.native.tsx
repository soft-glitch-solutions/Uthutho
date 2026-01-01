import React from 'react';
import { Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy';

// On Android, the ad unit ID is defined in AndroidManifest.xml
const adUnitID = Platform.select({
  ios: adUnitId,
  android: adUnitId,
});

const BannerAdComponent = () => {
  if (!adUnitID) {
    return null;
  }
  return (
    <BannerAd
      unitId={adUnitID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
};

export default BannerAdComponent;