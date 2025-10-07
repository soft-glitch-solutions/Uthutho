import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { Sun, Moon, Smartphone, Bell, Lock, Globe, Info , Shield  } from 'lucide-react-native';
import { useRouter } from 'expo-router'; // Import useRouter from expo-router

export default function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage } = useContext(LanguageContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const router = useRouter(); // Initialize the router

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
      appVersion: 'App Version 1.0.1',
      notifications: 'Notifications',
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
      appVersion: 'Versión de la App 1.0.1',
      notifications: 'Notificaciones',
    },
    // Add more languages as needed
  };

  const text = languageText[language] || languageText.en; // Fallback to English if language not found

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{text.settings}</Text>t>


        {/* Privacy Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.privacy}</Text>
      <TouchableOpacity
          style={styles.settingOption}
          onPress={() => router.push('/PrivacyScreen')}>
          <View style={styles.settingLeft}>
            <Lock color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>{text.privacyPolicy}</Text>
          </View>
        </TouchableOpacity>

                {/* Security Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.privacy}</Text>
      <TouchableOpacity
          style={styles.settingOption}
          onPress={() => router.push('/SecurityScreen')}>
          <View style={styles.settingLeft}>
            <Shield color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Security Settings</Text>
          </View>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{text.about}</Text>
        <View style={styles.settingOption}>
          <View style={styles.settingLeft}>
            <Info color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>{text.appVersion}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  themeOptions: {
    gap: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});