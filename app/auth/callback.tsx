import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        setStatus('Verifying session...');
        
        // Check for any incoming deep link (for mobile)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { queryParams } = Linking.parse(initialUrl);
          if (queryParams?.refresh_token || queryParams?.access_token) {
            // The tokens are in the URL, Supabase should handle them automatically
            setStatus('Session detected...');
          }
        }

        // Wait for Supabase to initialize the session
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          if (isMounted) {
            setStatus('Authentication successful!');
            router.replace('/(app)/(tabs)/home');
          }
        } else {
          throw new Error('No active session found');
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        if (isMounted) {
          setError(err.message || 'Authentication failed');
          router.replace('/auth');
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.statusText}>{status}</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
});