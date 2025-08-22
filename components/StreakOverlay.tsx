import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Trophy, Flame, Star, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface StreakOverlayProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function StreakOverlay({ visible, onClose, userId }: StreakOverlayProps) {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    maxStreak: 0,
    pointsEarned: 10,
    dayOfWeek: '',
    isNewRecord: false,
  });

  useEffect(() => {
    if (visible && userId) {
      updateLoginStreak();
    }
  }, [visible, userId]);

  const updateLoginStreak = async () => {
    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

      // Get or create login streak record
      let { data: streakRecord, error } = await supabase
        .from('login_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      let currentStreak = 1;
      let maxStreak = 1;
      let pointsEarned = 10; // Base points for logging in
      let isNewRecord = false;

      if (error && error.code === 'PGRST116') {
        // No existing record, create new one
        const { error: insertError } = await supabase
          .from('login_streaks')
          .insert([{
            user_id: userId,
            last_login: todayDate,
            current_streak: 1,
            max_streak: 1,
          }]);

        if (insertError) {
          console.error('Error creating streak record:', insertError);
        }
      } else if (streakRecord) {
        const lastLogin = new Date(streakRecord.last_login);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (streakRecord.last_login === todayDate) {
          // Already logged in today
          currentStreak = streakRecord.current_streak;
          maxStreak = streakRecord.max_streak;
          pointsEarned = 0; // No additional points for same day
        } else if (lastLogin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          // Consecutive day login
          currentStreak = streakRecord.current_streak + 1;
          maxStreak = Math.max(currentStreak, streakRecord.max_streak);
          pointsEarned = 10 + (currentStreak * 2); // Bonus points for streak
          isNewRecord = currentStreak > streakRecord.max_streak;

          // Update streak record
          await supabase
            .from('login_streaks')
            .update({
              last_login: todayDate,
              current_streak: currentStreak,
              max_streak: maxStreak,
            })
            .eq('user_id', userId);
        } else {
          // Streak broken, reset to 1
          currentStreak = 1;
          maxStreak = streakRecord.max_streak;
          pointsEarned = 10;

          await supabase
            .from('login_streaks')
            .update({
              last_login: todayDate,
              current_streak: 1,
            })
            .eq('user_id', userId);
        }
      }

      // Award points to user profile
      if (pointsEarned > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ points: (profile.points || 0) + pointsEarned })
            .eq('id', userId);
        }
      }

      setStreakData({
        currentStreak,
        maxStreak,
        pointsEarned,
        dayOfWeek,
        isNewRecord,
      });
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Flame size={48} color="#ff6b35" />
            </View>

            <Text style={styles.title}>
              {streakData.isNewRecord ? 'New Record!' : 'Welcome Back!'}
            </Text>

            <Text style={styles.dayText}>Happy {streakData.dayOfWeek}!</Text>

            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>

            {streakData.isNewRecord && (
              <View style={styles.recordBadge}>
                <Trophy size={20} color="#fbbf24" />
                <Text style={styles.recordText}>Personal Best!</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Star size={20} color="#1ea2b1" />
                <Text style={styles.statValue}>+{streakData.pointsEarned}</Text>
                <Text style={styles.statLabel}>Points Earned</Text>
              </View>

              <View style={styles.statItem}>
                <Trophy size={20} color="#fbbf24" />
                <Text style={styles.statValue}>{streakData.maxStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 300,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#1ea2b1',
    marginBottom: 20,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#cccccc',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2420',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  recordText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});