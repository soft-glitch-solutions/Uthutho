import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Dimensions, 
  Linking,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Users, MessageCircle, MapPin, Flag, Route, User, Clock } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 375;

export default function JourneyCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width <= 375;
  
  const { 
    duration, 
    trips, 
    routeName, 
    transportMode,
    journeyId,
    startPoint,
    endPoint,
    stopsCount,
    driverName,
    startedAt,
    currentStop,
    ratingJourneyId
  } = useLocalSearchParams<{ 
    duration?: string; 
    trips?: string; 
    routeName?: string; 
    transportMode?: string;
    journeyId?: string;
    startPoint?: string;
    endPoint?: string;
    stopsCount?: string;
    driverName?: string;
    startedAt?: string;
    currentStop?: string;
    ratingJourneyId?: string;
  }>();

  const seconds = duration ? Math.max(0, parseInt(duration, 10) || 0) : 0;
  const minutes = Math.floor(seconds / 60);
  const tripsCount = trips ? parseInt(trips, 10) : undefined;
  const stops = stopsCount ? parseInt(stopsCount, 10) : undefined;
  const currentStopNum = currentStop ? parseInt(currentStop, 10) : undefined;
  
  const [countdown, setCountdown] = useState(30);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    console.log('JourneyCompleteScreen params:', {
      duration, trips, routeName, transportMode, journeyId,
      startPoint, endPoint, stopsCount, driverName, ratingJourneyId
    });
    
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // Navigate home WITH rating prompt
          router.replace({
            pathname: '/home',
            params: { 
              refresh: Date.now(),
              showRatingForJourney: ratingJourneyId || journeyId
            }
          });
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
      console.error('Error sharing screenshot:', err);
    }
  };

