import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Feather } from '@expo/vector-icons'; // For icons
import * as Animatable from 'react-native-animatable'; // For animations

const TitleEarnScreen = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [titles, setTitles] = useState([]);

  // Fetch profile and titles
  useEffect(() => {
    const fetchProfileAndTitles = async () => {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.session) {
          throw new Error('No user session found. Please log in.');
        }

        const userId = session.session.user.id;

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          throw new Error('Failed to fetch profile data.');
        }

        setProfile(profileData);

        // Fetch titles data
        const { data: titlesData, error: titlesError } = await supabase
          .from('titles')
          .select('*')
          .order('points_required', { ascending: true });

        if (titlesError) {
          throw new Error('Failed to fetch titles.');
        }

        setTitles(titlesData || []);
      } catch (error) {
        console.error('Error fetching profile or titles:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndTitles();
  }, []);

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <View>
      {/* Header Skeleton */}
      <View style={styles.skeletonHeader} />
      <View style={[styles.skeletonSubheader, { marginBottom: 30 }]} />

      {/* Titles Skeleton */}
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={[styles.skeletonTitleBlock, { backgroundColor: colors.card }]}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonTextContainer}>
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '60%' }]} />
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

  const unlockedTitles = titles.filter((title) => profile?.titles?.includes(title.name));
  const lockedTitles = titles.filter((title) => !profile?.titles?.includes(title.name));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animatable.View animation="fadeInDown" duration={500} style={styles.header}>
        <Text style={[styles.heading, { color: colors.text }]}>Your Titles</Text>
        <Text style={[styles.subheading, { color: colors.text }]}>
          Track your progress and unlock new titles
        </Text>
      </Animatable.View>

      {/* Unlocked Titles */}
      <Animatable.View animation="fadeInUp" duration={500} delay={300}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Earned Titles</Text>
        {unlockedTitles.map((title) => (
          <View
            key={title.id}
            style={[styles.titleBlock, { backgroundColor: colors.card }]}
          >
            <Feather name="check-circle" size={24} color={colors.primary} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.titleName, { color: colors.text }]}>{title.name}</Text>
              <Text style={[styles.titlePoints, { color: colors.text }]}>
                {title.points_required} points
              </Text>
            </View>
          </View>
        ))}
      </Animatable.View>

      {/* Locked Titles */}
      <Animatable.View animation="fadeInUp" duration={500} delay={600}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Locked Titles</Text>
        {lockedTitles.map((title) => (
          <View
            key={title.id}
            style={[styles.titleBlock, { backgroundColor: colors.card }]}
          >
            <Feather name="lock" size={24} color={colors.text} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.titleName, { color: colors.text }]}>{title.name}</Text>
              <Text style={[styles.titlePoints, { color: colors.text }]}>
                {title.points_required} points to unlock
              </Text>
            </View>
          </View>
        ))}
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
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  titleTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  titleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  titlePoints: {
    fontSize: 14,
    opacity: 0.8,
  },
  // Skeleton Loader Styles
  skeletonHeader: {
    height: 28,
    width: '50%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonSubheader: {
    height: 16,
    width: '70%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  skeletonTitleBlock: {
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
    backgroundColor: '#e0e0e0',
  },
  skeletonTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  skeletonText: {
    height: 16,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default TitleEarnScreen;