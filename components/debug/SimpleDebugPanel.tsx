// components/SimpleDebugPanel.tsx - SIMPLIFIED VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Bug, X, Sparkles, Bell, BellOff, Clock, Globe, Shield, Send } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import {
  registerForPushNotificationsAsync,
  sendLocalNotification,
  scheduleDailyNotification,
  checkNotificationPermission,
  isMobilePlatform,
  testPushNotificationSelf,
} from '@/lib/notifications';

interface SimpleDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  onShowWelcomeOverlay: () => void;
  onHideWelcomeOverlay: () => void;
}

export default function SimpleDebugPanel({
  visible,
  onClose,
  onShowWelcomeOverlay,
  onHideWelcomeOverlay,
}: SimpleDebugPanelProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

  useEffect(() => {
    setIsMobile(isMobilePlatform());
  }, []);

  useEffect(() => {
    if (!visible) return;

    const checkAdminRole = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [visible]);

  useEffect(() => {
    if (isAdmin && visible && isMobile) {
      // Check permission and register for notifications
      checkNotificationPermission().then(permission => {
        setHasPermission(permission);
        if (permission === true) {
          registerForPushNotificationsAsync().then(token => {
            setPushToken(token);
          });
        }
      });
    }
  }, [isAdmin, visible, isMobile]);

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

  const handleRequestPermission = async () => {
    if (!isMobile) return;
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        const token = await registerForPushNotificationsAsync();
        setPushToken(token || null);
        Alert.alert('Success', 'Push notifications enabled!');
      } else {
        Alert.alert(
          'Permission Denied',
          'You need to enable notifications in Settings to receive push notifications.'
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permission.');
    }
  };

  const handleTestLocalNotification = async () => {
    if (!isMobile) return;
    
    try {
      await sendLocalNotification(
        'Local Test Notification 📱',
        'This is a local notification triggered from the app!',
        { 
          debug: true, 
          timestamp: new Date().toISOString(),
          type: 'local_test'
        }
      );
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      console.error('Error sending local notification:', error);
      Alert.alert('Error', 'Failed to send local notification.');
    }
  };

  const handleTestPushNotification = async () => {
    if (!isMobile) return;
    
    if (!pushToken) {
      Alert.alert('No Token', 'Please enable notifications first to get a push token.');
      return;
    }
    
    setSendingPush(true);
    try {
      const success = await testPushNotificationSelf();
      
      if (success) {
        Alert.alert(
          'Push Sent!',
          'Push notification sent via Expo servers. It may take a few seconds to arrive.'
        );
      } else {
        Alert.alert('Failed', 'Could not send push notification. Check console for details.');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      Alert.alert('Error', 'Failed to send push notification.');
    } finally {
      setSendingPush(false);
    }
  };

  const handleScheduleDailyNotification = async () => {
    if (!isMobile) return;
    
    try {
      await scheduleDailyNotification(
        'Good Morning! 🌅',
        "Time to plan your day with Uthutho!",
        9, // 9 AM
        0  // 0 minutes
      );
      Alert.alert('Success', 'Daily notification scheduled for 9:00 AM!');
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
      Alert.alert('Error', 'Failed to schedule daily notification.');
    }
  };

  const handleClearAllNotifications = async () => {
    if (!isMobile) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications.');
    }
  };

  const handleCheckAllSettings = async () => {
    if (!isMobile) return;
    
    try {
      const permission = await checkNotificationPermission();
      const token = pushToken || await registerForPushNotificationsAsync();
      
      Alert.alert(
        'Notification Status',
        `Platform: ${Platform.OS.toUpperCase()}\n` +
        `Permission: ${permission ? '✅ Granted' : '❌ Denied'}\n` +
        `Token: ${token ? '✅ Registered' : '❌ Not registered'}\n`
      );
    } catch (error) {
      console.error('Error checking settings:', error);
      Alert.alert('Error', 'Failed to check notification settings.');
    }
  };

  const renderPushNotificationSection = () => {
    if (!isMobile) {
      return (
        <View style={styles.webNoticeContainer}>
          <Globe size={24} color="#666666" />
          <Text style={styles.webNoticeText}>
            Push notifications are only available on iOS and Android devices.
          </Text>
          <Text style={styles.webNoticeSubtext}>
            Open this debug panel on a mobile device to access notification controls.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.settingsStatusContainer}>
          <View style={styles.statusRow}>
            <Shield size={14} color="#1ea2b1" />
            <Text style={styles.statusText}>Platform: {Platform.OS.toUpperCase()}</Text>
          </View>
          <View style={styles.statusRow}>
            <Shield size={14} color={hasPermission ? '#4CAF50' : '#FF9800'} />
            <Text style={styles.statusText}>
              Permission: {hasPermission === null ? 'Checking...' : hasPermission ? 'Granted ✅' : 'Denied ❌'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Shield size={14} color={pushToken ? '#4CAF50' : '#FF9800'} />
            <Text style={styles.statusText}>
              Token: {pushToken ? 'Registered ✅' : 'Not registered'}
            </Text>
          </View>
        </View>

        {pushToken && (
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Expo Push Token:</Text>
            <Text style={styles.tokenText} numberOfLines={1}>
              {pushToken.substring(0, 40)}...
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Full Token',
                  pushToken,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.showFullToken}>Show Full Token</Text>
            </TouchableOpacity>
          </View>
        )}

        {!hasPermission ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleRequestPermission}
          >
            <Bell size={20} color="#ffffff" />
            <Text style={styles.actionButtonTextPrimary}>Enable Push Notifications</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.permissionGrantedContainer}>
            <Bell size={20} color="#4CAF50" />
            <Text style={styles.permissionGrantedText}>Notifications enabled!</Text>
          </View>
        )}

        {/* TEST BUTTONS */}
        <View style={styles.testButtonsContainer}>
          <Text style={styles.testSectionTitle}>Test Notifications:</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleTestLocalNotification}
            disabled={!hasPermission}
          >
            <Bell size={20} color="#1ea2b1" />
            <Text style={[
              styles.actionButtonTextSecondary,
              !hasPermission && styles.disabledText
            ]}>
              Test Local Notification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={handleTestPushNotification}
            disabled={!hasPermission || sendingPush || !pushToken}
          >
            {sendingPush ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
            <Text style={[
              styles.actionButtonTextSuccess,
              (!hasPermission || !pushToken) && styles.disabledText
            ]}>
              {sendingPush ? 'Sending...' : 'Test Push Notification'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Local: Shows immediately{'\n'}
            Push: Goes through Expo servers
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleScheduleDailyNotification}
          disabled={!hasPermission}
        >
          <Clock size={20} color="#1ea2b1" />
          <Text style={[
            styles.actionButtonTextSecondary,
            !hasPermission && styles.disabledText
          ]}>
            Schedule Daily (9 AM)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonWarning]}
          onPress={handleClearAllNotifications}
          disabled={!hasPermission}
        >
          <BellOff size={20} color="#ff6b35" />
          <Text style={[
            styles.actionButtonTextWarning,
            !hasPermission && styles.disabledText
          ]}>
            Clear All Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonInfo]}
          onPress={handleCheckAllSettings}
        >
          <Shield size={20} color="#2196F3" />
          <Text style={styles.actionButtonTextInfo}>
            Check Notification Status
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bug size={24} color="#1ea2b1" />
              <Text style={styles.title}>Debug Panel</Text>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>
                  {isMobile ? Platform.OS.toUpperCase() : 'WEB'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#999999" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="#1ea2b1" />
              <Text style={styles.loadingText}>Checking admin privileges...</Text>
            </View>
          ) : isAdmin ? (
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
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

                {/* Push Notification Controls */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                  Push Notifications
                </Text>

                {renderPushNotificationSection()}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.secretContainer}>
              <Sparkles size={28} color="#fbbf24" />
              <Text style={styles.secretTitle}>Whoa 👀</Text>
              <Text style={styles.secretText}>
                You found a secret no one was supposed to know about.
              </Text>
              <Text style={styles.secretText}>
                That makes you pretty awesome 😛
              </Text>
              <Text style={styles.secretHint}>
                (Later updates will unlock something amazing here.)
              </Text>
            </View>
          )}
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
  platformBadge: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    color: '#cccccc',
    fontSize: 10,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  loading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#cccccc',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  content: {
    gap: 12,
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
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#1ea2b1',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  actionButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  actionButtonWarning: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  actionButtonInfo: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
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
  actionButtonTextSuccess: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextWarning: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextInfo: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  webNoticeContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
  },
  webNoticeText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  webNoticeSubtext: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
  },
  settingsStatusContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#cccccc',
    fontSize: 13,
  },
  tokenContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenLabel: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  showFullToken: {
    color: '#6666ff',
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  testButtonsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  testSectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    color: '#888888',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  permissionGrantedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B5E20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionGrantedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  secretContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  secretTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  secretText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  secretHint: {
    fontSize: 12,
    color: '#777777',
    marginTop: 6,
    textAlign: 'center',
  },
});