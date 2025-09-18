import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Platform, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('reset-password')) return; // skip redirect if deep link

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setRedirectTo('/(app)/(tabs)/home');
          return;
        }

        let hasLaunched: string | null = null;

        if (Platform.OS === 'web') {
          hasLaunched = localStorage.getItem('hasLaunched');
        } else {
          hasLaunched = await AsyncStorage.getItem('hasLaunched');
        }

        if (!hasLaunched) {
          setRedirectTo('/onboarding');
          if (Platform.OS === 'web') {
            localStorage.setItem('hasLaunched', 'true');
          } else {
            await AsyncStorage.setItem('hasLaunched', 'true');
          }
        } else {
          setRedirectTo('/auth');
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setRedirectTo('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTime();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Uthutho</Text>
        <Text style={styles.tagline}>Transform Your Daily Commute</Text>
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
