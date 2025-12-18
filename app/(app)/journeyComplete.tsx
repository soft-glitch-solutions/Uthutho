import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Linking,
  useWindowDimensions,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Clock, Users, MapPin, Flag, Route, User, MessageCircle } from 'lucide-react-native';

export default function JourneyCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width <= 375;
  const isVerySmallScreen = width <= 320;
  
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

  // Debug logging to check what values are being received
  useEffect(() => {
    console.log('JourneyCompleteScreen params:', {
      duration,
      routeName,
      transportMode,
      journeyId,
      startPoint,
      endPoint,
      stopsCount,
      driverName,
      startedAt,
      ratingJourneyId,
      durationType: typeof duration,
      durationRawValue: duration
    });
  }, []);

  // FIXED: Better duration calculation with debugging
  const parseDuration = () => {
    console.log('Parsing duration:', duration);
    
    // If duration is undefined or null, return default
    if (!duration && duration !== '0') {
      console.log('Duration is falsy, returning 0');
      return { totalSeconds: 0, minutes: 0, seconds: 0 };
    }
    
    try {
      // Handle different types of duration input
      let totalSeconds: number;
      
      if (typeof duration === 'string') {
        // Parse string to number
        totalSeconds = parseInt(duration, 10);
        console.log('Parsed duration string to:', totalSeconds);
      } else if (typeof duration === 'number') {
        // Already a number
        totalSeconds = duration;
        console.log('Duration is already number:', totalSeconds);
      } else {
        console.log('Unknown duration type, defaulting to 0');
        totalSeconds = 0;
      }
      
      // Ensure it's a valid number
      if (isNaN(totalSeconds) || totalSeconds < 0) {
        console.log('Invalid duration, defaulting to 0');
        totalSeconds = 0;
      }
      
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      console.log('Final duration calculation:', {
        totalSeconds,
        minutes,
        seconds,
        formatted: `${minutes}m ${seconds}s`
      });
      
      return { totalSeconds, minutes, seconds };
      
    } catch (error) {
      console.error('Error parsing duration:', error);
      return { totalSeconds: 0, minutes: 0, seconds: 0 };
    }
  };

  const { totalSeconds, minutes, seconds } = parseDuration();
  const formattedDuration = totalSeconds > 0 ? `${minutes}m ${seconds}s` : '0m 0s';
  const stops = stopsCount ? parseInt(stopsCount, 10) : undefined;
  
  const [countdown, setCountdown] = useState(30);
  const viewShotRef = useRef<ViewShot>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleBackToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
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

  // Test button to check duration
  const testDuration = () => {
    Alert.alert(
      'Debug Info',
      `Duration value: ${duration}\n` +
      `Type: ${typeof duration}\n` +
      `Parsed: ${totalSeconds} seconds\n` +
      `Formatted: ${formattedDuration}\n` +
      `Raw params: ${JSON.stringify({
        duration,
        routeName,
        transportMode
      }, null, 2)}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.smallScreenPadding,
          isVerySmallScreen && styles.verySmallScreenPadding
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Shareable Card */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.9 }}
          style={[
            styles.card,
            isSmallScreen && styles.smallScreenCard,
            isVerySmallScreen && styles.verySmallScreenCard
          ]}
        >
          {/* Debug Button - Remove in production */}
          <Pressable 
            style={styles.debugButton} 
            onPress={testDuration}
            onLongPress={() => {
              Alert.alert(
                'All Parameters',
                JSON.stringify({
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
                }, null, 2)
              );
            }}
          >
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </Pressable>

          {/* Header */}
          <View style={[
            styles.header,
            isSmallScreen && styles.smallScreenHeader
          ]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>COMPLETED</Text>
            </View>
            <Text style={[
              styles.celebrate,
              isSmallScreen && styles.smallScreenCelebrate,
              isVerySmallScreen && styles.verySmallScreenCelebrate
            ]}>
              Journey Complete! 🎉
            </Text>
            <Text style={[
              styles.title,
              isSmallScreen && styles.smallScreenTitle
            ]}>
              {routeName ? `You completed ${routeName}` : 'Journey Completed Successfully'}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={[
            styles.statsGrid,
            isSmallScreen && styles.smallScreenStatsGrid
          ]}>
            <View style={[
              styles.statItem,
              isSmallScreen && styles.smallScreenStatItem
            ]}>
              <View style={[styles.statIcon, styles.clockIcon]}>
                <Clock size={isVerySmallScreen ? 16 : 20} color="#FFFFFF" />
              </View>
              {/* Display duration - fixed */}
              <Text style={[
                styles.statValue,
                isSmallScreen && styles.smallScreenStatValue
              ]}>
                {formattedDuration}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            {transportMode && (
              <View style={[
                styles.statItem,
                isSmallScreen && styles.smallScreenStatItem
              ]}>
                <View style={[styles.statIcon, styles.transportIcon]}>
                  <Route size={isVerySmallScreen ? 16 : 20} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.statValue,
                  isSmallScreen && styles.smallScreenStatValue
                ]} numberOfLines={1}>
                  {transportMode}
                </Text>
                <Text style={styles.statLabel}>Mode</Text>
              </View>
            )}
            
            {stops !== undefined && (
              <View style={[
                styles.statItem,
                isSmallScreen && styles.smallScreenStatItem
              ]}>
                <View style={[styles.statIcon, styles.stopsIcon]}>
                  <MapPin size={isVerySmallScreen ? 16 : 20} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.statValue,
                  isSmallScreen && styles.smallScreenStatValue
                ]}>
                  {stops}
                </Text>
                <Text style={styles.statLabel}>Stops</Text>
              </View>
            )}
            
            {driverName && (
              <View style={[
                styles.statItem,
                isSmallScreen && styles.smallScreenStatItem
              ]}>
                <View style={[styles.statIcon, styles.driverIcon]}>
                  <User size={isVerySmallScreen ? 16 : 20} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.statValue,
                  isSmallScreen && styles.smallScreenStatValue
                ]} numberOfLines={1}>
                  {driverName}
                </Text>
                <Text style={styles.statLabel}>Driver</Text>
              </View>
            )}
          </View>

          {/* If duration is 0, show a warning (debug only) */}
          {totalSeconds === 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Duration shows 0. Check debug info.
              </Text>
            </View>
          )}

          {/* Journey Details */}
          {(startPoint || endPoint || startedAt) && (
            <View style={[
              styles.detailsCard,
              isSmallScreen && styles.smallScreenDetailsCard
            ]}>
              <Text style={[
                styles.detailsTitle,
                isSmallScreen && styles.smallScreenDetailsTitle
              ]}>
                Journey Details
              </Text>
              
              {startedAt && (
                <View style={[
                  styles.detailRow,
                  isSmallScreen && styles.smallScreenDetailRow
                ]}>
                  <Text style={[
                    styles.detailLabel,
                    isSmallScreen && styles.smallScreenDetailLabel
                  ]}>Started:</Text>
                  <Text style={[
                    styles.detailValue,
                    isSmallScreen && styles.smallScreenDetailValue
                  ]}>
                    {formatTime(startedAt)}
                  </Text>
                </View>
              )}
              
              {startPoint && (
                <View style={[
                  styles.detailRow,
                  isSmallScreen && styles.smallScreenDetailRow
                ]}>
                  <View style={styles.iconContainer}>
                    <Flag size={isVerySmallScreen ? 14 : 16} color="#1ea2b1" />
                  </View>
                  <Text style={[
                    styles.detailValue,
                    isSmallScreen && styles.smallScreenDetailValue
                  ]} numberOfLines={2}>
                    {startPoint}
                  </Text>
                </View>
              )}
              
              {endPoint && (
                <View style={[
                  styles.detailRow,
                  isSmallScreen && styles.smallScreenDetailRow
                ]}>
                  <View style={styles.iconContainer}>
                    <Flag size={isVerySmallScreen ? 14 : 16} color="#1ea2b1" />
                  </View>
                  <Text style={[
                    styles.detailValue,
                    isSmallScreen && styles.smallScreenDetailValue
                  ]} numberOfLines={2}>
                    {endPoint}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Community Section */}
          <View style={[
            styles.communityCard,
            isSmallScreen && styles.smallScreenCommunityCard
          ]}>
            <View style={styles.communityHeader}>
              <MessageCircle size={isVerySmallScreen ? 18 : 20} color="#25D366" />
              <Text style={[
                styles.communityTitle,
                isSmallScreen && styles.smallScreenCommunityTitle
              ]}>
                Join Our Community
              </Text>
            </View>
            <Text style={[
              styles.communityDescription,
              isSmallScreen && styles.smallScreenCommunityDescription
            ]}>
              Get real-time updates and connect with fellow travelers
            </Text>
            <Pressable 
              style={[
                styles.whatsappButton,
                isSmallScreen && styles.smallScreenWhatsappButton
              ]} 
              onPress={handleJoinWhatsAppChannel}
            >
              <Text style={[
                styles.whatsappButtonText,
                isSmallScreen && styles.smallScreenWhatsappButtonText
              ]}>
                Join WhatsApp Channel
              </Text>
            </Pressable>
            <Text style={[
              styles.communityNote,
              isSmallScreen && styles.smallScreenCommunityNote
            ]}>
              Stay informed about route changes and service updates
            </Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={[
          styles.actions,
          isSmallScreen && styles.smallScreenActions
        ]}>
          <Pressable 
            style={[
              styles.secondaryButton,
              isSmallScreen && styles.smallScreenSecondaryButton
            ]} 
            onPress={handleShare}
          >
            <Text style={[
              styles.secondaryButtonText,
              isSmallScreen && styles.smallScreenSecondaryButtonText
            ]}>
              Share Journey
            </Text>
          </Pressable>
          <Pressable 
            style={[
              styles.primaryButton,
              isSmallScreen && styles.smallScreenPrimaryButton
            ]} 
            onPress={handleBackToHome}
          >
            <Text style={[
              styles.primaryButtonText,
              isSmallScreen && styles.smallScreenPrimaryButtonText
            ]}>
              Return Home
            </Text>
          </Pressable>
        </View>

        {/* Countdown */}
        <View style={styles.countdownContainer}>
          <Text style={[
            styles.countdownText,
            isSmallScreen && styles.smallScreenCountdownText
          ]}>
            Auto-redirect in <Text style={styles.countdownHighlight}>{countdown}s</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  smallScreenPadding: {
    padding: 12,
  },
  verySmallScreenPadding: {
    padding: 8,
  },

  // Debug Button
  debugButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 100,
  },
  debugButtonText: {
    color: '#ff6b6b',
    fontSize: 10,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: '500',
  },

  // Card Container
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  smallScreenCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  verySmallScreenCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  // Header Section
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  smallScreenHeader: {
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  celebrate: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  smallScreenCelebrate: {
    fontSize: 20,
    marginBottom: 6,
  },
  verySmallScreenCelebrate: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  smallScreenTitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  smallScreenStatsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  smallScreenStatItem: {
    padding: 12,
    borderRadius: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallScreenStatIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  clockIcon: {
    backgroundColor: '#1ea2b1',
  },
  transportIcon: {
    backgroundColor: '#8B5CF6',
  },
  stopsIcon: {
    backgroundColor: '#10B981',
  },
  driverIcon: {
    backgroundColor: '#F59E0B',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  smallScreenStatValue: {
    fontSize: 14,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Journey Details
  detailsCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  smallScreenDetailsCard: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  smallScreenDetailsTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallScreenDetailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    width: 70,
  },
  smallScreenDetailLabel: {
    fontSize: 12,
    width: 65,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  smallScreenDetailValue: {
    fontSize: 12,
    marginLeft: 8,
  },
  iconContainer: {
    width: 22,
    alignItems: 'center',
  },

  // Community Section
  communityCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#25D36620',
    borderLeftWidth: 3,
    borderLeftColor: '#25D366',
  },
  smallScreenCommunityCard: {
    padding: 14,
    borderRadius: 12,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  communityTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  smallScreenCommunityTitle: {
    fontSize: 15,
  },
  communityDescription: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  smallScreenCommunityDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  smallScreenWhatsappButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  smallScreenWhatsappButtonText: {
    fontSize: 13,
  },
  communityNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  smallScreenCommunityNote: {
    fontSize: 10,
    lineHeight: 14,
  },

  // Action Buttons
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  smallScreenActions: {
    gap: 10,
    marginBottom: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  smallScreenPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  smallScreenPrimaryButtonText: {
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  smallScreenSecondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  smallScreenSecondaryButtonText: {
    fontSize: 14,
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  countdownText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  smallScreenCountdownText: {
    fontSize: 12,
  },
  countdownHighlight: {
    color: '#1ea2b1',
    fontWeight: '700',
  },
});