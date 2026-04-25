import { supabase } from '@/lib/supabase';

/**
 * Service to handle dispatching push notifications via Expo API
 */

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotificationByUserId(
  userId: string,
  notificationContent: PushNotificationData
) {
  try {
    console.log(`Fetching push token for User ID: ${userId}`);

    // Retrieve the user's latest push token from our Supabase table
    const { data: tokenData, error } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching push token:', error);
      return false;
    }

    if (!tokenData || !tokenData.expo_push_token) {
      console.warn(`No push token associated with user: ${userId}`);
      return false;
    }

    const expoPushToken = tokenData.expo_push_token;
    console.log(`Push token found: ${expoPushToken}`);

    // Call the Expo Push API
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notificationContent.title,
      body: notificationContent.body,
      data: notificationContent.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const body = await response.json();
    console.log('Expo Push API Response:', body);

    return true;
  } catch (error) {
    console.error('Exception while sending push notification:', error);
    return false;
  }
}
