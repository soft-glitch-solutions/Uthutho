import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Navigation, ArrowLeft, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface NearbySpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  category: string;
  image_url: string;
  stop_id: string;
  created_at: string;
  updated_at: string;
  stop?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

// Skeleton Loading Components
const SkeletonLoader = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={[styles.shareButton, styles.skeleton]} />
      </View>

      {/* Spot Image Skeleton */}
      <View style={[styles.imageContainer, styles.skeleton]} />

      {/* Spot Info Skeleton */}
      <View style={styles.infoSection}>
        <View style={[styles.skeletonTextLarge, styles.skeleton, { width: '70%', marginBottom: 12 }]} />
        <View style={[styles.skeletonTextMedium, styles.skeleton, { width: '90%', marginBottom: 8 }]} />
        <View style={[styles.skeletonTextSmall, styles.skeleton, { width: '60%', marginBottom: 12 }]} />
        <View style={[styles.skeletonBadge, styles.skeleton, { width: '30%' }]} />
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionButtons}>
        <View style={[styles.actionButton, styles.skeleton]} />
        <View style={[styles.actionButton, styles.skeleton]} />
      </View>

      {/* Description Skeleton */}
      <View style={styles.section}>
        <View style={[styles.skeletonTextMedium, styles.skeleton, { width: '50%', marginBottom: 16 }]} />
        <View style={[styles.skeletonTextSmall, styles.skeleton, { width: '100%', marginBottom: 8 }]} />
        <View style={[styles.skeletonTextSmall, styles.skeleton, { width: '80%', marginBottom: 8 }]} />
        <View style={[styles.skeletonTextSmall, styles.skeleton, { width: '90%' }]} />
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default function NearbySpotDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [spot, setSpot] = useState<NearbySpot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSpotDetails();
    }
  }, [id]);

  const loadSpotDetails = async () => {
    try {
      const { data: spotData, error: spotError } = await supabase
        .from('nearby_spots')
        .select(`
          *,
          stop:stop_id (name, latitude, longitude)
        `)
        .eq('id', id)
        .single();

      if (spotError) {
        console.error('Error loading spot:', spotError);
        return;
      }

      setSpot(spotData);
    } catch (error) {
      console.error('Error loading spot details:', error);
    }
    setLoading(false);
  };

  const openInMaps = () => {
    if (!spot) {
      console.log("No spot available, skipping openInMaps.");
      return;
    }

    const lat = spot.latitude;
    const lng = spot.longitude;
    const label = encodeURIComponent(spot.name);

    // Native deep links
    const iosUrl = `comgooglemaps://?q=${lat},${lng}`;
    const androidUrl = `geo:${lat},${longitude}?q=${lat},${lng}(${label})`;

    // Web fallback
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    console.log("openInMaps called with spot:", spot);
    console.log("Generated URLs:", { iosUrl, androidUrl, webUrl });

    if (Platform.OS === "web") {
      const confirm = window.confirm(`Would you like to open ${spot.name} in Google Maps?`);
      if (confirm) {
        console.log("Opening in browser:", webUrl);
        window.open(webUrl, "_blank");
      } else {
        console.log("User cancelled on web.");
      }
      return;
    }

    // Native platforms
    Alert.alert(
      "Open in Maps",
      `Would you like to open ${spot.name} in Google Maps?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => console.log("User cancelled openInMaps") },
        {
          text: "Open",
          onPress: async () => {
            try {
              let url =
                Platform.OS === "ios"
                  ? iosUrl
                  : Platform.OS === "android"
                  ? androidUrl
                  : webUrl;

              console.log("Trying URL:", url);

              const supported = await Linking.canOpenURL(url);
              console.log("canOpenURL result:", supported);

              if (!supported) {
                console.log("Deep link not supported, falling back to webUrl:", webUrl);
                url = webUrl;
              }

              await Linking.openURL(url);
              console.log("Successfully opened URL:", url);
            } catch (err) {
              console.error("Error opening maps:", err);
              Alert.alert("Error", "Unable to open Google Maps.");
            }
          },
        },
      ]
    );
  };

  const navigateToStop = () => {
    if (spot?.stop_id) {
      router.push(`/stop-details/${spot.stop_id}`);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m away`;
    } else {
      return `${(meters / 1000).toFixed(1)}km away`;
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!spot) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Spot not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <ExternalLink size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Spot Image */}
      <View style={styles.imageContainer}>
        {spot.image_url ? (
          <Image
            source={{ uri: spot.image_url }}
            style={styles.spotImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MapPin size={48} color="#1ea2b1" />
            <Text style={styles.spotName}>{spot.name}</Text>
          </View>
        )}
      </View>

      {/* Spot Info */}
      <View style={styles.infoSection}>
        <Text style={styles.spotName}>{spot.name}</Text>
        
        {/* Category and Distance */}
        <View style={styles.metaContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{spot.category || 'Point of Interest'}</Text>
          </View>
          {spot.distance_meters && (
            <View style={styles.distanceContainer}>
              <MapPin size={14} color="#1ea2b1" />
              <Text style={styles.distanceText}>
                {formatDistance(spot.distance_meters)}
              </Text>
            </View>
          )}
        </View>

        {/* Associated Stop */}
        {spot.stop && (
          <TouchableOpacity style={styles.stopContainer} onPress={navigateToStop}>
            <MapPin size={16} color="#1ea2b1" />
            <Text style={styles.stopText}>
              Near {spot.stop.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
          <Navigation size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={navigateToStop}>
          <MapPin size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>View Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {spot.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{spot.description}</Text>
        </View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonTextLarge: {
    height: 28,
  },
  skeletonTextMedium: {
    height: 20,
  },
  skeletonTextSmall: {
    height: 16,
  },
  skeletonBadge: {
    height: 28,
  },
  // Error styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image styles
  imageContainer: {
    height: 200,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  spotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Info section
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  spotName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#1ea2b120',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: '#cccccc',
    fontSize: 12,
    marginLeft: 4,
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopText: {
    color: '#1ea2b1',
    fontSize: 12,
    marginLeft: 4,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#333333',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  bottomSpace: {
    height: 20,
  },
});