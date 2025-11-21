import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Platform 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

// Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostsTab } from '@/components/profile/PostsTab';
import { BasicInfoTab } from '@/components/profile/BasicInfoTab';
import { AchievementsTab } from '@/components/profile/AchievementsTab';
import { DeleteConfirmationModal } from '@/components/profile/DeleteConfirmationModal';

// Types
import { UserPost, LinkedAccount } from '@/types/profile';

export default function ProfileScreen() {
  const { formatTimeAgo } = require('@/components/utils');
  const { colors } = useTheme();
  const {
    loading,
    profile,
    handleSignOut,
    uploadAvatar,
    uploading,
  } = useProfile();

  const [selectedTab, setSelectedTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{id: string; type: 'hub' | 'stop'} | null>(null);

  // Load data effects
  useEffect(() => {
    if (profile?.id) {
      loadLinkedAccounts();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedTab === 'posts' && profile?.id) {
      loadUserPosts();
    }
  }, [selectedTab, profile?.id]);

  // Data loading functions
  const loadLinkedAccounts = async () => {
    try {
      setAccountsLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        const { user } = session;
        const accounts: LinkedAccount[] = [];
        
        if (user.email) {
          accounts.push({
            provider: 'email',
            connected: true,
            email: user.email
          });
        }
        
        const identities = user.identities || [];
        
        const hasGoogle = identities.some(identity => identity.provider === 'google');
        accounts.push({
          provider: 'google',
          connected: hasGoogle,
          email: hasGoogle ? user.email : undefined
        });
        
        const hasFacebook = identities.some(identity => identity.provider === 'facebook');
        accounts.push({
          provider: 'facebook',
          connected: hasFacebook,
          email: hasFacebook ? user.email : undefined
        });
        
        setLinkedAccounts(accounts);
      }
    } catch (error) {
      console.error('Error loading linked accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setPostsLoading(true);
      
      // Load hub posts
      const { data: hubPosts, error: hubError } = await supabase
        .from('hub_posts')
        .select(`
          id, 
          content, 
          created_at,
          hubs (name),
          post_reactions (reaction_type),
          post_comments (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (hubError) throw hubError;

      // Load stop posts
      const { data: stopPosts, error: stopError } = await supabase
        .from('stop_posts')
        .select(`
          id, 
          content, 
          created_at,
          stops (name),
          post_reactions (reaction_type),
          post_comments (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (stopError) throw stopError;

      // Combine and format posts
      const combinedPosts = [
        ...(hubPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          type: 'hub' as const,
          location_name: post.hubs?.name || 'Unknown Hub',
          likes_count: post.post_reactions?.filter(r => r.reaction_type === 'fire').length || 0,
          comments_count: post.post_comments?.length || 0
        })),
        ...(stopPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          type: 'stop' as const,
          location_name: post.stops?.name || 'Unknown Stop',
          likes_count: post.post_reactions?.filter(r => r.reaction_type === 'fire').length || 0,
          comments_count: post.post_comments?.length || 0
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUserPosts(combinedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Event handlers
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      const publicUrl = await uploadAvatar(file);
      console.log('Avatar uploaded successfully:', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleImagePicker = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAvatar(asset.uri);
      }
    }
  };

  const handleDeletePost = async (postId: string, postType: 'hub' | 'stop') => {
    setPostToDelete({ id: postId, type: postType });
    setDeleteModalVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      let error = null;
      if (postToDelete.type === 'hub') {
        const { error: hubError } = await supabase.from('hub_posts').delete().eq('id', postToDelete.id);
        error = hubError;
      } else {
        const { error: stopError } = await supabase.from('stop_posts').delete().eq('id', postToDelete.id);
        error = stopError;
      }

      if (error) {
        throw error;
      }

      setUserPosts(userPosts.filter(post => post.id !== postToDelete.id));
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeleteModalVisible(false);
      setPostToDelete(null);
    }
  };

  const cancelDeletePost = () => {
    setDeleteModalVisible(false);
    setPostToDelete(null);
  };

  const navigateToPost = (postId: string, postType: 'hub' | 'stop') => {
    router.push(`/post/${postId}`);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'posts':
        return (
          <PostsTab
            loading={postsLoading}
            posts={userPosts}
            onDeletePost={handleDeletePost}
            onNavigateToPost={navigateToPost}
            formatTimeAgo={formatTimeAgo}
          />
        );
      case 'basic-info':
        return (
          <BasicInfoTab
            colors={colors}
            accountsLoading={accountsLoading}
            linkedAccounts={linkedAccounts}
            onSignOut={handleSignOut}
          />
        );
      case 'achievements':
        return (
          <AchievementsTab
            colors={colors}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileInputChange}
          />
        )}

        {/* Profile Header */}
        <ProfileHeader
          loading={loading}
          profile={profile}
          uploading={uploading}
          onImagePicker={handleImagePicker}
          accountsLoading={accountsLoading}
          linkedAccounts={linkedAccounts}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'posts' && styles.activeTab]}
            onPress={() => setSelectedTab('posts')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'basic-info' && styles.activeTab]}
            onPress={() => setSelectedTab('basic-info')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Awards</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        <View style={styles.bottomSpace} />

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.text }]}>Uthutho v1.5.1</Text>
          <Text style={[styles.motto, { color: colors.primary }]}>"Izindlela zakho ziqinisekisa impumelelo!"</Text>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  tab: {
    padding: 10,
    borderRadius: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1ea2b1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  motto: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});