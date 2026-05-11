import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    Modal,
    Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, MapPin, Bus, Navigation, ChevronRight, Train, AlertCircle, Home, Briefcase, X, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NearbyStop {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    distance: number;
    routes: any[];
}

interface NearbyRoute {
    id: string;
    name: string;
    distanceToStop: number;
    nearestStopName: string;
    totalDistance?: number;
}

// Skeleton Loader Component
const SkeletonLoader = ({ colors }: { colors: any }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    const SkeletonItem = ({ style }: { style: any }) => (
        <Animated.View style={[style, { opacity, backgroundColor: colors.border || '#2A2D2E' }]} />
    );

    return (
        <View style={styles.skeletonContainer}>
            {/* Skeleton for Location Card */}
            <View style={[styles.skeletonLocationCard, { backgroundColor: colors.card }]}>
                <SkeletonItem style={styles.skeletonIcon} />
                <View style={styles.skeletonLocationText}>
                    <SkeletonItem style={styles.skeletonTitle} />
                    <SkeletonItem style={styles.skeletonSubtitle} />
                </View>
            </View>

            {/* Skeleton for Quick Save Buttons */}
            <View style={styles.quickSaveContainer}>
                <SkeletonItem style={styles.skeletonQuickSaveButton} />
                <SkeletonItem style={styles.skeletonQuickSaveButton} />
            </View>

            {/* Skeleton for Stops Section */}
            <View style={styles.section}>
                <SkeletonItem style={styles.skeletonSectionTitle} />
                <SkeletonItem style={styles.skeletonSectionSubtitle} />
                {[1, 2, 3].map((i) => (
                    <View key={i} style={[styles.skeletonStopCard, { backgroundColor: colors.card }]}>
                        <SkeletonItem style={styles.skeletonStopIcon} />
                        <View style={styles.skeletonStopInfo}>
                            <SkeletonItem style={styles.skeletonStopName} />
                            <SkeletonItem style={styles.skeletonStopMeta} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const SearchResults = () => {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
    const [nearbyRoutes, setNearbyRoutes] = useState<NearbyRoute[]>([]);
    const [selectedLocation, setSelectedLocation] = useState({
        lat: 0,
        lng: 0,
        name: '',
        fullAddress: '',
    });
    const [savingLocation, setSavingLocation] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoadingNewLocation, setIsLoadingNewLocation] = useState(false);

    // Get current user
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        })();
    }, []);

    // Update selected location when params change
    useEffect(() => {
        const { latitude, longitude, address, fullAddress } = params;

        if (latitude && longitude) {
            const newLat = parseFloat(latitude as string);
            const newLng = parseFloat(longitude as string);
            const newName = (address as string) || 'Selected Location';
            const newFullAddress = (fullAddress as string) || newName;

            console.log('Params changed:', { newLat, newLng, newName, newFullAddress });

            // Clear old data immediately when params change
            setNearbyStops([]);
            setNearbyRoutes([]);
            setLoading(true);
            setIsLoadingNewLocation(true);

            setSelectedLocation({
                lat: newLat,
                lng: newLng,
                name: newName,
                fullAddress: newFullAddress,
            });
        }
    }, [params.latitude, params.longitude, params.address, params.fullAddress]);

    // Calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    // Save current searched location to profile
    const saveCurrentLocationToProfile = async (type: 'home' | 'work') => {
        if (!user?.id) {
            setSuccessMessage('Please login to save addresses');
            setShowSuccessModal(true);
            return;
        }

        setSavingLocation(true);
        try {
            const addressData = {
                address: selectedLocation.fullAddress || selectedLocation.name,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                label: selectedLocation.name,
                savedAt: new Date().toISOString(),
            };

            const updateField = type === 'home' ? 'home' : 'work';

            const { error } = await supabase
                .from('profiles')
                .update({ [updateField]: addressData })
                .eq('id', user.id);

            if (error) throw error;

            setSuccessMessage(`${type === 'home' ? 'Home' : 'Work'} address saved successfully!`);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error saving address:', error);
            setSuccessMessage('Failed to save address. Please try again.');
            setShowSuccessModal(true);
        } finally {
            setSavingLocation(false);
        }
    };

    // Find nearby stops and routes from Supabase
    const findNearbyStopsAndRoutes = async () => {
        if (!selectedLocation.lat || !selectedLocation.lng) {
            console.log('No coordinates available');
            setLoading(false);
            setIsLoadingNewLocation(false);
            return;
        }

        console.log('Searching near coordinates:', selectedLocation.lat, selectedLocation.lng);
        setLoading(true);

        try {
            // Fetch all stops
            const { data: allStops, error: stopsError } = await supabase
                .from('stops')
                .select('*');

            if (stopsError) {
                console.error('Error fetching stops:', stopsError);
                throw stopsError;
            }

            if (!allStops || allStops.length === 0) {
                console.log('No stops found in database');
                setLoading(false);
                setIsLoadingNewLocation(false);
                return;
            }

            console.log(`Found ${allStops.length} total stops`);

            // Calculate distances and filter within 10km
            const stopsWithDistance = allStops
                .map(stop => ({
                    ...stop,
                    distance: calculateDistance(
                        selectedLocation.lat,
                        selectedLocation.lng,
                        stop.latitude,
                        stop.longitude
                    ),
                }))
                .filter(stop => stop.distance <= 10)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 20);

            console.log(`${stopsWithDistance.length} stops found within 10km`);

            // For each stop, fetch its associated routes via route_stops
            const stopsWithRoutes = await Promise.all(
                stopsWithDistance.map(async (stop) => {
                    const { data: routeStops, error: routeStopError } = await supabase
                        .from('route_stops')
                        .select('route_id, order_number')
                        .eq('stop_id', stop.id);

                    if (routeStopError) {
                        console.error(`Error fetching route_stops for stop ${stop.id}:`, routeStopError);
                        return { ...stop, routes: [] };
                    }

                    if (!routeStops || routeStops.length === 0) {
                        return { ...stop, routes: [] };
                    }

                    const routeIds = routeStops.map(rs => rs.route_id);

                    const { data: routesData, error: routesError } = await supabase
                        .from('routes')
                        .select('*')
                        .in('id', routeIds);

                    if (routesError) {
                        console.error(`Error fetching routes for stop ${stop.id}:`, routesError);
                        return { ...stop, routes: [] };
                    }

                    const routesWithOrder = routesData?.map(route => {
                        const routeStop = routeStops.find(rs => rs.route_id === route.id);
                        return {
                            ...route,
                            order_number: routeStop?.order_number || 0
                        };
                    }) || [];

                    return { ...stop, routes: routesWithOrder };
                })
            );

            // Filter stops that have at least one route
            const stopsWithValidRoutes = stopsWithRoutes.filter(stop => stop.routes && stop.routes.length > 0);
            console.log(`${stopsWithValidRoutes.length} stops have valid routes`);

            // Show stops first (order by distance)
            setNearbyStops(stopsWithValidRoutes);

            // Extract unique routes from nearby stops
            const uniqueRoutesMap = new Map();
            stopsWithValidRoutes.forEach(stop => {
                stop.routes.forEach((route: any) => {
                    if (!uniqueRoutesMap.has(route.id)) {
                        uniqueRoutesMap.set(route.id, {
                            id: route.id,
                            name: route.name,
                            distanceToStop: stop.distance,
                            nearestStopName: stop.name,
                            transport_type: route.transport_type,
                            totalDistance: stop.distance + (route.distance_km || 0)
                        });
                    }
                });
            });

            const uniqueRoutes = Array.from(uniqueRoutesMap.values())
                .sort((a, b) => a.distanceToStop - b.distanceToStop)
                .slice(0, 10);

            setNearbyRoutes(uniqueRoutes);
            console.log(`${uniqueRoutes.length} unique routes found`);

        } catch (error) {
            console.error('Error finding nearby stops:', error);
        } finally {
            setLoading(false);
            setIsLoadingNewLocation(false);
        }
    };

    // Fetch data when selectedLocation changes
    useEffect(() => {
        if (selectedLocation.lat && selectedLocation.lng && isLoadingNewLocation) {
            findNearbyStopsAndRoutes();
        }
    }, [selectedLocation.lat, selectedLocation.lng, isLoadingNewLocation]);

    const handleStopPress = (stopId: string) => {
        router.push(`/stop-details?stopId=${stopId}`);
    };

    const handleRoutePress = (routeId: string) => {
        router.push(`/route-details?routeId=${routeId}`);
    };

    const getDistanceDisplay = (distance: number) => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`;
        }
        return `${distance.toFixed(1)}km away`;
    };

    const getTransportIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'bus': return <Bus size={22} color={colors.primary} />;
            case 'train': return <Train size={22} color={colors.primary} />;
            default: return <Bus size={22} color={colors.primary} />;
        }
    };

    const handleBack = () => {
        router.back();
    };

    // Success Modal Component
    const SuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.successModalContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.successIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Check size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Success!</Text>
                    <Text style={[styles.successMessage, { color: colors.text, opacity: 0.7 }]}>
                        {successMessage}
                    </Text>
                    <TouchableOpacity
                        style={[styles.successButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowSuccessModal(false)}
                    >
                        <Text style={styles.successButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Header component (not loading state)
    const HeaderContent = () => (
        <>
            <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
                <View style={[styles.locationIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <MapPin size={24} color={colors.primary} />
                </View>
                <View style={styles.locationInfo}>
                    <Text style={[styles.locationName, { color: colors.text }]}>
                        {selectedLocation.name}
                    </Text>
                    <Text style={[styles.locationAddress, { color: colors.text, opacity: 0.7 }]}>
                        {selectedLocation.fullAddress}
                    </Text>
                </View>
            </View>

            <View style={styles.quickSaveContainer}>
                <TouchableOpacity
                    style={[styles.quickSaveButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => saveCurrentLocationToProfile('home')}
                    disabled={savingLocation}
                >
                    <Home size={20} color={colors.primary} />
                    <Text style={[styles.quickSaveText, { color: colors.text }]}>Save as Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.quickSaveButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => saveCurrentLocationToProfile('work')}
                    disabled={savingLocation}
                >
                    <Briefcase size={20} color={colors.primary} />
                    <Text style={[styles.quickSaveText, { color: colors.text }]}>Save as Work</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                            {selectedLocation.name || 'Search Results'}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                            {selectedLocation.fullAddress || 'Loading...'}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        // Show skeleton loader while loading
                        <SkeletonLoader colors={colors} />
                    ) : (
                        <>
                            {/* Header Content */}
                            <HeaderContent />

                            {/* Nearby Stops Section - Display FIRST */}
                            {nearbyStops.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            Nearby Stops
                                        </Text>
                                        <Text style={[styles.sectionCount, { color: colors.primary }]}>
                                            {nearbyStops.length} found
                                        </Text>
                                    </View>
                                    <Text style={[styles.sectionSubtitle, { color: colors.text, opacity: 0.7 }]}>
                                        Stops and stations near this location
                                    </Text>

                                    {nearbyStops.map((stop, index) => (
                                        <TouchableOpacity
                                            key={stop.id}
                                            style={[
                                                styles.stopCard,
                                                { backgroundColor: colors.card, borderColor: colors.border },
                                                index < nearbyStops.length - 1 && styles.stopCardMargin
                                            ]}
                                            onPress={() => handleStopPress(stop.id)}
                                        >
                                            <View style={[styles.stopIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                                                <Bus size={22} color={colors.primary} />
                                            </View>
                                            <View style={styles.stopInfo}>
                                                <Text style={[styles.stopName, { color: colors.text }]} numberOfLines={1}>
                                                    {stop.name}
                                                </Text>
                                                <View style={styles.stopMeta}>
                                                    <Navigation size={12} color={colors.primary} />
                                                    <Text style={[styles.stopDistance, { color: colors.primary }]}>
                                                        {getDistanceDisplay(stop.distance)}
                                                    </Text>
                                                    {stop.routes && stop.routes.length > 0 && (
                                                        <>
                                                            <View style={[styles.dot, { backgroundColor: colors.text }]} />
                                                            <Text style={[styles.stopRouteCount, { color: colors.text, opacity: 0.7 }]}>
                                                                {stop.routes.length} route{stop.routes.length > 1 ? 's' : ''}
                                                            </Text>
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                            <ChevronRight size={18} color={colors.text} opacity={0.5} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Nearby Routes Section - Display SECOND */}
                            {nearbyRoutes.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            Nearby Routes
                                        </Text>
                                        <Text style={[styles.sectionCount, { color: colors.primary }]}>
                                            {nearbyRoutes.length} found
                                        </Text>
                                    </View>
                                    <Text style={[styles.sectionSubtitle, { color: colors.text, opacity: 0.7 }]}>
                                        Routes passing near this location
                                    </Text>

                                    {nearbyRoutes.map((route, index) => (
                                        <TouchableOpacity
                                            key={route.id}
                                            style={[
                                                styles.routeCard,
                                                { backgroundColor: colors.card, borderColor: colors.border },
                                                index < nearbyRoutes.length - 1 && styles.routeCardMargin
                                            ]}
                                            onPress={() => handleRoutePress(route.id)}
                                        >
                                            <View style={[styles.routeIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                                                {getTransportIcon(route.transport_type)}
                                            </View>
                                            <View style={styles.routeInfo}>
                                                <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={1}>
                                                    {route.name}
                                                </Text>
                                                <View style={styles.routeMeta}>
                                                    <MapPin size={10} color={colors.primary} />
                                                    <Text style={[styles.routeDistance, { color: colors.text, opacity: 0.7 }]}>
                                                        Nearest: {route.nearestStopName}
                                                    </Text>
                                                </View>
                                                <View style={styles.routeDistanceBadge}>
                                                    <Navigation size={10} color={colors.primary} />
                                                    <Text style={[styles.routeDistanceText, { color: colors.primary }]}>
                                                        {getDistanceDisplay(route.distanceToStop)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <ChevronRight size={18} color={colors.text} opacity={0.5} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* No Results Message */}
                            {nearbyStops.length === 0 && nearbyRoutes.length === 0 && (
                                <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
                                    <AlertCircle size={48} color={colors.text} opacity={0.3} />
                                    <Text style={[styles.emptyText, { color: colors.text }]}>
                                        No stops or routes found nearby
                                    </Text>
                                    <Text style={[styles.emptySubtext, { color: colors.text, opacity: 0.7 }]}>
                                        Try searching for a different location or check back later
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </View>

            {/* Success Modal */}
            <SuccessModal />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 13,
    },
    quickSaveContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    quickSaveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    quickSaveText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: '500',
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    stopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    stopCardMargin: {
        marginBottom: 12,
    },
    stopIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stopInfo: {
        flex: 1,
    },
    stopName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stopMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stopDistance: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    stopRouteCount: {
        fontSize: 12,
    },
    routeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    routeCardMargin: {
        marginBottom: 12,
    },
    routeIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    routeInfo: {
        flex: 1,
    },
    routeName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    routeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    routeDistance: {
        fontSize: 12,
    },
    routeDistanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    routeDistanceText: {
        fontSize: 11,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        marginHorizontal: 16,
        borderRadius: 16,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContainer: {
        width: SCREEN_WIDTH - 48,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    successButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    successButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Skeleton Loader Styles
    skeletonContainer: {
        paddingHorizontal: 16,
    },
    skeletonLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
        marginBottom: 12,
    },
    skeletonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
    },
    skeletonLocationText: {
        flex: 1,
    },
    skeletonTitle: {
        height: 18,
        width: '60%',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonSubtitle: {
        height: 14,
        width: '80%',
        borderRadius: 4,
    },
    skeletonQuickSaveButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
    },
    skeletonSectionTitle: {
        height: 24,
        width: '50%',
        borderRadius: 4,
        marginBottom: 8,
        marginTop: 16,
    },
    skeletonSectionSubtitle: {
        height: 16,
        width: '70%',
        borderRadius: 4,
        marginBottom: 16,
    },
    skeletonStopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    skeletonStopIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
    },
    skeletonStopInfo: {
        flex: 1,
    },
    skeletonStopName: {
        height: 16,
        width: '70%',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonStopMeta: {
        height: 12,
        width: '50%',
        borderRadius: 4,
    },
});

export default SearchResults;