import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  Dimensions 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostsTab } from '@/components/profile/PostsTab';
import { BasicInfoTab } from '@/components/profile/BasicInfoTab';
import { AchievementsTab } from '@/components/profile/AchievementsTab';
import { DeleteConfirmationModal } from '@/components/profile/DeleteConfirmationModal';

// Types
import { UserPost, LinkedAccount } from '@/types/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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
        
        // Check for Twitter if you have it configured
        const hasTwitter = identities.some(identity => identity.provider === 'twitter');
        accounts.push({
          provider: 'twitter',
          connected: hasTwitter,
          email: hasTwitter ? user.email : undefined
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
      console.log('🔄 Loading posts for user:', profile.id);
      
      // First, get the user's profile data
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, selected_title')
        .eq('id', profile.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('✅ User profile data:', userProfile);

      // Load hub posts
      const { data: hubPosts, error: hubError } = await supabase
        .from('hub_posts')
        .select(`
          id, 
          content, 
          created_at,
          user_id,
          hubs (name),
          post_reactions (reaction_type),
          post_comments (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (hubError) {
        console.error('❌ Hub posts fetch error:', hubError);
        throw hubError;
      }

      console.log('✅ Hub posts:', hubPosts);

      // Load stop posts
      const { data: stopPosts, error: stopError } = await supabase
        .from('stop_posts')
        .select(`
          id, 
          content, 
          created_at,
          user_id,
          stops (name),
          post_reactions (reaction_type),
          post_comments (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (stopError) {
        console.error('❌ Stop posts fetch error:', stopError);
        throw stopError;
      }

      console.log('✅ Stop posts:', stopPosts);

      // Combine and format posts with the profile data
      const combinedPosts = [
        ...(hubPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user_id: post.user_id,
          type: 'hub' as const,
          location_name: post.hubs?.name || 'Unknown Hub',
          likes_count: post.post_reactions?.filter(r => r.reaction_type === 'fire').length || 0,
          comments_count: post.post_comments?.length || 0,
          user_first_name: userProfile?.first_name,
          user_last_name: userProfile?.last_name,
          user_avatar_url: userProfile?.avatar_url,
          user_title: userProfile?.selected_title,
          reactions: post.post_reactions || [],
          comments: post.post_comments || []
        })),
        ...(stopPosts || []).map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user_id: post.user_id,
          type: 'stop' as const,
          location_name: post.stops?.name || 'Unknown Stop',
          likes_count: post.post_reactions?.filter(r => r.reaction_type === 'fire').length || 0,
          comments_count: post.post_comments?.length || 0,
          user_first_name: userProfile?.first_name,
          user_last_name: userProfile?.last_name,
          user_avatar_url: userProfile?.avatar_url,
          user_title: userProfile?.selected_title,
          reactions: post.post_reactions || [],
          comments: post.post_comments || []
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('📊 Final combined posts:', combinedPosts);
      setUserPosts(combinedPosts);

    } catch (error) {
      console.error('❌ Error loading user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Function to handle connecting social accounts with detailed error handling
  const handleConnectAccount = async (provider: string) => {
    console.log(`Starting ${provider} connection...`);
    
    try {
      // First, get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }
      
      console.log('User session found:', session.user.email);
      
      // Create a deep link URL for the OAuth callback
      const callbackUrl = Linking.createURL('/profile');
      console.log('Callback URL:', callbackUrl);
      
      // Set up OAuth parameters based on provider
      let oauthProvider: 'google' | 'facebook' | 'twitter' | null = null;
      
      switch (provider) {
        case 'google':
          oauthProvider = 'google';
          break;
        case 'facebook':
          oauthProvider = 'facebook';
          break;
        case 'twitter':
          oauthProvider = 'twitter';
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // For web platform
      if (Platform.OS === 'web') {
        console.log('Starting web OAuth for provider:', oauthProvider);
        
        // First, check if we can get an OAuth URL
        const { data, error } = await supabase.auth.linkIdentity({
          provider: oauthProvider,
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: false, // Let Supabase handle redirect
          },
        });
        
        console.log('linkIdentity response:', { data, error });
        
        if (error) {
          console.error('linkIdentity error:', error);
          
          // Check for specific error types
          if (error.message?.includes('already linked')) {
            throw new Error('This social account is already linked to another user.');
          } else if (error.message?.includes('User already registered')) {
            throw new Error('This account is already registered with us.');
          } else if (error.message?.includes('Provider not enabled')) {
            throw new Error(`The ${provider} OAuth provider is not enabled in Supabase. Please contact support.`);
          } else if (error.message?.includes('invalid_client')) {
            throw new Error(`The ${provider} OAuth configuration is incorrect. Please contact support.`);
          } else {
            throw new Error(`OAuth setup error: ${error.message || 'Unknown error'}`);
          }
        }
        
        if (data?.url) {
          console.log('Opening OAuth URL:', data.url);
          
          // Open the OAuth URL in a new window/tab
          const authWindow = window.open(
            data.url, 
            '_blank', 
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );
          
          if (!authWindow) {
            throw new Error('Popup was blocked. Please allow popups for this website and try again.');
          }
          
          // Focus the new window
          authWindow.focus();
          
          // Set up a listener for the OAuth callback
          let checkCount = 0;
          const maxChecks = 120; // 2 minutes at 1-second intervals
          
          const checkOAuthCompletion = setInterval(async () => {
            checkCount++;
            
            try {
              // Check if the auth window is closed
              if (authWindow.closed) {
                clearInterval(checkOAuthCompletion);
                throw new Error('Authentication window was closed before completing.');
              }
              
              // Check if user is still in the same session
              const { data: { session: newSession } } = await supabase.auth.getSession();
              
              // Check if the provider is now connected
              if (newSession) {
                const identities = newSession.user.identities || [];
                const isNowConnected = identities.some(identity => 
                  identity.provider === provider || 
                  identity.provider === oauthProvider
                );
                
                if (isNowConnected) {
                  console.log(`${provider} account successfully connected!`);
                  clearInterval(checkOAuthCompletion);
                  authWindow.close();
                  
                  // Reload accounts
                  await loadLinkedAccounts();
                  
                  // Award points
                  await awardPointsForConnection(provider);
                  return;
                }
              }
              
              // Timeout after max checks
              if (checkCount >= maxChecks) {
                clearInterval(checkOAuthCompletion);
                authWindow.close();
                throw new Error('Connection timed out after 2 minutes. Please try again.');
              }
              
            } catch (checkError) {
              console.error('Error checking OAuth completion:', checkError);
              clearInterval(checkOAuthCompletion);
              authWindow.close();
              throw new Error(`Verification failed: ${checkError.message}`);
            }
          }, 1000);
          
        } else {
          console.warn('No OAuth URL returned from linkIdentity');
          throw new Error('Failed to start OAuth flow. No authentication URL was provided.');
        }
        
      } else {
        // For mobile, use Expo WebBrowser
        console.log('Starting mobile OAuth for provider:', oauthProvider);
        
        const { data, error } = await supabase.auth.linkIdentity({
          provider: oauthProvider,
          options: {
            redirectTo: callbackUrl,
            skipBrowserRedirect: true,
          },
        });
        
        console.log('Mobile linkIdentity response:', { data, error });
        
        if (error) {
          console.error('Mobile OAuth error:', error);
          throw new Error(`Mobile OAuth error: ${error.message || 'Unknown error'}`);
        }
        
        if (data?.url) {
          console.log('Opening mobile OAuth URL:', data.url);
          
          // Open the OAuth URL in a browser
          const result = await WebBrowser.openAuthSessionAsync(data.url, callbackUrl);
          console.log('WebBrowser result:', result);
          
          if (result.type === 'success') {
            // Parse the URL to get the code
            const url = result.url;
            console.log('OAuth callback URL:', url);
            
            // Extract code from URL
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get('code');
            const errorParam = urlObj.searchParams.get('error');
            
            if (errorParam) {
              throw new Error(`OAuth error: ${errorParam}`);
            }
            
            if (code) {
              console.log('Exchanging code for session...');
              // Exchange the code for a session
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                console.error('Session exchange error:', exchangeError);
                throw new Error(`Session exchange error: ${exchangeError.message}`);
              }
              
              console.log('Session exchange successful');
              // Reload accounts
              await loadLinkedAccounts();
              
              // Award points for connecting
              await awardPointsForConnection(provider);
            } else {
              throw new Error('No authorization code received from OAuth provider.');
            }
          } else if (result.type === 'cancel') {
            throw new Error('Connection cancelled by user.');
          } else if (result.type === 'dismiss') {
            throw new Error('Connection was dismissed.');
          } else if (result.type === 'locked') {
            throw new Error('Browser is locked or not available.');
          } else {
            throw new Error(`Connection failed with type: ${result.type}`);
          }
        } else {
          throw new Error('No OAuth URL provided for mobile authentication.');
        }
      }
      
    } catch (error) {
      console.error(`Error connecting ${provider} account:`, error);
      
      // Extract meaningful error message
      let errorMessage = 'Unable to connect account. Please try again.';
      
      if (error instanceof Error) {
        // Show the actual error message
        errorMessage = error.message;
        
        // Add troubleshooting tips for common errors
        if (error.message.includes('already linked')) {
          errorMessage += '\n\nTry: Sign out and sign in with that social account instead.';
        } else if (error.message.includes('already registered')) {
          errorMessage += '\n\nTry: Sign out and sign in with that social account, then link your current account from there.';
        } else if (error.message.includes('Popup was blocked')) {
          errorMessage += '\n\nTip: Check your browser settings to allow popups for this site.';
        } else if (error.message.includes('timed out')) {
          errorMessage += '\n\nTip: Try again and complete the authentication within 2 minutes.';
        } else if (error.message.includes('Provider not enabled')) {
          errorMessage += '\n\nAdmin: This OAuth provider needs to be configured in Supabase Dashboard.';
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  // Function to award points for connecting accounts
  const awardPointsForConnection = async (provider: string) => {
    try {
      const pointsMap: Record<string, number> = {
        'google': 50,
        'facebook': 50,
        'twitter': 30,
      };
      
      const points = pointsMap[provider] || 0;
      
      if (points > 0 && profile?.id) {
        // Get current user points
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', profile.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile points:', profileError);
          return; // Don't throw, points are secondary
        }
        
        const newPoints = (profileData?.points || 0) + points;
        
        // Update points in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', profile.id);
          
        if (updateError) {
          console.error('Error updating points:', updateError);
          return; // Don't throw, points are secondary
        }
        
        console.log(`Awarded ${points} points for connecting ${provider}`);
        
        // Try to create a points transaction record if the table exists
        try {
          const { error: transactionError } = await supabase
            .from('point_transactions')
            .insert({
              user_id: profile.id,
              amount: points,
              type: 'social_connection',
              description: `Connected ${provider} account`,
              provider: provider
            });
            
          if (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Don't throw, this is optional
          }
        } catch (tableError) {
          console.log('point_transactions table might not exist, skipping:', tableError);
        }
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      // Don't throw this error - points are secondary to the connection
    }
  };

  // Event handlers
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) {
        // Use your modal system here instead of alert
        console.warn('Please select a valid image file.');
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
            isDesktop={isDesktop}
          />
        );
      case 'basic-info':
        return (
          <BasicInfoTab
            colors={colors}
            accountsLoading={accountsLoading}
            linkedAccounts={linkedAccounts}
            onSignOut={handleSignOut}
            onConnectAccount={handleConnectAccount}
            isDesktop={isDesktop}
          />
        );
      case 'achievements':
        return (
          <AchievementsTab
            colors={colors}
            loading={loading}
            isDesktop={isDesktop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: '#000000' }]}
        contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Desktop wrapper */}
        {isDesktop ? (
          <View style={styles.desktopWrapper}>
            <View style={styles.desktopContentWrapper}>
              {/* Profile Header */}
              <ProfileHeader
                loading={loading}
                profile={profile}
                uploading={uploading}
                onImagePicker={handleImagePicker}
                accountsLoading={accountsLoading}
                linkedAccounts={linkedAccounts}
                isDesktop={isDesktop}
              />

              {/* Tabs */}
              <View style={[styles.tabs, isDesktop && styles.tabsDesktop]}>
                <TouchableOpacity
                  style={[styles.tab, isDesktop && styles.tabDesktop, selectedTab === 'posts' && styles.activeTab]}
                  onPress={() => setSelectedTab('posts')}
                >
                  <Text style={[styles.tabText, isDesktop && styles.tabTextDesktop, selectedTab === 'posts' && styles.activeTabText]}>
                    Posts
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isDesktop && styles.tabDesktop, selectedTab === 'basic-info' && styles.activeTab]}
                  onPress={() => setSelectedTab('basic-info')}
                >
                  <Text style={[styles.tabText, isDesktop && styles.tabTextDesktop, selectedTab === 'basic-info' && styles.activeTabText]}>
                    Basic Info
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isDesktop && styles.tabDesktop, selectedTab === 'achievements' && styles.activeTab]}
                  onPress={() => setSelectedTab('achievements')}
                >
                  <Text style={[styles.tabText, isDesktop && styles.tabTextDesktop, selectedTab === 'achievements' && styles.activeTabText]}>
                    Awards
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={[styles.tabContent, isDesktop && styles.tabContentDesktop]}>
                {renderTabContent()}
              </View>

              {/* App Info */}
              <View style={[styles.appInfo, isDesktop && styles.appInfoDesktop]}>
                <Text style={[styles.appInfoText, isDesktop && styles.appInfoTextDesktop]}>
                  Uthutho v1.8.2
                </Text>
                <Text style={[styles.motto, isDesktop && styles.mottoDesktop]}>
                  "Izindlela zakho ziqinisekisa impumelelo!"
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Mobile layout */}
            {/* Profile Header */}
            <ProfileHeader
              loading={loading}
              profile={profile}
              uploading={uploading}
              onImagePicker={handleImagePicker}
              accountsLoading={accountsLoading}
              linkedAccounts={linkedAccounts}
              isDesktop={false}
            />

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'posts' && styles.activeTab]}
                onPress={() => setSelectedTab('posts')}
              >
                <Text style={[styles.tabText, selectedTab === 'posts' && styles.activeTabText]}>
                  Posts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'basic-info' && styles.activeTab]}
                onPress={() => setSelectedTab('basic-info')}
              >
                <Text style={[styles.tabText, selectedTab === 'basic-info' && styles.activeTabText]}>
                  Basic Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
                onPress={() => setSelectedTab('achievements')}
              >
                <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
                  Awards
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {renderTabContent()}
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>
                Uthutho v1.8.2
              </Text>
              <Text style={styles.motto}>
                "Izindlela zakho ziqinisekisa impumelelo!"
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
        isDesktop={isDesktop}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  contentContainerDesktop: {
    minHeight: '100vh',
    alignItems: 'center',
  },
  desktopWrapper: {
    width: '100%',
    backgroundColor: '#000000',
    flex: 1,
  },
  desktopContentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    backgroundColor: '#000000',
    width: '100%',
  },
  tabsDesktop: {
    marginVertical: 24,
    justifyContent: 'flex-start',
    gap: 32,
    paddingHorizontal: 0,
    backgroundColor: '#000000',
  },
  tab: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabDesktop: {
    padding: 12,
    borderRadius: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1ea2b1',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabTextDesktop: {
    fontSize: 15,
  },
  activeTabText: {
    color: '#1ea2b1',
  },
  tabContent: {
    backgroundColor: '#000000',
    width: '100%',
  },
  tabContentDesktop: {
    paddingHorizontal: 0,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#000000',
    width: '100%',
  },
  appInfoDesktop: {
    marginTop: 32,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#CCCCCC',
  },
  appInfoTextDesktop: {
    fontSize: 13,
  },
  motto: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#1ea2b1',
  },
  mottoDesktop: {
    fontSize: 13,
  },
});