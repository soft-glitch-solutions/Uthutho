import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { X, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CreateSquadModalProps {
  visible: boolean;
  onClose: () => void;
  newSquadName: string;
  setNewSquadName: (text: string) => void;
  onCreate: () => void;
  creating: boolean;
  BRAND_COLOR: string;
}

export const CreateSquadModal = ({
  visible,
  onClose,
  newSquadName,
  setNewSquadName,
  onCreate,
  creating,
  BRAND_COLOR
}: CreateSquadModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Form New Squad</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Squad Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Shadow Syndicate"
              placeholderTextColor="#444"
              value={newSquadName}
              onChangeText={setNewSquadName}
              autoFocus
            />
            <View style={styles.costInfo}>
              <Zap size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.inputHint}>Deducts 1,000 Points from your account.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !newSquadName.trim() && { opacity: 0.5 }]}
            onPress={onCreate}
            disabled={!newSquadName.trim() || creating}
          >
            <LinearGradient
              colors={[BRAND_COLOR, '#15808d']}
              style={styles.confirmBtnInner}
            >
              {creating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Buy Legion</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#050505',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 16,
    marginBottom: 24,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#222',
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  inputHint: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  confirmBtnInner: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
