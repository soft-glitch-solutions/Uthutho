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

          // Handle OAuth callback - NEW APPROACH
          if (initialUrl.includes('auth/callback')) {
            try {
              // Parse URL parameters manually
              const url = new URL(initialUrl);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const searchParams = new URLSearchParams(url.search);
              
              const access_token = hashParams.get('access_token') || searchParams.get('access_token');
              const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token');
              
              if (access_token && refresh_token) {
                console.log('[Index] Setting session from URL tokens');
                const { error } = await supabase.auth.setSession({
                  access_token,
                  refresh_token
                });
                
                if (error) throw error;
                
                console.log('[Index] Session stored successfully');
                setRedirectTo('/(app)/(tabs)/home');
                return;
              } else {
                console.log('[Index] No tokens found in URL, checking for existing session');
              }
            } catch (err) {
              console.error('[Index] Error storing session from URL:', err);
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
        <View style={styles.taglineContainer}>
          <Text style={[styles.taglineText, styles.commuteText]}>Commute.</Text>
          <Text style={[styles.taglineText, styles.connectText]}> Connect.</Text>
          <Text style={[styles.taglineText, styles.communityText]}> Community.</Text>
        </View>
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
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commuteText: {
    color: '#1EA2B1', // Commute - blue
  },
  connectText: {
    color: '#ED67B1', // Connect - pink
  },
  communityText: {
    color: '#FD602D', // Community - orange
  },
});