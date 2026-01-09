// RootLayout.tsx - Complete version with AdMob and Notification initialization
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { ThemeProvider } from '../context/ThemeContext';
import { WaitingProvider } from '../context/WaitingContext';
import { LanguageProvider } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import NetworkGate from '@/components/NetworkGate';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';

// Make sure this matches your app.json scheme
const DEEP_LINK_SCHEME = 'uthutho';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();


  // Initialize Push Notifications for mobile only
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Skipping initialization on web platform');
      return;
    }

    const initializeNotifications = async () => {
      try {
        console.log(`[Notifications ${Platform.OS}] Starting initialization...`);
        
        // Configure notification handlers for mobile
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Configure Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1ea2b1',
            sound: 'default',
          });
          console.log('[Notifications Android] Notification channel configured');
        }

        // Request permission and register for push notifications
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log(`[Notifications ${Platform.OS}] Successfully registered with token`);
          
          // You could store this token in your database for sending notifications
          // Example: await savePushTokenToDatabase(token);
        }

        // Listen for notification responses (user taps on notification)
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('[Notifications] User tapped notification:', response);
          const data = response.notification.request.content.data;
          
          // Handle deep linking from notifications
          if (data.url) {
            router.push(data.url);
          }
        });

        console.log(`[Notifications ${Platform.OS}] Initialization complete`);
        
        return () => {
          responseListener.remove();
        };
      } catch (error) {
        console.error(`[Notifications ${Platform.OS}] Initialization failed:`, error);
      }
    };

    initializeNotifications();
  }, []);

  // Deep link handling for OAuth and password reset
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('[DeepLink] Handling URL:', url);

      try {
        // Handle OAuth callbacks
        if (url.includes('auth/callback')) {
          console.log('[DeepLink] Processing OAuth callback');
          
          // Parse URL parameters manually
          const urlObj = new URL(url);
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const searchParams = new URLSearchParams(urlObj.search);
          
          const access_token = hashParams.get('access_token') || searchParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token');
          const error_description = hashParams.get('error_description') || searchParams.get('error_description');
          
          if (error_description) {
            console.error('[DeepLink] OAuth error:', error_description);
            router.replace('/auth');
            return;
          }
          
          if (access_token && refresh_token) {
            console.log('[DeepLink] Setting session from tokens');
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (error) {
              console.error('[DeepLink] Error setting session:', error);
              router.replace('/auth');
              return;
            }
            
            console.log('[DeepLink] OAuth successful, redirecting to home');
            router.replace('/(app)/(tabs)/home');
            return;
          } else {
            console.log('[DeepLink] No tokens found in URL');
            router.replace('/auth');
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
        console.error('[DeepLink] Error handling URL:', error);
        router.replace('/auth');
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    
    // Handle initial URL when app is launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <WaitingProvider>
        <LanguageProvider>
          <NetworkGate>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                gestureEnabled: true,
                contentStyle: { backgroundColor: '#000' },
              }}
            >
              <Stack.Screen name="index" options={{ gestureEnabled: false }} />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
              <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
              <Stack.Screen name="auth/callback" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(app)" options={{ gestureEnabled: false }} />
            </Stack>
          </NetworkGate>
        </LanguageProvider>
      </WaitingProvider>
    </ThemeProvider>
  );
}