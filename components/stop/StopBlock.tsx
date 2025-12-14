import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { useWaiting } from '@/context/WaitingContext';
import { Square, Hand, X, AlertTriangle, Trash2 } from "lucide-react-native";
import WaitingDrawer from '@/components/WaitingDrawer';
import { useJourney } from '@/hook/useJourney';

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [journeyToCancel, setJourneyToCancel] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Use the useJourney hook to get real-time active journey status
  const { activeJourney, loading: journeyLoading, refreshActiveJourney } = useJourney();
  
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

  // Check for active journey using the useJourney hook
  useEffect(() => {
    if (!journeyLoading) {
      // Update hasActiveJourney based on the activeJourney from useJourney hook
      setHasActiveJourney(!!activeJourney);
      setIsCheckingJourney(false);
    }
  }, [journeyLoading, activeJourney]);

  // Also check for journey_participants to be safe
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
            last_ping_time,
            routes!inner(
              name,
              start_point,
              end_point
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('journeys.status', 'in_progress')
        .gte('journeys.last_ping_time', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
        .maybeSingle();

      if (error) {
        console.error('Error checking active journey participation:', error);
        // Fall back to useJourney hook result
        setHasActiveJourney(!!activeJourney);
        setJourneyToCancel(activeJourney);
      } else {
        setHasActiveJourney(!!data || !!activeJourney);
        setJourneyToCancel(data?.journeys || activeJourney);
      }
    } catch (error) {
      console.error('Error checking journey participation:', error);
      setHasActiveJourney(!!activeJourney);
      setJourneyToCancel(activeJourney);
    } finally {
      setIsCheckingJourney(false);
    }
  };

  // Add a periodic check (every 5 seconds) as a fallback
  useEffect(() => {
    // Initial check
    checkActiveJourneyParticipation();
    
    // Set up interval for periodic checking
    const interval = setInterval(() => {
      checkActiveJourneyParticipation();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
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
    // Don't allow marking as waiting if user is participating in an active journey
    if (hasActiveJourney) {
      Alert.alert(
        "Active Journey",
        "You are currently participating in an active journey. Complete or cancel your current journey before starting a new one.",
        [
          { text: "OK", style: "cancel" },
          { 
            text: "Cancel Journey", 
            style: "destructive",
            onPress: () => setShowCancelModal(true)
          }
        ]
      );
      return;
    }
    setShowDrawer(true);
  };

const handleCancelJourney = async () => {
  if (!journeyToCancel) return;
  
  setCancelling(true);
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id;
    
    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    console.log('Deleting journey participant entry:', journeyToCancel.id);

    // 1. Remove user from stop_waiting
    const { error: waitingError } = await supabase
      .from('stop_waiting')
      .delete()
      .eq('user_id', userId)
      .eq('journey_id', journeyToCancel.id);

    if (waitingError) {
      console.error('Error removing from stop_waiting:', waitingError);
    }

    // 2. DELETE the journey participant entry completely (not just deactivate)
    const { error: deleteError } = await supabase
      .from('journey_participants')
      .delete()
      .eq('user_id', userId)
      .eq('journey_id', journeyToCancel.id);

    if (deleteError) {
      console.error('Error deleting journey participant:', deleteError);
    } else {
      console.log('✅ Journey participant entry deleted');
    }

    // 3. Check if there are any other active participants left
    const { data: remainingParticipants, error: checkError } = await supabase
      .from('journey_participants')
      .select('id')
      .eq('journey_id', journeyToCancel.id)
      .eq('is_active', true);

    if (checkError) {
      console.error('Error checking remaining participants:', checkError);
    }

    // 4. If no active participants left, mark journey as cancelled
    if (!remainingParticipants || remainingParticipants.length === 0) {
      console.log('No active participants left, marking journey as cancelled');
      
      const { error: updateError } = await supabase
        .from('journeys')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', journeyToCancel.id);

      if (updateError) {
        console.error('Error updating journey status:', updateError);
      } else {
        console.log('✅ Journey marked as cancelled');
      }
    }

    // 5. If user was a driver, update driver_journeys
    const { data: driverData } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .eq('is_verified', true)
      .eq('is_active', true)
      .maybeSingle();

    if (driverData && journeyToCancel.driver_id === driverData.id) {
      console.log('User is a driver, updating driver_journeys');
      
      await supabase
        .from('driver_journeys')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('driver_id', driverData.id)
        .eq('journey_id', journeyToCancel.id);
    }

    // 6. Also check and delete any completed_journeys entries for this user and journey
    const { error: completedDeleteError } = await supabase
      .from('completed_journeys')
      .delete()
      .eq('user_id', userId)
      .eq('journey_id', journeyToCancel.id);

    if (completedDeleteError && completedDeleteError.code !== 'PGRST116') {
      console.error('Error deleting from completed_journeys:', completedDeleteError);
    }

    // 7. Refresh the active journey status
    if (refreshActiveJourney) {
      await refreshActiveJourney();
    }

    // 8. Reset local state
    setHasActiveJourney(false);
    setJourneyToCancel(null);
    setShowCancelModal(false);
    
    Alert.alert(
      'Journey Cancelled',
      'Your active journey has been cancelled and removed successfully.',
      [{ text: 'OK' }]
    );

    // 9. Force re-check journey status after a short delay
    setTimeout(() => {
      checkActiveJourneyParticipation();
    }, 500);

  } catch (error) {
    console.error('Error cancelling journey:', error);
    Alert.alert('Error', 'Failed to cancel journey. Please try again.');
  } finally {
    setCancelling(false);
  }
};

  const handleWaitingSet = async (routeId: string, transportType: string) => {
    // Double check before setting waiting status
    await checkActiveJourneyParticipation();
    
    if (hasActiveJourney) {
      Alert.alert(
        "Active Journey",
        "You are currently participating in an active journey. Complete or cancel your current journey before starting a new one.",
        [
          { text: "OK", style: "cancel" },
          { 
            text: "Cancel Journey", 
            style: "destructive",
            onPress: () => setShowCancelModal(true)
          }
        ]
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

  // Cancel Journey Modal
  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.warningIcon}>
              <AlertTriangle size={32} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Cancel Journey</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              <X size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalWarning}>
              Are you sure you want to cancel your active journey?
            </Text>
            
            {journeyToCancel && (
              <View style={styles.journeyDetails}>
                <Text style={styles.detailTitle}>Journey Details:</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Route:</Text>
                  <Text style={styles.detailValue}>
                    {journeyToCancel.routes?.name || 'Unknown Route'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>From:</Text>
                  <Text style={styles.detailValue}>
                    {journeyToCancel.routes?.start_point || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>
                    {journeyToCancel.routes?.end_point || 'Unknown'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.warningBox}>
              <AlertTriangle size={20} color="#f59e0b" />
              <Text style={styles.warningText}>
                This action will remove you from the active journey. Any progress will be lost.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
              onPress={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              <Text style={styles.cancelButtonText}>Keep Journey</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, cancelling && styles.buttonDisabled]}
              onPress={handleCancelJourney}
              disabled={cancelling}
            >
              {cancelling ? (
                <Text style={styles.confirmButtonText}>Cancelling...</Text>
              ) : (
                <>
                  <Trash2 size={20} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Cancel Journey</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          {/* Show different buttons based on journey status */}
          {hasActiveJourney ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f59e0b' }]}
              onPress={() => setShowCancelModal(true)}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.buttonText}>Cancel Journey</Text>
            </TouchableOpacity>
          ) : (
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
        </>
      )}

      {renderCancelModal()}
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
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f59e0b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
    paddingTop: 16,
  },
  modalWarning: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 26,
  },
  journeyDetails: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    width: 60,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#f59e0b30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b30',
    gap: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#f59e0b',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default StopBlock;