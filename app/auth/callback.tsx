import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let authListener;

    const handleAuthStateChange = async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (!mounted) return;

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              setStatus('Authentication successful!');
              router.replace('/(app)/(tabs)/home');
            } else {
              throw new Error('No session available after sign in');
            }
            break;

          case 'SIGNED_OUT':
            setError('Authentication failed. Please try again.');
            router.replace('/auth?error=Authentication failed');
            break;

          case 'INITIAL_SESSION':
            if (session) {
              setStatus('Already authenticated');
              router.replace('/(app)/(tabs)/home');
            } else {
              setStatus('No active session found');
              router.replace('/auth');
            }
            break;

          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            // These events don't require navigation changes
            break;

          default:
            console.warn('Unhandled auth event:', event);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        if (mounted) {
          setError(err.message || 'Authentication error');
          router.replace(`/auth?error=${encodeURIComponent(err.message)}`);
        }
      }
    };

    // Set up the auth state listener
    authListener = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check initial session immediately
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          handleAuthStateChange('INITIAL_SESSION', session);
        }
      })
      .catch(err => {
        console.error('Initial session check error:', err);
        if (mounted) {
          setError('Failed to check authentication status');
          router.replace('/auth');
        }
      });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.statusText}>{status}</Text>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
    marginTop: 8,
  },
});