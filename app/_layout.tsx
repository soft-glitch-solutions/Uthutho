import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import { ThemeProvider } from '../context/ThemeContext';
import { WaitingProvider } from '../context/WaitingContext';
import { LanguageProvider } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    return () => subscription.remove();
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('[DeepLink] Handling URL:', url);
  
    try {
      // Supabase handles OAuth callback + stores session
      if (url.includes('auth/callback')) {
        try {
          const { error } = await supabase.auth.getSessionFromUrl({
            url,
            storeSession: true,
          });
          if (error) throw error;
          console.log('[DeepLink] Session stored from callback');
          router.replace('/(app)/(tabs)/home');
          return;
        } catch (err) {
          console.error('[DeepLink] Error handling callback:', err);
          router.replace('/auth');
          return;
        }
      }
  
      // Password reset flow
      if (url.includes('reset-password')) {
        const urlObj = new URL(url);
        const access_token =
          urlObj.searchParams.get('access_token') ||
          new URLSearchParams(urlObj.hash.replace('#', '')).get('access_token');
        const refresh_token =
          urlObj.searchParams.get('refresh_token') ||
          new URLSearchParams(urlObj.hash.replace('#', '')).get('refresh_token');
  
        if (access_token && refresh_token) {
          router.replace({
            pathname: '/reset-password',
            params: { access_token, refresh_token },
          });
        }
      }
    } catch (error) {
      console.error('[DeepLink] Error parsing URL:', error);
    }
  };
  

  return (
    <ThemeProvider>
      <WaitingProvider>
        <LanguageProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
            <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth/callback" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(app)" options={{ gestureEnabled: false }} />
          </Stack>
        </LanguageProvider>
      </WaitingProvider>
    </ThemeProvider>
  );
}
