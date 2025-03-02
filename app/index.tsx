import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        return <Redirect href="/onboarding" />;
      }

      if (session) {
        return <Redirect href="/(app)/(tabs)/home" />;
      }

      return <Redirect href="/onboarding" />;
    };

    checkSession();
  }, []);

  return <Redirect href="/onboarding" />;
}