import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { WaitingProvider } from '../context/WaitingContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const route = url.replace(/.*?:\/\//g, '');
      const [path, query] = route.split('?');

      if (path === 'reset-password') {
        router.replace(query ? `/reset-password?${query}` : '/reset-password');
      }

      if (path === 'auth/callback') {
        router.replace('/auth/callback');
      }
    };

    // Handle deep links when app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep links when app is launched from closed state
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
