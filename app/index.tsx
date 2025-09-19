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
        // Check for any deep links first (mobile)
        if (Platform.OS !== 'web') {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            console.log('[Index] Initial URL detected:', initialUrl);
            
            // Handle OAuth callbacks on mobile
            if (initialUrl.includes('auth/callback')) {
              setRedirectTo('/auth/callback');
              return;
            }

            // Handle password reset links on mobile
            if (initialUrl.includes('reset-password')) {
              // Extract tokens from URL for mobile
              const { queryParams } = Linking.parse(initialUrl);
              const access_token = queryParams?.access_token as string;
              const refresh_token = queryParams?.refresh_token as string;

              if (access_token && refresh_token) {
                setRedirectTo(`/reset-password?access_token=${access_token}&refresh_token=${refresh_token}`);
                return;
              }
            }
          }
        }

        // 🔑 Handle web reset-password links with hash (#)
        if (Platform.OS === 'web') {
          const hash = window.location.hash;
          console.log('[Index] Hash:', hash);
          
          if (hash && hash.includes('access_token')) {
            // Extract parameters from hash fragment
            const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');

            console.log('[Index] Extracted tokens:', {
              access_token: access_token?.slice(0, 8),
              refresh_token: refresh_token?.slice(0, 8)
            });

            if (access_token && refresh_token) {
              // Convert hash to query parameters for the redirect
              setRedirectTo(`/reset-password?access_token=${access_token}&refresh_token=${refresh_token}`);
              return;
            }
          }

          // Handle web OAuth callbacks
          if (window.location.href.includes('auth/callback')) {
            setRedirectTo('/auth/callback');
            return;
          }
        }

        // Check if user is already authenticated
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('[Index] User already authenticated, redirecting to app');
            setRedirectTo('/(app)/(tabs)/home');
            return;
          }
        } catch (authError) {
          console.log('[Index] No active session, continuing to onboarding/auth');
        }

        // 🔁 Otherwise continue with first-launch / auth logic
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