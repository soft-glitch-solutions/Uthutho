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
  Animated
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useJourney } from '@/hook/useJourney';
import { JourneyHeader } from '@/components/journey/JourneyHeader';
import { JourneyTabs } from '@/components/journey/JourneyTabs';
import { JourneySkeleton } from '@/components/journey/JourneySkeleton';
import { NoActiveJourney } from '@/components/journey/NoActiveJourney';
import { JourneyContent } from '@/components/journey/JourneyContent';
import { ArrivedAnimation } from '@/components/journey/ArrivedAnimation';
import { JourneyStop } from '@/types/journey';

import { useJourneyData } from '@/components/journey/hooks/useJourneyData';
import { useJourneyActions } from '@/components/journey/hooks/useJourneyActions';
import { useLocationUpdates } from '@/components/journey/hooks/useLocationUpdates';
import { useChat } from '@/components/journey/hooks/useChat';

export default function JourneyScreen() {
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
    () => {} // setUserStopName - handle this if needed
  );

  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);
  
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
          activeTab={activeTab}
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
        <JourneyHeader title="Active Journey" />
        
        <JourneyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessages={unreadMessages}
          onlineCount={journeyData.onlineCount}
        />
        
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
});