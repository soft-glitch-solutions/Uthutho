import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { Sun, Moon, Smartphone, Bell, Lock, Globe, Info, Shield, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage } = useContext(LanguageContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  // Language-specific text
  const languageText = {
    en: {
      settings: 'Settings',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
      changeLanguage: 'Change Language',
      privacy: 'Privacy',
      privacyPolicy: 'Privacy Policy',
      about: 'About',
      appVersion: 'App Version 1.8.2',
      notifications: 'Notifications',
      security: 'Security',
      securitySettings: 'Security Settings',
      preferences: 'Preferences',
    },
    es: {
      settings: 'Configuración',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      language: 'Idioma',
      changeLanguage: 'Cambiar Idioma',
      privacy: 'Privacidad',
      privacyPolicy: 'Política de Privacidad',
      about: 'Acerca de',
      appVersion: 'Versión de la App 1.5.1',
      notifications: 'Notificaciones',
      security: 'Seguridad',
      securitySettings: 'Configuración de Seguridad',
      preferences: 'Preferencias',
    },
    // Add more languages as needed
  };

  const text = languageText[language] || languageText.en;

  const themeOptions = [
    { value: 'light', label: text.light, icon: Sun },
    { value: 'dark', label: text.dark, icon: Moon },
    { value: 'system', label: text.system, icon: Smartphone },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'zu', label: 'Zulu' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'xh', label: 'Xhosa' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{text.settings}</Text>
          <View style={[styles.headerLine, { backgroundColor: '#1EA2B1' }]} />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.preferences}</Text>
          
          {/* Notifications */}
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Bell size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{text.notifications}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#cccccc', true: '#1EA2B1' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Theme Selection */}
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Smartphone size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{text.theme}</Text>
            </View>
            <Text style={[styles.currentSetting, { color: '#1EA2B1' }]}>
              {theme === 'light' ? text.light : theme === 'dark' ? text.dark : text.system}
            </Text>
          </View>

          {/* Language Selection */}
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Globe size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{text.language}</Text>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => router.push('/language-selector')}
            >
              <Text style={styles.changeButtonText}>{text.changeLanguage}</Text>
              <ChevronRight size={16} color="#1EA2B1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.privacy}</Text>
          
          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/PrivacyScreen')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Lock size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{text.privacyPolicy}</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>

          {/* Security Settings */}
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/security-settings')}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Shield size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{text.securitySettings}</Text>
            </View>
            <ChevronRight size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.about}</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <View style={styles.settingIconContainer}>
                <Info size={20} color="#1EA2B1" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Uthutho</Text>
            </View>
            <Text style={[styles.appVersion, { color: '#666666' }]}>{text.appVersion}</Text>
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
    flex: 1,
  },
  currentSetting: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1EA2B1',
    marginRight: 4,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '400',
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