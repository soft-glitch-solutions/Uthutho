import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Linking, Platform } from 'react-native';
import { Bell, Lock, Info, Shield, ChevronRight, MessageSquare, FileText, HelpCircle, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';

// Required for WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  const settings = {
    settings: 'Settings',
    notifications: 'Notifications',
    privacy: 'Privacy & Security',
    privacyPolicy: 'Privacy Policy',
    securitySettings: 'Security Settings',
    terms: 'Terms of Service',
    about: 'About',
    appVersion: 'App Version 1.8.2',
    feedback: 'Feedback & Support',
    help: 'Help & FAQ',
  };

  const handleOpenTerms = async () => {
    const termsUrl = 'https://uthutho.co.za/terms-and-conditions';
    
    try {
      // Use WebBrowser to open within app (works on iOS/Android)
      await WebBrowser.openBrowserAsync(termsUrl, {
        // iOS settings
        dismissButtonStyle: 'close',
        preferredBarTintColor: '#1a1a1a',
        preferredControlTintColor: '#1EA2B1',
        // Android settings
        toolbarColor: '#1a1a1a',
        secondaryToolbarColor: '#000000',
        enableDefaultShare: false,
        enableBarCollapsing: false,
        // Common settings
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        createTask: false,
      });
    } catch (error) {
      console.error('Error opening terms:', error);
      // Fallback to Linking if WebBrowser fails
      const supported = await Linking.canOpenURL(termsUrl);
      if (supported) {
        await Linking.openURL(termsUrl);
      }
    }
  };

  const handleOpenPrivacy = async () => {
    const privacyUrl = 'https://uthutho.co.za/privacy-policy';
    
    try {
      await WebBrowser.openBrowserAsync(privacyUrl, {
        dismissButtonStyle: 'close',
        preferredBarTintColor: '#1a1a1a',
        preferredControlTintColor: '#1EA2B1',
        toolbarColor: '#1a1a1a',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch (error) {
      console.error('Error opening privacy policy:', error);
      const supported = await Linking.canOpenURL(privacyUrl);
      if (supported) {
        await Linking.openURL(privacyUrl);
      }
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{settings.settings}</Text>
          <View style={[styles.headerLine, { backgroundColor: '#1EA2B1' }]} />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          {/* Notifications */}
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Bell size={20} color="#1EA2B1" />
              </View>
              <View style={styles.settingDetails}>
                <Text style={[styles.settingText, { color: colors.text }]}>{settings.notifications}</Text>
                <Text style={[styles.settingSubtext, { color: '#666666' }]}>Alerts and updates</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#cccccc', true: '#1EA2B1' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{settings.privacy}</Text>
          
          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/PrivacyScreen')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Lock size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{settings.privacyPolicy}</Text>

            </View>
                          <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>

          {/* Security Settings */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/SecurityScreen')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Shield size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{settings.securitySettings}</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleOpenTerms}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <FileText size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{settings.terms}</Text>
            </View>
            <ExternalLink size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          {/* Help & FAQ */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/help')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <HelpCircle size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{settings.help}</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>

          {/* Feedback & Support */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/feedback-support')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <MessageSquare size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{settings.feedback}</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{settings.about}</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Info size={20} color="#1EA2B1" />
              </View>
              <View style={styles.settingDetails}>
                <Text style={[styles.settingText, { color: colors.text }]}>Uthutho</Text>
                <Text style={[styles.settingSubtext, { color: '#666666' }]}>{settings.appVersion}</Text>
              </View>
            </View>
          </View>

          {/* Tagline with colors */}
          <View style={styles.taglineContainer}>
            <Text style={[styles.taglineText, styles.commuteText]}>Commute.</Text>
            <Text style={[styles.taglineText, styles.connectText]}> Connect.</Text>
            <Text style={[styles.taglineText, styles.communitiesText]}> Communities.</Text>
          </View>

          {/* Developer Info */}
          <View style={[styles.developerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.developerTitle, { color: colors.text }]}>Developed by</Text>
            <Text style={styles.developerName}>Soft Glitch Solutions</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerLine: {
    height: 4,
    width: 60,
    borderRadius: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingDetails: {
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  taglineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commuteText: {
    color: '#1EA2B1',
  },
  connectText: {
    color: '#ED67B1',
  },
  communitiesText: {
    color: '#FD602D',
  },
  developerCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  developerTitle: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
    opacity: 0.7,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1EA2B1',
  },
  bottomSpacing: {
    height: 40,
  },
});