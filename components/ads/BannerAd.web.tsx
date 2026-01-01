import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const BannerAdComponent = () => {
  const { colors } = useTheme();

  // Render a placeholder for AdSense on the web
  return (
    <View style={[styles.adContainer, { backgroundColor: colors.card }]}>
      <Text style={{ color: colors.text }}>AdSense Banner Placeholder</Text>
      {/* You can replace this with your AdSense code */}
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    height: 50, // Typical banner height
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BannerAdComponent;