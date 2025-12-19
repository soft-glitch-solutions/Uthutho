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
  Alert,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';
import { 
  Clock, 
  Users, 
  MapPin, 
  Flag, 
  Route, 
  User, 
  MessageCircle,
  Share2,
  Home,
  Sparkles,
  Trophy,
  TrendingUp,
  CheckCircle
} from 'lucide-react-native';

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

  const [showAnimation, setShowAnimation] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [statItemsVisible, setStatItemsVisible] = useState<number[]>([]);
  const animationRef = useRef<LottieView>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [countdown, setCountdown] = useState(30);

  const parseDuration = () => {
    if (!duration && duration !== '0') {
      return { totalSeconds: 0, minutes: 0, seconds: 0, formatted: '0m 0s' };
    }
    
    try {
      let totalSeconds: number;
      
      if (typeof duration === 'string') {
        totalSeconds = parseInt(duration, 10);
      } else if (typeof duration === 'number') {
        totalSeconds = duration;
      } else {
        totalSeconds = 0;
      }
      
      if (isNaN(totalSeconds) || totalSeconds < 0) {
        totalSeconds = 0;
      }
      
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = totalSeconds > 0 ? `${minutes}m ${seconds}s` : '0m 0s';
      
      return { totalSeconds, minutes, seconds, formatted };
    } catch {
      return { totalSeconds: 0, minutes: 0, seconds: 0, formatted: '0m 0s' };
    }
  };

  const { totalSeconds, minutes, seconds, formatted } = parseDuration();
  const formattedDuration = formatted;
  const stops = stopsCount ? parseInt(stopsCount, 10) : undefined;

  // Handle animation sequence
  useEffect(() => {
    if (showAnimation) {
      // Play animation for 5 seconds
      const animationTimer = setTimeout(() => {
        setShowAnimation(false);
        setShowStats(true);
        
        // Animate stats items one by one
        const statsTimer = setTimeout(() => {
          const items = [0, 1, 2, 3];
          items.forEach((item, index) => {
            setTimeout(() => {
              setStatItemsVisible(prev => [...prev, item]);
            }, index * 200); // 200ms delay between each stat
          });
        }, 300); // Wait 300ms after animation before showing stats
        
        return () => clearTimeout(statsTimer);
      }, 5000); // 5 seconds animation

      return () => clearTimeout(animationTimer);
    }
  }, [showAnimation]);

  // Countdown timer (only starts after animation)
  useEffect(() => {
    if (showStats) {
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
    }
  }, [showStats, journeyId, ratingJourneyId]);

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          dialogTitle: '🎯 My Journey Stats',
          mimeType: 'image/png',
        });
      } else if (!uri) {
        Alert.alert('Error', 'Could not capture journey image');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch {
      Alert.alert('Error', 'Failed to share journey');
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
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp');
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  // Animation Screen
  if (showAnimation) {
    return (
      <SafeAreaView style={styles.animationContainer}>
        <View style={styles.animationContent}>
          <View style={styles.celebrationMessage}>
            <CheckCircle size={64} color="#10B981" style={styles.checkIcon} />
            <Text style={styles.celebrationTitle}>You Made It!</Text>
            <Text style={styles.celebrationSubtitle}>
              Journey completed successfully
            </Text>
          </View>
          
          {/* Lottie Animation */}
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <LottieView
              ref={animationRef}
              source={require('../../assets/animations/Celebrate.json')} // You'll need to add this file
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          ) : (
            <DotLottieReact
              src="https://lottie.host/e298b4d7-ec25-4809-9971-fd981511e67a/rWHuAlLHeZ.lottie"
              loop
              autoplay
              style={styles.lottieAnimation}
            />
          )}
          
          <Text style={styles.loadingText}>
            Calculating your journey stats...
          </Text>
          
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Stats Screen (with fade-in animation)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.smallScreenPadding,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Shareable Card */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.95 }}
          style={[
            styles.card,
            isSmallScreen && styles.smallScreenCard,
          ]}
        >
          {/* Header with celebration */}
          <View style={styles.header}>
            <View style={styles.trophyContainer}>
              <Text style={[
                styles.mainTitle,
                isSmallScreen && styles.smallScreenMainTitle
              ]}>
                Journey Complete
              </Text>
            </View>
            
          </View>

          {/* Stats Highlights with fade-in animation */}
          <View style={[
            styles.statsHighlights,
            isSmallScreen && styles.smallScreenStatsHighlights
          ]}>
            {/* Duration Stat */}
            <View style={[
              styles.statHighlight,
              { opacity: statItemsVisible.includes(1) ? 1 : 0 }
            ]}>
              <View style={[styles.statIconWrapper, styles.durationIcon]}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statHighlightValue}>{formattedDuration}</Text>
                <Text style={styles.statHighlightLabel}>Time</Text>
              </View>
            </View>
            
            {/* Transport Mode Stat */}
            {transportMode && (
              <View style={[
                styles.statHighlight,
                { opacity: statItemsVisible.includes(2) ? 1 : 0 }
              ]}>
                <View style={[styles.statIconWrapper, styles.modeIcon]}>
                  <Route size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statHighlightValue} numberOfLines={1}>
                    {transportMode}
                  </Text>
                  <Text style={styles.statHighlightLabel}>Mode</Text>
                </View>
              </View>
            )}
          </View>

          {/* Journey Info Card with fade-in */}
          <View style={[
            styles.infoCard,
            isSmallScreen && styles.smallScreenInfoCard,
            { opacity: statItemsVisible.includes(3) ? 1 : 0 }
          ]}>
            <Text style={styles.infoCardTitle}>Journey Details</Text>
            
            {startedAt && (
              <View style={styles.infoRow}>
                <Clock size={18} color="#9CA3AF" />
                <Text style={styles.infoLabel}>Started at</Text>
                <Text style={styles.infoValue}>{formatTime(startedAt)}</Text>
              </View>
            )}
            
            {startPoint && (
              <View style={styles.infoRow}>
                <Flag size={18} color="#10B981" />
                <Text style={styles.infoLabel}>From</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{startPoint}</Text>
              </View>
            )}
            
            {endPoint && (
              <View style={styles.infoRow}>
                <Flag size={18} color="#EF4444" />
                <Text style={styles.infoLabel}>To</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{endPoint}</Text>
              </View>
            )}
            
            {stops !== undefined && (
              <View style={styles.infoRow}>
                <MapPin size={18} color="#8B5CF6" />
                <Text style={styles.infoLabel}>Stops</Text>
                <Text style={styles.infoValue}>{stops}</Text>
              </View>
            )}
            
            {driverName && (
              <View style={styles.infoRow}>
                <User size={18} color="#F59E0B" />
                <Text style={styles.infoLabel}>Driver</Text>
                <Text style={styles.infoValue}>{driverName}</Text>
              </View>
            )}
          </View>

          {/* Share Prompt */}
          <View style={[
            styles.sharePrompt,
            { opacity: statItemsVisible.length === 4 ? 1 : 0 }
          ]}>
            <Share2 size={20} color="#1ea2b1" />
            <Text style={styles.sharePromptText}>
              Share your achievement with friends
            </Text>
          </View>

        </ViewShot>

        {/* Action Buttons */}
        <View style={[
          styles.actionContainer,
          isSmallScreen && styles.smallScreenActionContainer,
          { opacity: statItemsVisible.length === 4 ? 1 : 0 }
        ]}>
          <Pressable 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Card</Text>
          </Pressable>
          
          <View style={styles.actionButtonsRow}>
            <Pressable 
              style={styles.communityButton}
              onPress={handleJoinWhatsAppChannel}
            >
              <MessageCircle size={18} color="#25D366" />
              <Text style={styles.communityButtonText}>Join Community</Text>
            </Pressable>
            
            <Pressable 
              style={styles.homeButton}
              onPress={handleBackToHome}
            >
              <Home size={18} color="#FFFFFF" />
              <Text style={styles.homeButtonText}>Home</Text>
            </Pressable>
          </View>
        </View>

        {/* Countdown */}
        <View style={[
          styles.countdownWrapper,
          { opacity: statItemsVisible.length === 4 ? 1 : 0 }
        ]}>
          <View style={styles.countdownBubble}>
            <Text style={styles.countdownText}>
              Auto-redirect in <Text style={styles.countdownNumber}>{countdown}s</Text>
            </Text>
          </View>
          
          <Pressable 
            style={styles.skipButton}
            onPress={handleBackToHome}
          >
            <Text style={styles.skipButtonText}>Skip Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Animation Screen Styles
  animationContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  animationContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationMessage: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkIcon: {
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 300,
    height: 300,
    marginBottom: 30,
  },
  placeholderAnimation: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    width: '0%',
    animationKeyframes: {
      '0%': { width: '0%' },
      '100%': { width: '100%' },
    },
    animationDuration: '5s',
    animationTimingFunction: 'linear',
    animationIterationCount: 1,
  },

  // Original Stats Screen Styles (with animations)
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  smallScreenPadding: {
    padding: 12,
  },

  // Card Container
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  smallScreenCard: {
    padding: 20,
    borderRadius: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  celebrationText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  trophyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  smallScreenMainTitle: {
    fontSize: 24,
  },
  routeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 162, 177, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.3)',
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },

  // Stats Highlights
  statsHighlights: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  smallScreenStatsHighlights: {
    gap: 12,
  },
  statHighlight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  durationIcon: {
    backgroundColor: '#1ea2b1',
    shadowColor: '#1ea2b1',
  },
  modeIcon: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  statTextContainer: {
    flex: 1,
  },
  statHighlightValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statHighlightLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },
  smallScreenInfoCard: {
    padding: 16,
    borderRadius: 16,
  },
  infoCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    width: 70,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },

  // Share Prompt
  sharePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },
  sharePromptText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Branding Footer
  brandingFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  brandingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandingSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 1,
  },

  // Action Container
  actionContainer: {
    gap: 12,
    marginBottom: 20,
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },
  smallScreenActionContainer: {
    gap: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1ea2b1',
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  communityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  communityButtonText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '600',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Countdown
  countdownWrapper: {
    alignItems: 'center',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '500ms',
  },
  countdownBubble: {
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  countdownText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  countdownNumber: {
    color: '#1ea2b1',
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Additional styles for animations
  routeTagText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
});