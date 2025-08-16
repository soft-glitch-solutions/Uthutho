import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, Text, ActivityIndicator } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Extract token from URL fragment if needed
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        router.replace('/auth?error=Authentication failed');
        return;
      }

      if (session) {
        router.replace('/(app)/(tabs)/home');
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Completing authentication...</Text>
    </View>
  );
}