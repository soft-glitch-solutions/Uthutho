// components/routes/TaxiRouteFinder.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Bus, MapPin, Navigation, Clock, DollarSign, ChevronRight, Info } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { taxiRoutesData, findRoutesBetween, getUniqueLocations, TaxiRoute } from '@/data/taxiRoutes';
import { geocodeLocation, getRouteGeometry } from '@/services/routeGeometry';
import { RouteMap } from '@/components/routes/RouteMap';

interface RouteWithGeometry extends TaxiRoute {
    originCoords?: { latitude: number; longitude: number };
    destCoords?: { latitude: number; longitude: number };
    routeGeometry?: any;
    distance?: number;
    duration?: number;
}

export const TaxiRouteFinder = () => {
    const { colors } = useTheme();
    const [selectedOrigin, setSelectedOrigin] = useState<string>('');
    const [selectedDestination, setSelectedDestination] = useState<string>('');
    const [availableRoutes, setAvailableRoutes] = useState<TaxiRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<RouteWithGeometry | null>(null);
    const [loading, setLoading] = useState(false);
    const [locations] = useState<string[]>(getUniqueLocations());

    const searchRoutes = () => {
        console.log('🔍 Search button pressed');
        console.log('Selected origin:', selectedOrigin);
        console.log('Selected destination:', selectedDestination);

        if (!selectedOrigin || !selectedDestination) {
            Alert.alert('Please select both origin and destination');
            return;
        }

        const routes = findRoutesBetween(selectedOrigin, selectedDestination);
        console.log('📊 Found routes:', routes.length);
        setAvailableRoutes(routes);

        if (routes.length === 0) {
            Alert.alert('No routes found', `No direct taxi route from ${selectedOrigin} to ${selectedDestination}`);
        }
    };

    const selectRoute = async (route: TaxiRoute) => {
        console.log('🚌 Selecting route:', route.origin, '→', route.destination);
        setLoading(true);
        try {
            // Geocode both locations
            console.log('📍 Geocoding origin:', route.origin);
            const originCoords = await geocodeLocation(route.origin);
            console.log('📍 Origin coords:', originCoords);

            console.log('📍 Geocoding destination:', route.destination);
            const destCoords = await geocodeLocation(route.destination);
            console.log('📍 Destination coords:', destCoords);

            if (!originCoords || !destCoords) {
                console.error('❌ Geocoding failed for one or both locations');
                Alert.alert('Error', 'Could not find coordinates for these locations. Please check your API key.');
                setLoading(false);
                return;
            }

            console.log('🗺️ Getting route geometry...');
            // Get route geometry from Google
            const routeGeometry = await getRouteGeometry(originCoords, destCoords, 'DRIVING');
            console.log('🗺️ Route geometry received:', routeGeometry ? 'Yes' : 'No');

            setSelectedRoute({
                ...route,
                originCoords,
                destCoords,
                routeGeometry,
                distance: routeGeometry?.distance,
                duration: routeGeometry?.duration,
            });
            console.log('✅ Route selected successfully');
        } catch (error) {
            console.error('❌ Error selecting route:', error);
            Alert.alert('Error', 'Failed to load route details. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (distanceKm: number): string => {
        const baseFare = 8;
        const perKm = 2;
        const estimated = baseFare + (distanceKm * perKm);
        return `R${Math.round(estimated)} - R${Math.round(estimated + 5)}`;
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🚕 Cape Town Taxi Routes</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text, opacity: 0.7 }]}>
                Find official minibus taxi routes between suburbs
            </Text>

            {/* Origin Selection */}
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>From</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                    {locations.slice(0, 20).map((loc) => (
                        <TouchableOpacity
                            key={loc}
                            style={[
                                styles.locationChip,
                                { backgroundColor: selectedOrigin === loc ? colors.primary : '#2A2D2E' },
                            ]}
                            onPress={() => {
                                console.log('📍 Origin selected:', loc);
                                setSelectedOrigin(loc);
                            }}
                        >
                            <Text style={[styles.locationChipText, { color: selectedOrigin === loc ? '#fff' : colors.text }]}>
                                {loc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Destination Selection */}
            <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                    {locations.slice(0, 20).map((loc) => (
                        <TouchableOpacity
                            key={loc}
                            style={[
                                styles.locationChip,
                                { backgroundColor: selectedDestination === loc ? colors.primary : '#2A2D2E' },
                            ]}
                            onPress={() => {
                                console.log('📍 Destination selected:', loc);
                                setSelectedDestination(loc);
                            }}
                        >
                            <Text style={[styles.locationChipText, { color: selectedDestination === loc ? '#fff' : colors.text }]}>
                                {loc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Search Button */}
            <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                onPress={searchRoutes}
            >
                <Bus size={20} color="#fff" />
                <Text style={styles.searchBtnText}>Find Taxi Routes</Text>
            </TouchableOpacity>

            {/* Available Routes List */}
            {availableRoutes.length > 0 && !selectedRoute && (
                <View style={[styles.routesContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.routesTitle, { color: colors.text }]}>
                        Available Routes ({availableRoutes.length})
                    </Text>
                    {availableRoutes.map((route) => (
                        <TouchableOpacity
                            key={route.id}
                            style={[styles.routeCard, { borderColor: colors.border }]}
                            onPress={() => selectRoute(route)}
                        >
                            <View style={styles.routeHeader}>
                                <Bus size={20} color={colors.primary} />
                                <Text style={[styles.routeName, { color: colors.text }]}>
                                    {route.origin} → {route.destination}
                                </Text>
                                <ChevronRight size={18} color="#666" />
                            </View>
                            <Text style={styles.routeDistance}>~{(route.shapeLength / 1000).toFixed(1)} km</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Loading route...</Text>
                </View>
            )}

            {/* Selected Route Details with Map */}
            {selectedRoute && selectedRoute.originCoords && selectedRoute.destCoords && (
                <View style={[styles.routeDetailContainer, { backgroundColor: colors.card }]}>
                    <View style={styles.routeDetailHeader}>
                        <Bus size={24} color={colors.primary} />
                        <Text style={[styles.routeDetailTitle, { color: colors.text }]}>
                            {selectedRoute.origin} → {selectedRoute.destination}
                        </Text>
                    </View>

                    {/* Route Map/Instructions Component */}
                    <RouteMap
                        origin={selectedRoute.originCoords}
                        destination={selectedRoute.destCoords}
                        apiKey={process.env.EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY || ''}
                        travelMode="DRIVING"
                    />

                    {/* Estimated Fare */}
                    <View style={[styles.fareContainer, { borderTopColor: colors.border }]}>
                        <Info size={14} color={colors.primary} />
                        <Text style={[styles.fareLabel, { color: colors.text }]}>Estimated Fare</Text>
                        <Text style={[styles.fareAmount, { color: colors.primary }]}>
                            {formatPrice(selectedRoute.shapeLength / 1000)}
                        </Text>
                        <Text style={styles.fareNote}>*Prices may vary based on demand and time of day</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.closeBtn, { borderColor: colors.border }]}
                        onPress={() => setSelectedRoute(null)}
                    >
                        <Text style={[styles.closeBtnText, { color: colors.text }]}>Close</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginBottom: 16,
    },
    inputCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    locationScroll: {
        flexDirection: 'row',
    },
    locationChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    locationChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        marginBottom: 20,
    },
    searchBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    routesContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    routesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    routeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    routeName: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    routeDistance: {
        fontSize: 12,
        color: '#888',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    routeDetailContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 20,
    },
    routeDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    routeDetailTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    fareContainer: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'center',
        gap: 4,
    },
    fareLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    fareAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    fareNote: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        textAlign: 'center',
    },
    closeBtn: {
        margin: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default TaxiRouteFinder;