import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons'; // For icons
import * as Animatable from 'react-native-animatable'; // For animations
import { useProfile } from '@/hook/useProfile'; // Use the useProfile hook

const TitleEarnScreen = () => {
  const { colors } = useTheme();
  const {
    loading,
    profile,
    titles,
  } = useProfile(); // Use the useProfile hook

  const [unlockedTitles, setUnlockedTitles] = useState([]);
  const [lockedTitles, setLockedTitles] = useState([]);

  // Update unlocked and locked titles when profile or titles change
  useEffect(() => {
    if (profile && titles) {
      const unlocked = titles.filter((title) => profile?.titles?.includes(title.name));
      const locked = titles.filter((title) => !profile?.titles?.includes(title.name));
      setUnlockedTitles(unlocked);
      setLockedTitles(locked);
    }
  }, [profile, titles]);

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <View>
      {/* Header Skeleton */}
      <View style={[styles.skeletonHeader, { backgroundColor: colors.card }]} />
      <View style={[styles.skeletonSubheader, { backgroundColor: colors.card }]} />

      {/* Titles Skeleton */}
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <View
            key={index}
            style={[styles.skeletonTitleTile, { backgroundColor: colors.card }]}
          >
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonTextContainer}>
              <View style={[styles.skeletonText, { backgroundColor: colors.card }]} />
              <View style={[styles.skeletonText, { width: '60%', backgroundColor: colors.card }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader />
      </ScrollView>
    );
  }

  // Render each title in a 3-column grid
  const renderTitleItem = ({ item }) => (
    <View style={[styles.titleTile, { backgroundColor: colors.card }]}>
      <Feather
        name={unlockedTitles.includes(item) ? 'check-circle' : 'lock'}
        size={24}
        color={unlockedTitles.includes(item) ? colors.primary : colors.text}
      />
      <Text style={[styles.titleName, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.titlePoints, { color: colors.text }]}>
        {item.points_required} points
      </Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animatable.View animation="fadeIn" duration={500} style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>Your Titles</Text>
        <Text style={[styles.subheading, { color: colors.text }]}>
          Track your progress and unlock new titles
        </Text>
      </Animatable.View>

      {/* Unlocked Titles */}
      <Animatable.View animation="fadeIn" duration={500} delay={300}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Earned Titles</Text>
        <FlatList
          data={unlockedTitles}
          renderItem={renderTitleItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      </Animatable.View>

      {/* Locked Titles */}
      <Animatable.View animation="fadeIn" duration={500} delay={600}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Locked Titles</Text>
        <FlatList
          data={lockedTitles}
          renderItem={renderTitleItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      </Animatable.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  grid: {
    justifyContent: 'space-between',
  },
  titleTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    padding: 15,
    borderRadius: 15,
  },
  titleName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  titlePoints: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  // Skeleton Loader Styles
  skeletonHeader: {
    height: 28,
    width: '50%',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonSubheader: {
    height: 16,
    width: '70%',
    borderRadius: 8,
    marginBottom: 30,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonTitleTile: {
    width: '30%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 10,
  },
  skeletonTextContainer: {
    alignItems: 'center',
  },
  skeletonText: {
    height: 16,
    width: '80%',
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default TitleEarnScreen;