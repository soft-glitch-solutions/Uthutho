import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function ContactSupportScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Contact Support</Text>
      <Text style={[styles.content, { color: colors.text }]}>
        Need help? Here’s how to contact our support team:
        1. Go to the help center from the menu.
        2. Tap on "Contact Support."
        3. Fill out the form with your issue or question.
        4. Submit the form, and our team will get back to you shortly.
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