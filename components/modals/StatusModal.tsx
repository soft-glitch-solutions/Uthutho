import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusModalProps {
  visible: boolean;
  type: StatusType;
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showCloseButton?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export default function StatusModal({
  visible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
  showCloseButton = true,
  actionText,
  onAction,
}: StatusModalProps) {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose && type !== 'loading') {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, type]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };

  const statusConfig = {
    success: { icon: <CheckCircle2 size={48} color="#10B981" />, color: '#10B981', bg: '#10B98115' },
    error: { icon: <XCircle size={48} color="#EF4444" />, color: '#EF4444', bg: '#EF444415' },
    warning: { icon: <AlertCircle size={48} color="#F59E0B" />, color: '#F59E0B', bg: '#F59E0B15' },
    loading: { icon: <Loader2 size={48} color={colors.primary} />, color: colors.primary, bg: `${colors.primary}15` },
    info: { icon: <Info size={48} color={colors.primary} />, color: colors.primary, bg: `${colors.primary}15` },
  };

  const config = statusConfig[type] || statusConfig.info;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
            {config.icon}
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

          <View style={styles.buttonContainer}>
            {actionText && onAction && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: config.color }]}
                onPress={handleAction}
              >
                <Text style={styles.actionButtonText}>{actionText}</Text>
              </TouchableOpacity>
            )}
            
            {showCloseButton && type !== 'loading' && (
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleClose}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 32,
    borderRadius: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.6,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});