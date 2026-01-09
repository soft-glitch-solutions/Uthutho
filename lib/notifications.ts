import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  // Web doesn't support push notifications via Expo Notifications
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1ea2b1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push token:', token);
  } else {
    console.log('Must use physical device for push notifications');
  }

  return token;
}

export function setupNotificationHandlers() {
  // Don't set up handlers on web
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
    // Handle navigation based on notification data
    const data = response.notification.request.content.data;
    console.log('Notification data:', data);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

export async function schedulePushNotification(title: string, body: string, data?: any) {
  // Don't schedule on web
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
      color: '#1ea2b1',
    },
    trigger: null, // Send immediately
  });
}

export async function scheduleDailyNotification(title: string, body: string, hour: number, minute: number) {
  // Don't schedule on web
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

export async function checkNotificationPermission(): Promise<boolean | null> {
  // Web doesn't support Expo Notifications permission check
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

export function isMobilePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}