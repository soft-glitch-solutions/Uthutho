import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { X, Clock,  Users, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useJourney } from '@/hook/useJourney';

interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
}

interface WaitingCount {
  route_id: string;
  waiting_count: number;
}

interface WaitingDrawerProps {
  visible: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
  onWaitingSet: () => void;
  closeOnOverlayTap?: boolean;
}

export default function WaitingDrawer({ 
  visible, 
  onClose, 
  stopId, 
  stopName, 
  onWaitingSet,
  closeOnOverlayTap = true
}: WaitingDrawerProps) {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const { createOrJoinJourney } = useJourney();

  useEffect(() => {
    if (visible) {
      loadRoutesForStop();
      loadWaitingCounts();
      
      // Set up real-time subscription for waiting counts
      const subscription = supabase
        .channel('stop_waiting_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stop_waiting',
            filter: `stop_id=eq.${stopId}`
          },
          () => {
            loadWaitingCounts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [visible, stopId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isCountingDown) {
      completeWaiting();
    }
    return () => clearInterval(interval);
  }, [countdown, isCountingDown]);

  const loadRoutesForStop = async () => {
    setLoading(true);
    try {
      const { data: routesData, error: routesError } = await supabase
        .from('route_stops')
        .select(`
          route:routes (
            id,
            name,
            transport_type,
            cost,
            start_point,
            end_point
          )
        `)
        .eq('stop_id', stopId);

      if (routesError) throw routesError;

      if (routesData && routesData.length > 0) {
        const formattedRoutes = routesData.map(item => item.route).filter(route => route !== null);
        setRoutes(formattedRoutes);
        return;
      }

      setRoutes([]);
    } catch (error) {
      console.error('Error loading routes for stop:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWaitingCounts = async () => {
    try {
      // Query active waiting users for this stop (not expired)
      const { data, error } = await supabase
        .from('stop_waiting')
        .select('route_id')
        .eq('stop_id', stopId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Count waiting users per route
      const counts: Record<string, number> = {};
      
      if (data) {
        data.forEach((item) => {
          const routeId = item.route_id || 'unknown'; // Handle cases where route_id might be null
          counts[routeId] = (counts[routeId] || 0) + 1;
        });
      }

      setWaitingCounts(counts);
    } catch (error) {
      console.error('Error loading waiting counts:', error);
    }
  };

  const getWaitingCountForRoute = (routeId: string) => {
    return waitingCounts[routeId] || 0;
  };

  const getTotalWaitingCount = () => {
    return Object.values(waitingCounts).reduce((sum, count) => sum + count, 0);
  };

  const startCountdown = (route: Route) => {
    setSelectedRoute(route);
    setCountdown(5);
    setIsCountingDown(true);
  };

  const completeWaiting = async () => {
    if (!selectedRoute) return;

    try {
      // First, create an entry in stop_waiting table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert waiting record
      const { error: waitingError } = await supabase
        .from('stop_waiting')
        .upsert({
          stop_id: stopId,
          user_id: user.id,
          route_id: selectedRoute.id,
          transport_type: selectedRoute.transport_type,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
        }, {
          onConflict: 'stop_id,user_id'
        });

      if (waitingError) throw waitingError;

      // Then create/join journey
      const result = await createOrJoinJourney(
        stopId,
        selectedRoute.id,
        selectedRoute.transport_type
      );

      if (result.success) {
        await awardPoints(2);
        router.replace('/journey');
        onWaitingSet();
      } else {
        // If journey creation fails, remove the waiting record
        await supabase
          .from('stop_waiting')
          .delete()
          .eq('stop_id', stopId)
          .eq('user_id', user.id);
        
        Alert.alert('Error', result.error || 'Failed to start journey');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
      Alert.alert('Error', 'Failed to start journey. Please try again.');
    }
    
    setIsCountingDown(false);
    setSelectedRoute(null);
    setCountdown(0);
    onClose();
  };

  const awardPoints = async (points: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + points })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const cancelCountdown = () => {
    setIsCountingDown(false);
    setSelectedRoute(null);
    setCountdown(0);
  };

  const handleOverlayTap = () => {
    if (closeOnOverlayTap && !isCountingDown) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {closeOnOverlayTap && (
          <TouchableOpacity 
            style={styles.overlayTapArea}
            activeOpacity={1}
            onPress={handleOverlayTap}
          />
        )}
        
        <View style={styles.drawer}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isCountingDown ? `Confirming... ${countdown}` : 'Mark as Waiting'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              {isCountingDown 
                ? `Marking you as waiting for ${selectedRoute?.name} at ${stopName}`
                : `Select which transport you're waiting for at ${stopName}`
              }
            </Text>
            {!isCountingDown && getTotalWaitingCount() > 0 && (
              <View style={styles.totalWaitingContainer}>
                <Users size={16} color="#1ea2b1" />
                <Text style={styles.totalWaitingText}>
                  {getTotalWaitingCount()} {getTotalWaitingCount() === 1 ? 'person is' : 'people are'} waiting at this stop
                </Text>
              </View>
            )}
          </View>

          {isCountingDown && (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.content}>
            {loading ? (
              <Text style={styles.loadingText}>Loading available routes...</Text>
            ) : routes.length === 0 ? (
              <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View style={styles.transportBadge}>
                    <Text style={styles.transportType}>Unknown</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: '#666666' }]}>R 0</Text>
                  </View>
                </View>
                
                <Text style={styles.routeName}>No Routes Available</Text>
                <Text style={styles.routeDestination}>
                  No transport routes found for this stop
                </Text>
              </View>
            ) : (
              routes.map((route) => {
                const waitingCount = getWaitingCountForRoute(route.id);
                return (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.routeCard,
                      selectedRoute?.id === route.id && isCountingDown && styles.selectedRouteCard,
                      waitingCount > 0 && styles.routeWithWaiters
                    ]}
                    onPress={() => startCountdown(route)}
                    disabled={isCountingDown}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.transportBadge}>
                        <Text style={styles.transportType}>{route.transport_type}</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>R {route.cost}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.routeName}>{route.name}</Text>
                    <Text style={styles.routeDestination}>
                      {route.start_point} → {route.end_point}
                    </Text>
                    
                    <View style={styles.routeFooter}>
                      <View style={styles.waitingInfo}>
                        <Users size={16} color={waitingCount > 0 ? "#1ea2b1" : "#666666"} />
                        <Text style={[
                          styles.waitingCount,
                          waitingCount > 0 && styles.waitingCountActive
                        ]}>
                          {waitingCount} {waitingCount === 1 ? 'person' : 'people'} waiting
                        </Text>
                      </View>
                      <View style={styles.estimatedTime}>
                        <Clock size={16} color="#666666" />
                        <Text style={styles.timeText}>
                          Est. {10 + Math.floor(Math.random() * 15)} min
                        </Text>
                      </View>
                    </View>

                    {selectedRoute?.id === route.id && isCountingDown && (
                      <View style={styles.selectedOverlay}>
                        <CheckCircle size={24} color="#4ade80" />
                        <Text style={styles.selectedText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333333',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  totalWaitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  totalWaitingText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 40,
  },
  routeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  selectedRouteCard: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b110',
  },
  routeWithWaiters: {
    borderColor: '#1ea2b1',
    borderWidth: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transportBadge: {
    backgroundColor: '#1ea2b120',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  transportType: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 12,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingCount: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  waitingCountActive: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ade8020',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});