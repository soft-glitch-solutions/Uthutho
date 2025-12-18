// components/journey/hooks/useLocationUpdates.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export function useLocationUpdates(
  participantStatus: 'waiting' | 'picked_up' | 'arrived',
  activeJourneyId?: string,
  currentUserId?: string
) {
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Check location permission
  const checkLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      console.log('Location permission status:', status);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationError('Failed to check location permission');
    }
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to update your position while you are picked up.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // You might want to use Linking.openSettings() here
              console.log('Open location settings');
            }}
          ]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Failed to request location permission');
      return false;
    }
  }, []);

  // Update location to Supabase
  const updateLocationInDatabase = useCallback(async (latitude: number, longitude: number) => {
    if (!activeJourneyId || !currentUserId) {
      console.log('Missing journeyId or userId for location update');
      return false;
    }

    try {
      console.log('Updating location in database:', {
        lat: latitude,
        lng: longitude,
        journeyId: activeJourneyId,
        userId: currentUserId
      });
      
      const { error } = await supabase
        .from('journey_participants')
        .update({
          latitude: latitude,
          longitude: longitude,
          last_location_update: new Date().toISOString()
        })
        .eq('journey_id', activeJourneyId)
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating location in database:', error);
        throw error;
      }

      console.log('Location updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update location in database:', error);
      throw error;
    }
  }, [activeJourneyId, currentUserId]);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    try {
      setIsUpdatingLocation(true);
      setLocationError(null);
      
      console.log('Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Minimum time interval between updates (ms)
      });
      
      console.log('Location obtained:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy
      });
      
      setIsUpdatingLocation(false);
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      setIsUpdatingLocation(false);
      setLocationError('Failed to get current location');
      
      // Check if error is due to permission
      if (error instanceof Error && error.message.includes('permission')) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert(
            'Location Error',
            'Location permission is required to update your position.',
            [{ text: 'OK' }]
          );
        }
      }
      
      return null;
    }
  }, [requestLocationPermission]);

  // Update location with retry logic
  const updateLocationWithRetry = useCallback(async (retryCount = 0): Promise<boolean> => {
    const maxRetries = 2;
    
    try {
      // Check permission first
      if (!locationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          console.log('Location permission not granted');
          return false;
        }
      }

      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        console.log('Failed to get location');
        return false;
      }

      // Update in database
      await updateLocationInDatabase(location.latitude, location.longitude);
      return true;
      
    } catch (error) {
      console.error('Location update failed:', error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying location update (${retryCount + 1}/${maxRetries})...`);
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return updateLocationWithRetry(retryCount + 1);
      }
      
      return false;
    }
  }, [locationPermission, requestLocationPermission, getCurrentLocation, updateLocationInDatabase]);

  // Periodic location updates for picked_up users
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isUpdating = false;

    const startPeriodicUpdates = async () => {
      if (participantStatus === 'picked_up' && activeJourneyId && currentUserId) {
        console.log('Starting periodic location updates for user:', currentUserId);
        
        // First update immediately
        try {
          if (!isUpdating) {
            isUpdating = true;
            await updateLocationWithRetry();
            isUpdating = false;
          }
        } catch (error) {
          console.error('Initial location update failed:', error);
          isUpdating = false;
        }

        // Then set up interval for periodic updates (every 30 seconds)
        intervalId = setInterval(async () => {
          if (!isUpdating) {
            try {
              isUpdating = true;
              console.log('Periodic location update...');
              await updateLocationWithRetry();
            } catch (error) {
              console.error('Periodic location update failed:', error);
            } finally {
              isUpdating = false;
            }
          }
        }, 30000); // 30 seconds
      }
    };

    const stopPeriodicUpdates = () => {
      if (intervalId) {
        console.log('Stopping periodic location updates');
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPeriodicUpdates();

    return () => {
      stopPeriodicUpdates();
    };
  }, [participantStatus, activeJourneyId, currentUserId, updateLocationWithRetry]);

  // Clean up location updates when status changes away from picked_up
  useEffect(() => {
    if (participantStatus !== 'picked_up' && activeJourneyId && currentUserId) {
      console.log('Clearing location data for non-picked_up status');
      
      // Clear location data from database when user is no longer picked_up
      const clearLocationData = async () => {
        try {
          const { error } = await supabase
            .from('journey_participants')
            .update({
              latitude: null,
              longitude: null,
              last_location_update: null
            })
            .eq('journey_id', activeJourneyId)
            .eq('user_id', currentUserId)
            .eq('is_active', true);

          if (error) {
            console.error('Error clearing location data:', error);
          }
        } catch (error) {
          console.error('Failed to clear location data:', error);
        }
      };

      clearLocationData();
    }
  }, [participantStatus, activeJourneyId, currentUserId]);

  return {
    // State
    locationPermission,
    setLocationPermission,
    isUpdatingLocation,
    locationError,
    
    // Functions
    checkLocationPermission,
    requestLocationPermission,
    updateLocationInDatabase,
    getCurrentLocation,
    updateLocationWithRetry,
  };
}