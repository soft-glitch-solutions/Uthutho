import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Platform, Text, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        let initialUrl: string | null = null;
  
        if (Platform.OS !== 'web') {
          initialUrl = await Linking.getInitialURL();
        } else {
          initialUrl = window.location.href;
        }
  
        if (initialUrl) {
          console.log('[Index] Initial URL detected:', initialUrl);
  
          // Handle OAuth callback (Supabase will extract + save session)
          if (initialUrl.includes('auth/callback')) {
            try {
              const { data, error } = await supabase.auth.getSessionFromUrl({
                url: initialUrl,
                storeSession: true,
              });
  
              if (error) throw error;
              console.log('[Index] Session stored successfully');
              setRedirectTo('/(app)/(tabs)/home');
              return;
            } catch (err) {
              console.error('[Index] Error storing session:', err);
              setRedirectTo('/auth');
              return;
            }
          }
  
          // Handle password reset link
          if (initialUrl.includes('reset-password')) {
            const urlObj = new URL(initialUrl);
            const access_token =
              urlObj.searchParams.get('access_token') ||
              new URLSearchParams(urlObj.hash.replace('#', '')).get('access_token');
            const refresh_token =
              urlObj.searchParams.get('refresh_token') ||
              new URLSearchParams(urlObj.hash.replace('#', '')).get('refresh_token');
  
            if (access_token && refresh_token) {
              setRedirectTo(
                `/reset-password?access_token=${access_token}&refresh_token=${refresh_token}`
              );
              return;
            }
          }
        }
  
        // Otherwise, check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setRedirectTo('/(app)/(tabs)/home');
          return;
        }
  
        // Onboarding vs Auth
        let hasLaunched = Platform.OS === 'web'
          ? localStorage.getItem('hasLaunched')
          : await AsyncStorage.getItem('hasLaunched');
  
        if (!hasLaunched) {
          setRedirectTo('/onboarding');
          if (Platform.OS === 'web') {
            localStorage.setItem('hasLaunched', 'true');
          } else {
            await AsyncStorage.setItem('hasLaunched', 'true');
          }
        } else {
          setRedirectTo('/onboarding');
        }
      } catch (error) {
        console.error('Error in Index init:', error);
        setRedirectTo('/auth');
      } finally {
        setIsLoading(false);
      }
    };
  
    init();
  }, []);
  

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Uthutho</Text>
        <Text style={styles.tagline}>Transform Your Daily Commute</Text>
        <ActivityIndicator color="#1ea2b1" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#ffffff',
    textAlign: 'center',
  },
});