// components/feeds/PostCreationModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { X, Send } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostCreationModalProps {
  visible: boolean;
  onClose: () => void;
  newPost: string;
  setNewPost: (text: string) => void;
  createPost: () => Promise<void>;
  selectedCommunity?: {
    id: string;
    name: string;
    type: 'hub' | 'stop';
  } | null;
  maxLength?: number;
}

const PostCreationModal: React.FC<PostCreationModalProps> = ({
  visible,
  onClose,
  newPost,
  setNewPost,
  createPost,
  selectedCommunity,
  maxLength = 500,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [uploading, setUploading] = useState(false);

  const characterCount = newPost.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;
  const canPost = newPost.trim() && !isOverLimit && !uploading;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleCreatePost = async () => {
    if (!canPost) return;
    setUploading(true);
    try {
      await createPost();
      onClose();
    } catch (e) {
      console.error('Error creating post:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>New Post</Text>
              {selectedCommunity && (
                <Text style={styles.modalSubtitle}>
                  in{' '}
                  <Text style={styles.communityName}>{selectedCommunity.name}</Text>
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Text Input */}
          <TextInput
            style={[styles.input, isOverLimit && styles.inputError]}
            placeholder="What's happening in the community?"
            placeholderTextColor="#555555"
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
            editable={!uploading}
            autoFocus
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.charCount,
                isNearLimit && styles.charCountWarning,
                isOverLimit && styles.charCountError,
              ]}
            >
              {characterCount}/{maxLength}
            </Text>

            <TouchableOpacity
              style={[styles.postButton, !canPost && styles.postButtonDisabled]}
              onPress={handleCreatePost}
              disabled={!canPost}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.postButtonText}>Post</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  communityName: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 13,
    color: '#555555',
  },
  charCountWarning: {
    color: '#f59e0b',
  },
  charCountError: {
    color: '#ef4444',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1ea2b1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#2a2a2a',
    shadowOpacity: 0,
    elevation: 0,
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PostCreationModal;