// In JourneyCompleteScreen's handleBackToHome function:
  const handleBackToHome = () => {
    console.log('🎯 Navigating to home with params:', {
      ratingJourneyId,
      journeyId,
      refresh: Date.now()
    });
    
    // Navigate home WITH rating prompt
    router.replace({
      pathname: '/(tabs)',
      params: { 
        refresh: Date.now(),
        showRatingForJourney: ratingJourneyId || journeyId // Pass journey ID for rating
      }
    });
  };

  const handleJoinWhatsAppChannel = () => {
    const whatsappUrl = 'https://whatsapp.com/channel/0029VbBvCFSFMqrRi2c83q0Z';
    Linking.openURL(whatsappUrl).catch(err => 
      console.error('Error opening WhatsApp:', err)
    );
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

  // Calculate responsive values
  const responsive = {
    paddingHorizontal: isSmallScreen ? 16 : 24,
    cardPaddingVertical: isSmallScreen ? 20 : 34,
    cardPaddingHorizontal: isSmallScreen ? 16 : 26,
    celebrateFontSize: isSmallScreen ? 24 : 32,
    titleFontSize: isSmallScreen ? 16 : 18,
    detailItemWidth: isSmallScreen ? '100%' : '48%',
    detailItemMarginBottom: isSmallScreen ? 8 : 0,
    infoPillPadding: isSmallScreen ? 8 : 10,
    actionButtonPadding: isSmallScreen ? 10 : 12,
    actionButtonFontSize: isSmallScreen ? 14 : 16,
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.9 }}
        style={[
          styles.card,
          {
            width: Math.min(width - responsive.paddingHorizontal * 2, 520),
            paddingVertical: responsive.cardPaddingVertical,
            paddingHorizontal: responsive.cardPaddingHorizontal,
          }
        ]}
      >
        <Text style={[styles.celebrate, { fontSize: responsive.celebrateFontSize }]}>
          🎉 Journey Complete!
        </Text>

        <Text style={[styles.title, { fontSize: responsive.titleFontSize }]}>
          {routeName ? `You completed ${routeName}` : 'Your journey is complete!'}
        </Text>
        
        {startPoint && endPoint && (
          <View style={styles.routeInfo}>
            <View style={styles.routePointContainer}>
              <MapPin size={isSmallScreen ? 14 : 16} color="#4ade80" />
              <Text style={styles.routePoint} numberOfLines={2}>
                {startPoint}
              </Text>
            </View>
            <View style={styles.routeArrowContainer}>
              <View style={styles.routeLine} />
              <Text style={styles.routeArrow}>↓</Text>
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routePointContainer}>
              <Flag size={isSmallScreen ? 14 : 16} color="#ef4444" />
              <Text style={styles.routePoint} numberOfLines={2}>
                {endPoint}
              </Text>
            </View>
          </View>
        )}
        
        {/* Journey Details Grid - Stack on small screens */}
        <View style={[
          styles.detailsGrid,
          isSmallScreen && styles.detailsGridSmall
        ]}>
          {transportMode && (
            <View style={[
              styles.detailItem,
              { 
                width: responsive.detailItemWidth,
                marginBottom: responsive.detailItemMarginBottom
              }
            ]}>
              <Route size={isSmallScreen ? 16 : 18} color="#1ea2b1" />
              <Text style={styles.detailLabel}>Transport</Text>
              <Text style={styles.detailValue}>{transportMode}</Text>
            </View>
          )}
          
          {driverName && (
            <View style={[
              styles.detailItem,
              { 
                width: responsive.detailItemWidth,
                marginBottom: responsive.detailItemMarginBottom
              }
            ]}>
              <User size={isSmallScreen ? 16 : 18} color="#1ea2b1" />
              <Text style={styles.detailLabel}>Driver</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{driverName}</Text>
            </View>
          )}
          
          {stops && (
            <View style={[
              styles.detailItem,
              { 
                width: responsive.detailItemWidth,
                marginBottom: responsive.detailItemMarginBottom
              }
            ]}>
              <MapPin size={isSmallScreen ? 16 : 18} color="#1ea2b1" />
              <Text style={styles.detailLabel}>Stops</Text>
              <Text style={styles.detailValue}>{stops}</Text>
            </View>
          )}
          
          {startedAt && (
            <View style={[
              styles.detailItem,
              { 
                width: responsive.detailItemWidth,
                marginBottom: responsive.detailItemMarginBottom
              }
            ]}>
              <Clock size={isSmallScreen ? 16 : 18} color="#1ea2b1" />
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>{formatTime(startedAt)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.subtitle}>
          Thanks for using Uthutho — your smart transport companion 🚍
        </Text>

        {seconds > 0 && (
          <View style={[styles.infoPill, { padding: responsive.infoPillPadding }]}>
            <Clock size={isSmallScreen ? 16 : 18} color="#fbbf24" />
            <View style={styles.infoPillContent}>
              <Text style={styles.infoText}>Ride Duration</Text>
              <Text style={styles.infoValue}>{minutes} min {seconds % 60}s</Text>
            </View>
          </View>
        )}

        {typeof tripsCount === 'number' && (
          <View style={[styles.infoPill, { padding: responsive.infoPillPadding }]}>
            <Users size={isSmallScreen ? 16 : 18} color="#1ea2b1" />
            <View style={styles.infoPillContent}>
              <Text style={styles.infoText}>Total Trips</Text>
              <Text style={styles.infoValue}>{tripsCount}</Text>
            </View>
          </View>
        )}
        
        {currentStopNum && (
          <View style={[styles.infoPill, { padding: responsive.infoPillPadding }]}>
            <Flag size={isSmallScreen ? 16 : 18} color="#10b981" />
            <View style={styles.infoPillContent}>
              <Text style={styles.infoText}>Final Stop</Text>
              <Text style={styles.infoValue}>#{currentStopNum}</Text>
            </View>
          </View>
        )}

        {/* WhatsApp Channel Section */}
        <View style={styles.whatsappSection}>
          <View style={styles.whatsappHeader}>
            <MessageCircle size={isSmallScreen ? 20 : 24} color="#25D366" />
            <Text style={[
              styles.whatsappTitle,
              isSmallScreen && { fontSize: 16 }
            ]}>
              Join Our Community
            </Text>
          </View>
          
          <Text style={[
            styles.whatsappDescription,
            isSmallScreen && { fontSize: 13 }
          ]}>
            Get real-time updates, transport alerts, and connect with other commuters on our official WhatsApp channel
          </Text>

          <Pressable 
            style={styles.whatsappButton}
            onPress={handleJoinWhatsAppChannel}
          >
            <Users size={isSmallScreen ? 18 : 20} color="#ffffff" />
            <Text style={[
              styles.whatsappButtonText,
              isSmallScreen && { fontSize: 14 }
            ]}>
              Join WhatsApp Channel
            </Text>
          </Pressable>

          <Text style={styles.whatsappNote}>
            Stay informed about route changes and community events
          </Text>
        </View>
      </ViewShot>

      <View style={styles.actionsRow}>
        <Pressable 
          style={[
            styles.primaryButton, 
            { 
              paddingVertical: responsive.actionButtonPadding,
              paddingHorizontal: responsive.actionButtonPadding * 2
            }
          ]} 
          onPress={handleBackToHome}
        >
          <Text style={[
            styles.primaryButtonText,
            { fontSize: responsive.actionButtonFontSize }
          ]}>
            Back to Home
          </Text>
        </Pressable>

        <Pressable 
          style={[
            styles.secondaryButton,
            { 
              paddingVertical: responsive.actionButtonPadding,
              paddingHorizontal: responsive.actionButtonPadding * 1.5
            }
          ]} 
          onPress={handleShare}
        >
          <Text style={[
            styles.secondaryButtonText,
            { fontSize: responsive.actionButtonFontSize }
          ]}>
            Share Journey
          </Text>
        </Pressable>
      </View>

      <Text style={styles.countdown}>Returning home in {countdown}s…</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 520,
  },
  celebrate: {
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 18,
  },
  // Route Info Styles
  routeInfo: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  routePointContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  routePoint: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  routeArrowContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  routeLine: {
    width: 2,
    height: 10,
    backgroundColor: '#333333',
  },
  routeArrow: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  detailsGridSmall: {
    flexDirection: 'column',
    gap: 8,
  },
  detailItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 80,
    justifyContent: 'center',
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  // Info Pill
  infoPill: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoPillContent: {
    marginLeft: 10,
    flex: 1,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  // WhatsApp Section Styles
  whatsappSection: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#25D36620',
    alignItems: 'center',
    width: '100%',
  },
  whatsappHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappTitle: {
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  whatsappDescription: {
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
  whatsappNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    minWidth: 120,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 100,
  },
  secondaryButtonText: {
    color: '#cccccc',
    fontWeight: '600',
    textAlign: 'center',
  },
  countdown: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 10,
    marginBottom: 10,
  },
});