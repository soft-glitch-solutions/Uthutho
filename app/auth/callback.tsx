import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing authentication...');
  const [hasCheckedInitialSession, setHasCheckedInitialSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authListener;

    const handleAuthChange = async (event, session) => {
      if (!isMounted) return;

      console.log('Auth event:', event, session);

      // Skip INITIAL_SESSION if we've already checked it
      if (event === 'INITIAL_SESSION' && hasCheckedInitialSession) {
        return;
      }

      try {
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
          setStatus('Authentication successful!');
          router.replace('/(app)/(tabs)/home');
        } 
        else if (event === 'SIGNED_OUT') {
          setStatus('Redirecting to login...');
          router.replace('/auth');
        }
        else if (event === 'INITIAL_SESSION' && !session) {
          // Only redirect if this is the initial check
          if (!hasCheckedInitialSession) {
            setStatus('No active session found');
            router.replace('/auth');
            setHasCheckedInitialSession(true);
          }
        }
      } catch (error) {
        console.error('Auth handling error:', error);
        if (isMounted) {
          setStatus('Authentication error');
          router.replace('/auth?error=' + encodeURIComponent(error.message));
        }
      }
    };

    // First check the current session synchronously
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          setHasCheckedInitialSession(true);
          handleAuthChange('INITIAL_SESSION', session);
        }
      })
      .catch(error => {
        console.error('Session check error:', error);
        if (isMounted) {
          setStatus('Session check failed');
          router.replace('/auth');
        }
      });

    // Then set up the listener for future changes
    authListener = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [hasCheckedInitialSession]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
});