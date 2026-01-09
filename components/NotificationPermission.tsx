// components/NotificationPermission.tsx
import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/hook/useAuth';

export function NotificationPermission() {
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = async () => {
    try {
      const token = await notificationService.registerForPushNotifications(user?.id);
      
      if (token) {
        setPermissionGranted(true);
        Alert.alert(
          'Success',
          'Notifications enabled! You\'ll receive important updates.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive important updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // You can use Linking.openSettings() here
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    }
  };

  if (permissionGranted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enable Notifications</Text>
      <Text style={styles.description}>
        Get important updates, reminders, and alerts about your activities.
      </Text>
      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>Enable Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setPermissionGranted(true)}>
        <Text style={styles.skipText}>Maybe Later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    margin: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});