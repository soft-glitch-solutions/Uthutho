// hooks/useFeedsData.ts
import { useState, useCallback } from 'react';
import { Alert, Platform, Share as RNShare } from 'react-native';
import { supabase } from '@/lib/supabase';
import * as MediaLibrary from 'expo-media-library';
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