import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        let hasLaunched: string | null = null;

        // Check if the platform is web or mobile
        if (Platform.OS === 'web') {
          // Use localStorage for web
          hasLaunched = localStorage.getItem('hasLaunched');
        } else {
          // Use AsyncStorage for mobile
          hasLaunched = await AsyncStorage.getItem('hasLaunched');
        }

        if (!hasLaunched) {
          // First-time user, redirect to onboarding
          setRedirectTo('/onboarding');

          // Set the flag for first launch
          if (Platform.OS === 'web') {
            localStorage.setItem('hasLaunched', 'true');
          } else {
            await AsyncStorage.setItem('hasLaunched', 'true');
          }
        } else {
          // Not first-time user, redirect to auth or home
          setRedirectTo('/onboarding'); // Default to auth, or you can add session check here
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setRedirectTo('/onboarding'); // Fallback to onboarding on error
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTime();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Redirect href="/onboarding" />; // Default to onboarding
}