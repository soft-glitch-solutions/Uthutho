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
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  loading,
  profile,
  uploading,
  onImagePicker,
  accountsLoading,
  linkedAccounts
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <LinkedAccountsBadge 
        loading={accountsLoading} 
        accounts={linkedAccounts} 
        colors={colors} 
      />

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onImagePicker}
        disabled={uploading}
      >
        {loading ? (
          <Shimmer colors={colors}>
            <View style={[styles.avatar, { backgroundColor: colors.border }]} />
          </Shimmer>
        ) : (
          <>
            <Image
              source={{
                uri: profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
              }}
              style={styles.avatar}
            />
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
        <Shimmer colors={colors}>
          <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
        </Shimmer>
      ) : (
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.first_name} {profile?.last_name}
        </Text>
      )}
      
      {loading ? (
        <Shimmer colors={colors}>
          <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
        </Shimmer>
      ) : (
        <Text style={[styles.userTitle, { color: colors.primary }]}>{profile?.selected_title}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
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
  },
  userTitle: {
    fontSize: 16,
  },
  skeletonName: {
    width: 200,
    height: 30,
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
  },
});