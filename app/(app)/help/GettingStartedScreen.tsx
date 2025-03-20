import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function GettingStartedScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Getting Started</Text>
      <Text style={[styles.content, { color: colors.text }]}>
        Welcome to Uthutho! Here’s how to get started:
        1. Sign up or log in to your account.
        2. Explore the home screen to find nearby transportation options.
        3. Use the search bar to find specific routes or hubs.
        4. Save your favorite routes for quick access.
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