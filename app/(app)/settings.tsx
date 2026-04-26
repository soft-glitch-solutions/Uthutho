import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Linking, Platform, Alert, Animated } from 'react-native';
import { Bell, Lock, Info, Shield, ChevronRight, MessageSquare, FileText, HelpCircle, ExternalLink, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hook/useAuth';
import { sendPushNotificationByUserId } from '@/services/pushNotificationService';

WebBrowser.maybeCompleteAuthSession();

const BRAND_COLOR = '#1ea2b1';

const SettingsSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <View style={styles.headerTitleBox}>
          <View style={{ width: 100, height: 24, backgroundColor: '#111', borderRadius: 4 }} />
          <View style={{ width: 80, height: 10, backgroundColor: '#111', borderRadius: 4, marginTop: 4 }} />
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.section}>
            <View style={{ width: 100, height: 10, backgroundColor: '#111', borderRadius: 4, marginBottom: 16 }} />
            <Animated.View style={[styles.card, { opacity, height: 120 }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleTestPush = async () => {
    if (!user) { Alert.alert('Error', 'Login required.'); return; }
    const result = await sendPushNotificationByUserId(user.id, {
      title: 'Uthutho says Hello 👋',
      body: 'Your test push notification is working perfectly!',
    });
    if (result) Alert.alert('Success', 'Push notification triggered!');
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.readyText}>READY TO MOVE</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.iconBox}><Bell size={20} color={BRAND_COLOR} /></View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Alerts and updates</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#222', true: BRAND_COLOR }} thumbColor="#FFF" />
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={handleTestPush}>
              <View style={[styles.iconBox, { backgroundColor: '#ED67B120' }]}><Bell size={20} color="#ED67B1" /></View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Test Push</Text>
                <Text style={styles.settingSubtitle}>Send a test alert</Text>
              </View>
              <ChevronRight size={18} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
          <View style={styles.card}>
            {[
              { label: 'Privacy Policy', icon: Lock, route: '/PrivacyScreen' },
              { label: 'Security Settings', icon: Shield, route: '/SecurityScreen' },
              { label: 'Terms of Service', icon: FileText, action: () => WebBrowser.openBrowserAsync('https://uthutho.co.za/terms-and-conditions') }
            ].map((item, i) => (
              <TouchableOpacity key={i} style={[styles.settingRow, i < 2 && styles.borderBottom]} onPress={item.action || (() => router.push(item.route as any))}>
                <View style={styles.iconBox}><item.icon size={20} color={BRAND_COLOR} /></View>
                <Text style={styles.settingTitle}>{item.label}</Text>
                <ChevronRight size={18} color="#333" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.card}>
            {[
              { label: 'Help & FAQ', icon: HelpCircle, route: '/help' },
              { label: 'Feedback & Support', icon: MessageSquare, route: '/feedback-support' }
            ].map((item, i) => (
              <TouchableOpacity key={i} style={[styles.settingRow, i === 0 && styles.borderBottom]} onPress={() => router.push(item.route as any)}>
                <View style={styles.iconBox}><item.icon size={20} color={BRAND_COLOR} /></View>
                <Text style={styles.settingTitle}>{item.label}</Text>
                <ChevronRight size={18} color="#333" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.iconBox}><Info size={20} color={BRAND_COLOR} /></View>
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Uthutho</Text>
                <Text style={styles.settingSubtitle}>Version 1.8.2 — READY TO MOVE</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.devSection}>
          <Text style={styles.devLabel}>POWERED BY</Text>
          <Text style={styles.devName}>Soft Glitch Solutions</Text>
        </View>
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', letterSpacing: -1 },
  readyText: { fontSize: 10, fontWeight: '900', color: BRAND_COLOR, letterSpacing: 2 },
  content: { paddingHorizontal: 24, paddingTop: 12 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 2, marginBottom: 16 },
  card: { backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#222' },
  iconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  settingTexts: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', flex: 1 },
  settingSubtitle: { fontSize: 12, fontWeight: '600', color: '#444', marginTop: 2 },
  devSection: { alignItems: 'center', marginTop: 12 },
  devLabel: { fontSize: 9, fontWeight: '900', color: '#222', letterSpacing: 1.5 },
  devName: { fontSize: 14, fontWeight: 'bold', color: BRAND_COLOR, fontStyle: 'italic', marginTop: 4 },
});