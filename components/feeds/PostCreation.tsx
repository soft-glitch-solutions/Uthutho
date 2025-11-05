// components/feeds/PostCreation.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PostCreationProps } from '@/types';

const PostCreation: React.FC<PostCreationProps> = ({
  newPost,
  setNewPost,
  createPost,
  maxLength = 500,
}) => {
  const [uploading, setUploading] = useState(false);

  const characterCount = newPost.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  const handleCreatePost = async () => {
    if (!newPost.trim() || isOverLimit) return;
    
    setUploading(true);
    
    try {
      // Create post without images
      await createPost(newPost, []);
      
      // Reset form
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const canPost = newPost.trim() && !isOverLimit && !uploading;

  return (
    <View style={styles.postCreationContainer}>
      <TextInput
        style={[
          styles.postInput,
          isOverLimit && styles.postInputError,
        ]}
        placeholder="What's happening?"
        placeholderTextColor="#777"
        value={newPost}
        onChangeText={setNewPost}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />
      
      <View style={styles.postFooter}>
        <View style={styles.footerLeft}>
          <Text style={[
            styles.characterCount,
            isNearLimit && styles.characterCountWarning,
            isOverLimit && styles.characterCountError,
          ]}>
            {characterCount}/{maxLength}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.postButton,
            !canPost && styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!canPost}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCreationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
  },
  postInputError: {
    borderColor: '#ef4444',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  characterCount: {
    fontSize: 14,
    color: '#666666',
  },
  characterCountWarning: {
    color: '#f59e0b',
  },
  characterCountError: {
    color: '#ef4444',
  },
  postButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PostCreation;