// JourneyScreen.tsx (updated)
import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Pressable,
  Easing
} from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Menu, User, ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJourney } from '@/hook/useJourney';
import { JourneySkeleton } from '@/components/journey/JourneySkeleton';
import { NoActiveJourney } from '@/components/journey/NoActiveJourney';
import { JourneyContent } from '@/components/journey/JourneyContent';
import { ArrivedAnimation } from '@/components/journey/ArrivedAnimation';
import { JourneyStop } from '@/types/journey';

import { useJourneyData } from '@/components/journey/hooks/useJourneyData';
import { useJourneyActions } from '@/components/journey/hooks/useJourneyActions';
import { useLocationUpdates } from '@/components/journey/hooks/useLocationUpdates';
import { useChat } from '@/components/journey/hooks/useChat';

// Animated Hamburger Menu Component
const AnimatedHamburgerMenu = ({ onPress, color, textColor }: any) => {
  const rotation = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(rotation, { toValue: 1, duration: 150, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(rotation, { toValue: 0, duration: 150, easing: Easing.linear, useNativeDriver: true })
    ]).start();
    if (onPress) onPress();
  };

  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  return (
    <Pressable onPress={handlePress} style={styles.logoContainer}>
    </Pressable>
  );
};

export default function JourneyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeJourney, loading, refreshActiveJourney } = useJourney();

  // Add state for showing arrived animation
  const [showArrivedAnimation, setShowArrivedAnimation] = useState(false);
  const [isProcessingArrival, setIsProcessingArrival] = useState(false);

  // Use custom hooks
  const journeyData = useJourneyData();
  const {
    locationPermission,
    setLocationPermission,
    isUpdatingLocation,
    checkLocationPermission
  } = useLocationUpdates(
    journeyData.participantStatus,
    activeJourney?.id,
    journeyData.currentUserId
  );

  const {
    chatMessages,
    newMessage,
    setNewMessage,
    unreadMessages,
    loadChatMessages,
    subscribeToChat,
    sendChatMessage
  } = useChat(
    activeJourney?.id,
    journeyData.currentUserId
  );

  // Modified useJourneyActions hook to handle animation
  const actions = useJourneyActions(
    journeyData.currentUserId,
    journeyData.participantStatus,
    journeyData.setParticipantStatus,
    locationPermission,
    setLocationPermission,
    activeJourney,
    journeyData.refreshActiveJourney,
    journeyData.loadOtherPassengers,
    journeyData.loadJourneyStops,
    () => { } // setUserStopName - handle this if needed
  );

  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);

  const { userProfile } = journeyData;

  // Simple animation
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (activeJourney) {
      loadChatMessages();
      const unsubscribe = subscribeToChat();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [activeJourney]);

  const handleStopPress = (stop: JourneyStop) => {
    setSelectedStop(stop);
    setShowStopDetails(true);
  };

  // Custom handler for arrival that shows animation
  const handleArrived = async () => {
    if (isProcessingArrival) return;

    try {
      setIsProcessingArrival(true);
      setShowArrivedAnimation(true);

      // Update participant status to arrived
      await actions.updateParticipantStatus('arrived');

      // Note: The navigation will happen inside updateParticipantStatus
      // The animation will be on screen while that's processing

    } catch (error) {
      console.error('Error in arrival process:', error);
      setIsProcessingArrival(false);
      setShowArrivedAnimation(false);
      Alert.alert('Error', 'Failed to process arrival');
    }
  };

  // Handle animation completion (optional)
  const handleAnimationComplete = () => {
    // You can keep animation visible until navigation happens
    // or hide it after a certain time
    console.log('Animation completed');
  };

  // Add retry mechanism
  const renderContent = () => {
    if (loading) {
      return <JourneySkeleton />;
    }

    if (!activeJourney) {
      return (
        <View style={styles.noJourneyContainer}>
          <NoActiveJourney />
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              console.log('Manual retry...');
              if (refreshActiveJourney) {
                await refreshActiveJourney();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <JourneyContent
          activeTab="info"
          fadeAnim={fadeAnim}
          activeJourney={activeJourney}
          journeyStops={journeyData.journeyStops}
          userStopName={journeyData.userStopName}
          currentUserId={journeyData.currentUserId}
          otherPassengers={journeyData.otherPassengers}
          participantStatus={journeyData.participantStatus}
          onStopPress={handleStopPress}
          onPickedUp={() => actions.updateParticipantStatus('picked_up')}
          onArrived={handleArrived} // Use custom handler
          onNotifyAhead={actions.pingPassengersAhead}
          onShare={actions.shareJourney}
          userProfile={journeyData.userProfile}
          waitingTime={journeyData.waitingTime}
          isUpdatingLocation={isUpdatingLocation}
          connectionError={journeyData.connectionError}
          hasDriverInJourney={journeyData.hasDriverInJourney}
          isDriver={journeyData.isDriver}
          onlineCount={journeyData.onlineCount}
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendChatMessage}
          selectedStop={selectedStop}
          showStopDetails={showStopDetails}
          setShowStopDetails={setShowStopDetails}
          showChatAtBottom={true}
        />

        <ArrivedAnimation
          isVisible={showArrivedAnimation}
          onAnimationComplete={handleAnimationComplete}
          duration={0} // Set to 0 to not auto-hide, or set a longer duration
          message="Processing your arrival and awarding points..."
        />
      </>
    );
  };

  if (loading && !activeJourney) {
    return <JourneySkeleton />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <AnimatedHamburgerMenu
              onPress={() => { }}
              color={colors.primary}
              textColor={colors.text}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              {userProfile?.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.primary }}
                />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <User color="#fff" size={20} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingHeader}>
          <Text style={[styles.greetingText, { color: colors.primary }]}>Let's get moving on your Journey</Text>
        </View>

        {renderContent()}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  noJourneyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uthuthoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pointsContainer: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  greetingHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 5,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});