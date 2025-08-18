import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(app)/(tabs)/home');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.replace('/(app)/(tabs)/home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Authenticating...</Text>
    </View>
  );
}