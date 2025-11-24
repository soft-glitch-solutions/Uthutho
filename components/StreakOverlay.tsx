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
    pointsEarned: 0,
    dayOfWeek: '',
    isNewRecord: false,
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      updateLoginStreak();
    }
  }, [visible, userId]);

  const updateLoginStreak = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

      console.log('Updating streak for user:', userId, 'Date:', todayDate);

      // Get or create login streak record
      let { data: streakRecord, error } = await supabase
        .from('login_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Existing streak record:', streakRecord);

      let currentStreak = 1;
      let maxStreak = 1;
      let pointsEarned = 10; // Base points for logging in
      let isNewRecord = false;
      let message = 'Welcome back!';

      if (error && error.code === 'PGRST116') {
        // No existing record, create new one
        console.log('Creating new streak record');
        const { data: newRecord, error: insertError } = await supabase
          .from('login_streaks')
          .insert([{
            user_id: userId,
            last_login: todayDate,
            current_streak: 1,
            max_streak: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating streak record:', insertError);
          throw insertError;
        }

        streakRecord = newRecord;
        message = 'Welcome! Start your journey!';
        
      } else if (streakRecord) {
        const lastLogin = new Date(streakRecord.last_login);
        const lastLoginDate = lastLogin.toISOString().split('T')[0];
        
        console.log('Last login date:', lastLoginDate, 'Today:', todayDate);

        if (lastLoginDate === todayDate) {
          // Already logged in today
          console.log('Already logged in today');
          currentStreak = streakRecord.current_streak;
          maxStreak = streakRecord.max_streak;
          pointsEarned = 0; // No additional points for same day
          message = 'Welcome back! You already logged in today.';
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayDate = yesterday.toISOString().split('T')[0];

          console.log('Yesterday date:', yesterdayDate);

          if (lastLoginDate === yesterdayDate) {
            // Consecutive day login - streak continues
            console.log('Consecutive day login - continuing streak');
            currentStreak = streakRecord.current_streak + 1;
            maxStreak = Math.max(currentStreak, streakRecord.max_streak);
            pointsEarned = 10 + (currentStreak * 2); // Bonus points for streak
            isNewRecord = currentStreak > streakRecord.max_streak;
            message = `Amazing! ${currentStreak} day streak!`;

            // Update streak record
            const { error: updateError } = await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: currentStreak,
                max_streak: maxStreak,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (updateError) {
              console.error('Error updating streak:', updateError);
              throw updateError;
            }
          } else {
            // Streak broken (not consecutive), reset to 1
            console.log('Streak broken - resetting to 1');
            currentStreak = 1;
            maxStreak = streakRecord.max_streak;
            pointsEarned = 10;
            message = 'Welcome back! New streak started.';

            const { error: updateError } = await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: 1,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (updateError) {
              console.error('Error resetting streak:', updateError);
              throw updateError;
            }
          }
        }
      }

      // Award points to user profile if points were earned
      if (pointsEarned > 0) {
        console.log('Awarding points:', pointsEarned);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profile) {
          const newPoints = (profile.points || 0) + pointsEarned;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating points:', updateError);
          } else {
            console.log('Points updated successfully');
          }
        }
      }

      setStreakData({
        currentStreak,
        maxStreak,
        pointsEarned,
        dayOfWeek,
        isNewRecord,
        message,
      });

      console.log('Streak update completed:', {
        currentStreak,
        maxStreak,
        pointsEarned,
        isNewRecord,
        message
      });

    } catch (error) {
      console.error('Error updating login streak:', error);
      // Set fallback data
      setStreakData({
        currentStreak: 1,
        maxStreak: 1,
        pointsEarned: 10,
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        isNewRecord: false,
        message: 'Welcome! Daily login bonus awarded.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const SkeletonLoader = () => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.skeletonCloseButton} />
          
          <View style={styles.content}>
            <View style={[styles.skeletonIcon, styles.skeleton]} />
            
            <View style={[styles.skeletonTitle, styles.skeleton]} />
            <View style={[styles.skeletonDayText, styles.skeleton]} />
            
            <View style={styles.streakContainer}>
              <View style={[styles.skeletonStreakNumber, styles.skeleton]} />
              <View style={[styles.skeletonStreakLabel, styles.skeleton]} />
            </View>

            <View style={[styles.skeletonRecordBadge, styles.skeleton]} />

            <View style={styles.statsContainer}>
              <View style={[styles.skeletonStatItem, styles.skeleton]} />
              <View style={[styles.skeletonStatItem, styles.skeleton]} />
            </View>

            <View style={[styles.skeletonButton, styles.skeleton]} />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

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
              {streakData.isNewRecord ? 'New Record! 🔥' : streakData.message}
            </Text>

            <Text style={styles.dayText}>Happy {streakData.dayOfWeek}!</Text>

            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>

            {streakData.isNewRecord && (
              <View style={styles.recordBadge}>
                <Trophy size={20} color="#fbbf24" />
                <Text style={styles.recordText}>Personal Best! 🏆</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              {streakData.pointsEarned > 0 && (
                <View style={styles.statItem}>
                  <Star size={20} color="#1ea2b1" />
                  <Text style={styles.statValue}>+{streakData.pointsEarned}</Text>
                  <Text style={styles.statLabel}>Points Earned</Text>
                </View>
              )}

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
  // Skeleton styles
  skeleton: {
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 20,
  },
  skeletonTitle: {
    width: 200,
    height: 28,
    marginBottom: 8,
  },
  skeletonDayText: {
    width: 120,
    height: 18,
    marginBottom: 20,
  },
  skeletonStreakNumber: {
    width: 80,
    height: 52,
    marginBottom: 8,
  },
  skeletonStreakLabel: {
    width: 80,
    height: 16,
  },
  skeletonRecordBadge: {
    width: 140,
    height: 32,
    borderRadius: 16,
    marginBottom: 20,
  },
  skeletonStatItem: {
    width: 100,
    height: 80,
    borderRadius: 12,
  },
  skeletonButton: {
    width: 120,
    height: 44,
    borderRadius: 12,
  },
});