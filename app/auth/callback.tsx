import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { parse } from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const handleOAuthCallback = async () => {
      try {
        // Get the current URL
        const url = await Linking.getInitialURL();
        
        if (!url) {
          throw new Error('No callback URL found');
        }

        // Parse the URL using expo-linking
        const parsedUrl = parse(url);
        const params = parsedUrl.queryParams;
        
        if (!params?.code) {
          throw new Error('No authentication code found');
        }

        setStatus('Verifying authentication...');

        // Retrieve the stored code verifier
        const codeVerifier = await SecureStore.getItemAsync('supabase-auth-code-verifier');
        
        if (!codeVerifier) {
          throw new Error('Missing code verifier');
        }

        // Exchange the code for a session
        const { data: { session }, error: authError } = 
          await supabase.auth.exchangeCodeForSession({
            code: params.code,
            codeVerifier: codeVerifier
          });

        if (authError) {
          throw authError;
        }

        if (!session) {
          throw new Error('Authentication failed: No session created');
        }

        // Clean up the code verifier after successful exchange
        await SecureStore.deleteItemAsync('supabase-auth-code-verifier');

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