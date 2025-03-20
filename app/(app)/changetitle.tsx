import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons'; // For icons
import * as Animatable from 'react-native-animatable'; // For animations
import Toast from 'react-native-toast-message'; // For toast messages
import { useProfile } from '@/hook/useProfile';

const TitleChangeScreen = () => {
  const { colors } = useTheme();
  const {
    loading,
    profile,
    titles,
    handleSelectTitle,
  } = useProfile(); // Use the useProfile hook

  const [selectedTitle, setSelectedTitle] = useState(profile?.selected_title || '');

  // Update selectedTitle when profile changes
  useEffect(() => {
    if (profile?.selected_title) {
      setSelectedTitle(profile.selected_title);
    }
  }, [profile]);

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <View>
      {/* Header Skeleton */}
      <View style={[styles.skeletonHeader, { backgroundColor: colors.card }]} />
      <View style={[styles.skeletonSubheader, { backgroundColor: colors.card }]} />

      {/* Titles Skeleton */}
      {[1, 2, 3].map((_, index) => (
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
  );

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader />
      </ScrollView>
    );
  }

  const unlockedTitles = titles.filter((title) => profile?.titles?.includes(title.title));
  const lockedTitles = titles.filter((title) => !profile?.titles?.includes(title.title));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animatable.View animation="fadeIn" duration={500} style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>Change Your Title</Text>
        <Text style={[styles.subheading, { color: colors.text }]}>
          Select a title to showcase on your profile
        </Text>
      </Animatable.View>

      {/* Unlocked Titles */}
      <Animatable.View animation="fadeIn" duration={500} delay={300}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Unlocked Titles</Text>
        {unlockedTitles.map((title) => (
          <TouchableOpacity
            key={title.id}
            style={[
              styles.titleTile,
              {
                backgroundColor: colors.card,
                borderColor: selectedTitle === title.title ? colors.primary : colors.card,
              },
            ]}
            onPress={() => {
              setSelectedTitle(title.title);
              handleSelectTitle(title.title);
            }}
            disabled={loading}
          >
            <Text style={[styles.titleText, { color: colors.text }]}>{title.title}</Text>
            {selectedTitle === title.title && (
              <Feather name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Animatable.View>

      {/* Locked Titles */}
      <Animatable.View animation="fadeIn" duration={500} delay={600}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Locked Titles</Text>
        {lockedTitles.map((title) => (
          <View
            key={title.id}
            style={[
              styles.titleTile,
              {
                backgroundColor: colors.card,
                opacity: 0.6, // Gray out locked titles
              },
            ]}
          >
            <Text style={[styles.titleText, { color: colors.text }]}>{title.title}</Text>
            <Feather name="lock" size={20} color={colors.text} />
            <Text style={[styles.lockedSubtitle, { color: colors.text }]}>
              Unlock at {title.points_required} points
            </Text>
          </View>
        ))}
      </Animatable.View>

      {/* Toast Component */}
      <Toast />
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
  titleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lockedSubtitle: {
    fontSize: 14,
    opacity: 0.8,
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
  skeletonTitleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 15,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonText: {
    height: 16,
    width: '80%',
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default TitleChangeScreen;