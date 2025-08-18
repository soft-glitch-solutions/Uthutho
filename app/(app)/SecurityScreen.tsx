import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Shield, Lock, Eye, MapPin, Bell, Smartphone, Key } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SecurityScreen() {
  const router = useRouter();
  const [locationSharing, setLocationSharing] = useState(true);
  const [dataAnalytics, setDataAnalytics] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const securitySettings = [
    {
      icon: MapPin,
      title: 'Location Sharing',
      description: 'Allow the app to access your location for route planning',
      value: locationSharing,
      onToggle: setLocationSharing,
    },
    {
      icon: Eye,
      title: 'Data Analytics',
      description: 'Help improve the app by sharing anonymous usage data',
      value: dataAnalytics,
      onToggle: setDataAnalytics,
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Receive updates about routes, delays, and transport news',
      value: pushNotifications,
      onToggle: setPushNotifications,
    },
    {
      icon: Smartphone,
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition to secure your account',
      value: biometricAuth,
      onToggle: setBiometricAuth,
    },
  ];

  const securityActions = [
    {
      icon: Key,
      title: 'Change Password',
      description: 'Update your account password',
      action: () => handleChangePassword(),
    },
    {
      icon: Shield,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      action: () => handleTwoFactor(),
    },
    {
      icon: Lock,
      title: 'Account Deletion',
      description: 'Permanently delete your account and all data',
      action: () => handleAccountDeletion(),
      danger: true,
    },
  ];

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will receive an email with instructions to reset your password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Email', onPress: sendPasswordReset },
      ]
    );
  };

  const sendPasswordReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);
        if (error) {
          Alert.alert('Error', 'Failed to send password reset email.');
        } else {
          Alert.alert('Success', 'Password reset email sent!');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email.');
    }
  };

  const handleTwoFactor = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete all your data permanently.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Delete', style: 'destructive', onPress: deleteAccount },
              ]
            );
          }
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        Alert.alert('Error', 'Failed to delete profile data.');
        return;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
        { text: 'OK', onPress: () => router.replace('/auth') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.introSection}>
          <Lock size={48} color="#1ea2b1" />
          <Text style={styles.introTitle}>Secure Your Account</Text>
          <Text style={styles.introText}>
            Manage your privacy settings and security preferences to keep your account safe.
          </Text>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          {securitySettings.map((setting, index) => {
            const IconComponent = setting.icon;
            return (
              <View key={index} style={styles.settingCard}>
                <View style={styles.settingLeft}>
                  <IconComponent size={24} color="#1ea2b1" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                </View>
                <Switch
                  value={setting.value}
                  onValueChange={setting.onToggle}
                  trackColor={{ false: '#333333', true: '#1ea2b150' }}
                  thumbColor={setting.value ? '#1ea2b1' : '#666666'}
                />
              </View>
            );
          })}
        </View>

        {/* Security Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Actions</Text>
          {securityActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, action.danger && styles.dangerCard]}
                onPress={action.action}
              >
                <IconComponent 
                  size={24} 
                  color={action.danger ? '#ef4444' : '#1ea2b1'} 
                />
                <View style={styles.actionText}>
                  <Text style={[
                    styles.actionTitle,
                    action.danger && styles.dangerText
                  ]}>
                    {action.title}
                  </Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Text style={[
                  styles.actionArrow,
                  action.danger && styles.dangerText
                ]}>
                  ›
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Use a strong, unique password for your account{'\n'}
              • Don't share your login credentials with others{'\n'}
              • Log out when using shared devices{'\n'}
              • Keep the app updated to the latest version{'\n'}
              • Report suspicious activity immediately
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Developed by Soft Glitch Solutions</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dangerCard: {
    borderColor: '#ef444450',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  dangerText: {
    color: '#ef4444',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  actionArrow: {
    fontSize: 24,
    color: '#666666',
  },
  tipsSection: {
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tipText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
  },
});