import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Smartphone, Bell, Lock, User, Globe, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Theme Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              {
                backgroundColor: theme === 'light' ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setTheme('light')}>
            <Sun color={theme === 'light' ? 'white' : colors.text} />
            <Text
              style={[
                styles.themeText,
                { color: theme === 'light' ? 'white' : colors.text },
              ]}>
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              {
                backgroundColor: theme === 'dark' ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setTheme('dark')}>
            <Moon color={theme === 'dark' ? 'white' : colors.text} />
            <Text
              style={[
                styles.themeText,
                { color: theme === 'dark' ? 'white' : colors.text },
              ]}>
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              {
                backgroundColor: theme === 'system' ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setTheme('system')}>
            <Smartphone color={theme === 'system' ? 'white' : colors.text} />
            <Text
              style={[
                styles.themeText,
                { color: theme === 'system' ? 'white' : colors.text },
              ]}>
              System
            </Text>
          </TouchableOpacity>
        </View>


        {/* Language Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
        <TouchableOpacity style={styles.settingOption}>
          <View style={styles.settingLeft}>
            <Globe color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Change Language</Text>
          </View>
        </TouchableOpacity>


        {/* Privacy Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>
        <TouchableOpacity style={styles.settingOption}>
          <View style={styles.settingLeft}>
            <Lock color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
          </View>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={styles.settingOption}>
          <View style={styles.settingLeft}>
            <Info color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>App Version 0.0.1</Text>
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