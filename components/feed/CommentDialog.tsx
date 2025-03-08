// components/CommentDialog.tsx
import React from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, Image, StyleSheet } from 'react-native';

interface CommentDialogProps {
  isVisible: boolean;
  onClose: () => void;
  selectedPostDetails: any; // Replace with proper type
  newComment: string;
  setNewComment: (text: string) => void;
  onCreateComment: () => void;
  isCreatingComment: boolean;
  colors: {
    modalOverlay: string;
    card: string;
    text: string;
    primary: string;
    buttonText: string;
  };
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  isVisible,
  onClose,
  selectedPostDetails,
  newComment,
  setNewComment,
  onCreateComment,
  isCreatingComment,
  colors,
}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
          </Pressable>
          {selectedPostDetails && (
            <>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor={colors.text}
                style={[styles.commentInput, { color: colors.text }]}
                multiline
              />
              <Pressable
                onPress={onCreateComment}
                style={[styles.commentButton, { backgroundColor: colors.primary }]}
                disabled={isCreatingComment}
              >
                <Text style={[styles.commentButtonText, { color: colors.buttonText }]}>Add Comment</Text>
              </Pressable>

              <FlatList
                data={selectedPostDetails.post_comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.commentContainer}>
                    <Image
                      source={{ uri: item.profiles?.avatar_url }}
                      style={styles.commentAvatar}
                    />
                    <View>
                      <Text style={[styles.commentUserName, { color: colors.text }]}>
                        {item.profiles?.first_name} {item.profiles?.last_name}
                      </Text>
                      <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
                    </View>
                  </View>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  commentButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonText: {
    fontWeight: 'bold',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentUserName: {
    fontWeight: 'bold',
  },
  commentContent: {
    color: '#333',
  },
});

export default CommentDialog;