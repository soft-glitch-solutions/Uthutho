import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Asset } from 'expo-asset';

const blueAsset = require('../../assets/animations/Uthutho_blue.svg');
const orangeAsset = require('../../assets/animations/Uthutho_orange.svg');
const pinkAsset = require('../../assets/animations/Uthutho_pink.svg');

const useSvgAsset = (assetReq: any) => {
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [asset] = await Asset.loadAsync(assetReq);
        const sourceUri = asset.localUri || asset.uri;
        if (!sourceUri) return;
        
        const response = await fetch(sourceUri);
        const text = await response.text();
        if (isMounted) setXml(text);
      } catch (e) {
        console.warn('Failed to load SVG asset', e);
      }
    })();
    return () => { isMounted = false; };
  }, [assetReq]);

  return xml;
};

const ScrollingLine = ({ xml, duration = 4000, repeatCount }: { xml: string | null, duration?: number, repeatCount: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!xml) return;
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, [anim, duration, xml]);

  if (!xml) return null;

  // Rendered width is 343.5 (viewBox 171.75 * 2)
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -343.5]
  });

  return (
    <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
      {Array.from({ length: repeatCount }).map((_, i) => (
        <SvgXml key={i} xml={xml} width={343.5} height={33} />
      ))}
    </Animated.View>
  );
};

export const CornerAnimations = () => {
  const blueSvg = useSvgAsset(blueAsset);
  const orangeSvg = useSvgAsset(orangeAsset);
  const pinkSvg = useSvgAsset(pinkAsset);

  const { width, height } = useWindowDimensions();
  const maxDim = Math.max(width, height);
  const isDesktop = width >= 1024;
  
  // Calculate how many SVGs we need to fill the diagonal
  // maxDim * 1.5 is a safe width to cover the diagonal rotation fully across large screens
  const containerWidth = maxDim * 1.5;
  const repeatCount = Math.ceil(containerWidth / 343.5) + 1; // +1 for the scrolling overflow

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[
        styles.cornerAnimations, 
        { width: containerWidth },
        isDesktop && styles.cornerAnimationsDesktop
      ]}>
        <ScrollingLine xml={blueSvg} duration={6000} repeatCount={repeatCount} />
        <ScrollingLine xml={orangeSvg} duration={6000} repeatCount={repeatCount} />
        <ScrollingLine xml={pinkSvg} duration={6000} repeatCount={repeatCount} />
        {/* On desktop, we want a grander feel, so we repeat the sequence to cover more background */}
        {isDesktop && (
          <>
            <ScrollingLine xml={blueSvg} duration={6000} repeatCount={repeatCount} />
            <ScrollingLine xml={orangeSvg} duration={6000} repeatCount={repeatCount} />
            <ScrollingLine xml={pinkSvg} duration={6000} repeatCount={repeatCount} />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cornerAnimations: {
    position: 'absolute',
    top: -50,
    left: -100,
    height: 300,
    transform: [{ rotate: '45deg' }],
    gap: 15,
  },
  cornerAnimationsDesktop: {
    top: -150,
    left: -150,
    height: 800,
    gap: 25,
    opacity: 0.6,
  }
});
