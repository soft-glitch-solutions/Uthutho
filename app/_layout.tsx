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
    const parsed = Linking.parse(url);
    if (!parsed || !parsed.path) return;

    if (parsed.path.includes('reset-password')) {
      const hashParams = new URLSearchParams(parsed.queryParams as any);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      router.replace({
        pathname: '/reset-password',
        params: { access_token: access_token || '', refresh_token: refresh_token || '' },
      });
    }

    if (parsed.path.includes('auth/callback')) {
      router.replace('/auth/callback');
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
