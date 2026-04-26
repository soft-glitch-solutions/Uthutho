import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { Trophy, Star, X, Check, Circle, Flame } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const flameAnimationRef = useRef<any>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (visible && userId) {
      updateLoginStreak();
    }
  }, [visible, userId]);

  useEffect(() => {
    if (visible && !isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();
      
      if (flameAnimationRef.current) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          flameAnimationRef.current.play();
        }
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, isLoading]);

  const updateLoginStreak = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const currentDayIndex = today.getDay();

      let { data: streakRecord, error } = await supabase
        .from('login_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      let currentStreak = 1;
      let maxStreak = 1;
      let pointsEarned = 10;
      let isNewRecord = false;
      let message = 'Welcome back!';
      let completedDays: number[] = [currentDayIndex];

      if (error && error.code === 'PGRST116') {
        const { data: newRecord } = await supabase
          .from('login_streaks')
          .insert([{
            user_id: userId,
            last_login: todayDate,
            current_streak: 1,
            max_streak: 1,
            completed_days: completedDays,
          }])
          .select()
          .single();
        streakRecord = newRecord;
        message = 'Ready to move? Start your journey!';
      } else if (streakRecord) {
        const lastLogin = new Date(streakRecord.last_login);
        const lastLoginDate = lastLogin.toISOString().split('T')[0];
        
        if (lastLoginDate === todayDate) {
          currentStreak = streakRecord.current_streak;
          maxStreak = streakRecord.max_streak;
          pointsEarned = 0;
          completedDays = streakRecord.completed_days || [currentDayIndex];
          message = 'You are already on fire today!';
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayDate = yesterday.toISOString().split('T')[0];
          const previousDays = streakRecord.completed_days || [];
          
          if (lastLoginDate === yesterdayDate) {
            currentStreak = streakRecord.current_streak + 1;
            maxStreak = Math.max(currentStreak, streakRecord.max_streak);
            pointsEarned = 10 + (currentStreak * 2);
            isNewRecord = currentStreak > streakRecord.max_streak;
            message = `${currentStreak} DAYS IN A ROW!`;
            completedDays = !previousDays.includes(currentDayIndex) ? [...previousDays, currentDayIndex] : previousDays;

            await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: currentStreak,
                max_streak: maxStreak,
                completed_days: completedDays,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          } else {
            currentStreak = 1;
            maxStreak = streakRecord.max_streak;
            pointsEarned = 10;
            message = 'Welcome back! Let\'s build a new streak.';
            completedDays = [currentDayIndex];

            await supabase
              .from('login_streaks')
              .update({
                last_login: todayDate,
                current_streak: 1,
                completed_days: completedDays,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          }
        }
      }

      if (pointsEarned > 0) {
        const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
        if (profile) {
          await supabase.from('profiles').update({ points: (profile.points || 0) + pointsEarned }).eq('id', userId);
        }
      }

      setStreakData({ currentStreak, maxStreak, pointsEarned, dayOfWeek, isNewRecord, message, completedDays });
    } catch (error) {
      console.error('Streak update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Flame size={40} color="#1ea2b1" />
        </View>
      );
    }
  };

  const renderDayCircles = () => {
    const currentDayIndex = new Date().getDay();
    return daysOfWeek.map((day, index) => {
      const isToday = index === currentDayIndex;
      const isCompleted = streakData.completedDays?.includes(index) || false;
      return (
        <View key={day} style={styles.dayCircleContainer}>
          <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day}</Text>
          <View style={[styles.dayCircle, isToday && styles.todayCircle, isCompleted && styles.completedCircle]}>
            {isCompleted ? <Check size={14} color="#000" strokeWidth={3} /> : <View style={styles.dot} />}
          </View>
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <FlameAnimation />
            </View>

            <Text style={styles.title}>{streakData.message}</Text>
            <Text style={styles.dayText}>Happy {streakData.dayOfWeek}!</Text>

            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>

            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>WEEKLY PROGRESS</Text>
              <View style={styles.daysRow}>{renderDayCircles()}</View>
            </View>

            {streakData.pointsEarned > 0 && (
              <View style={styles.rewardBanner}>
                <Star size={16} color="#000" fill="#000" />
                <Text style={styles.rewardText}>+{streakData.pointsEarned} Points Added</Text>
              </View>
            )}

            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>CONTINUE</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 32,
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  flameAnimation: {
    width: 120,
    height: 120,
  },
  fallbackFlame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakBadge: {
    alignItems: 'center',
    marginBottom: 32,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 72,
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: -4,
  },
  progressCard: {
    backgroundColor: '#000',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCircleContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  todayLabel: {
    color: '#1ea2b1',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    borderColor: '#1ea2b1',
    borderWidth: 2,
  },
  completedCircle: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#222',
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  rewardText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  continueButton: {
    backgroundColor: '#1ea2b1',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});