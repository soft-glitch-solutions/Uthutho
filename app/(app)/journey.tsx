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
  Easing,
  Dimensions
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Header Component
const PremiumHeader = ({ onBack, userProfile, colors }: any) => {
  return (
    <View style={styles.headerTop}>
      <TouchableOpacity 
        onPress={onBack} 
        style={styles.backBtn}
      >
        <ArrowLeft size={24} color="#FFF" />
      </TouchableOpacity>
      
      <Text style={styles.brandText}>Uthutho</Text>
      
      <TouchableOpacity 
        onPress={() => router.push('/profile')}
        style={styles.profileBtn}
      >
        {userProfile?.avatar_url ? (
          <Image
            source={{ uri: userProfile.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User color="#FFF" size={20} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function JourneyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeJourney, loading, refreshActiveJourney } = useJourney();

  const [showArrivedAnimation, setShowArrivedAnimation] = useState(false);
  const [isProcessingArrival, setIsProcessingArrival] = useState(false);

  const journeyData = useJourneyData();
  const {
    locationPermission,
    setLocationPermission,
    isUpdatingLocation,
  } = useLocationUpdates(
    journeyData.participantStatus,
    activeJourney?.id,
    journeyData.currentUserId
  );

  const {
    chatMessages,
    newMessage,
    setNewMessage,
    loadChatMessages,
    subscribeToChat,
    sendChatMessage
  } = useChat(
    activeJourney?.id,
    journeyData.currentUserId
  );

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
    () => { }
  );

  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);

  const { userProfile } = journeyData;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [activeJourney]);

  const handleStopPress = (stop: JourneyStop) => {
    setSelectedStop(stop);
    setShowStopDetails(true);
  };

  const handleArrived = async () => {
    if (isProcessingArrival) return;
    try {
      setIsProcessingArrival(true);
      setShowArrivedAnimation(true);
      await actions.updateParticipantStatus('arrived');
    } catch (error) {
      console.error(error);
      setIsProcessingArrival(false);
      setShowArrivedAnimation(false);
      Alert.alert('Error', 'Failed to process arrival');
    }
  };

  const renderContent = () => {
    if (loading) return <JourneySkeleton />;

    if (!activeJourney) {
      return (
        <View style={styles.noJourneyContainer}>
          <NoActiveJourney />
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={async () => {
              if (refreshActiveJourney) await refreshActiveJourney();
            }}
          >
            <Text style={styles.retryBtnText}>RETRY LOADING</Text>
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
          onArrived={handleArrived}
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
          onAnimationComplete={() => {}}
          duration={0}
          message="Processing your arrival and awarding points..."
        />
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <PremiumHeader 
          onBack={() => router.back()} 
          userProfile={userProfile} 
          colors={colors} 
        />

        <View style={styles.greetingSection}>
          <Text style={styles.readyText}>READY TO MOVE</Text>
          <Text style={styles.headingText}>My Journey</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  noJourneyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 32,
  },
  retryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});