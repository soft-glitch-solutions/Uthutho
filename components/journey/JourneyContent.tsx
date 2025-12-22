// components/journey/JourneyContent.tsx
import React, { useState } from 'react';
import { InfoTab } from './InfoTab';
import { ChatTab } from './ChatTab';
import { StopDetailsModal } from './StopDetailsModal';
import { JourneyStop } from '@/types/journey';
import { useRouter } from 'expo-router'; // Import the router

interface JourneyContentProps {
  activeTab: 'info' | 'chat';
  fadeAnim: any;
  activeJourney: any;
  journeyStops: JourneyStop[];
  userStopName: string;
  currentUserId: string;
  otherPassengers: any[];
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
  chatMessages: any[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  selectedStop: JourneyStop | null;
  showStopDetails: boolean;
  setShowStopDetails: (show: boolean) => void;
}

export const JourneyContent: React.FC<JourneyContentProps> = ({
  activeTab,
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
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
  selectedStop,
  showStopDetails,
  setShowStopDetails
}) => {
  const router = useRouter(); // Initialize router

  // Navigation function to handle stop details navigation
  const handleNavigateToStopDetails = (stopId: string) => {
    // Navigate to stop details page
    router.push(`/stop-details?stopId=${stopId}`);
  };

  if (activeTab === 'info') {
    return (
      <>
        <InfoTab
          fadeAnim={fadeAnim}
          activeJourney={activeJourney}
          journeyStops={journeyStops}
          userStopName={userStopName}
          currentUserId={currentUserId}
          otherPassengers={otherPassengers}
          participantStatus={participantStatus}
          onStopPress={onStopPress}
          onPickedUp={onPickedUp}
          onArrived={onArrived}
          onNotifyAhead={onNotifyAhead}
          onShare={onShare}
          onCompleteJourney={onCompleteJourney}
          userProfile={userProfile}
          waitingTime={waitingTime}
          isUpdatingLocation={isUpdatingLocation}
          connectionError={connectionError}
          hasDriverInJourney={hasDriverInJourney}
          isDriver={isDriver}
          onlineCount={onlineCount}
          onNavigateToStopDetails={handleNavigateToStopDetails} // Pass navigation function
        />
        
        <StopDetailsModal
          stop={selectedStop}
          visible={showStopDetails}
          onClose={() => setShowStopDetails(false)}
          passengers={otherPassengers}
          onNavigateToStopDetails={handleNavigateToStopDetails} // Pass navigation function to modal
        />
      </>
    );
  } else {
    return (
      <ChatTab
        messages={chatMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={onSendMessage}
        currentUserId={currentUserId}
        onlineCount={onlineCount}
      />
    );
  }
};