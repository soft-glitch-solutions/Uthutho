import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated } from 'react-native';
import { X, Clock, DollarSign, MapPin, Users, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Route {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
}

interface WaitingDrawerProps {
  visible: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
  onWaitingSet: () => void;
}

export default function WaitingDrawer({ 
  visible, 
  onClose, 
  stopId, 
  stopName, 
  onWaitingSet 
}: WaitingDrawerProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRoutesForStop();
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
    // Get routes that have this stop
    const { data: routesData, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('stop_id', stopId);

    if (routesError || !routesData || routesData.length === 0) {
      // If no routes found, check if stop exists in stops table
      const { data: stopData } = await supabase
        .from('stops')
        .select('route_id')
        .eq('id', stopId)
        .single();

      if (stopData?.route_id) {
        // Get the route this stop belongs to
        const { data: routeData } = await supabase
          .from('routes')
          .select('*')
          .eq('id', stopData.route_id);
        
        setRoutes(routeData || []);
      } else {
        setRoutes([]);
      }
    } else {
      setRoutes(routesData);
    }
  } catch (error) {
    console.error('Error loading routes for stop:', error);
    setRoutes([]);
  }
  setLoading(false);
};

  const startCountdown = (route: Route) => {
    setSelectedRoute(route);
    setCountdown(5);
    setIsCountingDown(true);
  };

  const completeWaiting = async () => {
    if (!selectedRoute) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('stop_waiting')
        .insert([{
          stop_id: stopId,
          user_id: user.id,
          transport_type: selectedRoute.transport_type,
          route_id: selectedRoute.id,
        }]);

      if (!error) {
        // Award 2 points for marking as waiting
        await awardPoints(2);
        onWaitingSet();
        onClose();
      }
    } catch (error) {
      console.error('Error marking as waiting:', error);
    }
    
    setIsCountingDown(false);
    setSelectedRoute(null);
    setCountdown(0);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
              <TouchableOpacity
                style={styles.routeCard}
                onPress={() => startCountdown({
                  id: 'default',
                  name: 'No Route Available',
                  transport_type: 'Unknown',
                  cost: 0,
                  start_point: 'Unknown',
                  end_point: 'Unknown'
                })}
                disabled={isCountingDown}
              >
                <View style={styles.routeHeader}>
                  <View style={styles.transportBadge}>
                    <Text style={styles.transportType}>Unknown</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <DollarSign size={16} color="#666666" />
                    <Text style={[styles.price, { color: '#666666' }]}>R 0</Text>
                  </View>
                </View>
                
                <Text style={styles.routeName}>No Route Available</Text>
                <Text style={styles.routeDestination}>
                  No transport routes found for this stop
                </Text>
                
                <View style={styles.routeFooter}>
                  <View style={styles.waitingInfo}>
                    <Users size={16} color="#666666" />
                    <Text style={styles.waitingCount}>0 waiting</Text>
                  </View>
                  <View style={styles.estimatedTime}>
                    <Clock size={16} color="#666666" />
                    <Text style={styles.timeText}>Unknown</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              routes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeCard}
                  onPress={() => startCountdown(route)}
                  disabled={isCountingDown}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.transportBadge}>
                      <Text style={styles.transportType}>{route.transport_type}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <DollarSign size={16} color="#1ea2b1" />
                      <Text style={styles.price}>R {route.cost}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDestination}>
                    {route.start_point} → {route.end_point}
                  </Text>
                  
                  <View style={styles.routeFooter}>
                    <View style={styles.waitingInfo}>
                      <Users size={16} color="#666666" />
                      <Text style={styles.waitingCount}>
                        {Math.floor(Math.random() * 8)} waiting
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
              ))
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
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