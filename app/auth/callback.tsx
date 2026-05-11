// app/auth/callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Only import Linking on native platforms
let Linking: any = null;
if (Platform.OS !== 'web') {
  Linking = require('expo-linking');
}

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          router.replace('/(app)/(tabs)/home');
        }, 500);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          router.replace('/(app)/(tabs)/home');
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        router.replace('/auth');
      }
    });

    // Handle deep linking on native only
    if (Platform.OS !== 'web' && Linking) {
      const handleDeepLink = ({ url }: { url: string }) => {
        // Handle the deep link URL
        console.log('Deep link received:', url);
      };

      const subscription = Linking.addEventListener('url', handleDeepLink);

      return () => {
        authListener.subscription.unsubscribe();
        subscription.remove();
      };
    }

    // Fallback in case _layout.tsx fails to handle it
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setStatus('Taking longer than expected...');
        }
      });
    }, 5000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
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