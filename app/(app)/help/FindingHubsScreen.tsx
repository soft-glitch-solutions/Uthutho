import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function FindingHubsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Finding Transportation Hubs</Text>
      <Text style={[styles.content, { color: colors.text }]}>
        To find nearby transportation hubs:
        1. Open the map view from the home screen.
        2. Use the filter to display only hubs.
        3. Tap on a hub to see details and available routes.
        4. Get directions to the hub using your preferred navigation app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
});