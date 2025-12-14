import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bug, X, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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

          {/* Content */}
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="#1ea2b1" />
            </View>
          ) : isAdmin ? (
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
            </View>
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

  // 🔥 BLACK PANEL
  container: {
    backgroundColor: '#000000',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
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
  closeButton: {
    padding: 4,
  },
  loading: {
    paddingVertical: 30,
    alignItems: 'center',
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

  // Secret view
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
