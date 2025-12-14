import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Linking,
  useWindowDimensions,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Clock, Users, MapPin, Flag, Route, User, MessageCircle } from 'lucide-react-native';

export default function JourneyCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width <= 375;
  const screenHeight = height;
  
  const { 
    duration, 
    routeName, 
    transportMode,
    journeyId,
    startPoint,
    endPoint,
    stopsCount,
    driverName,
    startedAt,
    ratingJourneyId
  } = useLocalSearchParams<{ 
    duration?: string; 
    routeName?: string; 
    transportMode?: string;
    journeyId?: string;
    startPoint?: string;
    endPoint?: string;
    stopsCount?: string;
    driverName?: string;
    startedAt?: string;
    ratingJourneyId?: string;
  }>();

  const seconds = duration ? Math.max(0, parseInt(duration, 10) || 0) : 0;
  const minutes = Math.floor(seconds / 60);
  const stops = stopsCount ? parseInt(stopsCount, 10) : undefined;
  
  const [countdown, setCountdown] = useState(30);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          handleBackToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [journeyId, ratingJourneyId]);

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
      console.error('Error sharing:', err);
    }
  };

  const handleBackToHome = () => {
    router.replace({
      pathname: '/home',
      params: { 
        refresh: Date.now(),
        showRatingForJourney: ratingJourneyId || journeyId
      }
    });
  };

  const handleJoinWhatsAppChannel = () => {
    const whatsappUrl = 'https://whatsapp.com/channel/0029VbBvCFSFMqrRi2c83q0Z';
    Linking.openURL(whatsappUrl);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.9 }}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.celebrate}>Journey Complete</Text>
            <Text style={styles.title}>
              {routeName ? `You completed ${routeName}` : 'Journey Completed'}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Clock size={18} color="#1ea2b1" />
              </View>
              <Text style={styles.statValue}>{minutes}m {seconds % 60}s</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            
            {stops && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MapPin size={18} color="#1ea2b1" />
                </View>
                <Text style={styles.statValue}>{stops}</Text>
                <Text style={styles.statLabel}>Stops</Text>
              </View>
            )}
            
            {driverName && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <User size={18} color="#1ea2b1" />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  {driverName}
                </Text>
                <Text style={styles.statLabel}>Driver</Text>
              </View>
            )}
          </View>

          {/* Additional Info */}
          {startedAt && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Started At: </Text>
              <Text style={styles.infoValue}>{formatTime(startedAt)}</Text>
            </View>
          )}

          {/* Community Section */}
          <View style={styles.communityCard}>
            <View style={styles.communityHeader}>
              <MessageCircle size={18} color="#25D366" />
              <Text style={styles.communityTitle}>Join Our Community</Text>
            </View>
            <Pressable style={styles.whatsappButton} onPress={handleJoinWhatsAppChannel}>
              <Text style={styles.whatsappButtonText}>Join WhatsApp Channel</Text>
            </Pressable>
            <Text style={styles.communityNote}>
              Stay informed about route changes
            </Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleBackToHome}>
            <Text style={styles.primaryButtonText}>Home</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </Pressable>
        </View>

        <Text style={styles.countdown}>Returning in {countdown}s</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 20,
    minHeight: 667, // Minimum height for 375x667 screen
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrate: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    color: '#cccccc',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  routeCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 24,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
    marginTop: 1,
  },
  routeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
    marginLeft: 38,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  communityCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#25D36620',
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  communityTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  communityNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  countdown: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});