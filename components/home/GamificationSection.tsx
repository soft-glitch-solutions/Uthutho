import React from 'react';
import { View, Text } from 'react-native';
import { Trophy, Award } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import GamificationSkeleton from './skeletons/GamificationSkeleton';

interface GamificationSectionProps {
  isStatsLoading: boolean;
  userStats: {
    points: number;
    level: number;
    streak: number;
    title: string;
  };
  colors: any;
}

const GamificationSection = ({ isStatsLoading, userStats, colors }: GamificationSectionProps) => {
  if (isStatsLoading) {
    return <GamificationSkeleton colors={colors} />;
  }

  return (
    <View style={styles.gamificationCard}>
      <View style={styles.gamificationHeader}>
        <Trophy size={24} color="#fbbf24" />
        <Text style={[styles.gamificationTitle, { color: colors.text }]}>Your Progress</Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{userStats.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>Level {userStats.level}</Text>
          <Text style={styles.statLabel}>Explorer</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{userStats.streak} days</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.titleBadge}>
        <Award size={16} color="#1ea2b1" />
        <Text style={styles.titleText}>{userStats.title}</Text>
      </View>
    </View>
  );
};

const styles = {
  gamificationCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  gamificationHeader: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    marginBottom: 16,
  },
  gamificationTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between' as 'space-between',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center' as 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    color: '#fbbf24',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  titleBadge: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    backgroundColor: '#1ea2b120',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  titleText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500' as '500',
    marginLeft: 4,
  },
};

export default GamificationSection;