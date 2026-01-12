import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Bug, X, Bus, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SimpleDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  onShowWelcomeOverlay: () => void;
  onHideWelcomeOverlay: () => void;
  onShowWaitingDrawer?: () => void;
}

export default function SimpleDebugPanel({
  visible,
  onClose,
  onShowWelcomeOverlay,
  onHideWelcomeOverlay,
  onShowWaitingDrawer,
}: SimpleDebugPanelProps) {
  const [drawerState, setDrawerState] = useState(false);

  const handleResetWelcome = async () => {
    Alert.alert(
      'Reset Welcome Overlay',
      'Are you sure you want to reset the welcome overlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await AsyncStorage.removeItem('hasSeenWelcome');
            Alert.alert('Success', 'Welcome overlay has been reset.');
          },
        },
      ]
    );
  };

  const handleTestWaitingDrawer = () => {
    setDrawerState(true);
    if (onShowWaitingDrawer) {
      onShowWaitingDrawer();
    }
  };

  const handleDrawerStateChange = (isVisible: boolean) => {
    setDrawerState(isVisible);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bug size={24} color="#1ea2b1" />
              <Text style={styles.title}>Debug Panel</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#999999" />
            </TouchableOpacity>
          </View>

          {/* Content with ScrollView */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Welcome Overlay Controls</Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={onShowWelcomeOverlay}
              >
                <Text style={styles.actionButtonTextPrimary}>Show Welcome Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={onHideWelcomeOverlay}
              >
                <Text style={styles.actionButtonTextSecondary}>Hide Welcome Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonWarning]}
                onPress={handleResetWelcome}
              >
                <Text style={styles.actionButtonTextWarning}>Reset Welcome State</Text>
              </TouchableOpacity>

              {/* Waiting Drawer Section */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Waiting Drawer</Text>
              
              {onShowWaitingDrawer && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonTertiary]}
                  onPress={handleTestWaitingDrawer}
                >
                  <Bus size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonTextTertiary}>Old Trigger Method</Text>
                </TouchableOpacity>
              )}


              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonQuaternary]}
                onPress={() => {
                  Alert.alert(
                    'How to Test',
                    'Tap "Test Waiting Drawer" to open the drawer.',
                    [{ text: 'Got it' }]
                  );
                }}
              >
                <MapPin size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonTextQuaternary}>How to Use</Text>
              </TouchableOpacity>

              {/* Drawer Status Indicator */}
              <View style={[
                styles.statusIndicator,
                drawerState && styles.statusIndicatorActive
              ]}>
                <View style={[
                  styles.statusDot,
                  drawerState && styles.statusDotActive
                ]} />
                <Text style={styles.statusText}>
                  {drawerState ? 'Drawer is OPEN' : 'Drawer is CLOSED'}
                </Text>
              </View>

              {/* Debug Info */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Debug Info</Text>
                <Text style={styles.infoText}>
                  • Test the waiting drawer UI
                </Text>
                <Text style={styles.infoText}>
                  • Works without location
                </Text>
                <Text style={styles.infoText}>
                  • Shows routes and filters
                </Text>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#000000',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 12,
    paddingBottom: 20,
  },
  debugTriggerContainer: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#1ea2b1',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  actionButtonWarning: {
    backgroundColor: '#ff6b3520',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  actionButtonTertiary: {
    backgroundColor: '#10b981',
  },
  actionButtonQuaternary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextWarning: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextTertiary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextQuaternary: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  statusIndicatorActive: {
    backgroundColor: '#1ea2b110',
    borderColor: '#1ea2b1',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  statusDotActive: {
    backgroundColor: '#4ade80',
  },
  statusText: {
    color: '#cccccc',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 4,
  },
});