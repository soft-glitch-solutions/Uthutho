import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const handleOAuthCallback = async () => {
      try {
        // Check if we have the OAuth code in the URL
        if (!params?.code) {
          throw new Error('No authentication code found');
        }

        setStatus('Verifying authentication...');

        // Exchange the code for a session
        const { data: { session }, error: authError } = 
          await supabase.auth.exchangeCodeForSession(params.code);

        if (authError) {
          throw authError;
        }

        if (!session) {
          throw new Error('Authentication failed: No session created');
        }

        // Success - redirect to app
        if (isMounted) {
          setStatus('Authentication successful!');
          router.replace('/(app)/(tabs)/home');
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        if (isMounted) {
          setError(err.message);
          setStatus('Authentication failed');
          router.replace(`/auth?error=${encodeURIComponent(err.message)}`);
        }
      }
    };

    handleOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [params?.code]);

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