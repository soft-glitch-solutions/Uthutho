import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LanguageContext } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  // Add more languages as needed
];

export default function ChangeLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  const { colors } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Change Language</Text>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              {
                backgroundColor: language === lang.code ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setLanguage(lang.code)}>
            <Text
              style={[
                styles.languageText,
                { color: language === lang.code ? 'white' : colors.text },
              ]}>
              {lang.name}
            </Text>
          </TouchableOpacity>
        ))}
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
  languageOption: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
  },
});