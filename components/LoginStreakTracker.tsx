import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated, Easing, TouchableOpacity, Dimensions, Modal, StyleSheet, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Gift, RotateCw, Star, Zap, Sparkles, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginStreakPopupProps {
  open: boolean;
  onClose: () => void;
}

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

  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);
  const fadeValue = new Animated.Value(0);

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
      try {
        await supabase.rpc('increment_points', { user_id: userId, points_to_add: pointsWon });
      } catch (error) {
        console.error('Error awarding points:', error);
      }
      setSpinning(false);
    });
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
                  <Animated.View style={[styles.resultBanner, { opacity: fadeValue }]}>
                    <Sparkles size={24} color="#000" />
                    <Text style={styles.resultText}>+{spinResult} POINTS WON!</Text>
                  </Animated.View>
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
});

export default LoginStreakPopup;