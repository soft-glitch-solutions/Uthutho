import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { 
  Mail, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Globe, 
  Facebook, 
  Twitter 
} from 'lucide-react-native';

interface BasicInfoTabProps {
  colors: any;
  accountsLoading: boolean;
  linkedAccounts: any[];
  onSignOut: () => void;
  onConnectAccount: (provider: string) => void;
  isDesktop: boolean;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  colors,
  accountsLoading,
  linkedAccounts,
  onSignOut,
  onConnectAccount,
  isDesktop
}) => {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return <Globe size={20} color="#EA4335" />;
      case 'facebook': return <Facebook size={20} color="#1877F2" />;
      case 'twitter': return <Twitter size={20} color="#1DA1F2" />;
      default: return <Mail size={20} color="#888" />;
    }
  };

  const isConnected = (provider: string) => {
    return linkedAccounts.some(acc => acc.provider === provider && acc.connected);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SOCIAL CONNECTIONS</Text>
      
      <View style={styles.cardsContainer}>
        {['google', 'facebook', 'twitter'].map((provider) => (
          <TouchableOpacity 
            key={provider}
            style={styles.connectionCard}
            onPress={() => onConnectAccount(provider)}
            disabled={isConnected(provider)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.providerIcon}>
                {getProviderIcon(provider)}
              </View>
              {isConnected(provider) && (
                <View style={styles.statusBadge}>
                  <ShieldCheck size={12} color="#1ea2b1" />
                  <Text style={styles.statusText}>LINKED</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.providerName}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </Text>
            
            {!isConnected(provider) && (
              <Text style={styles.connectLabel}>Connect Account</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 40 }]}>ACCOUNT SETTINGS</Text>
      
      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <Mail size={18} color="#FFF" />
            </View>
            <Text style={styles.settingsItemText}>Email Preferences</Text>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <ShieldCheck size={18} color="#FFF" />
            </View>
            <Text style={styles.settingsItemText}>Privacy & Security</Text>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingsItem, { borderBottomWidth: 0 }]} 
          onPress={onSignOut}
        >
          <View style={styles.settingsItemLeft}>
            <View style={[styles.itemIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <LogOut size={18} color="#EF4444" />
            </View>
            <Text style={[styles.settingsItemText, { color: '#EF4444' }]}>Sign Out</Text>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#444',
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  connectionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1ea2b1',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  connectLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  settingsList: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DDD',
  },
});
