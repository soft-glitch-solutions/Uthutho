import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For local storage
import { useTheme } from '../context/ThemeContext'; // Use the theme

const LoginStreakTracker = ({ userId }) => {
  const { colors } = useTheme(); // Get theme colors
  const [visible, setVisible] = useState(false); // Controls dialog visibility
  const [streakData, setStreakData] = useState({ current: 0, max: 0, points: 0 });

  // Check if the dialog has been shown today
  const checkIfDialogShownToday = async () => {
    const lastShownDate = await AsyncStorage.getItem('lastShownDate');
    const today = new Date().toDateString();

    if (lastShownDate === today) {
      return true; // Dialog already shown today
    }
    return false; // Dialog not shown today
  };

  const handleLoginStreak = async () => {
    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return;

      // Check if the dialog has already been shown today
      const dialogShownToday = await checkIfDialogShownToday();
      if (dialogShownToday) return;

      // Call the Supabase function to get streak data
      const { data, error } = await supabase
        .rpc('handle_login_streak', { input_user_id: userId });

      if (error) throw error;

      // Update the streak state
      setStreakData({
        current: data.current_streak,
        max: data.max_streak,
        points: data.points_earned,
      });

      // Show the dialog
      setVisible(true);

      // Store today's date in local storage
      await AsyncStorage.setItem('lastShownDate', new Date().toDateString());
    } catch (error) {
      console.error('Error handling login streak:', error);
    }
  };

  useEffect(() => {
    handleLoginStreak();
  }, [userId]);

  return (
    <Provider>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={() => setVisible(false)}
          style={{ backgroundColor: colors.background }} // Use theme background color
        >
          <Dialog.Title style={{ color: colors.text }}>Login Streak</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.text }}>Current Streak: {streakData.current} days</Text>
            <Text style={{ color: colors.text }}>Max Streak: {streakData.max} days</Text>
            <Text style={{ color: colors.text }}>Points Earned: {streakData.points}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setVisible(false)}
              textColor={colors.primary} // Use theme primary color
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
  );
};

export default LoginStreakTracker;