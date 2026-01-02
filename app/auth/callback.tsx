// app/auth/callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL that launched the app
        const url = await Linking.getInitialURL();
        
        if (!url) {
          throw new Error('No URL found');
        }

        console.log('[AuthCallback] Handling URL:', url);
        
        // Parse the URL for tokens
        const urlObj = new URL(url);
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const error_description = hashParams.get('error_description');

        if (error_description) {
          throw new Error(error_description);
        }

        if (!access_token || !refresh_token) {
          throw new Error('No authentication tokens found');
        }

        setStatus('Setting up your session...');
        
        // Set the session
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) throw error;

        setStatus('Success! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          router.replace('/(app)/(tabs)/home');
        }, 1000);

      } catch (error: any) {
        console.error('[AuthCallback] Error:', error);
        setStatus(`Authentication failed: ${error.message}`);
        
        setTimeout(() => {
          router.replace('/auth');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Uthutho</Text>
        <Text style={styles.tagline}>Commute. Connect. Community.</Text>
        
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#1ea2b1" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
});