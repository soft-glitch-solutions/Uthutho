import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Edit, Settings, LogOut } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { LinkedAccount } from '@/types/profile';

interface BasicInfoTabProps {
  colors: any;
  accountsLoading: boolean;
  linkedAccounts: LinkedAccount[];
  onSignOut: () => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  colors,
  accountsLoading,
  linkedAccounts,
  onSignOut
}) => {
  const getProviderIcon = (provider: string, size: number = 16) => {
    switch (provider) {
      case 'google':
        return (
          <View style={[styles.providerIcon, { backgroundColor: '#DB4437' }]}>
            <Text style={styles.providerText}>G</Text>
          </View>
        );
      case 'facebook':
        return (
          <View style={[styles.providerIcon, { backgroundColor: '#1877F2' }]}>
            <Text style={styles.providerText}>f</Text>
          </View>
        );
      case 'email':
        return (
          <View style={[styles.providerIcon, { backgroundColor: '#666' }]}>
            <Text style={styles.providerText}>@</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.providerIcon, { backgroundColor: '#666' }]}>
            <Text style={styles.providerText}>?</Text>
          </View>
        );
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'facebook':
        return 'Facebook';
      case 'email':
        return 'Email';
      default:
        return provider;
    }
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

  return (
    <View style={styles.container}>
      {/* Linked Accounts Section */}
      <View style={styles.linkedAccountsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Linked Accounts</Text>
        {accountsLoading ? (
          <View style={styles.accountsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading accounts...</Text>
          </View>
        ) : (
          <View style={styles.accountsList}>
            {linkedAccounts.map((account) => (
              <View key={account.provider} style={[styles.accountItem, { backgroundColor: colors.card }]}>
                <View style={styles.accountInfo}>
                  <View style={styles.accountProvider}>
                    {getProviderIcon(account.provider, 24)}
                    <Text style={[styles.providerName, { color: colors.text }]}>
                      {getProviderName(account.provider)}
                    </Text>
                  </View>
                  <View style={[
                    styles.connectionStatus,
                    { backgroundColor: account.connected ? '#1ea2b1' : '#6b7280' }
                  ]}>
                    <Text style={styles.statusText}>
                      {account.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
                {account.connected && account.email && (
                  <Text style={[styles.accountEmail, { color: colors.text }]}>
                    {account.email}
                  </Text>
                )}
              </View>
            ))}
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
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
    opacity: 0.8,
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
});