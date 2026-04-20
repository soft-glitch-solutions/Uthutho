import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Star, ChevronRight, MessageSquare, Phone } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const driverName = `${transport.driver.profiles.first_name} ${transport.driver.profiles.last_name}`;
  const driverRating = transport.driver.profiles.rating || 0;
  const driverTrips = transport.driver.profiles.total_trips || 0;

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Driver Information</Text>
      
      <TouchableOpacity 
        style={[styles.driverCard, { backgroundColor: colors.background, borderColor: colors.border }]} 
        onPress={onViewProfile}
      >
        <View style={styles.driverInfo}>
          {transport.driver.profiles.avatar_url ? (
            <Image 
              source={{ uri: transport.driver.profiles.avatar_url }}
              style={styles.driverAvatar}
            />
          ) : (
            <View style={[styles.driverAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitials}>
                {transport.driver.profiles.first_name?.[0]}{transport.driver.profiles.last_name?.[0]}
              </Text>
            </View>
          )}
          
          <View style={styles.driverDetails}>
            <Text style={[styles.driverName, { color: colors.text }]}>{driverName}</Text>
            <View style={styles.driverStats}>
              <View style={styles.driverStat}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <Text style={[styles.driverStatText, { color: colors.text }]}>
                  {driverRating.toFixed(1)} <Text style={{ opacity: 0.5 }}>({driverTrips} trips)</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color={colors.text} opacity={0.3} />
      </TouchableOpacity>

      {(transport.driver.profiles.phone || transport.driver.profiles.email) && (
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
            onPress={onMessage}
          >
            <MessageSquare size={18} color={colors.primary} />
            <Text style={[styles.contactButtonText, { color: colors.primary }]}>Message</Text>
          </TouchableOpacity>
          
          {transport.driver.profiles.phone && (
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={onCall}
            >
              <Phone size={18} color="#FFF" />
              <Text style={[styles.contactButtonText, { color: '#FFF' }]}>Call Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    marginRight: 14,
  },
  driverAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverStatText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
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
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});