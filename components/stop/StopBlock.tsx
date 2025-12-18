import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { useWaiting } from '@/context/WaitingContext';
import { Square, Hand, X, AlertTriangle, Trash2, Bug } from "lucide-react-native";
import WaitingDrawer from '@/components/WaitingDrawer';
import { useJourney } from '@/hook/useJourney';
import { getCurrentLocation, isWithinRadius } from '@/utils/location';
import SimpleDebugPanel from '@/components/debug/SimpleDebugPanel';

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
  // Debug props (optional)
  debugMode?: boolean;
  onDebugWaitingDrawerRequest?: () => void;
}

const StopBlock = ({ 
  stopId, 
  stopName, 
  stopLocation, 
  colors, 
  radius = 0.5,
  debugMode = false,
  onDebugWaitingDrawerRequest 
}: StopBlockProps) => {
  const {
    waitingStatus,
    setWaitingStatus,
    countdown,
    setCountdown,
    autoDeleteCountdown,
    setAutoDeleteCountdown,
  } = useWaiting();

  const [isClose, setIsClose] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hasActiveJourney, setHasActiveJourney] = useState(false);
  const [isCheckingJourney, setIsCheckingJourney] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [journeyToCancel, setJourneyToCancel] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Debug state
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [debugWaitingDrawerVisible, setDebugWaitingDrawerVisible] = useState(false);
  const [debugWelcomeVisible, setDebugWelcomeVisible] = useState(false);
  
  const { activeJourney, loading: journeyLoading, refreshActiveJourney } = useJourney();
  
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoDeleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const animation = Animated.loop(
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
    );
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  // Get user location only once
  useEffect(() => {
    let mounted = true;
    
    const checkLocation = async () => {
      if (!mounted) return;
      
      setLocationLoading(true);
      try {
        const location = await getCurrentLocation();
        if (mounted && location) {
          const close = isWithinRadius(
            location.latitude,
            location.longitude,
            stopLocation.latitude,
            stopLocation.longitude,
            radius
          );
          setIsClose(close);
        }
      } catch (error) {
        console.error('Error checking location:', error);
      } finally {
        if (mounted) {
          setLocationLoading(false);
        }
      }
    };

    checkLocation();
    
    // Check location periodically instead of watching
    const locationInterval = setInterval(checkLocation, 30000);
    
    return () => {
      mounted = false;
      clearInterval(locationInterval);
    };
  }, [stopLocation, radius]);

  useEffect(() => {
    if (!journeyLoading) {
      const hasJourney = !!activeJourney;
      setHasActiveJourney(hasJourney);
      setIsCheckingJourney(false);
      if (hasJourney) {
        setJourneyToCancel(activeJourney);
      }
    }
  }, [journeyLoading, activeJourney]);

  const checkActiveJourneyParticipation = useCallback(async () => {
    try {
      setIsCheckingJourney(true);
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      
      if (!userId) {
        setHasActiveJourney(false);
        setIsCheckingJourney(false);
        return;
      }

      if (!activeJourney) {
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
          .gte('journeys.last_ping_time', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .maybeSingle();

        if (error) {
          console.error('Error checking active journey participation:', error);
        } else if (data) {
          setHasActiveJourney(true);
          setJourneyToCancel(data.journeys);
        }
      }
    } catch (error) {
      console.error('Error checking journey participation:', error);
    } finally {
      setIsCheckingJourney(false);
    }
  }, [activeJourney]);

  useEffect(() => {
    checkActiveJourneyParticipation();
    
    checkIntervalRef.current = setInterval(() => {
      checkActiveJourneyParticipation();
    }, 30000);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [checkActiveJourneyParticipation]);

  useEffect(() => {
    return () => {
      // Clean up all intervals and timers
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (autoDeleteTimerRef.current) {
        clearTimeout(autoDeleteTimerRef.current);
        autoDeleteTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  const handleMarkAsWaiting = useCallback(() => {
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
  }, [hasActiveJourney]);

  const handleCancelJourney = useCallback(async () => {
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

      const { error: waitingError } = await supabase
        .from('stop_waiting')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyToCancel.id);

      if (waitingError) {
        console.error('Error removing from stop_waiting:', waitingError);
      }

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

      const { data: remainingParticipants, error: checkError } = await supabase
        .from('journey_participants')
        .select('id')
        .eq('journey_id', journeyToCancel.id)
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking remaining participants:', checkError);
      }

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

      const { error: completedDeleteError } = await supabase
        .from('completed_journeys')
        .delete()
        .eq('user_id', userId)
        .eq('journey_id', journeyToCancel.id);

      if (completedDeleteError && completedDeleteError.code !== 'PGRST116') {
        console.error('Error deleting from completed_journeys:', completedDeleteError);
      }

      if (refreshActiveJourney) {
        await refreshActiveJourney();
      }

      setHasActiveJourney(false);
      setJourneyToCancel(null);
      setShowCancelModal(false);
      

      setTimeout(() => {
        checkActiveJourneyParticipation();
      }, 500);

    } catch (error) {
      console.error('Error cancelling journey:', error);
      Alert.alert('Error', 'Failed to cancel journey. Please try again.');
    } finally {
      setCancelling(false);
    }
  }, [journeyToCancel, refreshActiveJourney, checkActiveJourneyParticipation]);

  const handleWaitingSet = useCallback(async (routeId: string, transportType: string) => {
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
    } else {
      setWaitingStatus({ 
        stopId, 
        createdAt: data.created_at,
        routeId,
        transportType
      });
      startAutoDeleteTimer(data.created_at);
    }
  }, [hasActiveJourney, checkActiveJourneyParticipation, stopId, setWaitingStatus]);

  const startAutoDeleteTimer = useCallback((createdAt: string) => {
    if (autoDeleteTimerRef.current) {
      clearTimeout(autoDeleteTimerRef.current);
      autoDeleteTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const creationTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = (currentTime - creationTime) / 1000;
    const remainingTime = 300 - elapsedTime;

    if (remainingTime > 0) {
      setAutoDeleteCountdown(Math.floor(remainingTime));
      autoDeleteTimerRef.current = setTimeout(() => {
        deleteWaitingStatus();
      }, remainingTime * 1000);

      countdownIntervalRef.current = setInterval(() => {
        setAutoDeleteCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      deleteWaitingStatus();
    }
  }, [setAutoDeleteCountdown]);

  const deleteWaitingStatus = useCallback(async () => {
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
  }, [stopId, setWaitingStatus, setCountdown, setAutoDeleteCountdown]);

  const handlePickedUp = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    let timer = 5;
    setCountdown(timer);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
      timer -= 1;
      if (timer === 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        deleteWaitingStatus();
      }
    }, 1000);
  }, [setCountdown, deleteWaitingStatus]);

  const formatCountdown = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  // Debug functions
  const handleShowDebugPanel = useCallback(() => {
    if (debugMode && onDebugWaitingDrawerRequest) {
      onDebugWaitingDrawerRequest();
    } else {
      setDebugPanelVisible(true);
    }
  }, [debugMode, onDebugWaitingDrawerRequest]);

  const handleShowWaitingDrawer = useCallback(() => {
    if (debugMode) {
      setDebugWaitingDrawerVisible(true);
    } else {
      setShowDrawer(true);
    }
  }, [debugMode]);

  const handleCloseWaitingDrawer = useCallback(() => {
    if (debugMode) {
      setDebugWaitingDrawerVisible(false);
    } else {
      setShowDrawer(false);
    }
  }, [debugMode]);

  const renderCancelModal = useCallback(() => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
      onRequestClose={() => !cancelling && setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.warningIcon}>
              <AlertTriangle size={32} color="#f50b0bff" />
            </View>
            <Text style={styles.modalTitle}>Cancel Journey</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => !cancelling && setShowCancelModal(false)}
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
              onPress={() => !cancelling && setShowCancelModal(false)}
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
  ), [showCancelModal, cancelling, journeyToCancel, handleCancelJourney]);

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

  if (!isClose && !debugMode) {
    return null;
  }

  const isWaiting = waitingStatus?.stopId === stopId;
  const shouldShowDrawer = showDrawer || (debugMode && debugWaitingDrawerVisible);

  return (
    <View style={styles.container}>
      {debugMode && (
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleShowDebugPanel}
        >
          <Bug size={16} color="#ffffff" />
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      )}

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
          {hasActiveJourney ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f51b0bff' }]}
              onPress={() => setShowCancelModal(true)}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.buttonText}>Cancel Journey</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#10b981' }]}
                onPress={handleShowWaitingDrawer}
              >
                <Hand size={20} color="white" />
                <Text style={styles.buttonText}>Waiting</Text>
              </TouchableOpacity>
              
              <WaitingDrawer
                visible={shouldShowDrawer}
                onClose={handleCloseWaitingDrawer}
                stopId={stopId}
                stopName={stopName}
                onWaitingSet={(routeId, transportType) => {
                  handleWaitingSet(routeId, transportType);
                  handleCloseWaitingDrawer();
                }}
              />
            </>
          )}
        </>
      )}

      {/* Debug Panel */}
      <SimpleDebugPanel
        visible={debugPanelVisible}
        onClose={() => setDebugPanelVisible(false)}
        onShowWelcomeOverlay={() => {
          setDebugWelcomeVisible(true);
          console.log('Debug: Show welcome overlay');
        }}
        onHideWelcomeOverlay={() => {
          setDebugWelcomeVisible(false);
          console.log('Debug: Hide welcome overlay');
        }}
        onShowWaitingDrawer={() => {
          setDebugPanelVisible(false);
          setTimeout(() => {
            setDebugWaitingDrawerVisible(true);
          }, 300);
        }}
      />

      {renderCancelModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    position: 'relative',
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
  // Debug button styles
  debugButton: {
    position: 'absolute',
    top: -25,
    right: 0,
    backgroundColor: '#1ea2b1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
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

export default React.memo(StopBlock);