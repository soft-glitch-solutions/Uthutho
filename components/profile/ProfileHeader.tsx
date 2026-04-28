import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import { Camera, Settings, User, Star, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

interface ProfileHeaderProps {
  loading: boolean;
  profile: any;
  uploading: boolean;
  onImagePicker: () => void;
  isDesktop: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading,
  profile,
  uploading,
  onImagePicker,
  isDesktop
}) => {
  const { colors } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Molo';
    if (hour < 18) return 'Sawubona';
    return 'Kunjani';
  };

  const formatRideTime = (minutes: number) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar Branding */}
      <View style={styles.topBar}>
        <Text style={styles.brandText}>Uthutho</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onImagePicker}
            disabled={uploading}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#111' }]}>
                <User size={20} color="#444" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Camera size={10} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Typography Section */}
      <View style={styles.heroSection}>
        <Text style={styles.readyText}>PROFILE OVERVIEW</Text>
        <Text style={styles.greetingText}>{getGreeting()}, {profile?.first_name || 'User'}</Text>
        <Text style={styles.headingText}>{profile?.selected_title || 'Community Member'}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statPill}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.statValue}>{profile?.points || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statPill}>
          <MapPin size={14} color="#1ea2b1" />
          <Text style={styles.statValue}>{profile?.trips || 0}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: Platform.OS === 'ios' ? 12 : 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1ea2b1',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1ea2b1',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    marginTop: 0,
    marginBottom: 24,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -1,
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1ea2b1',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  skeletonContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
