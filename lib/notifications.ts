// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    // Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    // If still not granted, show alert
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || '2669c125-3910-49ce-a24b-5675a796b3ec',
      })).data;

      console.log('✅ Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1ea2b1',
          showBadge: true,
        });
        console.log('✅ Android notification channel configured');
      } catch (error) {
        console.error('Error setting notification channel:', error);
      }
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

// Setup notification listeners
export function setupNotificationListeners() {
  // Listen for incoming notifications while app is open
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📨 Notification received:', notification);
      // You can update UI state here if needed
    }
  );

  // Listen for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 Notification tapped:', response);
      handleNotificationTap(response.notification.request.content.data);
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Handle notification tap navigation
function handleNotificationTap(data: any) {
  if (data?.screen) {
    switch (data.screen) {
      case 'home':
        router.push('/(tabs)');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      case 'notifications':
        router.push('/(tabs)/notifications');
        break;
      case 'journeys':
        router.push('/(tabs)/journeys');
        break;
      default:
        router.push('/(tabs)');
    }
  }
}

// Send a local notification (for testing)
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any,
  delayInSeconds: number = 2
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        seconds: delayInSeconds,
      },
    });
    console.log('✅ Local notification scheduled');
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Send welcome notification
export async function sendWelcomeNotification(userName?: string) {
  await sendLocalNotification(
    '👋 Welcome to Uthutho!',
    userName 
      ? `Welcome ${userName}! Start exploring stops and join journeys.`
      : 'Welcome! Your travel journey starts now. Join stops, start journeys, and earn points!',
    {
      screen: 'home',
      type: 'welcome',
      timestamp: new Date().toISOString(),
    },
    3
  );
}