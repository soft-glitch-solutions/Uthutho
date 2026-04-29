import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  Modal, 
  TextInput, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import {
  Mail,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Globe,
  Facebook,
  Twitter,
  MapPin,
  Bus,
  Languages,
  User,
  Save,
  X
} from 'lucide-react-native';

interface BasicInfoTabProps {
  colors: any;
  accountsLoading: boolean;
  linkedAccounts: any[];
  onSignOut: () => void;
  onConnectAccount: (provider: string) => void;
  onUpdateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
  isDesktop: boolean;
  profile: any;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  colors,
  accountsLoading,
  linkedAccounts,
  onSignOut,
  onConnectAccount,
  onUpdateProfile,
  isDesktop,
  profile
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    home: profile?.home || '',
    preferred_transport: profile?.preferred_transport || '',
    preferred_language: profile?.preferred_language || 'English (South Africa)'
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return <Globe size={20} color="#EA4335" />;
      case 'facebook': return <Facebook size={20} color="#1877F2" />;
      default: return <Mail size={20} color="#888" />;
    }
  };

  const isConnected = (provider: string) => {
    return linkedAccounts.some(acc => acc.provider === provider && acc.connected);
  };

  const handleOpenEdit = () => {
    setEditData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      home: profile?.home || '',
      preferred_transport: profile?.preferred_transport || '',
      preferred_language: profile?.preferred_language || 'English (South Africa)'
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    const result = await onUpdateProfile(editData);
    setIsUpdating(false);
    
    if (result.success) {
      setEditModalVisible(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } else {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', result.error || 'Failed to update profile');
      } else {
        console.error('Update failed:', result.error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>SOCIAL CONNECTIONS</Text>
      </View>

      <View style={styles.cardsContainer}>
        {['google', 'facebook'].map((provider) => (
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

      <View style={[styles.headerRow, { marginTop: 40 }]}>
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
        <TouchableOpacity onPress={handleOpenEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingsItem} onPress={handleOpenEdit}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <User size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.settingsItemText}>Full Name</Text>
              <Text style={styles.itemSubtitle}>{profile?.first_name} {profile?.last_name}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={handleOpenEdit}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <MapPin size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.settingsItemText}>Home Address</Text>
              <Text style={styles.itemSubtitle}>{profile?.home || 'Not set'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={handleOpenEdit}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <Bus size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.settingsItemText}>Preferred Transport</Text>
              <Text style={styles.itemSubtitle}>{profile?.preferred_transport || 'Not set'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={handleOpenEdit}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.itemIconBox}>
              <Languages size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.settingsItemText}>Language</Text>
              <Text style={styles.itemSubtitle}>{profile?.preferred_language || 'English (South Africa)'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#000', borderColor: '#222', borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.first_name}
                  onChangeText={(text) => setEditData({...editData, first_name: text})}
                  placeholder="Enter first name"
                  placeholderTextColor="#444"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.last_name}
                  onChangeText={(text) => setEditData({...editData, last_name: text})}
                  placeholder="Enter last name"
                  placeholderTextColor="#444"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Home Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.home}
                  onChangeText={(text) => setEditData({...editData, home: text})}
                  placeholder="Enter home address"
                  placeholderTextColor="#444"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Transport</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.preferred_transport}
                  onChangeText={(text) => setEditData({...editData, preferred_transport: text})}
                  placeholder="e.g. Taxi, Bus, Train"
                  placeholderTextColor="#444"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.preferred_language}
                  onChangeText={(text) => setEditData({...editData, preferred_language: text})}
                  placeholder="Enter language"
                  placeholderTextColor="#444"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: '#1ea2b1' }]} 
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Save size={18} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#444',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1ea2b1',
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
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
