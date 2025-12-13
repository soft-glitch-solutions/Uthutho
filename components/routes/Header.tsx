import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MessageCircle, MapPin, Bell, User } from 'lucide-react-native';
import { contactUsOnWhatsApp } from '@/utils/whatsapp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HeaderProps {
  isDesktop?: boolean;
}

export default function Header({ isDesktop: propIsDesktop = false }: HeaderProps) {
  const desktopMode = isDesktop || propIsDesktop;
  
  return (
    <View style={styles.container}>
      {/* Top Menu Bar for Desktop */}
      {desktopMode && (
        <View style={styles.topMenu}>
          <View style={styles.topMenuLeft}>
            <TouchableOpacity style={styles.menuItem}>
              <MapPin size={16} color="#cccccc" />
              <Text style={styles.menuText}>Select City</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Bell size={16} color="#cccccc" />
              <Text style={styles.menuText}>Notifications</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topMenuRight}>
            <TouchableOpacity style={styles.menuItem}>
              <User size={16} color="#cccccc" />
              <Text style={styles.menuText}>Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Header Section */}
      <View style={[styles.header, desktopMode && styles.headerDesktop]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, desktopMode && styles.titleDesktop]}>Transport</Text>
          <TouchableOpacity 
            style={[styles.headerWhatsappButton, desktopMode && styles.headerWhatsappButtonDesktop]}
            onPress={() => contactUsOnWhatsApp()}
          >
            <MessageCircle size={desktopMode ? 18 : 20} color="#25D366" />
            {desktopMode && (
              <Text style={styles.whatsappText}>Contact Support</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, desktopMode && styles.subtitleDesktop]}>
          Find stops, routes and hubs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  topMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  topMenuLeft: {
    flexDirection: 'row',
    gap: 24,
  },
  topMenuRight: {
    flexDirection: 'row',
    gap: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuText: {
    fontSize: 14,
    color: '#cccccc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '500',
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