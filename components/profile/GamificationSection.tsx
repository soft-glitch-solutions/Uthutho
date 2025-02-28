import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GamificationSectionProps {
  profile: {
    points: number;
    titles: string[];
    selected_title: string | null;
  };
  titles: {
    id: number;
    title: string;
    points_required: number;
  }[];
  onSelectTitle: (title: string) => void;
}

const GamificationSection = ({ profile, titles, onSelectTitle }: GamificationSectionProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Rank</Text>
      <Text style={styles.points}>Points: {profile.points || 0}</Text>

      <Text style={styles.sectionTitle}>Titles</Text>
      {titles.map((title) => (
        <View key={title.id} style={styles.titleItem}>
          <Text style={styles.titleText}>
            {title.title} ({title.points_required} points)
          </Text>
          {profile.titles?.includes(title.title) ? (
            <Text style={styles.unlockedText}>Unlocked</Text>
          ) : (
            <Text style={styles.lockedText}>
              {title.points_required - (profile.points || 0)} points needed
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  points: {
    fontSize: 16,
    marginBottom: 16,
  },
  titleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 16,
  },
  unlockedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  lockedText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default GamificationSection;