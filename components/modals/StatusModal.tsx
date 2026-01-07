// components/modals/StatusModal.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from 'lucide-react-native';

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if enabled
      if (autoClose && type !== 'loading') {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, type]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={64} color="#10B981" />;
      case 'error':
        return <XCircle size={64} color="#EF4444" />;
      case 'warning':
        return <AlertCircle size={64} color="#F59E0B" />;
      case 'loading':
        return <Clock size={64} color="#1ea2b1" />;
      case 'info':
      default:
        return <Info size={64} color="#1ea2b1" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.1)';
      case 'loading':
        return 'rgba(30, 162, 177, 0.1)';
      case 'info':
      default:
        return 'rgba(30, 162, 177, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.2)';
      case 'error':
        return 'rgba(239, 68, 68, 0.2)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.2)';
      case 'loading':
        return 'rgba(30, 162, 177, 0.2)';
      case 'info':
      default:
        return 'rgba(30, 162, 177, 0.2)';
    }
  };

  const getActionButtonColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'loading':
        return '#1ea2b1';
      case 'info':
      default:
        return '#1ea2b1';
    }
  };

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
              backgroundColor: '#111111',
              borderColor: getBorderColor(),
              borderWidth: 1,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
            {getIcon()}
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Loading indicator */}
          {type === 'loading' && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {actionText && onAction && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getActionButtonColor() }]}
                onPress={handleAction}
              >
                <Text style={styles.actionButtonText}>{actionText}</Text>
              </TouchableOpacity>
            )}
            
            {showCloseButton && type !== 'loading' && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1ea2b1',
    opacity: 0.6,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});