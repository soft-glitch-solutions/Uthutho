import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Alert, 
  Animated, 
  Image,
  Dimensions 
} from 'react-native';
import { Clock, Users, CircleCheck as CheckCircle, Search, UserPlus, ChevronRight, Filter, Info, HelpCircle, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useJourney } from '@/hook/useJourney';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700; // For 667px height

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

// Transport type filter options
const TRANSPORT_TYPES = [
  { id: 'all', label: 'All', icon: null },
  { id: 'minibus', label: 'Minibus', icon: require('../assets/icons/minibus-icon.png') },
  { id: 'bus', label: 'Bus', icon: require('../assets/icons/bus-icon.png') },
  { id: 'train', label: 'Train', icon: require('../assets/icons/train-icon.png') },
  { id: 'taxi', label: 'Taxi', icon: require('../assets/icons/taxi-icon.png') },
];

export default function WaitingDrawer({ 
  visible, 
  onClose, 
  stopId, 
  stopName, 
  onWaitingSet 
}: WaitingDrawerProps) {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'searching' | 'joining' | 'creating'>('searching');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'confirm'>('select');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showHelpTip, setShowHelpTip] = useState(true);
  const { createOrJoinJourney } = useJourney();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ScrollView ref for confirm step
  const confirmScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadRoutesForStop();
      loadWaitingCounts();
      loadUserProfile();
      checkIfDriver();
      setCurrentStep('select');
      setSelectedRoute(null);
      setActiveFilter('all');
      setShowHelpTip(true);
      
      // Fade in help tip after a delay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }).start();
      
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

  // Filter routes when activeFilter changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter(route => 
        route.transport_type.toLowerCase() === activeFilter
      );
      setFilteredRoutes(filtered);
    }
  }, [activeFilter, routes]);

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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

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
        setFilteredRoutes(formattedRoutes);
        return;
      }

      setRoutes([]);
      setFilteredRoutes([]);
    } catch (error) {
      console.error('Error loading routes for stop:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
      setRoutes([]);
      setFilteredRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWaitingCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('stop_waiting')
        .select('route_id')
        .eq('stop_id', stopId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

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

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setCurrentStep('confirm');
    setShowHelpTip(false);
  };

  const handleBackToSelect = () => {
    setSelectedRoute(null);
    setCurrentStep('select');
  };

  const handleConfirmWaiting = () => {
    if (!selectedRoute) return;
    
    setIsSearching(true);
    setSearchPhase('searching');
    
    if (isDriver) {
      createDriverJourney(selectedRoute);
    } else {
      searchForExistingJourney(selectedRoute);
    }
  };

  const searchForExistingJourney = async (route: Route) => {
    try {
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

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .eq('is_active', true)
        .single();

      if (!driverData) {
        console.error('Driver not found or not verified');
        return;
      }

      const { data: firstStop } = await supabase
        .from('stops')
        .select('id')
        .eq('route_id', route.id)
        .order('order_number', { ascending: true })
        .limit(1)
        .single();

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
    setCurrentStep('select');
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

        {isDriver && (
          <View style={styles.driverBadge}>
            <Text style={styles.driverBadgeText}>🚗 Driver</Text>
          </View>
        )}

        <View style={styles.searchIconContainer}>
          {searchPhase === 'joining' ? (
            <UserPlus size={16} color="#4ade80" />
          ) : (
            <Search size={16} color="#1ea2b1" />
          )}
        </View>
      </View>
    );
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'select', label: '1. Select Route', active: currentStep === 'select' && !isSearching },
      { key: 'confirm', label: '2. Confirm', active: currentStep === 'confirm' && !isSearching },
      { key: 'searching', label: '3. Searching...', active: isSearching },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              step.active && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                step.active && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              step.active && styles.stepLabelActive
            ]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHelpTip = () => {
    return (
      <Animated.View style={[styles.helpTip, { opacity: fadeAnim }]}>
        <View style={styles.helpContent}>
          <Info size={16} color="#1ea2b1" />
          <Text style={styles.helpText}>
            Select your transport route below. <Text style={styles.helpHighlight}>You can filter by transport type</Text> or see how many people are already waiting.
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowHelpTip(false));
          }}
        >
          <Text style={styles.dismissText}>Got it</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTransportFilter = () => {
    const availableTypes = new Set(routes.map(route => route.transport_type.toLowerCase()));
    
    return (
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Filter size={14} color="#cccccc" />
          <Text style={styles.filterTitle}>Filter by transport type</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {TRANSPORT_TYPES.map((type) => {
            const isAvailable = type.id === 'all' || availableTypes.has(type.id);
            if (!isAvailable) return null;
            
            const isActive = activeFilter === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                  !type.icon && { paddingHorizontal: 16 }
                ]}
                onPress={() => setActiveFilter(type.id)}
              >
                {type.icon && (
                  <Image 
                    source={type.icon} 
                    style={styles.filterIcon} 
                    resizeMode="contain"
                  />
                )}
                <Text style={[
                  styles.filterText,
                  isActive && styles.filterTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const getTransportIcon = (transportType: string) => {
    const type = transportType.toLowerCase();
    switch (type) {
      case 'minibus':
        return require('../assets/icons/minibus-icon.png');
      case 'bus':
        return require('../assets/icons/bus-icon.png');
      case 'train':
        return require('../assets/icons/train-icon.png');
      case 'taxi':
        return require('../assets/icons/taxi-icon.png');
      default:
        return null;
    }
  };

  const renderRouteCard = (route: Route) => {
    const waitingCount = getWaitingCountForRoute(route.id);
    const transportIcon = getTransportIcon(route.transport_type);
    
    return (
      <TouchableOpacity
        key={route.id}
        style={[
          styles.routeCard,
          waitingCount > 0 && styles.routeWithWaiters,
          isDriver && styles.driverRouteCard
        ]}
        onPress={() => handleRouteSelect(route)}
      >
        <View style={styles.routeHeader}>
          <View style={styles.transportBadge}>
            {transportIcon && (
              <Image 
                source={transportIcon} 
                style={styles.transportIcon}
                resizeMode="contain"
              />
            )}
            <View style={styles.routeInfo}>
              <Text style={styles.transportType}>{route.transport_type}</Text>
              <Text style={styles.routeCost}>R {route.cost}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666666" />
        </View>
        
        <Text style={styles.routeName} numberOfLines={1}>
          {route.name}
        </Text>
        <Text style={styles.routeDestination} numberOfLines={1}>
          {route.start_point} → {route.end_point}
        </Text>
        
        <View style={styles.routeFooter}>
          <View style={styles.waitingInfo}>
            <View style={[
              styles.waitingBadge,
              waitingCount > 0 && styles.waitingBadgeActive
            ]}>
              <Users size={12} color={waitingCount > 0 ? "#ffffff" : "#666666"} />
              <Text style={[
                styles.waitingCount,
                waitingCount > 0 && styles.waitingCountActive
              ]}>
                {waitingCount} waiting
              </Text>
            </View>
          </View>
          
          {isDriver && (
            <View style={styles.driverTag}>
              <Text style={styles.driverTagText}>🚗</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectStep = () => (
    <View style={styles.selectContainer}>
      {showHelpTip && renderHelpTip()}
      
      {renderTransportFilter()}
      
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {activeFilter === 'all' ? 'All Routes' : `${TRANSPORT_TYPES.find(t => t.id === activeFilter)?.label} Routes`}
        </Text>
        <Text style={styles.resultsCount}>
          {filteredRoutes.length} {filteredRoutes.length === 1 ? 'route' : 'routes'}
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Finding available routes...</Text>
        </View>
      ) : filteredRoutes.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Image 
            source={require('../assets/icons/minibus-icon.png')}
            style={styles.noResultsIcon}
          />
          <Text style={styles.noResultsTitle}>
            No routes found
          </Text>
          <Text style={styles.noResultsText}>
            {activeFilter === 'all' 
              ? 'No transport routes available at this stop.'
              : `No ${TRANSPORT_TYPES.find(t => t.id === activeFilter)?.label} routes found.`
            }
          </Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={styles.clearFilterText}>Show all routes</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.routesScroll}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.routesContent}
        >
          {filteredRoutes.map(renderRouteCard)}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.confirmContainer}>
      <ScrollView 
        ref={confirmScrollViewRef}
        style={styles.confirmScroll}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.confirmContent}
      >
        <TouchableOpacity 
          style={styles.backButtonTop}
          onPress={handleBackToSelect}
        >
          <ArrowLeft size={18} color="#1ea2b1" />
          <Text style={styles.backButtonText}>Back to routes</Text>
        </TouchableOpacity>
        
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>Ready to wait?</Text>
          <Text style={styles.confirmationSubtitle}>
            You're about to join the waiting list for:
          </Text>
          
          <View style={styles.selectedRouteCard}>
            <View style={styles.routeHeader}>
              <View style={styles.transportBadge}>
                {getTransportIcon(selectedRoute?.transport_type || '') && (
                  <Image 
                    source={getTransportIcon(selectedRoute?.transport_type || '')} 
                    style={styles.transportIconLarge}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.routeInfo}>
                  <Text style={styles.transportTypeLarge}>{selectedRoute?.transport_type}</Text>
                  <Text style={styles.routeCostLarge}>R {selectedRoute?.cost}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.selectedRouteName} numberOfLines={2}>
              {selectedRoute?.name}
            </Text>
            <Text style={styles.selectedRouteDestination} numberOfLines={2}>
              {selectedRoute?.start_point} → {selectedRoute?.end_point}
            </Text>
            
            <View style={styles.waitingInfoLarge}>
              <Users size={18} color="#1ea2b1" />
              <Text style={styles.waitingCountLarge}>
                {getWaitingCountForRoute(selectedRoute?.id || '')} people already waiting
              </Text>
            </View>
            
            {isDriver && (
              <View style={styles.driverNotice}>
                <Text style={styles.driverNoticeText}>
                  🚗 You'll be starting as a driver for this route
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>What happens next:</Text>
            <View style={styles.instructionStep}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>
                We'll search for existing journeys to join
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>
                If none found, we'll create a new journey
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                You'll be taken to the journey screen
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmActions}>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              isDriver && styles.driverConfirmButton
            ]}
            onPress={handleConfirmWaiting}
          >
            <Text style={styles.confirmButtonText}>
              {isDriver ? '🚗 Start as Driver' : '✅ Confirm Waiting'}
            </Text>
            <Text style={styles.confirmButtonSubtext}>
              {isDriver ? 'Begin your driver journey' : 'Join the waiting list'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const getSearchPhaseText = () => {
    switch (searchPhase) {
      case 'searching':
        return isDriver 
          ? `Starting as driver for ${selectedRoute?.name}`
          : `Looking for existing journeys for ${selectedRoute?.name}`;
      case 'joining':
        return `Found an existing journey! Joining now`;
      case 'creating':
        return `Creating a new journey for ${selectedRoute?.name}`;
      default:
        return `Select which transport you're waiting for`;
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
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPressOut={onClose}
      >
        <TouchableOpacity 
          style={styles.drawer} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isSearching 
                  ? (searchPhase === 'searching' 
                      ? (isDriver ? 'Starting as Driver...' : 'Finding Journey...')
                      : searchPhase === 'joining'
                      ? 'Joining Journey...'
                      : 'Creating Journey...'
                    )
                  : currentStep === 'select' 
                    ? 'Select Your Route'
                    : 'Confirm Waiting'
                }
              </Text>
            </View>
            
            <Text style={[
              styles.subtitle,
              searchPhase === 'joining' && styles.joiningSubtitle
            ]}>
              {isSearching 
                ? getSearchPhaseText()
                : currentStep === 'select'
                  ? `Routes available at ${stopName}`
                  : `Review your selection`
              }
            </Text>
            
            {renderStepIndicator()}
            
            {!isSearching && currentStep === 'select' && getTotalWaitingCount() > 0 && (
              <View style={styles.totalWaitingContainer}>
                <Users size={14} color="#1ea2b1" />
                <Text style={styles.totalWaitingText}>
                  {getTotalWaitingCount()} {getTotalWaitingCount() === 1 ? 'person is' : 'people are'} waiting at this stop
                </Text>
              </View>
            )}
          </View>

          {isSearching ? (
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
              <Text style={styles.searchingSubtext}>
                This usually takes 10-30 seconds
              </Text>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelSearching}>
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep === 'select' ? (
            renderSelectStep()
          ) : (
            renderConfirmStep()
          )}
        </TouchableOpacity>
      </TouchableOpacity>
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
    maxHeight: IS_SMALL_SCREEN ? '85%' : '80%',
    minHeight: IS_SMALL_SCREEN ? '70%' : 'auto',
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
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: IS_SMALL_SCREEN ? 17 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    color: '#cccccc',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: IS_SMALL_SCREEN ? 22 : 24,
    height: IS_SMALL_SCREEN ? 22 : 24,
    borderRadius: IS_SMALL_SCREEN ? 11 : 12,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#1ea2b1',
  },
  stepNumber: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabel: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#1ea2b1',
    fontWeight: '500',
  },
  joiningSubtitle: {
    color: '#4ade80',
    fontWeight: '600',
  },
  totalWaitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
  },
  totalWaitingText: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: IS_SMALL_SCREEN ? 20 : 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  joiningContainer: {
    backgroundColor: '#4ade8010',
    borderBottomColor: '#4ade80',
  },
  radarContainer: {
    width: IS_SMALL_SCREEN ? 100 : 110,
    height: IS_SMALL_SCREEN ? 100 : 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: IS_SMALL_SCREEN ? 100 : 110,
    height: IS_SMALL_SCREEN ? 100 : 110,
    borderRadius: IS_SMALL_SCREEN ? 50 : 55,
    borderWidth: 1.5,
    borderColor: '#1ea2b1',
  },
  radarRing2: {
    width: IS_SMALL_SCREEN ? 85 : 90,
    height: IS_SMALL_SCREEN ? 85 : 90,
    borderRadius: IS_SMALL_SCREEN ? 42.5 : 45,
  },
  radarRing3: {
    width: IS_SMALL_SCREEN ? 70 : 75,
    height: IS_SMALL_SCREEN ? 70 : 75,
    borderRadius: IS_SMALL_SCREEN ? 35 : 37.5,
  },
  profileContainer: {
    width: IS_SMALL_SCREEN ? 50 : 55,
    height: IS_SMALL_SCREEN ? 50 : 55,
    borderRadius: IS_SMALL_SCREEN ? 25 : 27.5,
    overflow: 'hidden',
    borderWidth: 2.5,
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
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  driverBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  searchIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  searchingText: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  searchingSubtext: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    marginBottom: 16,
    textAlign: 'center',
  },
  joiningText: {
    color: '#4ade80',
  },
  selectContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  helpTip: {
    backgroundColor: '#1ea2b110',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  helpText: {
    color: '#cccccc',
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    lineHeight: 16,
    flex: 1,
    marginLeft: 8,
  },
  helpHighlight: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  dismissText: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    color: '#cccccc',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  filterScroll: {
    flexGrow: 0,
    maxHeight: 40,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    paddingHorizontal: IS_SMALL_SCREEN ? 10 : 12,
    paddingVertical: IS_SMALL_SCREEN ? 6 : 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterPillActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  filterIcon: {
    width: IS_SMALL_SCREEN ? 14 : 15,
    height: IS_SMALL_SCREEN ? 14 : 15,
    marginRight: 5,
  },
  filterText: {
    color: '#cccccc',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: '600',
  },
  resultsCount: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
  },
  routesScroll: {
    flex: 1,
  },
  routesContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bottomPadding: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingSpinner: {
    width: IS_SMALL_SCREEN ? 35 : 40,
    height: IS_SMALL_SCREEN ? 35 : 40,
    borderRadius: IS_SMALL_SCREEN ? 17.5 : 20,
    borderWidth: 3,
    borderColor: '#333333',
    borderTopColor: '#1ea2b1',
    marginBottom: 10,
  },
  loadingText: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  noResultsIcon: {
    width: IS_SMALL_SCREEN ? 50 : 55,
    height: IS_SMALL_SCREEN ? 50 : 55,
    opacity: 0.5,
    marginBottom: 12,
  },
  noResultsTitle: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 15 : 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsText: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  clearFilterButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  clearFilterText: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '500',
  },
  routeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: IS_SMALL_SCREEN ? 12 : 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transportIcon: {
    width: IS_SMALL_SCREEN ? 26 : 28,
    height: IS_SMALL_SCREEN ? 26 : 28,
  },
  routeInfo: {
    justifyContent: 'center',
  },
  transportType: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '600',
  },
  routeCost: {
    color: '#10b981',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  routeName: {
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  routeDestination: {
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    color: '#cccccc',
    marginBottom: 10,
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
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  waitingBadgeActive: {
    backgroundColor: '#1ea2b1',
  },
  waitingCount: {
    color: '#666666',
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
    fontWeight: '500',
  },
  waitingCountActive: {
    color: '#ffffff',
  },
  routeWithWaiters: {
    borderColor: '#1ea2b1',
    borderWidth: 1.5,
  },
  driverRouteCard: {
    borderLeftColor: '#fbbf24',
    borderLeftWidth: 3,
  },
  driverTag: {
    backgroundColor: '#fbbf2420',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  driverTagText: {
    color: '#fbbf24',
    fontSize: IS_SMALL_SCREEN ? 9 : 10,
    fontWeight: '600',
  },
  confirmContainer: {
    flex: 1,
  },
  confirmScroll: {
    flex: 1,
  },
  confirmContent: {
    paddingBottom: 30,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButtonText: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 13 : 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  confirmationCard: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  confirmationTitle: {
    fontSize: IS_SMALL_SCREEN ? 17 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  confirmationSubtitle: {
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    color: '#cccccc',
    marginBottom: 16,
  },
  selectedRouteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: IS_SMALL_SCREEN ? 14 : 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#1ea2b1',
  },
  transportIconLarge: {
    width: IS_SMALL_SCREEN ? 36 : 38,
    height: IS_SMALL_SCREEN ? 36 : 38,
  },
  transportTypeLarge: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: '600',
  },
  routeCostLarge: {
    color: '#10b981',
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  selectedRouteName: {
    fontSize: IS_SMALL_SCREEN ? 15 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 20,
  },
  selectedRouteDestination: {
    fontSize: IS_SMALL_SCREEN ? 13 : 14,
    color: '#cccccc',
    marginBottom: 16,
    lineHeight: 18,
  },
  waitingInfoLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  waitingCountLarge: {
    color: '#1ea2b1',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '600',
  },
  driverNotice: {
    backgroundColor: '#fbbf2420',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#fbbf24',
  },
  driverNoticeText: {
    color: '#fbbf24',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: IS_SMALL_SCREEN ? 12 : 14,
    marginBottom: 16,
  },
  instructionsTitle: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 14 : 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionNumber: {
    width: IS_SMALL_SCREEN ? 20 : 22,
    height: IS_SMALL_SCREEN ? 20 : 22,
    borderRadius: IS_SMALL_SCREEN ? 10 : 11,
    backgroundColor: '#1ea2b1',
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 10 : 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: IS_SMALL_SCREEN ? 20 : 22,
    marginRight: 10,
  },
  instructionText: {
    color: '#cccccc',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    flex: 1,
    lineHeight: 18,
  },
  confirmActions: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    padding: IS_SMALL_SCREEN ? 16 : 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  driverConfirmButton: {
    backgroundColor: '#f59e0b',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: IS_SMALL_SCREEN ? 15 : 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  confirmButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: IS_SMALL_SCREEN ? 12 : 13,
    fontWeight: '600',
  },
});