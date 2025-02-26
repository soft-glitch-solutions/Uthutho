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

  const { data: { session } } = supabase.auth.getSession();



  const hasLaunched = AsyncStorage.getItem('hasLaunched');
  if (!hasLaunched) {
    return <Redirect href="/onboarding" />;
  }

    if (session) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/auth" />;
}