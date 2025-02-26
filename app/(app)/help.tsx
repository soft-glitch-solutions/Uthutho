import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

export default function HelpScreen() {
  const { colors } = useTheme();

  const helpTopics = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using Uthutho',
    },
    {
      title: 'Finding Transportation Hubs',
      description: 'How to locate and navigate to nearby hubs',
    },
    {
      title: 'Using the Feed',
      description: 'Stay updated with latest transportation news',
    },
    {
      title: 'Managing Your Profile',
      description: 'Update your information and preferences',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Help Center</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        How can we help you today?
      </Text>

      <View style={styles.topics}>
        {helpTopics.map((topic, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.topicCard, { backgroundColor: colors.card }]}>
            <View style={styles.topicContent}>
              <Text style={[styles.topicTitle, { color: colors.text }]}>
                {topic.title}
              </Text>
              <Text
                style={[styles.topicDescription, { color: colors.text }]}
                numberOfLines={2}>
                {topic.description}
              </Text>
            </View>
            <ChevronRight color={colors.text} size={20} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
  },
  topics: {
    gap: 15,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  topicContent: {
    flex: 1,
    marginRight: 10,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  topicDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
});