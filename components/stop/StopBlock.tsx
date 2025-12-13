import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
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
    primary: string;
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
  const [hasActiveJourney, setHasActiveJourney] = useState(false);
  const [isCheckingJourney, setIsCheckingJourney] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  
  // Shimmer animation ref
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          setLocationLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Check for active journey participation
  useEffect(() => {
    checkActiveJourneyParticipation();
  }, []);

  const checkActiveJourneyParticipation = async () => {
    try {
      setIsCheckingJourney(true);
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      
      if (!userId) {
        setHasActiveJourney(false);
        setIsCheckingJourney(false);
        return;
      }

      // Check if user is an active participant in any in-progress journey
      const { data, error } = await supabase
        .from('journey_participants')
        .select(`
          id,
          journeys!inner(
            id,
            status,
            last_ping_time
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('journeys.status', 'in_progress')
        .gte('journeys.last_ping_time', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
        .maybeSingle();

      if (error) {
        console.error('Error checking active journey participation:', error);
        setHasActiveJourney(false);
      } else {
        setHasActiveJourney(!!data);
      }
    } catch (error) {
      console.error('Error checking journey participation:', error);
      setHasActiveJourney(false);
    } finally {
      setIsCheckingJourney(false);
    }
  };

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
    // Don't allow marking as waiting if user is participating in an active journey
    if (hasActiveJourney) {
      Alert.alert(
        "Active Journey",
        "You are currently participating in an active journey. Complete your current journey before starting a new one.",
        [{ text: "OK" }]
      );
      return;
    }
    setShowDrawer(true);
  };

  const handleWaitingSet = async (routeId: string, transportType: string) => {
    // Double check before setting waiting status
    if (hasActiveJourney) {
      Alert.alert(
        "Active Journey",
        "You are currently participating in an active journey. Complete your current journey before starting a new one.",
        [{ text: "OK" }]
      );
      return;
    }

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

  // Show skeleton loading state while checking location or journey status
  if (locationLoading || isCheckingJourney) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletonContainer, { opacity: 0.8 }]}>
          <View style={[styles.skeletonButton, { backgroundColor: colors.primary }]}>
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.text, width: 100 }]} />
            </View>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: colors.text,
                  opacity: shimmerOpacity,
                  transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }],
                },
              ]}
            />
          </View>
          <View style={styles.skeletonHint}>
            <View style={[styles.skeletonHintLine, { backgroundColor: colors.text, width: '60%' }]} />
          </View>
        </View>
      </View>
    );
  }

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
          {/* Only show waiting button if user is not participating in an active journey */}
          {!hasActiveJourney && (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#10b981' }]}
                onPress={handleMarkAsWaiting}
              >
                <Hand size={20} color="white" />
                <Text style={styles.buttonText}>Waiting</Text>
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
          
          {hasActiveJourney && !isWaiting && (
            <View style={[styles.activeJourneyNote, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.activeJourneyText, { color: colors.text }]}>
                You're currently on an active journey
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  skeletonContainer: {
    gap: 8,
  },
  skeletonButton: {
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.7,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonHint: {
    alignItems: 'center',
  },
  skeletonHintLine: {
    height: 12,
    borderRadius: 4,
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  activeJourneyNote: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeJourneyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default StopBlock;