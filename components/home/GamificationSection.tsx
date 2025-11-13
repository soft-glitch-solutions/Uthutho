import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Trophy, Award, Flame } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import GamificationSkeleton from './skeletons/GamificationSkeleton';

interface GamificationSectionProps {
  isStatsLoading?: boolean;
  userStats?: {
    points: number;
    level: number;
    streak: number;
    title: string;
  };
  colors: any;
}

const GamificationSection = ({ isStatsLoading: externalLoading, userStats: externalStats, colors }: GamificationSectionProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    points: 0,
    level: 1,
    streak: 0,
    title: 'Newbie Explorer',
    maxStreak: 0
  });

  // If external stats are provided, use them. Otherwise fetch our own.
  const shouldFetchData = !externalStats;
  const finalIsLoading = externalLoading !== undefined ? externalLoading : isLoading;
  const finalUserStats = externalStats || userStats;

  useEffect(() => {
    if (shouldFetchData) {
      loadUserStats();
    }
  }, [shouldFetchData]);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get profile points and title
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, selected_title')
          .eq('id', user.id)
          .single();
        
        // Get streak data
        const { data: streakData } = await supabase
          .from('login_streaks')
          .select('current_streak, max_streak')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUserStats({
            points: profile.points || 0,
            level: Math.floor((profile.points || 0) / 100) + 1,
            streak: streakData?.current_streak || 0,
            maxStreak: streakData?.max_streak || 0,
            title: profile.selected_title || 'Newbie Explorer'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (finalIsLoading) {
    return <GamificationSkeleton colors={colors} />;
  }

  const getLevelTitle = (level: number) => {
    const titles = [
      'Newbie Explorer',
      'Regular Commuter', 
      'City Navigator',
      'Transit Expert',
      'Master Explorer'
    ];
    return titles[Math.min(level - 1, titles.length - 1)] || 'Explorer';
  };

  const calculateProgress = () => {
    const currentLevelPoints = (finalUserStats.level - 1) * 100;
    const pointsInCurrentLevel = finalUserStats.points - currentLevelPoints;
    return Math.min((pointsInCurrentLevel / 100) * 100, 100);
  };

  return (
    <View style={[styles.gamificationCard, { borderColor: colors.border }]}>
      <View style={styles.gamificationHeader}>
        <Trophy size={24} color="#fbbf24" />
        <Text style={[styles.gamificationTitle, { color: colors.text }]}>Your Progress</Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{finalUserStats.points}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Points</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>Level {finalUserStats.level}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            {getLevelTitle(finalUserStats.level)}
          </Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={styles.streakContainer}>
            <Flame size={16} color={finalUserStats.streak > 0 ? "#ff6b35" : "#666"} />
            <Text style={[styles.statNumber, { marginLeft: 4 }]}>
              {finalUserStats.streak}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.text }]}>Day Streak</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${calculateProgress()}%`,
                backgroundColor: finalUserStats.level > 1 ? '#fbbf24' : '#1ea2b1'
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {calculateProgress().toFixed(0)}% to Level {finalUserStats.level + 1}
        </Text>
      </View>

      <View style={[styles.titleBadge, { backgroundColor: `${colors.primary}20` }]}>
        <Award size={16} color={colors.primary} />
        <Text style={[styles.titleText, { color: colors.primary }]}>
          {finalUserStats.title}
        </Text>
      </View>

      {finalUserStats.maxStreak > 0 && (
        <View style={styles.maxStreakBadge}>
          <Text style={[styles.maxStreakText, { color: colors.text }]}>
            Best Streak: {finalUserStats.maxStreak} days 🏆
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  gamificationCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
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
  streakContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    color: '#fbbf24',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden' as 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center' as 'center',
    opacity: 0.7,
  },
  titleBadge: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500' as '500',
    marginLeft: 4,
  },
  maxStreakBadge: {
    alignItems: 'center' as 'center',
  },
  maxStreakText: {
    fontSize: 12,
    opacity: 0.7,
  },
};

export default GamificationSection;