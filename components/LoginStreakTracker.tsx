import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext'; // Assuming you have a theme context

interface LoginStreakPopupProps {
  open: boolean;
  onClose: () => void;
}

export function LoginStreakPopup({ open, onClose }: LoginStreakPopupProps) {
  const { colors } = useTheme(); // Get theme colors
  const [streak, setStreak] = useState<{
    current_streak: number;
    max_streak: number;
    points_earned?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchLoginStreak();
    }
  }, [open]);

  const fetchLoginStreak = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) return;

      const userId = session.session.user.id;

      // Get the user's current streak
      const { data: streakData, error: streakError } = await supabase
        .from('login_streaks')
        .select('current_streak, max_streak')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError;
      }

      if (streakData) {
        // Check if the streak has reached 7 days
        const pointsEarned = streakData.current_streak % 7 === 0 ? 1 : 0;
        setStreak({
          ...streakData,
          points_earned: pointsEarned
        });
      }
    } catch (error) {
      console.error('Error fetching login streak:', error);
      // You can use a toast library for React Native here if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <Portal>
        <Dialog visible={open} onDismiss={onClose} style={{ backgroundColor: colors.background }}>
          <Dialog.Title style={{ color: colors.text }}>Login Streak</Dialog.Title>
          <Dialog.Content>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.text }}>Loading your streak...</Text>
              </View>
            ) : streak ? (
              <View style={styles.streakContainer}>
                <View style={styles.streakCircle}>
                  <Text style={styles.streakNumber}>{streak.current_streak}</Text>
                </View>
                <Text style={[styles.streakText, { color: colors.text }]}>
                  {streak.current_streak === 1 
                    ? "First day of your streak!" 
                    : `${streak.current_streak} day streak! Keep it up!`}
                </Text>
                <Text style={[styles.streakSubText, { color: colors.text }]}>
                  Your best streak: {streak.max_streak} days
                </Text>
                {streak.points_earned ? (
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>
                      +{streak.points_earned} point earned for completing 7 days!
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.streakSubText, { color: colors.text }]}>
                    {7 - (streak.current_streak % 7)} more days for a point reward
                  </Text>
                )}
              </View>
            ) : (
              <Text style={{ color: colors.text }}>Start your login streak today!</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onClose} textColor={colors.primary}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
  );
}

const styles = {
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  streakContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD', // Light blue background for the circle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976D2', // Dark blue color for the number
  },
  streakText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  streakSubText: {
    fontSize: 14,
    marginBottom: 10,
  },
  pointsContainer: {
    backgroundColor: '#C8E6C9', // Light green background for points
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  pointsText: {
    color: '#388E3C', // Dark green color for points text
    fontWeight: '500',
  },
};

export default LoginStreakPopup;