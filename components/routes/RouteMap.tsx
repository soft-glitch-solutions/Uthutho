// components/routes/RouteMap.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Navigation, Clock, MapPin, Bus, Footprints } from 'lucide-react-native';

// Safe platform-conditional import for WebView to prevent bundler errors on Web
let WebView: any = null;
if (Platform.OS !== 'web') {
    try {
        WebView = require('react-native-webview').WebView;
    } catch (e) {
        console.warn('WebView could not be loaded dynamically:', e);
    }
}

interface LatLng {
    latitude: number;
    longitude: number;
}

interface RouteMapProps {
    origin: LatLng | null;
    destination: LatLng | null;
    apiKey: string;
    travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT';
    onRouteReady?: (distance: string, duration: string, steps: RouteStep[]) => void;
}

interface RouteStep {
    instruction: string;
    distance: string;
    duration: string;
    mode: 'walk' | 'drive' | 'bus' | 'train';
}

const mapDarkStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#121212' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'road.highway.controlled_control', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

// Web Directions Service + Map Renderer
const WebDirectionsService: React.FC<RouteMapProps> = ({ origin, destination, apiKey, travelMode = 'DRIVING', onRouteReady }) => {
    const { colors } = useTheme();
    const mapRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<{
        distance: string;
        duration: string;
        steps: RouteStep[];
        startAddress: string;
        endAddress: string;
    } | null>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    useEffect(() => {
        if (!origin || !destination || !apiKey) return;

        // Load Google Maps script if not already present
        if (!document.querySelector('#google-maps-script')) {
            const script = document.createElement('script');
            script.id = 'google-maps-script';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
            script.async = true;
            script.defer = true;

            (window as any).initGoogleMaps = () => {
                setMapsLoaded(true);
            };

            document.head.appendChild(script);
        } else {
            setMapsLoaded(true);
        }
    }, [origin, destination, apiKey]);

    useEffect(() => {
        if (!mapsLoaded || !origin || !destination || !(window as any).google || !mapRef.current) return;

        setLoading(true);
        setError(null);

        const directionsService = new (window as any).google.maps.DirectionsService();

        const travelModeMap = {
            'DRIVING': (window as any).google.maps.TravelMode.DRIVING,
            'WALKING': (window as any).google.maps.TravelMode.WALKING,
            'TRANSIT': (window as any).google.maps.TravelMode.TRANSIT,
        };

        const request = {
            origin: { lat: origin.latitude, lng: origin.longitude },
            destination: { lat: destination.latitude, lng: destination.longitude },
            travelMode: travelModeMap[travelMode as keyof typeof travelModeMap] || (window as any).google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result: any, status: string) => {
            setLoading(false);
            if (status === 'OK' && result) {
                const route = result.routes[0];
                const leg = route.legs[0];

                const steps: RouteStep[] = leg.steps.map((step: any) => ({
                    instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
                    distance: step.distance.text,
                    duration: step.duration.text,
                    mode: step.travel_mode === 'WALKING' ? 'walk' :
                        step.travel_mode === 'TRANSIT' ? 'bus' : 'drive',
                }));

                const routeData = {
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: steps,
                    startAddress: leg.start_address,
                    endAddress: leg.end_address,
                };

                setRouteInfo(routeData);
                onRouteReady?.(routeData.distance, routeData.duration, routeData.steps);

                // Render Google Map Web View
                try {
                    const map = new (window as any).google.maps.Map(mapRef.current, {
                        zoom: 12,
                        center: { lat: origin.latitude, lng: origin.longitude },
                        styles: mapDarkStyle,
                        disableDefaultUI: true,
                        zoomControl: true
                    });

                    const directionsRenderer = new (window as any).google.maps.DirectionsRenderer({
                        map: map,
                        suppressMarkers: false,
                        polylineOptions: {
                            strokeColor: '#1ea2b1',
                            strokeWeight: 5,
                            strokeOpacity: 0.9
                        }
                    });

                    directionsRenderer.setDirections(result);
                } catch (mapErr) {
                    console.error('Failed to initialize Web Map:', mapErr);
                }
            } else {
                setError('Could not find route between these locations');
                console.error('Directions error:', status);
            }
        });
    }, [mapsLoaded, origin, destination, travelMode]);

    if (!origin || !destination) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                <Text style={[styles.placeholderText, { color: colors.text }]}>
                    Select origin and destination to see route
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Interactive Map View */}
            <View 
                ref={mapRef} 
                style={[
                    styles.mapCanvas, 
                    { 
                        backgroundColor: '#121212', 
                        borderColor: colors.border,
                        display: loading || error ? 'none' : 'flex' 
                    }
                ]} 
            />

            {loading && (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color="#1ea2b1" />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Finding best route...</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorWrapper}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && routeInfo && (
                <>
                    {/* Header with route summary */}
                    <View style={styles.header}>
                        <View style={styles.locationRow}>
                            <View style={styles.dotFilled} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                {routeInfo.startAddress.split(',')[0]}
                            </Text>
                        </View>
                        <View style={styles.locationLine} />
                        <View style={styles.locationRow}>
                            <View style={styles.dotOutline} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                {routeInfo.endAddress.split(',')[0]}
                            </Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={[styles.statsRow, { borderColor: colors.border }]}>
                        <View style={styles.statItem}>
                            <Navigation size={16} color="#1ea2b1" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.distance}</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={16} color="#1ea2b1" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.duration}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>

                    {/* Turn-by-turn instructions */}
                    <View style={styles.stepsContainer}>
                        <Text style={[styles.stepsTitle, { color: colors.text }]}>Directions</Text>
                        {routeInfo.steps.map((step, index) => (
                            <View key={index} style={styles.stepItem}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.stepContent}>
                                    <View style={styles.stepHeader}>
                                        {step.mode === 'walk' ? <Footprints size={16} color="#1ea2b1" /> :
                                         step.mode === 'bus' ? <Bus size={16} color="#1ea2b1" /> :
                                         <Navigation size={16} color="#1ea2b1" />}
                                        <Text style={[styles.stepInstruction, { color: colors.text }]}>{step.instruction}</Text>
                                    </View>
                                    <View style={styles.stepMeta}>
                                        <Text style={styles.stepDistance}>{step.distance}</Text>
                                        <Text style={styles.stepSeparator}>•</Text>
                                        <Text style={styles.stepDuration}>{step.duration}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

// Native directions service rendering in WebView
const NativeDirectionsService: React.FC<RouteMapProps> = ({ origin, destination, apiKey, travelMode = 'DRIVING', onRouteReady }) => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<{
        distance: string;
        duration: string;
    } | null>(null);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            setLoading(false);
            if (data.status === 'SUCCESS') {
                setRouteInfo({
                    distance: data.distance,
                    duration: data.duration
                });
                onRouteReady?.(data.distance, data.duration, []);
            } else {
                setError(data.message || 'Could not calculate route');
            }
        } catch (e) {
            console.error('Failed to parse WebView message:', e);
        }
    };

    if (!origin || !destination) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                <Text style={[styles.placeholderText, { color: colors.text }]}>
                    Select origin and destination to see route
                </Text>
            </View>
        );
    }

    // Google Maps Dark themed HTML configuration for WebView rendering
    const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width" />
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #121212;
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places"></script>
        <script>
          const darkStyle = ${JSON.stringify(mapDarkStyle)};

          function initMap() {
            try {
              const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12,
                center: { lat: ${origin.latitude}, lng: ${origin.longitude} },
                styles: darkStyle,
                disableDefaultUI: true,
                zoomControl: true
              });

              const directionsService = new google.maps.DirectionsService();
              const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#1ea2b1',
                  strokeWeight: 6,
                  strokeOpacity: 0.95
                }
              });

              const request = {
                origin: { lat: ${origin.latitude}, lng: ${origin.longitude} },
                destination: { lat: ${destination.latitude}, lng: ${destination.longitude} },
                travelMode: google.maps.TravelMode.${travelMode}
              };

              directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                  directionsRenderer.setDirections(result);
                  const leg = result.routes[0].legs[0];
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'SUCCESS',
                    distance: leg.distance.text,
                    duration: leg.duration.text
                  }));
                } else {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'ERROR',
                    message: 'Could not calculate route path'
                  }));
                }
              });
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'ERROR',
                message: err.message
              }));
            }
          }
          window.onload = initMap;
        </script>
      </head>
      <body>
        <div id="map"></div>
      </body>
    </html>
    `;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Interactive WebView Map */}
            {WebView ? (
                <View style={[styles.mapCanvasContainer, { borderColor: colors.border }]}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: mapHtml }}
                        style={styles.webView}
                        onMessage={handleMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />
                </View>
            ) : (
                <View style={styles.errorWrapper}>
                    <Text style={styles.errorText}>Map view not supported on this platform</Text>
                </View>
            )}

            {loading && (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color="#1ea2b1" />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Calculating route...</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorWrapper}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && routeInfo && (
                <>
                    <View style={styles.header}>
                        <View style={styles.locationRow}>
                            <View style={styles.dotFilled} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                Origin Hub Location
                            </Text>
                        </View>
                        <View style={styles.locationLine} />
                        <View style={styles.locationRow}>
                            <View style={styles.dotOutline} />
                            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                                Destination Hub Location
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statsRow, { borderColor: colors.border }]}>
                        <View style={styles.statItem}>
                            <Navigation size={16} color="#1ea2b1" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.distance}</Text>
                            <Text style={styles.statLabel}>Distance</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={16} color="#1ea2b1" />
                            <Text style={[styles.statValue, { color: colors.text }]}>{routeInfo.duration}</Text>
                            <Text style={styles.statLabel}>Est. Duration</Text>
                        </View>
                    </View>

                    <View style={styles.stepsContainer}>
                        <Text style={[styles.stepsTitle, { color: colors.text }]}>Directions</Text>
                        <View style={styles.nativeNote}>
                            <Text style={styles.nativeNoteText}>
                                View the map above for route path and road information. Use standard gestures to zoom and pan.
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};

// Main component
export const RouteMap: React.FC<RouteMapProps> = (props) => {
    if (Platform.OS === 'web') {
        return <WebDirectionsService {...props} />;
    }
    return <NativeDirectionsService {...props} />;
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        padding: 16,
        marginBottom: 12,
    },
    mapCanvas: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    mapCanvasContainer: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
    },
    webView: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    placeholderText: {
        fontSize: 14,
        textAlign: 'center',
        padding: 20,
    },
    loadingWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
    },
    errorWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        textAlign: 'center',
        padding: 20,
    },
    header: {
        marginBottom: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    dotFilled: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1ea2b1',
    },
    dotOutline: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#1ea2b1',
    },
    locationLine: {
        width: 2,
        height: 12,
        backgroundColor: '#1ea2b1',
        marginLeft: 4,
        opacity: 0.5,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
    },
    stepsContainer: {
        gap: 12,
    },
    stepsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    stepItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 162, 177, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#1ea2b1',
        fontSize: 12,
        fontWeight: '600',
    },
    stepContent: {
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    stepInstruction: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    stepMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 24,
    },
    stepDistance: {
        fontSize: 11,
        color: '#888',
    },
    stepSeparator: {
        fontSize: 11,
        color: '#555',
    },
    stepDuration: {
        fontSize: 11,
        color: '#1ea2b1',
    },
    nativeNote: {
        backgroundColor: 'rgba(30, 162, 177, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    nativeNoteText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
    },
});