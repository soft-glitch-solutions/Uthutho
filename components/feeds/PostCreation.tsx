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
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface ExtendedPostCreationProps extends Omit<PostCreationProps, 'createPost'> {
  createPost: () => Promise<void>;
  maxLength?: number;
  isDesktop?: boolean;
  selectedCommunity?: {
    id: string;
    name: string;
    type: 'hub' | 'stop';
    latitude?: number;
    longitude?: number;
    address?: string;
  };
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
  const router = useRouter();

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

  const handleCommunityPress = () => {
    if (!selectedCommunity) return;
    
    // Navigate to the community page based on type
    if (selectedCommunity.type === 'hub') {
      router.push(`/hub/${selectedCommunity.id}`);
    } else if (selectedCommunity.type === 'stop') {
      router.push(`/stop-details?stopId=${selectedCommunity.id}`);
    }
  };

  const canPost = newPost.trim() && !isOverLimit && !uploading;

  return (
    <View style={[styles.postCreationContainer, desktopMode && styles.postCreationContainerDesktop]}>
      {selectedCommunity && (
        <View style={[styles.communityHeader, desktopMode && styles.communityHeaderDesktop]}>
          <Text style={[styles.communityHeaderText, desktopMode && styles.communityHeaderTextDesktop]}>
            Posting in{' '}
          </Text>
          
          <TouchableOpacity 
            onPress={handleCommunityPress}
            activeOpacity={0.6}
            style={styles.communityButton}
          >
            <View style={styles.communityButtonContent}>
              <Text style={[styles.communityName, desktopMode && styles.communityNameDesktop]}>
                {selectedCommunity.name}
              </Text>
            </View>
          </TouchableOpacity>
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
        editable={!uploading}
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
          activeOpacity={0.8}
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  
  communityButton: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
  },
  communityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityName: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 14,
  },
  communityNameDesktop: {
    fontSize: 13,
  },
  navIcon: {
    opacity: 0.8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonDesktop: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
  },
  postButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
    elevation: 0,
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