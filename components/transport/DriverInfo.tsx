import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Star, Shield, ChevronRight, MessageSquare, Phone } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';

interface DriverInfoProps {
  transport: SchoolTransport;
  onViewProfile: () => void;
  onMessage: () => void;
  onCall: () => void;
}

export const DriverInfo: React.FC<DriverInfoProps> = ({
  transport,
  onViewProfile,
  onMessage,
  onCall,
}) => {
  const driverName = `${transport.driver.profiles.first_name} ${transport.driver.profiles.last_name}`;
  const driverRating = transport.driver.profiles.rating || 0;
  const driverTrips = transport.driver.profiles.total_trips || 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Driver Information</Text>
      <TouchableOpacity style={styles.driverCard} onPress={onViewProfile}>
        <View style={styles.driverInfo}>
          {transport.driver.profiles.avatar_url ? (
            <Image 
              source={{ uri: transport.driver.profiles.avatar_url }}
              style={styles.driverAvatar}
            />
          ) : (
            <View style={styles.driverAvatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {transport.driver.profiles.first_name?.[0]}{transport.driver.profiles.last_name?.[0]}
              </Text>
            </View>
          )}
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driverName}</Text>
            
            <View style={styles.driverStats}>
              <View style={styles.driverStat}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.driverStatText}>
                  {driverRating.toFixed(1)} ({driverTrips} trips)
                </Text>
              </View>
              
            </View>
          </View>
        </View>
        
        <ChevronRight size={20} color="#666666" />
      </TouchableOpacity>

      {(transport.driver.profiles.phone || transport.driver.profiles.email) && (
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={[styles.contactButton, styles.messageButton]}
            onPress={onMessage}
          >
            <MessageSquare size={20} color="#1ea2b1" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          
          {transport.driver.profiles.phone && (
            <TouchableOpacity 
              style={[styles.contactButton, styles.callButton]}
              onPress={onCall}
            >
              <Phone size={20} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#111111',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverStatText: {
    color: '#888888',
    fontSize: 12,
    marginLeft: 4,
  },
  driverVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  driverVerifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButton: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  messageButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#1ea2b1',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});