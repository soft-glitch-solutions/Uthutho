import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ContributeModalProps {
  visible: boolean;
  onClose: () => void;
  amount: string;
  setAmount: (text: string) => void;
  onConfirm: () => void;
  loading: boolean;
  userPoints: number;
  BRAND_COLOR: string;
}

export const ContributeModal = ({
  visible,
  onClose,
  amount,
  setAmount,
  onConfirm,
  loading,
  userPoints,
  BRAND_COLOR
}: ContributeModalProps) => {
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
            <Text style={styles.modalTitle}>Boost Squad Influence</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Amount to Contribute</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 500"
              placeholderTextColor="#444"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <Text style={styles.inputHint}>Your Balance: {userPoints || 0} pts</Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, (!amount || parseInt(amount) <= 0) && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={!amount || parseInt(amount) <= 0 || loading}
          >
            <LinearGradient
              colors={[BRAND_COLOR, '#15808d']}
              style={styles.confirmBtnInner}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Confirm Donation</Text>}
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
  inputHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
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
