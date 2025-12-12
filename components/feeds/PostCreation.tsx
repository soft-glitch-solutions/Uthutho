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
  Dimensions,
} from 'react-native';
import { PostCreationProps } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface ExtendedPostCreationProps extends Omit<PostCreationProps, 'createPost'> {
  createPost: () => Promise<void>;
  maxLength?: number;
  isDesktop?: boolean;
  selectedCommunity?: any;
}

const PostCreation: React.FC<ExtendedPostCreationProps> = ({
  newPost,
  setNewPost,
  createPost,
  maxLength = 500,
  isDesktop: propIsDesktop = false,
  selectedCommunity,
}) => {
  const desktopMode = isDesktop || propIsDesktop;
  const [uploading, setUploading] = useState(false);

  const characterCount = newPost.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  const handleCreatePost = async () => {
    if (!newPost.trim() || isOverLimit) return;
    
    setUploading(true);
    
    try {
      await createPost();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const canPost = newPost.trim() && !isOverLimit && !uploading;

  return (
    <View style={[styles.postCreationContainer, desktopMode && styles.postCreationContainerDesktop]}>
      {selectedCommunity && (
        <View style={[styles.communityHeader, desktopMode && styles.communityHeaderDesktop]}>
          <Text style={[styles.communityHeaderText, desktopMode && styles.communityHeaderTextDesktop]}>
            Posting in <Text style={styles.communityName}>{selectedCommunity.name}</Text>
          </Text>
        </View>
      )}
      
      <TextInput
        style={[
          styles.postInput,
          desktopMode && styles.postInputDesktop,
          isOverLimit && styles.postInputError,
        ]}
        placeholder="What's happening in the community?"
        placeholderTextColor="#777"
        value={newPost}
        onChangeText={setNewPost}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />
      
      <View style={[styles.postFooter, desktopMode && styles.postFooterDesktop]}>
        <View style={[styles.footerLeft, desktopMode && styles.footerLeftDesktop]}>
          <Text style={[
            styles.characterCount,
            desktopMode && styles.characterCountDesktop,
            isNearLimit && styles.characterCountWarning,
            isOverLimit && styles.characterCountError,
          ]}>
            {characterCount}/{maxLength}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.postButton,
            desktopMode && styles.postButtonDesktop,
            !canPost && styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!canPost}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={[styles.postButtonText, desktopMode && styles.postButtonTextDesktop]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  postCreationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postCreationContainerDesktop: {
    padding: 12,
    margin: 0,
    marginBottom: 16,
    borderRadius: 12,
  },
  
  communityHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  communityHeaderDesktop: {
    marginBottom: 8,
    paddingBottom: 6,
  },
  communityHeaderText: {
    fontSize: 14,
    color: '#cccccc',
  },
  communityHeaderTextDesktop: {
    fontSize: 13,
  },
  communityName: {
    color: '#1ea2b1',
    fontWeight: '600',
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
  postInputDesktop: {
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    borderRadius: 10,
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
  postFooterDesktop: {
    marginTop: 10,
  },
  
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLeftDesktop: {
    gap: 12,
  },
  
  characterCount: {
    fontSize: 14,
    color: '#666666',
  },
  characterCountDesktop: {
    fontSize: 13,
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
  postButtonDesktop: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
  },
  
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  postButtonTextDesktop: {
    fontSize: 13,
  },
});

export default PostCreation;