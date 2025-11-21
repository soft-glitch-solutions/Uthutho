import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Facebook, Mail, Globe } from 'lucide-react-native';
import { Shimmer } from './SkeletonComponents';

interface LinkedAccountsBadgeProps {
  loading: boolean;
  accounts: any[];
  colors: any;
}

export const LinkedAccountsBadge: React.FC<LinkedAccountsBadgeProps> = ({
  loading,
  accounts,
  colors
}) => {
  const getProviderIcon = (provider: string, size: number = 16) => {
    switch (provider) {
      case 'google':
        return (
          <Image
            source={require('@/assets/images/google-icon.png')}
            style={{ width: size, height: size }}
          />
        );
      case 'facebook':
        return <Facebook size={size} color="#1877F2" />;
      case 'email':
        return <Mail size={size} color="#666" />;
      default:
        return <Globe size={size} color="#666" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.linkedAccountsContainer}>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonLinkedAccounts, { backgroundColor: colors.border }]} />
        </Shimmer>
      </View>
    );
  }

  return (
    <View style={styles.linkedAccountsContainer}>
      <View style={styles.linkedAccountsBadge}>
        {accounts.filter(account => account.connected).map((account) => (
          <View key={account.provider} style={styles.providerIcon}>
            {getProviderIcon(account.provider, 20)}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  linkedAccountsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  linkedAccountsBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    gap: 6,
  },
  providerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLinkedAccounts: {
    width: 80,
    height: 32,
    borderRadius: 20,
  },
});