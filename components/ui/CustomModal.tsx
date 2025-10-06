import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, AlertTriangle, CheckCircle, Info, Edit3 } from 'lucide-react-native';

export type ModalType = 'confirm' | 'success' | 'error' | 'info' | 'edit';

interface CustomModalProps {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type,
  title,
  message,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <AlertTriangle size={32} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={32} color="#10b981" />;
      case 'error':
        return <AlertTriangle size={32} color="#ef4444" />;
      case 'info':
        return <Info size={32} color="#1ea2b1" />;
      case 'edit':
        return <Edit3 size={32} color="#1ea2b1" />;
      default:
        return <Info size={32} color="#1ea2b1" />;
    }
  };

  const getPrimaryButtonStyle = () => {
    switch (type) {
      case 'confirm':
        return styles.confirmButton;
      case 'success':
        return styles.successButton;
      case 'error':
        return styles.errorButton;
      case 'info':
        return styles.infoButton;
      case 'edit':
        return styles.editButton;
      default:
        return styles.infoButton;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            
            {children && (
              <View style={styles.childrenContainer}>
                {children}
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            {secondaryButtonText && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={onSecondaryPress || onClose}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.primaryButton, getPrimaryButtonStyle()]}
              onPress={onPrimaryPress}
            >
              <Text style={styles.primaryButtonText}>
                {primaryButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 0,
  },
  iconContainer: {
    padding: 8,
  },
  closeButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
    paddingTop: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 22,
  },
  childrenContainer: {
    marginTop: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  infoButton: {
    backgroundColor: '#1ea2b1',
  },
  editButton: {
    backgroundColor: '#1ea2b1',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CustomModal;