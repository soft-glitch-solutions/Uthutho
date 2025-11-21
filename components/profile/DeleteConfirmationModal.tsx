import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, Trash } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { DeleteModalProps } from '@/types/profile';

export const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={[styles.deleteModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.deleteModalHeader}>
            <AlertTriangle size={24} color="#ef4444" />
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Post</Text>
          </View>
          
          <Text style={[styles.deleteModalMessage, { color: colors.text }]}>
            Are you sure you want to delete this post?{'\n\n'}
            <Text style={styles.warningText}>
              This action cannot be undone. The post and all its comments will be permanently removed.
            </Text>
          </Text>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity 
              style={[styles.deleteCancelButton, { backgroundColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.deleteCancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteConfirmButton}
              onPress={onConfirm}
            >
              <Trash size={16} color="#ffffff" />
              <Text style={styles.deleteConfirmButtonText}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteModalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  warningText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 14,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});