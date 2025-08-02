import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useWaiting } from '../../context/WaitingContext'; // Import the global state
import { Square } from "lucide-react-native";

const StopBlock = ({ stopId, stopName, stopLocation, colors, radius = 0.5 }) => {
  const {
    waitingStatus,
    setWaitingStatus,
    countdown,
    setCountdown,
    autoDeleteCountdown,
    setAutoDeleteCountdown,
  } = useWaiting(); // Use the global state

  const [isClose, setIsClose] = useState(false); // Track if the user is close to the stop
  const [userLocation, setUserLocation] = useState(null); // Track the user's current location

  // Get the user's current location
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

  // Check if the user is close to the stop
  useEffect(() => {
    if (userLocation && stopLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        stopLocation.latitude,
        stopLocation.longitude
      );
      setIsClose(distance <= radius); // Check if the user is within the radius
    }
  }, [userLocation, stopLocation, radius]);

  // Check if the user is already waiting at this stop
  const checkIfUserIsWaiting = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('stop_waiting')
      .select('created_at') // Fetch the creation time
      .eq('stop_id', stopId)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Error checking waiting status:', error);
      Alert.alert('Error', 'Failed to check waiting status.');
    } else if (data) {
      setWaitingStatus({ stopId, createdAt: data.created_at }); // Update global state
      startAutoDeleteTimer(data.created_at); // Start the 5-minute timer
    }
  };

  // Handle "Mark as Waiting" button press
  const handleMarkAsWaiting = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('stop_waiting')
      .insert({
        stop_id: stopId,
        user_id: userId,
        transport_type: 'bus',
      })
      .select('created_at') // Fetch the creation time
      .single();

    if (error) {
      console.error('Error marking as waiting:', error);
      Alert.alert('Error', 'Failed to mark as waiting.');
    } else {
      setWaitingStatus({ stopId, createdAt: data.created_at }); // Update global state
      Alert.alert('Success', 'You are now marked as waiting.');
      startAutoDeleteTimer(data.created_at); // Start the 5-minute timer
    }
  };

  // Start the 5-minute auto-delete timer
  const startAutoDeleteTimer = (createdAt) => {
    const creationTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = (currentTime - creationTime) / 1000; // Elapsed time in seconds
    const remainingTime = 300 - elapsedTime; // 5 minutes in seconds

    if (remainingTime > 0) {
      setAutoDeleteCountdown(Math.floor(remainingTime)); // Set the remaining time

      const timer = setTimeout(() => {
        deleteWaitingStatus(); // Automatically delete the waiting status after 5 minutes
      }, remainingTime * 1000); // Remaining time in milliseconds

      // Start the countdown
      const countdownInterval = setInterval(() => {
        setAutoDeleteCountdown((prev) => prev - 1);
      }, 1000);

      // Clear the interval when the component unmounts
      return () => clearInterval(countdownInterval);
    } else {
      deleteWaitingStatus(); // Delete the waiting status if the time has already passed
    }
  };

  // Handle "Picked Up" button press
  const handlePickedUp = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    // Start the 5-second countdown
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

  // Delete the waiting status
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
      setWaitingStatus(null); // Clear the global state
      setCountdown(5); // Reset the countdown
      setAutoDeleteCountdown(300); // Reset the 5-minute countdown
      Alert.alert('Success', 'You have been marked as picked up.');
    }
  };

  // Calculate the distance between two coordinates (in kilometers)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Format the 5-minute countdown into minutes and seconds
  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Only render the block if the user is close to the stop
  if (!isClose) {
    return null;
  }

  // Check if the user is waiting at this stop
  const isWaiting = waitingStatus?.stopId === stopId;

  return (
    <View style={styles.container}>
      {isWaiting && (
        <Text style={[styles.countdownText, { color: colors.text }]}>
          Stop will be removed in {formatCountdown(autoDeleteCountdown)}
        </Text>
      )}
      {isWaiting ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ef4444' }]} // Red color
          onPress={handlePickedUp}
        >
          <Square size={20} color="white" />
          <Text style={styles.buttonText}>Picked Up ({countdown}s)</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10b981' }]} // Green color
          onPress={handleMarkAsWaiting}
        >
          <FontAwesome name="hand-stop-o" size={20} color="white" /> {/* Hand icon */}
          <Text style={styles.buttonText}>Mark as Waiting</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
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
    marginLeft: 10, // Space between icon and text
  },
});

export default StopBlock;