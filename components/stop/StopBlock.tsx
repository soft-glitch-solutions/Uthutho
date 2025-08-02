import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';
import { useWaiting } from '../../context/WaitingContext';
import { Square, Hand } from 'lucide-react-native';

const StopBlock = ({ stopId, stopName, stopLocation, colors, radius = 0.5 }) => {
  const {
    waitingStatus,
    setWaitingStatus,
    countdown,
    setCountdown,
    autoDeleteCountdown,
    setAutoDeleteCountdown,
  } = useWaiting();

  const [isClose, setIsClose] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState(['A1', 'B3', 'C5']);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  useEffect(() => {
    if (userLocation && stopLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        stopLocation.latitude,
        stopLocation.longitude
      );
      setIsClose(distance <= radius);
    }
  }, [userLocation, stopLocation, radius]);

  const checkIfUserIsWaiting = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('stop_waiting')
      .select('created_at')
      .eq('stop_id', stopId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking waiting status:', error);
      Alert.alert('Error', 'Failed to check waiting status.');
    } else if (data) {
      setWaitingStatus({ stopId, createdAt: data.created_at });
      startAutoDeleteTimer(data.created_at);
    }
  };

  const handleRouteSelect = async (routeName) => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('stop_waiting')
      .insert({
        stop_id: stopId,
        user_id: userId,
        transport_type: 'bus',
        route: routeName,
      })
      .select('created_at')
      .single();

    if (error) {
      console.error('Error marking as waiting:', error);
      Alert.alert('Error', 'Failed to mark as waiting.');
    } else {
      setWaitingStatus({ stopId, createdAt: data.created_at });
      startAutoDeleteTimer(data.created_at);
      setShowRouteSelector(false);
      Alert.alert('Marked', `You are now marked as waiting for route ${routeName}.`);
    }
  };

  const startAutoDeleteTimer = (createdAt) => {
    const creationTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = (currentTime - creationTime) / 1000;
    const remainingTime = 300 - elapsedTime;

    if (remainingTime > 0) {
      setAutoDeleteCountdown(Math.floor(remainingTime));

      const timer = setTimeout(() => {
        deleteWaitingStatus();
      }, remainingTime * 1000);

      const countdownInterval = setInterval(() => {
        setAutoDeleteCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else {
      deleteWaitingStatus();
    }
  };

  const handlePickedUp = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    let timer = 5;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
      timer -= 1;

      if (timer === 0) {
        clearInterval(interval);
        deleteWaitingStatus();
      }
    }, 1000);
  };

  const deleteWaitingStatus = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { error } = await supabase
      .from('stop_waiting')
      .delete()
      .eq('stop_id', stopId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting waiting:', error);
      Alert.alert('Error', 'Failed to mark as picked up.');
    } else {
      setWaitingStatus(null);
      setCountdown(5);
      setAutoDeleteCountdown(300);
      Alert.alert('Success', 'You have been marked as picked up.');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!isClose) return null;

  const isWaiting = waitingStatus?.stopId === stopId;

  return (
    <View style={styles.container}>
      {isWaiting && (
        <Text style={[styles.countdownText, { color: colors.text }]}>Stop will be removed in {formatCountdown(autoDeleteCountdown)}</Text>
      )}
      {isWaiting ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ef4444' }]}
          onPress={handlePickedUp}
        >
          <Square size={20} color="white" />
          <Text style={styles.buttonText}>Picked Up ({countdown}s)</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10b981' }]}
          onPress={() => setShowRouteSelector(true)}
        >
          <Hand size={20} color="white" />
          <Text style={styles.buttonText}>Mark as Waiting</Text>
        </TouchableOpacity>
      )}

      {showRouteSelector && (
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={() => setShowRouteSelector(false)}
        >
          <TouchableOpacity
            style={styles.overlayDrawer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.overlayTitle}>Select Your Route</Text>
            {availableRoutes.map((route) => (
              <TouchableOpacity
                key={route}
                style={styles.routeButton}
                onPress={() => handleRouteSelect(route)}
              >
                <Text style={styles.routeButtonText}>{route}</Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  countdownText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  overlayDrawer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  routeButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
  },
  routeButtonText: {
    fontSize: 16,
    color: '#111827',
  },
});

export default StopBlock;
