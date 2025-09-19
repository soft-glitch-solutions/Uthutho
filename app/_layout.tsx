import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import { ThemeProvider } from '../context/ThemeContext';
import { WaitingProvider } from '../context/WaitingContext';
import { LanguageProvider } from '../context/LanguageContext';

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

const handleDeepLink = (url: string) => {
  console.log('[DeepLink] Handling URL:', url);
  
  try {
    // Handle both query parameters and hash fragments
    let access_token: string | null = null;
    let refresh_token: string | null = null;

    // Check for query parameters first
    if (url.includes('?')) {
      const urlObj = new URL(url);
      access_token = urlObj.searchParams.get('access_token');
      refresh_token = urlObj.searchParams.get('refresh_token');
    }
    
    // If no query params found, check hash fragment
    if ((!access_token || !refresh_token) && url.includes('#')) {
      const hashIndex = url.indexOf('#');
      const hash = url.substring(hashIndex + 1);
      const hashParams = new URLSearchParams(hash);
      access_token = hashParams.get('access_token');
      refresh_token = hashParams.get('refresh_token');
    }

    console.log('[DeepLink] Extracted tokens:', {
      access_token: access_token?.slice(0, 8),
      refresh_token: refresh_token?.slice(0, 8)
    });

    if (access_token && refresh_token && url.includes('reset-password')) {
      router.replace({
        pathname: '/reset-password',
        params: { access_token, refresh_token },
      });
    }

    if (url.includes('auth/callback')) {
      router.replace('/auth/callback');
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
