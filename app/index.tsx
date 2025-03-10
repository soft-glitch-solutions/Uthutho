import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
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

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (!hasLaunched) {
          setRedirectTo('/onboarding');
        } else if (session) {
          setRedirectTo('/(app)/(tabs)/home');
        } else {
          setRedirectTo('/onboarding');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setRedirectTo('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTime();
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Redirect href="/onboarding" />;
}