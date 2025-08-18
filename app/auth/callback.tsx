import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session); // Added logging
      if (event === 'SIGNED_OUT') { // Corrected logic to handle SIGNED_OUT for errors
        router.replace('/auth?error=Authentication failed');
      }
      else if (event === 'SIGNED_IN' && session) {
          router.replace('/(app)/(tabs)/home');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Completing authentication...</Text>
    </View>
  );
}