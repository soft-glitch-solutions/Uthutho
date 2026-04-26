import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Edit, Settings, LogOut, Plus, Check, X, Trophy, ChevronRight, Mail, Globe, Facebook, Twitter } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { LinkedAccount } from '@/types/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface BasicInfoTabProps {
  colors: any;
  accountsLoading: boolean;
  linkedAccounts: LinkedAccount[];
  onSignOut: () => void;
  onConnectAccount: (provider: string) => Promise<void>;
  isDesktop?: boolean;
}

const AVAILABLE_PROVIDERS = [
  { id: 'google', name: 'Google', icon: <Globe size={20} color="#DB4437" />, color: '#DB4437', points: 50 },
  { id: 'facebook', name: 'Facebook', icon: <Facebook size={20} color="#1877F2" />, color: '#1877F2', points: 50 },
];

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  colors,
  accountsLoading,
  linkedAccounts,
  onSignOut,
  onConnectAccount,
  isDesktop = false
}) => {
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    points?: number;
  }>({
    type: 'info',
    title: '',
    message: ''
  });

  const isProviderConnected = (provider: string) => {
    const account = linkedAccounts.find(acc => acc.provider === provider);
    return account?.connected || false;
  };

  const getAccountEmail = (provider: string) => {
    const account = linkedAccounts.find(acc => acc.provider === provider);
    return account?.email || null;
  };

  const handleConnectAccount = async (provider: string) => {
    if (isProviderConnected(provider)) return;

    setConnectingProvider(provider);
    try {
      await onConnectAccount(provider);
    } catch (error) {
      console.error('Error connecting account:', error);
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.primary }]}>ACCOUNT SETTINGS</Text>
        
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/EditProfileScreen')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
            <Edit size={20} color={colors.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={styles.menuSubtitle}>Change your name or title</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(120, 120, 120, 0.1)' }]}>
            <Settings size={20} color="#666" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Settings</Text>
            <Text style={styles.menuSubtitle}>Privacy and notifications</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Social Connections */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.primary }]}>SOCIAL CONNECTIONS</Text>
        
        <View style={styles.grid}>
          {AVAILABLE_PROVIDERS.map((provider) => {
            const isConnected = isProviderConnected(provider.id);
            return (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.socialCard, 
                  { backgroundColor: colors.card, borderColor: isConnected ? colors.primary : colors.border }
                ]}
                onPress={() => handleConnectAccount(provider.id)}
                disabled={connectingProvider === provider.id || isConnected}
              >
                <View style={styles.socialHeader}>
                  <View style={[styles.socialIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    {provider.icon}
                  </View>
                  {isConnected ? (
                    <Check size={18} color={colors.primary} />
                  ) : (
                    <View style={[styles.addBadge, { backgroundColor: colors.primary }]}>
                      <Plus size={12} color="white" />
                    </View>
                  )}
                </View>
                <Text style={[styles.socialName, { color: colors.text }]}>{provider.name}</Text>
                <Text style={styles.socialStatus}>
                  {isConnected ? 'Connected' : `Earn +${provider.points} pts`}
                </Text>
                {connectingProvider === provider.id && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.socialLoader} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          onPress={onSignOut}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
  },
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  socialStatus: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  socialLoader: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 12,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});