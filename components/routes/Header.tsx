import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { contactUsOnWhatsApp } from '@/utils/whatsapp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HeaderProps {
  isDesktop?: boolean;
}

export default function Header({ isDesktop: propIsDesktop = false }: HeaderProps) {
  const desktopMode = isDesktop || propIsDesktop;
  
  return (
    <View style={[styles.header, desktopMode && styles.headerDesktop]}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, desktopMode && styles.titleDesktop]}>Transport</Text>
        <TouchableOpacity 
          style={[styles.headerWhatsappButton, desktopMode && styles.headerWhatsappButtonDesktop]}
          onPress={() => contactUsOnWhatsApp()}
        >
          <MessageCircle size={desktopMode ? 18 : 20} color="#25D366" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, desktopMode && styles.subtitleDesktop]}>
        Find stops, routes and hubs
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleDesktop: {
    fontSize: 32,
  },
  headerWhatsappButton: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  headerWhatsappButtonDesktop: {
    padding: 10,
    borderRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
  },
  subtitleDesktop: {
    fontSize: 18,
    marginTop: 6,
  },
});