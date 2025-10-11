import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, Animated, Image } from 'react-native';
import { X, Clock, Users, CircleCheck as CheckCircle, Search, UserPlus } from 'lucide-react-native';
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
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'searching' | 'joining' | 'creating'>('searching');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDriver, setIsDriver] = useState(false);
  const { createOrJoinJourney } = useJourney();

  // Animation values for radar effect
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      loadRoutesForStop();
      loadWaitingCounts();
      loadUserProfile();
      checkIfDriver();
      
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
    if (isSearching) {
      startRadarAnimation();
    } else {
      stopRadarAnimation();
    }
  }, [isSearching]);

  const checkIfDriver = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, is_verified, is_active')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      setIsDriver(!!driverData);
    } catch (error) {
      console.error('Error checking driver status:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const startRadarAnimation = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Scale animation for profile picture
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRadarAnimation = () => {
    pulseAnim.stopAnimation();
    rotateAnim.stopAnimation();
    scaleAnim.stopAnimation();
    pulseAnim.setValue(0);
    rotateAnim.setValue(0);
    scaleAnim.setValue(1);
  };

  const loadRoutesForStop = async () => {
    setLoading(true);
    try {
      // Query using junction table approach
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

      // Fallback if no routes found
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
          const routeId = item.route_id || 'unknown';
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

  const startSearching = (route: Route) => {
    setSelectedRoute(route);
    setIsSearching(true);
    setSearchPhase('searching');
    
    // If user is a driver, they can create driver journey immediately
    if (isDriver) {
      createDriverJourney(route);
    } else {
      // For passengers, first try to find existing journeys to join
      searchForExistingJourney(route);
    }
  };

  const searchForExistingJourney = async (route: Route) => {
    try {
      // Look for existing active journeys with participants
      const { data: existingJourneys, error } = await supabase
        .from('journeys')
        .select(`
          id, 
          created_at, 
          status, 
          last_ping_time,
          journey_participants!inner(user_id, joined_at)
        `)
        .eq('route_id', route.id)
        .eq('status', 'in_progress')
        .eq('journey_participants.is_active', true)
        .gte('last_ping_time', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error searching for existing journeys:', error);
        setTimeout(() => {
          createNewJourney(route);
        }, 2000);
        return;
      }

      if (existingJourneys && existingJourneys.length > 0) {
        const journey = existingJourneys[0];
        setSearchPhase('joining');
        setTimeout(() => {
          joinExistingJourney(journey.id, route);
        }, 1500);
      } else {
        setTimeout(() => {
          createNewJourney(route);
        }, 3000);
      }
    } catch (error) {
      console.error('Error in searchForExistingJourney:', error);
      setTimeout(() => {
        createNewJourney(route);
      }, 2000);
    }
  };

  const joinExistingJourney = async (journeyId: string, route: Route) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use createOrJoinJourney instead of manual participant insertion
      const result = await createOrJoinJourney(
        stopId,
        route.id,
        route.transport_type
      );

      if (result.success) {
        await awardPoints(1);
        router.replace('/journey');
        onWaitingSet();
        setIsSearching(false);
        setSelectedRoute(null);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error joining existing journey:', error);
      createNewJourney(route);
    }
  };

  const createNewJourney = async (route: Route) => {
    setSearchPhase('creating');
    
    try {
      const result = await createOrJoinJourney(
        stopId,
        route.id,
        route.transport_type
      );

      if (result.success) {
        // If user is a driver, create driver journey entry
        if (isDriver) {
          await createDriverJourneyEntry(route, result.journeyId);
        }
        
        await awardPoints(2);
        router.replace('/journey');
        onWaitingSet();
      } else {
        Alert.alert('Error', result.error || 'Failed to create journey');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
      Alert.alert('Error', 'Failed to create journey. Please try again.');
    }
    
    setIsSearching(false);
    setSelectedRoute(null);
    onClose();
  };

  const createDriverJourney = async (route: Route) => {
    setSearchPhase('creating');
    
    try {
      const result = await createOrJoinJourney(
        stopId,
        route.id,
        route.transport_type
      );

      if (result.success) {
        await createDriverJourneyEntry(route, result.journeyId);
        await awardPoints(2);
        router.replace('/journey');
        onWaitingSet();
      } else {
        Alert.alert('Error', result.error || 'Failed to create driver journey');
      }
    } catch (error) {
      console.error('Error creating driver journey:', error);
      Alert.alert('Error', 'Failed to create driver journey. Please try again.');
    }
    
    setIsSearching(false);
    setSelectedRoute(null);
    onClose();
  };

  const createDriverJourneyEntry = async (route: Route, journeyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get driver record
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .eq('is_active', true)
        .single();

      if (driverError || !driverData) {
        console.error('Driver not found or not verified');
        return;
      }

      // Get the first stop for this route
      const { data: firstStop, error: stopError } = await supabase
        .from('stops')
        .select('id')
        .eq('route_id', route.id)
        .order('order_number', { ascending: true })
        .limit(1)
        .single();

      if (stopError) {
        console.error('Error getting first stop:', stopError);
      }

      // Create driver_journey entry
      const { error: createError } = await supabase
        .from('driver_journeys')
        .insert({
          driver_id: driverData.id,
          journey_id: journeyId,
          route_id: route.id,
          current_stop_id: firstStop?.id || null,
          status: 'active'
        });

      if (createError) {
        console.error('Error creating driver journey entry:', createError);
        throw createError;
      }

      console.log('Driver journey entry created successfully');
    } catch (error) {
      console.error('Error in createDriverJourneyEntry:', error);
      throw error;
    }
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

  const cancelSearching = () => {
    setIsSearching(false);
    setSelectedRoute(null);
  };

  const renderRadarAnimation = () => {
    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2],
    });

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.radarContainer}>
        {/* Outer radar rings */}
        <Animated.View
          style={[
            styles.radarRing,
            {
              opacity: pulseOpacity,
              transform: [
                { scale: pulseScale },
                { rotate: rotation }
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarRing,
            styles.radarRing2,
            {
              opacity: pulseOpacity,
              transform: [
                { scale: pulseScale },
                { rotate: rotation }
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarRing,
            styles.radarRing3,
            {
              opacity: pulseOpacity,
              transform: [
                { scale: pulseScale },
                { rotate: rotation }
              ],
            },
          ]}
        />
        
        {/* Center profile picture */}
        <Animated.View
          style={[
            styles.profileContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={{
              uri: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
            }}
            style={styles.profileImage}
          />
        </Animated.View>

        {/* Driver badge if user is a driver */}
        {isDriver && (
          <View style={styles.driverBadge}>
            <Text style={styles.driverBadgeText}>🚗 Driver</Text>
          </View>
        )}

        {/* Search icon overlay */}
        <View style={styles.searchIconContainer}>
          {searchPhase === 'joining' ? (
            <UserPlus size={20} color="#4ade80" />
          ) : (
            <Search size={20} color="#1ea2b1" />
          )}
        </View>
      </View>
    );
  };

  const getSearchPhaseText = () => {
    switch (searchPhase) {
      case 'searching':
        return isDriver 
          ? `Starting as driver for ${selectedRoute?.name} at ${stopName}`
          : `Looking for existing journeys for ${selectedRoute?.name} at ${stopName}`;
      case 'joining':
        return `Found an existing journey! Joining now for ${selectedRoute?.name} at ${stopName}`;
      case 'creating':
        return `Creating a new journey for ${selectedRoute?.name} at ${stopName}`;
      default:
        return `Select which transport you're waiting for at ${stopName}`;
    }
  };

  const getSearchingText = () => {
    switch (searchPhase) {
      case 'searching':
        return isDriver 
          ? 'Setting up your driver journey...'
          : 'Looking for other travelers to join...';
      case 'joining':
        return 'Joining existing journey...';
      case 'creating':
        return 'Setting up your journey...';
      default:
        return 'Searching...';
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
        <View style={styles.drawer}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isSearching 
                  ? (searchPhase === 'searching' 
                      ? (isDriver ? 'Starting as Driver...' : 'Searching for Journey...')
                      : searchPhase === 'joining'
                      ? 'Joining Journey...'
                      : 'Creating New Journey...'
                    )
                  : 'Mark as Waiting'
                }
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={[
              styles.subtitle,
              searchPhase === 'joining' && styles.joiningSubtitle
            ]}>
              {isSearching ? getSearchPhaseText() : `Select which transport you're waiting for at ${stopName}`}
            </Text>
            {!isSearching && getTotalWaitingCount() > 0 && (
              <View style={styles.totalWaitingContainer}>
                <Users size={16} color="#1ea2b1" />
                <Text style={styles.totalWaitingText}>
                  {getTotalWaitingCount()} {getTotalWaitingCount() === 1 ? 'person is' : 'people are'} waiting at this stop
                </Text>
              </View>
            )}
            {isDriver && !isSearching && (
              <View style={styles.driverIndicator}>
                <Text style={styles.driverIndicatorText}>
                  🚗 You are registered as a driver
                </Text>
              </View>
            )}
          </View>

          {isSearching && (
            <View style={[
              styles.searchingContainer,
              searchPhase === 'joining' && styles.joiningContainer
            ]}>
              {renderRadarAnimation()}
              <Text style={[
                styles.searchingText,
                searchPhase === 'joining' && styles.joiningText
              ]}>
                {getSearchingText()}
              </Text>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelSearching}>
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
                      selectedRoute?.id === route.id && isSearching && styles.selectedRouteCard,
                      waitingCount > 0 && styles.routeWithWaiters,
                      isDriver && styles.driverRouteCard
                  ]}
                  onPress={() => startSearching(route)}
                  disabled={isSearching}
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

                  {isDriver && (
                    <View style={styles.driverRouteBadge}>
                      <Text style={styles.driverRouteBadgeText}>Drive This Route</Text>
                    </View>
                  )}

                  {selectedRoute?.id === route.id && isSearching && (
                    <View style={styles.selectedOverlay}>
                      <CheckCircle size={24} color={
                        searchPhase === 'joining' ? '#4ade80' : 
                        searchPhase === 'creating' ? '#fbbf24' : '#1ea2b1'
                      } />
                      <Text style={styles.selectedText}>
                        {searchPhase === 'joining' ? 'Joining...' : 
                         searchPhase === 'creating' ? 'Creating...' : 'Searching...'}
                      </Text>
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
  joiningSubtitle: {
    color: '#4ade80',
    fontWeight: '600',
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
  driverIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2420',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  driverIndicatorText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  joiningContainer: {
    backgroundColor: '#4ade8010',
    borderBottomColor: '#4ade80',
  },
  radarContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  radarRing2: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  radarRing3: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1ea2b1',
    backgroundColor: '#1a1a1a',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  driverBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  driverBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  searchingText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  joiningText: {
    color: '#4ade80',
  },
  routeWithWaiters: {
    borderColor: '#1ea2b1',
    borderWidth: 2,
  },
  driverRouteCard: {
    borderLeftColor: '#fbbf24',
    borderLeftWidth: 4,
  },
  waitingCountActive: {
    color: '#1ea2b1',
    fontWeight: '600',
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
  driverRouteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fbbf2420',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  driverRouteBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '600',
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