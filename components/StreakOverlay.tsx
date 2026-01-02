import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated,
  Platform 
} from 'react-native';
import { Trophy, Star, X, Check, Circle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LottieView from 'lottie-react-native';

// Only import web components on web
let DotLottieReact: any = null;
if (Platform.OS === 'web') {
  try {
    const module = require('@lottiefiles/dotlottie-react');
    DotLottieReact = module.DotLottieReact;
  } catch (error) {
    console.warn('DotLottieReact not available');
  }
}

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
    completedDays: [] as number[],
  });

  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flameAnimationRef = useRef<any>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (visible && userId) {
      updateLoginStreak();
    }
  }, [visible, userId]);

  useEffect(() => {
    if (visible && !isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      if (flameAnimationRef.current) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          flameAnimationRef.current.play();
        }
      }
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, isLoading]);

  const updateLoginStreak = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const currentDayIndex = today.getDay(); // 0 = Sunday, 6 = Saturday

      console.log('Updating streak for user:', userId, 'Date:', todayDate);

      let { data: streakRecord, error } = await supabase
        .from('login_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Existing streak record:', streakRecord);

      let currentStreak = 1;
      let maxStreak = 1;
      let pointsEarned = 10;
      let isNewRecord = false;
      let message = 'Welcome back!';
      let completedDays: number[] = [currentDayIndex]; // Start with today as completed

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
            completed_days: completedDays,
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
          // Already logged in today - use existing data
          console.log('Already logged in today');
          currentStreak = streakRecord.current_streak;
          maxStreak = streakRecord.max_streak;
          pointsEarned = 0;
          completedDays = streakRecord.completed_days || [currentDayIndex];
          message = 'Welcome back! You already logged in today.';
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayDate = yesterday.toISOString().split('T')[0];

          console.log('Yesterday date:', yesterdayDate);

          // Get previous completed days
          const previousDays = streakRecord.completed_days || [];
          
          if (lastLoginDate === yesterdayDate) {
            // Consecutive day login
            console.log('Consecutive day login - continuing streak');
            currentStreak = streakRecord.current_streak + 1;
            maxStreak = Math.max(currentStreak, streakRecord.max_streak);
            pointsEarned = 10 + (currentStreak * 2);
            isNewRecord = currentStreak > streakRecord.max_streak;
            message = `Amazing! ${currentStreak} day streak!`;
            
            // Add today to completed days if not already there
            if (!previousDays.includes(currentDayIndex)) {
              completedDays = [...previousDays, currentDayIndex];
            } else {
              completedDays = previousDays;
            }

            // Update streak record
            const { error: updateError } = await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: currentStreak,
                max_streak: maxStreak,
                completed_days: completedDays,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);

            if (updateError) {
              console.error('Error updating streak:', updateError);
              throw updateError;
            }
          } else {
            // Streak broken - start fresh with today
            console.log('Streak broken - resetting to 1');
            currentStreak = 1;
            maxStreak = streakRecord.max_streak;
            pointsEarned = 10;
            message = 'Welcome back! New streak started.';
            completedDays = [currentDayIndex];

            const { error: updateError } = await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: 1,
                completed_days: completedDays,
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
        completedDays,
      });

      console.log('Streak update completed:', {
        currentStreak,
        maxStreak,
        pointsEarned,
        isNewRecord,
        message,
        completedDays
      });

    } catch (error) {
      console.error('Error updating login streak:', error);
      const today = new Date();
      setStreakData({
        currentStreak: 1,
        maxStreak: 1,
        pointsEarned: 10,
        dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
        isNewRecord: false,
        message: 'Welcome! Daily login bonus awarded.',
        completedDays: [today.getDay()],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lottie flame animation component
  const FlameAnimation = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return (
        <LottieView
          ref={flameAnimationRef}
          source={require('@/assets/animations/Fire.json')}
          autoPlay={false}
          loop={true}
          style={styles.flameAnimation}
          resizeMode="contain"
        />
      );
    } else if (Platform.OS === 'web' && DotLottieReact) {
      return (
        <DotLottieReact
          src="https://lottie.host/6e77d5d1-f49d-4ee8-9b98-81c81905eca1/Gw8bwrnNTJ.lottie"
          loop
          autoplay={true}
          style={styles.flameAnimation}
        />
      );
    } else {
      return (
        <View style={styles.fallbackFlame}>
          <Text style={styles.fallbackFlameText}>🔥</Text>
        </View>
      );
    }
  };

  // Render day circles with ticks
  const renderDayCircles = () => {
    const currentDayIndex = new Date().getDay();
    
    return daysOfWeek.map((day, index) => {
      const isToday = index === currentDayIndex;
      const isCompleted = streakData.completedDays?.includes(index) || false;
      
      return (
        <View key={day} style={styles.dayCircleContainer}>
          <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
            {day}
          </Text>
          <View style={[
            styles.dayCircle,
            isToday && styles.todayCircle,
            isCompleted && styles.completedCircle
          ]}>
            {isCompleted ? (
              <Check size={16} color="#ffffff" />
            ) : (
              <Circle size={16} color={isToday ? "#1ea2b1" : "#666666"} />
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <FlameAnimation />
            </View>

            <Text style={styles.title}>
              {streakData.isNewRecord ? 'New Record!' : streakData.message}
            </Text>

            <Text style={styles.dayText}>Happy {streakData.dayOfWeek}!</Text>

            {/* Streak counter */}
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>

            {/* Weekly progress tracker - single row */}
            <View style={styles.weekProgressContainer}>
              <Text style={styles.weekProgressLabel}>Weekly Progress</Text>
              <View style={styles.daysRow}>
                {renderDayCircles()}
              </View>
              <Text style={styles.progressText}>
                {streakData.completedDays?.length || 0} of {daysOfWeek.length} days completed
              </Text>
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
        </Animated.View>
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
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameAnimation: {
    width: 100,
    height: 100,
  },
  fallbackFlame: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 40,
  },
  fallbackFlameText: {
    fontSize: 40,
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
  weekProgressContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  weekProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  dayCircleContainer: {
    alignItems: 'center',
    width: 40,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#1ea2b1',
    fontWeight: 'bold',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
  },
  todayCircle: {
    borderColor: '#1ea2b1',
  },
  completedCircle: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
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
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    flex: 1,
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
    minWidth: 150,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});