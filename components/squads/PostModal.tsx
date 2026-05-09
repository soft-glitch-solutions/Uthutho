import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { X, Camera, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PostModalProps {
  visible: boolean;
  onClose: () => void;
  postContent: string;
  setPostContent: (text: string) => void;
  onCreatePost: () => void;
  posting: boolean;
  BRAND_COLOR: string;
}

export const PostModal = ({
  visible,
  onClose,
  postContent,
  setPostContent,
  onCreatePost,
  posting,
  BRAND_COLOR
}: PostModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Intel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>What's happening?</Text>
            <TextInput
              style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Share a status update with your squad..."
              placeholderTextColor="#444"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              autoFocus
            />
            <TouchableOpacity style={styles.addMediaBtn}>
              <Camera size={20} color={BRAND_COLOR} />
              <Text style={styles.addMediaText}>Attach Evidence (Photo)</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !postContent.trim() && { opacity: 0.5 }]}
            onPress={onCreatePost}
            disabled={!postContent.trim() || posting}
          >
            <LinearGradient
              colors={[BRAND_COLOR, '#15808d']}
              style={styles.confirmBtnInner}
            >
              {posting ? <ActivityIndicator color="#FFF" /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Send size={18} color="#FFF" />
                  <Text style={styles.confirmBtnText}>Broadcast Update</Text>
                </View>
              )}
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
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  addMediaText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '700',
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
