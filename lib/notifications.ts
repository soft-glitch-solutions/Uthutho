// lib/notifications.ts - COMPLETE VERSION
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
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

// Send a test push notification via Expo servers
export async function testPushNotificationSelf(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return false;
  }

  try {
    const token = await registerForPushNotificationsAsync();
    
    if (!token) {
      console.error('No push token available');
      return false;
    }

    console.log('Sending test push notification to token:', token.substring(0, 30) + '...');

    // Send push notification via Expo's API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: 'Test Push Notification 🚀',
        body: 'This is a test push notification from Uthutho!',
        data: {
          debug: true,
          type: 'test',
          timestamp: new Date().toISOString(),
          screen: 'debug'
        },
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await response.json();
    console.log('Push test result:', result);
    
    return result.data?.status === 'ok';
  } catch (error) {
    console.error('Error testing push notification:', error);
    return false;
  }
}

// Schedule a notification
export async function schedulePushNotification(
  title: string,
  body: string,
  data?: any
) {
  if (Platform.OS === 'web') {
    console.log('Cannot schedule notifications on web');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

// Schedule a daily notification
export async function scheduleDailyNotification(
  title: string,
  body: string,
  hour: number,
  minute: number
) {
  if (Platform.OS === 'web') {
    console.log('Cannot schedule notifications on web');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'daily' },
      sound: 'default',
    },
    trigger: {
      type: 'daily',
      hour,
      minute,
      repeats: true,
    },
  });
}

// Check notification permission
export async function checkNotificationPermission(): Promise<boolean | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return null;
  }
}

// Check if platform is mobile
export function isMobilePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

// Setup notification handlers (for use in RootLayout)
export function setupNotificationHandlers() {
  if (Platform.OS === 'web') {
    console.log('Notification handlers not supported on web');
    return () => {};
  }

  // Handle notifications received while app is foregrounded
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Listen to notifications received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Listen to user tapping on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    handleNotificationTap(data);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}