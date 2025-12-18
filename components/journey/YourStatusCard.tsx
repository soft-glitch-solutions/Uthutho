import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native'; // Fixed import

interface YourStatusCardProps {
  userProfile: any;
  userStopName: string;
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  waitingTime: number;
  isUpdatingLocation: boolean;
}

export const YourStatusCard: React.FC<YourStatusCardProps> = ({
  userProfile,
  userStopName,
  participantStatus,
  waitingTime,
  isUpdatingLocation
}) => {
  const getProfileInitial = () => {
    if (!userProfile) return 'Y';
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`;
    } else if (userProfile.first_name) {
      return userProfile.first_name[0];
    }
    return 'Y';
  };

  const formatWaitingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.yourStopRow}>
      <View style={styles.profileContainer}>
        {userProfile?.avatar_url ? (
          <Image 
            source={{ uri: userProfile.avatar_url }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profileInitial}>{getProfileInitial()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.yourStopInfo}>
        <Text style={styles.yourStopName} numberOfLines={1}>
          {participantStatus === 'waiting' ? userStopName : 'On Board'}
        </Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            participantStatus === 'waiting' ? styles.waitingDot : 
            participantStatus === 'picked_up' ? styles.pickedUpDot :
            styles.arrivedDot
          ]} />
          <Text style={styles.yourStopStatus} numberOfLines={1}>
            {participantStatus === 'waiting' ? 'Waiting for pickup' : 
              participantStatus === 'picked_up' ? 'On board - Picked up' : 
              'Arrived'}
          </Text>
          {isUpdatingLocation && participantStatus === 'picked_up' && (
            <View style={styles.locationUpdating}>
              <Text style={styles.locationUpdatingText}>🔄 Live</Text>
            </View>
          )}
        </View>
        <Text style={styles.yourStopTime} numberOfLines={1}>
          {participantStatus === 'waiting' ? `Waiting: ${formatWaitingTime(waitingTime)}` : 
            participantStatus === 'picked_up' ? 'On the way to destination' :
            'Journey completed'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  yourStopRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    marginBottom: 10,
    alignItems: 'center',
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  yourStopInfo: {
    flex: 1,
    minWidth: 0,
  },
  yourStopName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  waitingDot: {
    backgroundColor: '#fbbf24',
  },
  pickedUpDot: {
    backgroundColor: '#34d399',
  },
  arrivedDot: {
    backgroundColor: '#4ade80',
  },
  yourStopStatus: {
    fontSize: 10,
    color: '#cccccc',
    fontWeight: '500',
    marginRight: 6,
    flexShrink: 1,
  },
  locationUpdating: {
    backgroundColor: '#1ea2b130',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationUpdatingText: {
    fontSize: 9,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  yourStopTime: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '500',
  },
});