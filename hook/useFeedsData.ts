// hooks/useFeedsData.ts
import { useState, useCallback } from 'react';
import { Alert, Platform, Share as RNShare } from 'react-native';
import { supabase } from '@/lib/supabase';
import ViewShot from 'react-native-view-shot';
import { Community, Post } from '@/types/feeds';

export const useFeedsData = (userId: string) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingFavorites, setCheckingFavorites] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [weekRange, setWeekRange] = useState<string>('');
  const [postFilter, setPostFilter] = useState<'week' | 'all' | 'today'>('week');
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [sharingPost, setSharingPost] = useState(false);

  // All your data loading functions go here (loadFavoriteCommunities, loadAllCommunities, etc.)
  // They remain the same as in your original code, just moved to this hook

  // Updated sharePost function
  const sharePost = useCallback(async (post: Post, viewShotRef: any) => {
    try {
      setSharingPost(true);
      
      const communityName = selectedCommunity?.name || "Uthutho Community";
      const userName = `${post.profiles.first_name} ${post.profiles.last_name}`;
      const shareUrl = `https://mobile.uthutho.co.za/post/${post.id}`;

      const message = `Check out ${userName}'s post in ${communityName} on Uthutho:\n\n"${post.content}"\n\n${shareUrl}`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Post from ${communityName}`,
            text: message,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          Alert.alert('Link copied', 'Post link has been copied to your clipboard');
        }
      } else {
        // Use React Native's Share API for mobile
        try {
          const result = await RNShare.share({
            message: message,
            title: `Post from ${communityName}`,
          });
          
          if (result.action === RNShare.sharedAction) {
            console.log('Post shared successfully');
          } else if (result.action === RNShare.dismissedAction) {
            console.log('Share dismissed');
          }
        } catch (shareError) {
          console.error('Error sharing:', shareError);
          // Fallback to alert if sharing fails
          Alert.alert(
            'Share Post', 
            `${message}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setSharingPost(false);
    }
  }, [selectedCommunity]);

  // Updated downloadPost function - COMPLIANT with Google Play policy
  const downloadPost = useCallback(async (post: Post, viewShotRef: any) => {
    if (!viewShotRef.current) return;

    try {
      setSharingPost(true);
      
      // Capture the post as an image
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (Platform.OS === 'android') {
        // For Android, use the Share API instead of MediaLibrary
        // This avoids the need for READ_MEDIA_IMAGES permission
        const result = await RNShare.share({
          title: 'Save Post to Gallery',
          message: 'Save this post image to your gallery',
          url: uri,
        });
        
        if (result.action === RNShare.sharedAction) {
          Alert.alert('Success', 'Use the share options to save the post to your gallery!');
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, we can still use MediaLibrary with proper permissions
        try {
          // Dynamically import expo-media-library to avoid issues
          const MediaLibrary = require('expo-media-library');
          
          const { status } = await MediaLibrary.requestPermissionsAsync();
          
          if (status === 'granted') {
            const asset = await MediaLibrary.createAssetAsync(uri);
            const album = await MediaLibrary.getAlbumAsync('Uthutho');
            
            if (album) {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
              await MediaLibrary.createAlbumAsync('Uthutho', asset, false);
            }
            
            Alert.alert('Success', 'Post saved to your photo gallery!');
          } else {
            // Fallback to sharing on iOS if permission denied
            const result = await RNShare.share({
              title: 'Save Post to Gallery',
              message: 'Save this post image to your gallery',
              url: uri,
            });
            
            if (result.action === RNShare.sharedAction) {
              Alert.alert('Success', 'Use the share options to save the post to your gallery!');
            }
          }
        } catch (iosError) {
          console.error('iOS save error:', iosError);
          // Fallback to sharing
          const result = await RNShare.share({
            title: 'Save Post to Gallery',
            message: 'Save this post image to your gallery',
            url: uri,
          });
        }
      }
    } catch (error) {
      console.error('Error downloading post:', error);
      
      // Show a more generic error message
      Alert.alert(
        'Save Post', 
        'You can save this post by sharing it and choosing "Save to Photos" from the share options.',
        [{ text: 'OK' }]
      );
    } finally {
      setSharingPost(false);
    }
  }, []);

  // The rest of your functions remain the same (loadFavoriteCommunities, loadAllCommunities, etc.)

  return {
    // State
    communities,
    selectedCommunity,
    posts,
    newPost,
    loading,
    refreshing,
    showAddCommunity,
    allCommunities,
    searchQuery,
    checkingFavorites,
    unreadNotifications,
    initialLoadComplete,
    weekRange,
    postFilter,
    followerCounts,
    sharingPost,
    
    // Setters
    setPosts,
    setNewPost,
    setSearchQuery,
    setShowAddCommunity,
    setSelectedCommunity,
    setPostFilter,
    setInitialLoadComplete,
    setLoading,
    setRefreshing,
    
    // Functions
    loadFavoriteCommunities,
    loadAllCommunities,
    loadNotificationCount,
    loadCommunityPosts,
    onRefresh,
    createPost,
    toggleFavorite,
    toggleReaction,
    sharePost,
    downloadPost,
    isValidUUID,
  };
};