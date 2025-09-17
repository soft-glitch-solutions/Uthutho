import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 24;

export default function JourneyCompleteScreen() {
  const { duration, trips, routeName, transportMode } =
    useLocalSearchParams<{ duration?: string; trips?: string; routeName?: string; transportMode?: string }>();

  const seconds = duration ? Math.max(0, parseInt(duration, 10) || 0) : 0;
  const minutes = Math.floor(seconds / 60);
  const tripsCount = trips ? parseInt(trips, 10) : undefined;

  const [countdown, setCountdown] = useState(30);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // Use replace to refresh the home screen
          router.replace({
            pathname: '/(tabs)',
            params: { refresh: Date.now() } // Add timestamp to force refresh
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share your journey',
          mimeType: 'image/png',
        });
      }
    } catch (err) {
      console.error('Error sharing screenshot:', err);
    }
  };

  const handleBackToHome = () => {
    // Use replace with a refresh parameter to force home screen to reload
    router.replace({
      pathname: '/(tabs)',
      params: { refresh: Date.now() } // Add timestamp to force refresh
    });
  };

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.9 }}
        style={styles.card}
      >
        <Text style={styles.celebrate}>🎉 Thank you!</Text>

        <Text style={styles.title}>
          You just completed{' '}
          <Text style={styles.brand}>{routeName ?? 'a route'}</Text> by{' '}
          <Text style={styles.brand}>{transportMode ?? 'public transport'}</Text>
        </Text>

        <Text style={styles.subtitle}>
          Try Uthutho now — your smart transport companion 🚍
        </Text>

        {seconds > 0 && (
          <View style={styles.infoPill}>
            <Text style={styles.infoText}>⏱ Ride Duration</Text>
            <Text style={styles.infoValue}>{minutes} min {seconds % 60}s</Text>
          </View>
        )}

        {typeof tripsCount === 'number' && (
          <View style={[styles.infoPill, { marginTop: 10 }]}>
            <Text style={styles.infoText}>🏆 Total trips</Text>
            <Text style={styles.infoValue}>{tripsCount}</Text>
          </View>
        )}
      </ViewShot>

      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryButton} onPress={handleBackToHome}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>Share</Text>
        </Pressable>
      </View>

      <Text style={styles.countdown}>Returning in {countdown}s…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: HORIZONTAL_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: Math.min(width - HORIZONTAL_PADDING * 2, 520),
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 34,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  celebrate: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  brand: {
    color: '#1ea2b1',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 18,
  },
  infoPill: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
    marginBottom: 10,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 22,
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#cccccc',
    fontWeight: '600',
  },
  countdown: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 12,
  },
});