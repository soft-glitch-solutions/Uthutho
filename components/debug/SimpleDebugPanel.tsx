import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Bug, X, Bus, MapPin, Flame, BookOpen, Eye, EyeOff, RotateCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetTutorial } from '@/components/AppTutorial';

interface SimpleDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  onShowWaitingDrawer?: () => void;
  onShowStreakOverlay?: () => void;
  onHideStreakOverlay?: () => void;
  onShowTutorial?: () => void;
}

export default function SimpleDebugPanel({
  visible,
  onClose,
  onShowWaitingDrawer,
  onShowStreakOverlay,
  onHideStreakOverlay,
  onShowTutorial,
}: SimpleDebugPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleResetTutorial = async () => {
    Alert.alert(
      'Reset Tutorial',
      'The journey tutorial will be shown on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetTutorial();
            Alert.alert('Done', 'Tutorial has been reset.');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBox}>
                  <Bug size={20} color="#1ea2b1" />
                </View>
                <View>
                  <Text style={styles.readyText}>DEVELOPER</Text>
                  <Text style={styles.title}>Debug Panel</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ─── STREAK OVERLAY ─── */}
            <Text style={styles.sectionTitle}>Streak Overlay</Text>

            <TouchableOpacity
              style={[styles.btn, styles.btnAmber]}
              onPress={() => onShowStreakOverlay?.()}
            >
              <Flame size={16} color="#000" />
              <Text style={styles.btnTextDark}>Show Streak Overlay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnOutlineAmber]}
              onPress={() => onHideStreakOverlay?.()}
            >
              <X size={16} color="#fbbf24" />
              <Text style={styles.btnTextAmber}>Hide Streak Overlay</Text>
            </TouchableOpacity>

            {/* ─── JOURNEY TUTORIAL ─── */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Journey Tutorial</Text>

            <TouchableOpacity
              style={[styles.btn, styles.btnPurple]}
              onPress={() => onShowTutorial?.()}
            >
              <BookOpen size={16} color="#000" />
              <Text style={styles.btnTextDark}>Show Tutorial Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleResetTutorial}>
              <RotateCcw size={16} color="#ef4444" />
              <Text style={styles.btnTextDanger}>Reset Tutorial State</Text>
            </TouchableOpacity>

            {/* ─── WAITING DRAWER ─── */}
            {onShowWaitingDrawer && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Waiting Drawer</Text>

                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen]}
                  onPress={() => {
                    setDrawerOpen(true);
                    onShowWaitingDrawer();
                  }}
                >
                  <Bus size={16} color="#000" />
                  <Text style={styles.btnTextDark}>Open Waiting Drawer</Text>
                </TouchableOpacity>

                {/* Status pill */}
                <View style={[styles.statusPill, drawerOpen && styles.statusPillActive]}>
                  <View style={[styles.statusDot, drawerOpen && styles.statusDotActive]} />
                  <Text style={styles.statusText}>
                    Drawer is {drawerOpen ? 'OPEN' : 'CLOSED'}
                  </Text>
                </View>
              </>
            )}

            {/* ─── INFO BOX ─── */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Debug Info</Text>
              <Text style={styles.infoText}>• Streak overlay requires a valid userId to fetch data</Text>
              <Text style={styles.infoText}>• Tutorial resets via AsyncStorage — restart may be needed</Text>
              <Text style={styles.infoText}>• Use "Reset" actions to re-trigger first-launch flows</Text>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#000',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#222',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(30,162,177,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.2)',
  },
  readyText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1ea2b1',
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 12,
  },

  // ─── BUTTONS ───
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
  },
  btnTeal: { backgroundColor: '#1ea2b1' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1ea2b1' },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  btnAmber: { backgroundColor: '#fbbf24' },
  btnOutlineAmber: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fbbf24' },
  btnPurple: { backgroundColor: '#8B5CF6' },
  btnGreen: { backgroundColor: '#10b981' },

  btnTextDark: { color: '#000', fontWeight: '800', fontSize: 14 },
  btnTextTeal: { color: '#1ea2b1', fontWeight: '800', fontSize: 14 },
  btnTextDanger: { color: '#ef4444', fontWeight: '800', fontSize: 14 },
  btnTextAmber: { color: '#fbbf24', fontWeight: '800', fontSize: 14 },

  // ─── STATUS ───
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    gap: 8,
  },
  statusPillActive: {
    backgroundColor: 'rgba(30,162,177,0.05)',
    borderColor: '#1ea2b1',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  statusDotActive: {
    backgroundColor: '#4ade80',
  },
  statusText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── INFO BOX ───
  infoBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    gap: 6,
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
});