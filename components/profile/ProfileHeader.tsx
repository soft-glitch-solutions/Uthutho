import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { LinkedAccountsBadge } from './LinkedAccountsBadge';
import { Shimmer } from './SkeletonComponents';

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
  accountsLoading,
  linkedAccounts,
  isDesktop = false
}) => {
  const { colors } = useTheme();

  // Function to get user's initial
  const getUserInitial = () => {
    if (!profile?.first_name) return 'U';
    
    const firstName = profile.first_name.trim();
    if (firstName.length > 0) {
      return firstName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Function to generate a color based on the user's initial
  const getInitialColor = (initial: string) => {
    // Create a consistent color based on the character
    const colorsList = [
      '#1ea2b1', // Teal
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#84cc16', // Lime
    ];
    
    // Use charCode to get a consistent index
    const index = initial.charCodeAt(0) % colorsList.length;
    return colorsList[index];
  };

  // Check if we should show the initial avatar
  const shouldShowInitial = !profile?.avatar_url || profile.avatar_url === '';

  const renderAvatar = () => {
    if (shouldShowInitial) {
      const initial = getUserInitial();
      const backgroundColor = getInitialColor(initial);
      
      return (
        <View style={[
          styles.avatar, 
          isDesktop ? styles.avatarDesktop : {},
          { backgroundColor }
        ]}>
          <Text style={[
            styles.initialText,
            isDesktop && styles.initialTextDesktop
          ]}>
            {initial}
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{
          uri: profile.avatar_url ||
            'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
        }}
        style={[styles.avatar, isDesktop && styles.avatarDesktop]}
      />
    );
  };

  const renderLoadingAvatar = () => (
    <Shimmer colors={colors} isDesktop={isDesktop}>
      <View style={[
        styles.avatar, 
        isDesktop && styles.avatarDesktop, 
        { backgroundColor: colors.border }
      ]} />
    </Shimmer>
  );

  if (isDesktop) {
    return (
      <View style={[styles.header, styles.headerDesktop]}>
        {/* Linked Accounts Badge at the top */}
        <View style={styles.desktopBadgeWrapper}>
          <LinkedAccountsBadge 
            loading={accountsLoading} 
            accounts={linkedAccounts} 
            colors={colors} 
            isDesktop={isDesktop}
          />
        </View>

        <View style={styles.desktopContent}>
          {/* Avatar on the left */}
          <TouchableOpacity
            style={styles.desktopAvatarContainer}
            onPress={onImagePicker}
            disabled={uploading}
          >
            {loading ? (
              renderLoadingAvatar()
            ) : (
              <>
                {renderAvatar()}
                <View style={[styles.cameraButton, styles.cameraButtonDesktop, { backgroundColor: colors.primary }]}>
                  <Camera size={16} color="white" />
                </View>
                {uploading && (
                  <View style={[styles.uploadingOverlay, styles.uploadingOverlayDesktop]}>
                    <ActivityIndicator color="white" />
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* Text content on the right */}
          <View style={styles.desktopTextContent}>
            {loading ? (
              <>
                <Shimmer colors={colors} isDesktop={isDesktop}>
                  <View style={[styles.skeletonName, styles.skeletonNameDesktop, { backgroundColor: colors.border }]} />
                </Shimmer>
                <Shimmer colors={colors} isDesktop={isDesktop}>
                  <View style={[styles.skeletonTitle, styles.skeletonTitleDesktop, { backgroundColor: colors.border }]} />
                </Shimmer>
              </>
            ) : (
              <>
                <Text style={[styles.name, styles.nameDesktop]}>
                  {profile?.first_name} {profile?.last_name}
                </Text>
                <Text style={[styles.userTitle, styles.userTitleDesktop]}>
                  {profile?.selected_title}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <LinkedAccountsBadge 
        loading={accountsLoading} 
        accounts={linkedAccounts} 
        colors={colors} 
        isDesktop={isDesktop}
      />

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onImagePicker}
        disabled={uploading}
      >
        {loading ? (
          renderLoadingAvatar()
        ) : (
          <>
            {renderAvatar()}
            <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
              <Camera size={16} color="white" />
            </View>
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
      
      {loading ? (
        <Shimmer colors={colors} isDesktop={isDesktop}>
          <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
        </Shimmer>
      ) : (
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.first_name} {profile?.last_name}
        </Text>
      )}
      
      {loading ? (
        <Shimmer colors={colors} isDesktop={isDesktop}>
          <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
        </Shimmer>
      ) : (
        <Text style={[styles.userTitle, { color: colors.primary }]}>{profile?.selected_title}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles (mobile)
  header: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  initialTextDesktop: {
    fontSize: 50,
    lineHeight: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FFFFFF',
  },
  userTitle: {
    fontSize: 16,
    color: '#1ea2b1',
  },
  skeletonName: {
    width: 200,
    height: 30,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#333333',
  },
  skeletonTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#333333',
  },

  // Desktop styles
  headerDesktop: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 24,
    backgroundColor: '#111111',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  desktopBadgeWrapper: {
    marginBottom: 24,
    width: '100%',
  },
  desktopContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
    width: '100%',
  },
  desktopAvatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarDesktop: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  cameraButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    bottom: 5,
    right: 5,
    borderWidth: 3,
    borderColor: '#111111',
  },
  uploadingOverlayDesktop: {
    borderRadius: 70,
  },
  desktopTextContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 140,
  },
  nameDesktop: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
    lineHeight: 34,
  },
  userTitleDesktop: {
    fontSize: 18,
    color: '#1ea2b1',
    marginBottom: 4,
  },
  skeletonNameDesktop: {
    width: 250,
    height: 34,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#333333',
  },
  skeletonTitleDesktop: {
    width: 180,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
});