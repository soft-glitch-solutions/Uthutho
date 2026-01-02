import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Edit, Settings, LogOut, Plus, Check, X, Trophy } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { LinkedAccount } from '@/types/profile';

interface BasicInfoTabProps {
  colors: any;
  accountsLoading: boolean;
  linkedAccounts: LinkedAccount[];
  onSignOut: () => void;
  onConnectAccount: (provider: string) => Promise<void>;
}

// Define available social providers
const AVAILABLE_PROVIDERS = [
  { id: 'email', name: 'Email', icon: '@', color: '#666', points: 0 },
  { id: 'google', name: 'Google', icon: 'G', color: '#DB4437', points: 50 },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2', points: 50 },
  { id: 'twitter', name: 'Twitter', icon: '𝕏', color: '#000000', points: 30 },
];

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  colors,
  accountsLoading,
  linkedAccounts,
  onSignOut,
  onConnectAccount
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

  const getProviderIcon = (provider: string, size: number = 16) => {
    const providerConfig = AVAILABLE_PROVIDERS.find(p => p.id === provider);
    if (!providerConfig) {
      return (
        <View style={[styles.providerIcon, { backgroundColor: '#666', width: size, height: size }]}>
          <Text style={[styles.providerText, { fontSize: size * 0.6 }]}>?</Text>
        </View>
      );
    }

    return (
      <View style={[styles.providerIcon, { 
        backgroundColor: providerConfig.color, 
        width: size, 
        height: size 
      }]}>
        <Text style={[styles.providerText, { fontSize: size * 0.6 }]}>
          {providerConfig.icon}
        </Text>
      </View>
    );
  };

  const getProviderName = (provider: string) => {
    return AVAILABLE_PROVIDERS.find(p => p.id === provider)?.name || provider;
  };

  const getProviderPoints = (provider: string) => {
    return AVAILABLE_PROVIDERS.find(p => p.id === provider)?.points || 0;
  };

  const isProviderConnected = (provider: string) => {
    const account = linkedAccounts.find(acc => acc.provider === provider);
    return account?.connected || false;
  };

  const getAccountEmail = (provider: string) => {
    const account = linkedAccounts.find(acc => acc.provider === provider);
    return account?.email || null;
  };

  // Check if points have already been awarded for this provider
  const hasPointsBeenAwarded = (provider: string) => {
    const account = linkedAccounts.find(acc => acc.provider === provider);
    return account?.points_awarded || false;
  };

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string, points?: number) => {
    setModalContent({ type, title, message, points });
    setModalVisible(true);
  };

  const handleConnectAccount = async (provider: string) => {
    console.log(`Connecting account: ${provider}`);
    
    if (isProviderConnected(provider)) {
      showModal(
        'info',
        'Already Connected',
        `Your account is already connected to ${getProviderName(provider)}`
      );
      return;
    }

    setConnectingProvider(provider);
    try {
      // Call the provided onConnectAccount function
      await onConnectAccount(provider);
      
      // Check if points should be shown (only show if not already awarded)
      const points = getProviderPoints(provider);
      const pointsAwarded = hasPointsBeenAwarded(provider);
      
      if (points > 0 && !pointsAwarded) {
        showModal(
          'success',
          'Success! 🎉',
          `You've connected your ${getProviderName(provider)} account and earned points!`,
          points
        );
      } else {
        showModal(
          'success',
          'Success! ✅',
          `You've connected your ${getProviderName(provider)} account!`
        );
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      showModal(
        'error',
        'Connection Failed',
        'Unable to connect account. Please try again.'
      );
    } finally {
      setConnectingProvider(null);
    }
  };

  const getConnectedCount = () => {
    return linkedAccounts.filter(account => account.connected).length;
  };

  const basicMenuItems = [
    {
      icon: <Edit size={24} color={colors.primary} />,
      title: 'Edit Profile',
      subtitle: 'Update your profile details',
      route: '/EditProfileScreen'
    },
    {
      icon: <Settings size={24} color={colors.primary} />,
      title: 'Settings',
      subtitle: 'App settings and preferences',
      route: '/settings'
    },
  ];

  const connectedCount = getConnectedCount();
  const allProviders = AVAILABLE_PROVIDERS;

  return (
    <View style={styles.container}>
      {/* All Accounts in One Section */}
      <View style={styles.linkedAccountsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Connected Accounts ({connectedCount}/{allProviders.length})
        </Text>
        
        {accountsLoading ? (
          <View style={styles.accountsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading accounts...</Text>
          </View>
        ) : (
          <View style={styles.accountsList}>
            {allProviders.map((provider) => {
              const isConnected = isProviderConnected(provider.id);
              const email = getAccountEmail(provider.id);
              const points = getProviderPoints(provider.id);
              const pointsAwarded = hasPointsBeenAwarded(provider.id);
              
              return (
                <View key={provider.id} style={[styles.accountItem, { backgroundColor: colors.card }]}>
                  <View style={styles.accountRow}>
                    {/* Provider Info */}
                    <View style={styles.accountInfo}>
                      {getProviderIcon(provider.id, 32)}
                      <View style={styles.accountDetails}>
                        <Text style={[styles.providerName, { color: colors.text }]}>
                          {provider.name}
                        </Text>
                        {isConnected ? (
                          <View style={styles.connectedInfo}>
                            <Check size={14} color="#10B981" />
                            <Text style={[styles.connectedText, { color: '#10B981' }]}>
                              Connected
                            </Text>
                            {/* Only show points badge if points were recently awarded */}
                            {points > 0 && !pointsAwarded && (
                              <Text style={[styles.pointsBadge, { color: colors.primary }]}>
                                +{points} pts
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={[styles.pointsEarnable, { color: colors.primary }]}>
                            Connect to earn +{points} points
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Action Button */}
                    {isConnected ? (
                      <View style={[styles.connectedBadge, { backgroundColor: '#1ea2b1' }]}>
                        <Check size={16} color="white" />
                        <Text style={styles.connectedBadgeText}>Connected</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.connectButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleConnectAccount(provider.id)}
                        disabled={connectingProvider === provider.id}
                      >
                        {connectingProvider === provider.id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Plus size={16} color="white" />
                            <Text style={styles.connectButtonText}>Connect</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Email if connected */}
                  {isConnected && email && (
                    <Text style={[styles.accountEmail, { color: colors.text }]}>
                      {email}
                    </Text>
                  )}

                  {/* Email provider doesn't need to be connected separately */}
                  {provider.id === 'email' && !isConnected && (
                    <Text style={[styles.notConnectedHint, { color: colors.text }]}>
                      Email is your primary login method
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {basicMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push(item.route)}
          >
            {item.icon}
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.text }]}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: '#ef4444' }]}
        onPress={onSignOut}
      >
        <LogOut size={24} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.modalIconContainer,
                    { 
                      backgroundColor: modalContent.type === 'success' ? '#10B981' : 
                                     modalContent.type === 'error' ? '#EF4444' : 
                                     '#1ea2b1'
                    }
                  ]}>
                    {modalContent.type === 'success' ? (
                      <Check size={24} color="white" />
                    ) : modalContent.type === 'error' ? (
                      <X size={24} color="white" />
                    ) : (
                      <Text style={styles.infoIcon}>i</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Title */}
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalContent.title}
                </Text>

                {/* Modal Message */}
                <Text style={[styles.modalMessage, { color: colors.text }]}>
                  {modalContent.message}
                </Text>

                {/* Points Display (only for success with points) */}
                {modalContent.type === 'success' && modalContent.points && modalContent.points > 0 && (
                  <View style={styles.pointsContainer}>
                    <Trophy size={20} color="#FFD700" />
                    <Text style={[styles.pointsText, { color: colors.primary }]}>
                      +{modalContent.points} points earned!
                    </Text>
                  </View>
                )}

                {/* Modal Button */}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { 
                      backgroundColor: modalContent.type === 'success' ? '#10B981' : 
                                     modalContent.type === 'error' ? '#EF4444' : 
                                     '#1ea2b1'
                    }
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>
                    {modalContent.type === 'success' ? 'Awesome!' : 
                     modalContent.type === 'error' ? 'Try Again' : 
                     'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linkedAccountsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  accountsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  accountsList: {
    gap: 12,
  },
  accountItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  pointsEarnable: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  providerIcon: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  connectedBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  notConnectedHint: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 8,
  },
  menuContainer: {
    padding: 20,
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});