import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Provider } from 'react-native-paper';
import { supabase } from '../../lib/supabase';

const LoginStreakTracker = ({ userId }) => {
  const [visible, setVisible] = useState(false);
  const [streak, setStreak] = useState({ current: 0, max: 0, points: 0 });

  const handleLogin = async () => {
    try {
      // Call the Supabase function to handle the login streak
      const { data, error } = await supabase
        .rpc('handle_login_streak', { user_id: userId });

      if (error) throw error;

      // Update the streak state
      setStreak({
        current: data.current_streak,
        max: data.max_streak,
        points: data.points_earned,
      });

      // Show the pop-up dialog
      setVisible(true);
    } catch (error) {
      console.error('Error handling login streak:', error);
    }
  };

  useEffect(() => {
    // Call handleLogin when the component mounts (or when the user logs in)
    handleLogin();
  }, [userId]);

  return (
    <Provider>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Login Streak</Dialog.Title>
          <Dialog.Content>
            <Text>Current Streak: {streak.current} days</Text>
            <Text>Max Streak: {streak.max} days</Text>
            <Text>Points Earned: {streak.points}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
  );
};

export default LoginStreakTracker;