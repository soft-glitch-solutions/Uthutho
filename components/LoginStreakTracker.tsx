import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Gift, RotateCw, Star, Zap, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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

  // Animation values
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);
  const fadeValue = new Animated.Value(0);

  const wheelSections = [
    { points: 10, color: '#FFD700', icon: '⭐', text: '10 Points' },
    { points: 5, color: '#C0C0C0', icon: '⚡', text: '5 Points' },
    { points: 15, color: '#FF6B6B', icon: '🎯', text: '15 Points' },
    { points: 8, color: '#4ECDC4', icon: '🎁', text: '8 Points' },
    { points: 12, color: '#FFA500', icon: '🔥', text: '12 Points' },
    { points: 7, color: '#9B59B6', icon: '✨', text: '7 Points' },
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
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
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

      // Check if user has already spun today
      setHasSpunToday(lastSpinDate === today);

      const { data: streakData, error: streakError } = await supabase
        .from('login_streaks')
        .select('current_streak, max_streak')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError;
      }

      if (streakData) {
        setStreak(streakData);
      }
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

    // Spin animation
    const randomSpins = 5 + Math.random() * 3; // 5-8 full spins
    const randomSection = Math.floor(Math.random() * wheelSections.length);
    const finalRotation = 360 * randomSpins + (randomSection * 60); // 60 degrees per section

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
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      const pointsWon = wheelSections[randomSection].points;
      setSpinResult(pointsWon);
      setShowSpinResult(true);
      setHasSpunToday(true);

      // Save spin date
      await AsyncStorage.setItem(`lastSpinDate_${userId}`, today);

      // Award points to user
      try {
        const { error } = await supabase.rpc('increment_points', {
          user_id: userId,
          points_to_add: pointsWon,
        });

        if (error) throw error;
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
    const angle = (index * 60); // 60 degrees per section
    return (
      <View
        key={index}
        style={[
          styles.wheelSection,
          {
            backgroundColor: section.color,
            transform: [{ rotate: `${angle}deg` }],
          },
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
      const { error } = await supabase.rpc('increment_points', {
        user_id: session.session.user.id,
        points_to_add: 10,
      });

      if (error) throw error;

      setShowSpinResult(true);
      setSpinResult(10);
      setHasSpunToday(true);
      
      // Save that user took bonus today
      const today = new Date().toDateString();
      await AsyncStorage.setItem(`lastSpinDate_${session.session.user.id}`, today);
    } catch (error) {
      console.error('Error awarding bonus points:', error);
    }
  };

  return (
    <Provider>
      <Portal>
        <Dialog 
          visible={open} 
          onDismiss={onClose} 
          style={[styles.dialogContainer, { backgroundColor: colors.background }]}
        >
          <Dialog.Title style={{ color: colors.text, textAlign: 'center', fontSize: 22 }}>
            🎉 Daily Reward Wheel! 🎉
          </Dialog.Title>
          
          <Dialog.Content>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.text, marginTop: 10 }}>Loading your rewards...</Text>
              </View>
            ) : (
              <View style={styles.container}>
                {/* Streak Info */}
                <View style={styles.streakHeader}>
                  <View style={[styles.streakBadge, { backgroundColor: colors.card }]}>
                    <Text style={[styles.streakNumber, { color: colors.primary }]}>
                      {streak?.current_streak || 0}
                    </Text>
                    <Text style={[styles.streakLabel, { color: colors.text }]}>Day Streak</Text>
                  </View>
                  <View style={styles.streakInfo}>
                    <Text style={[styles.streakText, { color: colors.text }]}>
                      {streak?.current_streak === 1 
                        ? "First day! 🚀" 
                        : `🔥 ${streak?.current_streak}-day streak!`}
                    </Text>
                    <Text style={[styles.streakSubText, { color: colors.text }]}>
                      Best: {streak?.max_streak || 0} days
                    </Text>
                  </View>
                </View>

                {/* Lucky Spin Wheel */}
                <View style={styles.wheelContainer}>
                  <Text style={[styles.wheelTitle, { color: colors.text }]}>
                    {hasSpunToday ? "Today's Reward" : "Spin to Win Points!"}
                  </Text>
                  
                  <View style={styles.wheelWrapper}>
                    <Animated.View
                      style={[
                        styles.wheel,
                        {
                          transform: [
                            { rotate: spinInterpolate },
                            { scale: scaleValue },
                          ],
                        },
                      ]}
                    >
                      {wheelSections.map((_, index) => getWheelSection(index))}
                    </Animated.View>
                    
                    <View style={styles.wheelPointer}>
                      <Zap size={35} color={colors.primary} fill={colors.primary} />
                    </View>
                  </View>

                  {showSpinResult ? (
                    <Animated.View 
                      style={[
                        styles.resultContainer,
                        { opacity: fadeValue, backgroundColor: colors.card }
                      ]}
                    >
                      <View style={styles.resultContent}>
                        <Sparkles size={40} color="#FFD700" />
                        <Text style={[styles.resultText, { color: colors.text }]}>
                          Congratulations! 🎉
                        </Text>
                        <Text style={[styles.pointsWon, { color: colors.primary }]}>
                          +{spinResult} Points Won!
                        </Text>
                        <Text style={[styles.resultSubtext, { color: colors.text }]}>
                          Come back tomorrow for another reward!
                        </Text>
                      </View>
                    </Animated.View>
                  ) : hasSpunToday ? (
                    <View style={[styles.alreadySpunContainer, { backgroundColor: colors.card }]}>
                      <Text style={[styles.alreadySpunText, { color: colors.text }]}>
                        ✅ You've already collected your daily reward today!
                      </Text>
                      <Text style={[styles.alreadySpunSubtext, { color: colors.text }]}>
                        Come back tomorrow for another spin!
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.spinButton, { backgroundColor: colors.primary }]}
                        onPress={spinTheWheel}
                        disabled={spinning}
                      >
                        {spinning ? (
                          <RotateCw size={24} color="#fff" />
                        ) : (
                          <Gift size={24} color="#fff" />
                        )}
                        <Text style={styles.spinButtonText}>
                          {spinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
                        </Text>
                      </TouchableOpacity>

                      {/* Alternative: Take 10 Points Button */}
                      <TouchableOpacity
                        style={[styles.bonusButton, { borderColor: colors.primary }]}
                        onPress={takeBonusPoints}
                      >
                        <Star size={20} color={colors.primary} />
                        <Text style={[styles.bonusButtonText, { color: colors.primary }]}>
                          Take 10 Points Instead
                        </Text>
                      </TouchableOpacity>

                      <Text style={[styles.noteText, { color: colors.text }]}>
                        🎯 Spin for 5-15 points or take guaranteed 10 points
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}
          </Dialog.Content>
          
          <Dialog.Actions>
            <Button onPress={onClose} textColor={colors.primary}>
              {hasSpunToday ? 'Close' : 'Maybe Later'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
  );
}

const styles = {
  dialogContainer: {
    borderRadius: 20,
    padding: 15,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  container: {
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  streakInfo: {
    flex: 1,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  streakSubText: {
    fontSize: 14,
    opacity: 0.8,
  },
  wheelContainer: {
    alignItems: 'center',
    width: '100%',
  },
  wheelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  wheelWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  wheel: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
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
    fontSize: 20,
    marginBottom: 2,
  },
  wheelSectionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  wheelPointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bonusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginBottom: 15,
  },
  bonusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  noteText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
  },
  resultContent: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  pointsWon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  alreadySpunContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
  },
  alreadySpunText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  alreadySpunSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
};

export default LoginStreakPopup;