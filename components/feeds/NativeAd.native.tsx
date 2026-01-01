import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeAdView } from 'react-native-google-mobile-ads';
import { useTheme } from '@/context/ThemeContext';

const adUnitId = __DEV__ ? 'ca-app-pub-3940256099942544/2247696110' : 'YOUR_NATIVE_AD_UNIT_ID';

const NativeAd = () => {
  const { colors } = useTheme();

  return (
    <NativeAdView
        adUnitID={adUnitId}
        style={styles.nativeAdView}
    >
        <View style={[styles.adContainer, { backgroundColor: colors.card }]}>
            <Text style={{color: colors.text}}>Native Ad</Text>
        </View>
    </NativeAdView>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 16,
  },
  nativeAdView: {
    width: '100%',
    height: 300,
  },
});

export default NativeAd;