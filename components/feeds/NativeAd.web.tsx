import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const NativeAd = () => {
  const { colors } = useTheme();

  // Render a placeholder for AdSense on the web
  return (
    <View style={[styles.adContainer, { backgroundColor: colors.card }]}>
      <Text style={{ color: colors.text }}>AdSense Ad Placeholder</Text>
      {/* You can replace this with your AdSense code */}
    </View>
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
});

export default NativeAd;
