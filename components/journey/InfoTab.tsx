// components/journey/InfoTab.tsx
import React from 'react';
import {
  View,
  ScrollView,
  Animated,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { VerticalRouteTimeline } from '@/components/journey/VerticalRouteTimeline';
import { ConnectionError } from '@/components/journey/ConnectionError';
import { JourneyStop, Passenger } from '@/types/journey';
import { JourneyChat } from './JourneyChat';
import { CompactHeader } from './CompactHeader';
import { ActionButtons } from './ActionButtons';
import { YourStatusCard } from './YourStatusCard';
import { StatisticsRow } from './StatisticsRow';

interface InfoTabProps {
  fadeAnim: Animated.Value;
  activeJourney: any;
  journeyStops: JourneyStop[];
  userStopName: string;
  currentUserId: string;
  otherPassengers: Passenger[];
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  onStopPress: (stop: JourneyStop) => void;
  onPickedUp: () => void;
  onArrived: () => void;
  onNotifyAhead: () => void;
  onShare: () => void;
  onCompleteJourney?: () => void;
  userProfile: any;
  waitingTime: number;
  isUpdatingLocation: boolean;
  connectionError: boolean;
  hasDriverInJourney: boolean;
  isDriver: boolean;
  onlineCount: number;
  showChatAtBottom?: boolean;
  chatMessages?: any[];
  newMessage?: string;
  setNewMessage?: (message: string) => void;
  onSendMessage?: (message: string) => Promise<void>;
  onNavigateToStopDetails?: (stopId: string) => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  fadeAnim,
  activeJourney,
  journeyStops,
  userStopName,
  currentUserId,
  otherPassengers,
  participantStatus,
  onStopPress,
  onPickedUp,
  onArrived,
  onNotifyAhead,
  onShare,
  onCompleteJourney,
  userProfile,
  waitingTime,
  isUpdatingLocation,
  connectionError,
  hasDriverInJourney,
  isDriver,
  onlineCount,
  showChatAtBottom,
  chatMessages = [],
  newMessage = '',
  setNewMessage = () => {},
  onSendMessage = async () => {},
}) => {
  const router = useRouter();

  const getEstimatedArrival = () => {
    if (!activeJourney || journeyStops.length === 0) return 'Unknown';

    const currentStopSequence = activeJourney.current_stop_sequence || 0;
    const remainingStops = journeyStops.length - currentStopSequence;
    const estimatedMinutes = remainingStops * 3;
    
    return `${estimatedMinutes}m`;
  };

  const handleNavigateToStopDetails = (stopId: string) => {
    // Navigate using your router
    router.push(`/stop-details?stopId=${stopId}`);
  };

  return (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact Journey Header */}
        <CompactHeader
          routeName={activeJourney.routes.name}
          transportType={activeJourney.routes.transport_type}
          startPoint={activeJourney.routes.start_point}
          endPoint={activeJourney.routes.end_point}
        />

        {/* Action Buttons (Elevated to top) */}
        <ActionButtons
          participantStatus={participantStatus}
          onPickedUp={onPickedUp}
          onArrived={onArrived}
          onNotifyAhead={onNotifyAhead}
          onShare={onShare}
        />

        {/* Vertical Route Timeline */}
        <VerticalRouteTimeline
          stops={journeyStops}
          currentUserStopName={userStopName}
          currentUserId={currentUserId}
          passengers={otherPassengers}
          transportType={activeJourney.routes.transport_type}
          currentStopSequence={activeJourney.current_stop_sequence || 0}
          participantStatus={participantStatus}
          onStopPress={onStopPress}
          onNavigateToStopDetails={handleNavigateToStopDetails}
        />

        {/* Statistics Row */}
        <StatisticsRow
          waitingTime={waitingTime}
          onlineCount={onlineCount}
          estimatedArrival={getEstimatedArrival()}
        />

        {/* Your Status Section */}
        <YourStatusCard
          userProfile={userProfile}
          userStopName={userStopName}
          participantStatus={participantStatus}
          waitingTime={waitingTime}
          isUpdatingLocation={isUpdatingLocation}
        />
        
        {connectionError && (
          <View style={styles.errorContainer}>
            <ConnectionError />
          </View>
        )}

        {/* No Driver Indicator */}
        {!hasDriverInJourney && !isDriver && (
          <TouchableOpacity style={styles.noDriverCard}>
            <Text style={styles.noDriverText}>No driver assigned</Text>
          </TouchableOpacity>
        )}

        {/* Complete Journey Button for Drivers */}
        {isDriver && participantStatus === 'arrived' && onCompleteJourney && (
          <View style={styles.completeJourneyContainer}>
            <TouchableOpacity
              style={styles.completeJourneyButton}
              onPress={() => {
                Alert.alert(
                  'Complete Journey',
                  'Are you sure you want to complete this journey? This will end the journey for all passengers.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Complete Journey', 
                      style: 'destructive',
                      onPress: onCompleteJourney 
                    }
                  ]
                );
              }}
            >
              <Text style={styles.completeJourneyButtonText}>
                Complete Journey
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.completeJourneyNote}>
              As the driver, you can complete the journey once all passengers have arrived at their destinations.
            </Text>
          </View>
        )}

        {/* Debug Button - Remove in production */}
        {__DEV__ && onCompleteJourney && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Debug: Complete Journey',
                'Test journey completion?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Test Complete', 
                    onPress: onCompleteJourney 
                  }
                ]
              );
            }}
          >
            <Text style={styles.debugButtonText}>Test Complete Journey</Text>
          </TouchableOpacity>
        )}

        {showChatAtBottom && (
          <View style={styles.chatSection}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Community Chat</Text>
            </View>
            <View style={{ height: 400 }}>
              <JourneyChat
                messages={chatMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={onSendMessage}
                currentUserId={currentUserId}
                onlineCount={onlineCount}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = {
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  errorContainer: {
    marginBottom: 10,
  },
  noDriverCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  noDriverText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
  },
  // Complete Journey Button Styles
  completeJourneyContainer: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeJourneyButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeJourneyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  completeJourneyNote: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Debug Button Styles
  debugButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatSection: {
    marginTop: 24,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  chatHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatTitle: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
};