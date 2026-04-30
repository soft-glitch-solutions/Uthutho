import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Animated, 
  Easing, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  StyleSheet, 
  Platform,
  Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { 
  Gift, 
  RotateCw, 
  Star, 
  Zap, 
  Sparkles, 
  X, 
  Play, 
  TrendingUp,
  Award
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginStreakPopupProps {
  open: boolean;
  onClose: () => void;
}

// Mock Ad Component
const MockAdPlayer = ({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.adOverlay}>
      <LinearGradient colors={['#000', '#111']} style={styles.adContainer}>
        <View style={styles.adHeader}>
          <Text style={styles.adBadge}>ADVERTISEMENT</Text>
          {timeLeft > 0 ? (
            <Text style={styles.adTimer}>Reward in {timeLeft}s</Text>
          ) : (
            <TouchableOpacity onPress={onComplete} style={styles.adCloseBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.adVideoPlaceholder}>
          <Play size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.adVideoText}>Uthutho Premium Video</Text>
          <ActivityIndicator size="small" color="#1ea2b1" style={{ marginTop: 20 }} />
        </View>

        <View style={styles.adFooter}>
          <Text style={styles.adFooterTitle}>Uthutho: Move with Purpose</Text>
          <Text style={styles.adFooterDesc}>Join the eco-friendly transport revolution today.</Text>
          <View style={styles.adProgressBarBg}>
            <Animated.View 
              style={[
                styles.adProgressBarFill, 
                { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export function LoginStreakPopup({ open, onClose }: LoginStreakPopupProps) {
  const { colors } = useTheme();
  const [streak, setStreak] = useState<{
    current_streak: number;
    max_streak: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showSpinResult, setShowSpinResult] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [rewardDoubled, setRewardDoubled] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef<Animated.CompositeAnimation | null>(null);

  const wheelSections = [
    { points: 10, color: '#111', icon: '⭐', text: '10' },
    { points: 5, color: '#000', icon: '⚡', text: '5' },
    { points: 15, color: '#111', icon: '🎯', text: '15' },
    { points: 8, color: '#000', icon: '🎁', text: '8' },
    { points: 12, color: '#111', icon: '🔥', text: '12' },
    { points: 7, color: '#000', icon: '✨', text: '7' },
  ];

  useEffect(() => {
    if (open) {
      fetchLoginStreak();
      setShowSpinResult(false);
      setSpinResult(null);
      setRewardDoubled(false);
    }
  }, [open]);

  useEffect(() => {
    if (showSpinResult) {
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [showSpinResult]);

  useEffect(() => {
    if (open && !spinning && !showSpinResult && !hasSpunToday) {
      startIdleSpin();
    } else {
      idleAnim.current?.stop();
    }
    return () => idleAnim.current?.stop();
  }, [open, spinning, showSpinResult, hasSpunToday]);

  const startIdleSpin = () => {
    spinValue.setValue(0);
    idleAnim.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 360,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    idleAnim.current.start();
  };

  const fetchLoginStreak = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) return;
      const userId = session.session.user.id;
      const today = new Date().toDateString();
      const lastSpinDate = await AsyncStorage.getItem(`lastSpinDate_${userId}`);
      setHasSpunToday(lastSpinDate === today);

      const { data: streakData } = await supabase
        .from('login_streaks')
        .select('current_streak, max_streak')
        .eq('user_id', userId)
        .single();

      if (streakData) setStreak(streakData);
    } catch (error) {
      console.error('Error fetching login streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const spinTheWheel = async () => {
    if (spinning || hasSpunToday) return;
    setSpinning(true);
    setShowSpinResult(false);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user.id) return;
    const userId = session.session.user.id;
    const today = new Date().toDateString();

    const randomSpins = 5 + Math.random() * 3;
    const randomSection = Math.floor(Math.random() * wheelSections.length);
    const finalRotation = 360 * randomSpins + (randomSection * 60);

    spinValue.setValue(0);
    scaleValue.setValue(1);

    Animated.parallel([
      Animated.timing(spinValue, {
        toValue: finalRotation,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ]),
    ]).start(async () => {
      const pointsWon = wheelSections[randomSection].points;
      setSpinResult(pointsWon);
      setShowSpinResult(true);
      setHasSpunToday(true);
      await AsyncStorage.setItem(`lastSpinDate_${userId}`, today);
      
      // Initial Award
      try {
        await supabase.rpc('increment_points', { user_id: userId, points_to_add: pointsWon });
      } catch (error) {
        console.error('Error awarding points:', error);
      }
      
      setSpinning(false);
    });
  };

  const handleDoubleReward = () => {
    setShowAd(true);
  };

  const onAdComplete = async () => {
    setShowAd(false);
    if (!spinResult) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) return;
      
      const additionalPoints = spinResult; // Double it means adding the same amount again
      await supabase.rpc('increment_points', { 
        user_id: session.session.user.id, 
        points_to_add: additionalPoints 
      });

      setSpinResult(spinResult * 2);
      setRewardDoubled(true);
      
      Alert.alert('Success!', `Your reward has been doubled to ${spinResult * 2} points!`);
    } catch (error) {
      console.error('Error doubling reward:', error);
    }
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const getWheelSection = (index: number) => {
    const section = wheelSections[index];
    const angle = index * 60;
    return (
      <View
        key={index}
        style={[
          styles.wheelSection,
          { backgroundColor: section.color, transform: [{ rotate: `${angle}deg` }] },
        ]}
      >
        <View style={styles.sectionContent}>
          <Text style={styles.wheelSectionIcon}>{section.icon}</Text>
          <Text style={styles.wheelSectionText}>{section.text}</Text>
        </View>
      </View>
    );
  };

  const takeBonusPoints = async () => {
    if (hasSpunToday) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user.id) return;
    try {
      await supabase.rpc('increment_points', { user_id: session.session.user.id, points_to_add: 10 });
      setShowSpinResult(true);
      setSpinResult(10);
      setHasSpunToday(true);
      await AsyncStorage.setItem(`lastSpinDate_${session.session.user.id}`, new Date().toDateString());
    } catch (error) {
      console.error('Error awarding bonus:', error);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#666" />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1ea2b1" />
              <Text style={styles.loadingText}>Loading rewards...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.readyText}>READY TO MOVE</Text>
              <Text style={styles.title}>Daily Reward Wheel</Text>

              <View style={styles.streakInfo}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
                  <Text style={styles.streakLabel}>Day Streak</Text>
                </View>
              </View>

              <View style={styles.wheelContainer}>
                <View style={styles.wheelWrapper}>
                  <Animated.View
                    style={[
                      styles.wheel,
                      { transform: [{ rotate: spinInterpolate }, { scale: scaleValue }] },
                    ]}
                  >
                    {wheelSections.map((_, index) => getWheelSection(index))}
                  </Animated.View>
                  <View style={styles.wheelPointer}>
                    <Zap size={40} color="#1ea2b1" fill="#1ea2b1" />
                  </View>
                </View>

                {showSpinResult ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <Animated.View style={[styles.resultBanner, { opacity: fadeValue }]}>
                      <Sparkles size={24} color="#000" />
                      <Text style={styles.resultText}>+{spinResult} POINTS WON!</Text>
                    </Animated.View>
                    
                    {!rewardDoubled && (
                      <TouchableOpacity 
                        style={styles.doubleBtn} 
                        onPress={handleDoubleReward}
                      >
                        <LinearGradient
                          colors={['#fbbf24', '#f59e0b']}
                          style={styles.doubleBtnInner}
                        >
                          <Play size={18} color="#000" fill="#000" />
                          <Text style={styles.doubleBtnText}>Watch Ad to Double Reward!</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={styles.claimBtn} onPress={onClose}>
                      <Text style={styles.claimBtnText}>Claim Points</Text>
                    </TouchableOpacity>
                  </View>
                ) : hasSpunToday ? (
                  <View style={styles.alreadySpunBox}>
                    <Text style={styles.alreadySpunText}>Reward collected! Come back tomorrow.</Text>
                  </View>
                ) : (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.spinButton}
                      onPress={spinTheWheel}
                      disabled={spinning}
                    >
                      {spinning ? <RotateCw size={20} color="#000" /> : <Gift size={20} color="#000" />}
                      <Text style={styles.spinButtonText}>{spinning ? 'SPINNING...' : 'SPIN TO WIN'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bonusButton} onPress={takeBonusPoints}>
                      <Star size={18} color="#1ea2b1" />
                      <Text style={styles.bonusButtonText}>Take 10 Points Instead</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Full Screen Ad Modal */}
      <Modal visible={showAd} transparent animationType="slide">
        <MockAdPlayer onComplete={onAdComplete} onCancel={() => setShowAd(false)} />
      </Modal>
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
    borderWidth: 1,
    borderColor: '#222',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
  },
  readyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1ea2b1',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  streakInfo: {
    marginBottom: 32,
  },
  streakBadge: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wheelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  wheelWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  wheel: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#000',
    borderWidth: 8,
    borderColor: '#1ea2b1',
    overflow: 'hidden',
  },
  wheelSection: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    left: '50%',
    top: 0,
    transformOrigin: 'left bottom',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    transform: [{ rotate: '30deg' }],
    alignItems: 'center',
    marginLeft: 30,
  },
  wheelSectionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  wheelSectionText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  wheelPointer: {
    position: 'absolute',
    top: -24,
    zIndex: 10,
    shadowColor: '#1ea2b1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  spinButton: {
    backgroundColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  spinButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  bonusButton: {
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  bonusButtonText: {
    color: '#1ea2b1',
    fontWeight: '700',
    fontSize: 12,
  },
  resultBanner: {
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
    marginBottom: 16,
  },
  resultText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  alreadySpunBox: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  alreadySpunText: {
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  doubleBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  doubleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  doubleBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  claimBtn: {
    paddingVertical: 12,
  },
  claimBtnText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 14,
  },
  // Ad Styles
  adOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    width: '100%',
    height: '100%',
    padding: 32,
    justifyContent: 'space-between',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  adBadge: {
    color: '#666',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adTimer: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  adCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  adVideoText: {
    color: '#444',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  adFooter: {
    marginBottom: 40,
  },
  adFooterTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  adFooterDesc: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  adProgressBarBg: {
    height: 4,
    backgroundColor: '#111',
    borderRadius: 2,
    overflow: 'hidden',
  },
  adProgressBarFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
  },
});

export default LoginStreakPopup;