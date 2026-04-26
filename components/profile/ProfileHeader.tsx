import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Camera, User, Settings } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface ProfileHeaderProps {
  loading: boolean;
  profile: any;
  uploading: boolean;
  onImagePicker: () => void;
  accountsLoading: boolean;
  linkedAccounts: any[];
  isDesktop?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading,
  profile,
  uploading,
  onImagePicker,
  isDesktop = false
}) => {
  const { colors } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderAvatar = () => {
    if (loading) {
      return <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]} />;
    }

    if (!profile?.avatar_url) {
      return (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
          <User size={20} color="#fff" />
        </View>
      );
    }

    return (
      <Image
        source={{ uri: profile.avatar_url }}
        style={styles.avatarImage}
      />
    );
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      {/* Top Bar Branding */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: colors.text }]}>Uthutho</Text>
        </View>
        
        <View style={styles.topActions}>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={onImagePicker}
            disabled={uploading}
          >
            {renderAvatar()}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Camera size={10} color="white" />
            </View>
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Typography Section */}
      <View style={styles.heroSection}>
        <Text style={[styles.readyText, { color: colors.primary }]}>
          PROFILE OVERVIEW
        </Text>

        <Text style={[styles.greetingText, { color: colors.text }]}>
          {getGreeting()} {profile?.first_name || 'Explorer'},
        </Text>

        <Text style={[styles.headingText, { color: colors.primary }]}>
          {profile?.selected_title || 'shaping your journey.'}
        </Text>
        
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile?.points || 0}</Text>
            <Text style={styles.statLabel}>POINTS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{profile?.level || 1}</Text>
            <Text style={styles.statLabel}>LEVEL</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.identities?.length || 1}
            </Text>
            <Text style={styles.statLabel}>LINKS</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#333',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    marginBottom: 24,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headingText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
});