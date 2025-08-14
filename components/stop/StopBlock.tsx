import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useWaiting } from '@/context/WaitingContext';
import { Square, Hand } from "lucide-react-native";
import WaitingDrawer from '@/components/WaitingDrawer';

interface StopBlockProps {
  stopId: string;
  stopName: string;
  stopLocation: {
    latitude: number;
    longitude: number;
  };
  colors: {
    text: string;
    background: string;
  };
  radius?: number;
}

const StopBlock = ({ stopId, stopName, stopLocation, colors, radius = 0.5 }: StopBlockProps) => {
  const {
    waitingStatus,
    setWaitingStatus,
    countdown,
    setCountdown,
    autoDeleteCountdown,
    setAutoDeleteCountdown,
  } = useWaiting();

  const [isClose, setIsClose] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  const handleMarkAsWaiting = () => {
    setShowDrawer(true);
  };

  const handleWaitingSet = async (routeId: string, transportType: string) => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('stop_waiting')
      .insert({
        stop_id: stopId,
        user_id: userId,
        route_id: routeId,
        transport_type: transportType,
      })
      .select('created_at')
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to mark as waiting.');
    } else {
      setWaitingStatus({ 
        stopId, 
        createdAt: data.created_at,
        routeId,
        transportType
      });
      startAutoDeleteTimer(data.created_at);
    }
  };

  const startAutoDeleteTimer = (createdAt: string) => {
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

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    } else {
      deleteWaitingStatus();
    }
  };

  const deleteWaitingStatus = async () => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { error } = await supabase
      .from('stop_waiting')
      .delete()
      .eq('stop_id', stopId)
      .eq('user_id', userId);

    if (!error) {
      setWaitingStatus(null);
      setCountdown(5);
      setAutoDeleteCountdown(300);
    }
  };

  const handlePickedUp = () => {
    let timer = 5;
    setCountdown(timer);
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
      timer -= 1;
      if (timer === 0) {
        clearInterval(interval);
        deleteWaitingStatus();
      }
    }, 1000);
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!isClose) {
    return null;
  }

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
          style={[styles.button, { backgroundColor: '#ef4444' }]}
          onPress={handlePickedUp}
        >
          <Square size={20} color="white" />
          <Text style={styles.buttonText}>Picked Up ({countdown}s)</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#10b981' }]}
            onPress={handleMarkAsWaiting}
          >
            <Hand size={20} color="white" />
            <Text style={styles.buttonText}>Mark as Waiting</Text>
          </TouchableOpacity>
          
          <WaitingDrawer
            visible={showDrawer}
            onClose={() => setShowDrawer(false)}
            stopId={stopId}
            stopName={stopName}
            onWaitingSet={handleWaitingSet}
          />
        </>
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
    marginLeft: 10,
  },
});

export default StopBlock;