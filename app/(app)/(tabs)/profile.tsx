import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatTimeAgo } from '../../../components/utils';
import { router } from 'expo-router';
import { Settings, LogOut, Camera, Captions, Edit, Badge, Star, MessageSquare, MapPin, Flame, Trash } from 'lucide-react-native';
import { useProfile } from '@/hook/useProfile';
import { Animated } from 'react-native';
import { supabase } from '@/lib/supabase';

// Skeleton Loading Components
const Shimmer = ({ children, colors }) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmerAnimation());
    };

    shimmerAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ overflow: 'hidden' }}>{/* Keep the surrounding View for overflow hiding */}
      <>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%', // Start off-screen to the left
          right: '-100%', // Extend off-screen to the right
          bottom: 0, // Cover the height of the child content
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
      </>
    </View>
  );
};

const ProfileHeaderSkeleton = ({ colors }) => (
  <View style={[styles.header, { backgroundColor: colors.card }]}>
    <Shimmer colors={colors}>
      <View style={[styles.avatar, { backgroundColor: colors.border }]} />
    </Shimmer>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
    </Shimmer>
    <Shimmer colors={colors}>
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
    </Shimmer>
  </View>
);

const PostSkeleton = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.postItem, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonPostContent, { backgroundColor: colors.border }]} />
      <View style={styles.postFooter}>
        <View style={[styles.skeletonPostLocation, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonPostReactions, { backgroundColor: colors.border }]} />
      </View>
    </View>
  </Shimmer>
);

const MenuItemSkeleton = ({ colors }) => (
  <Shimmer colors={colors}>
    <View style={[styles.menuItem, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
      <View style={styles.menuText}>
        <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonSubtext, { backgroundColor: colors.border }]} />
      </View>
    </View>
  </Shimmer>
);

const AchievementBannerSkeleton = ({ colors }) => (
 <Shimmer colors={colors}>
    <View style={[styles.achievementBanner, { backgroundColor: colors.border }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: colors.text }]} />
      <View style={styles.achievementText}>
        <View style={[styles.skeletonText, { backgroundColor: colors.text }]} />
        <View style={[styles.skeletonSubtext, { backgroundColor: colors.text }]} />
      </View>
    </View>
  </Shimmer>
);

interface UserPost {
  id: string;
  content: string;
  created_at: string;
  type: 'hub' | 'stop';
  location_name: string;
  likes_count: number;
  comments_count: number;
}

export default function ProfileScreen() {
  const { formatTimeAgo } = require('../../../components/utils.tsx'); // Assuming the path to utils.tsx
  const { colors } = useTheme();
  const {
    loading,
    profile,
    titles,
    handleSelectTitle,
    handleSignOut,
    uploadAvatar,
    uploading,
  } = useProfile();

  const [selectedTab, setSelectedTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTab === 'posts' && profile?.id) {
      loadUserPosts();
    }
  }, [selectedTab, profile?.id]);

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

  const handleImagePicker = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleDeletePost = async (postId: string, postType: 'hub' | 'stop') => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              let error = null;
              if (postType === 'hub') {
                const { error: hubError } = await supabase.from('hub_posts').delete().eq('id', postId);
                error = hubError;
              } else {
                const { error: stopError } = await supabase.from('stop_posts').delete().eq('id', postId);
                error = stopError;
              }

              if (error) {
                throw error;
              }

              setUserPosts(userPosts.filter(post => post.id !== postId));
              console.log('Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };


  const navigateToPost = (postId: string, postType: 'hub' | 'stop') => {
    if (postType === 'hub') {
      router.push(`/hub-post-details?postId=${postId}`);
    } else {
      router.push(`/stop-post-details?postId=${postId}`);
    }
  };

  const basicMenuItems = [
    {
      icon: <Edit size={24} color={colors.primary} />,
      title: 'Edit Profile',
      subtitle: 'Update your profile details',
      route: '/EditProfileScreen'
    },
    {
      icon: <Settings size={24} color={colors.primary} />,
      title: 'Settings',
      subtitle: 'App settings and preferences',
      route: '/settings'
    },
  ];

  const rankMenuItems = [
    {
      icon: <Badge size={24} color={colors.primary} />,
      title: 'Change Title',
      subtitle: 'Change your profile title',
      route: '/changetitle'
    },
    {
      icon: <Edit size={24} color={colors.primary} />,
      title: 'Title To Earn',
      subtitle: 'Look at what title to earn',
      route: '/titleearn'
    },
  ];

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Skeleton */}
        <ProfileHeaderSkeleton colors={colors} />

        {/* Tabs Skeleton */}
        <View style={styles.tabs}>
          {['Posts', 'Basic Info', 'Awards'].map((tab, index) => (
            <Shimmer key={index} colors={colors}>
              <View style={[styles.skeletonTab, { backgroundColor: colors.border }]} />
            </Shimmer>
          ))}
        </View>

        {/* Menu Items Skeleton */}
        <View style={styles.menuContainer}>
          {[1, 2].map((item) => (
            <MenuItemSkeleton key={item} colors={colors} />
          ))}
        </View>

        {/* Sign Out Button Skeleton */}
        <Shimmer colors={colors}>
          <View style={[styles.skeletonSignOut, { backgroundColor: colors.border }]} />
        </Shimmer>

        {/* App Info Skeleton */}
        <View style={styles.appInfo}>
          <Shimmer colors={colors}>
            <View style={[styles.skeletonAppInfo, { backgroundColor: colors.border }]} />
          </Shimmer>
          <Shimmer colors={colors}>
            <View style={[styles.skeletonMotto, { backgroundColor: colors.border }]} />
          </Shimmer>
        </View>
      </ScrollView>
    );
  }

  return (
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

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleImagePicker}
          disabled={uploading}
        >
          {loading ? (
            <Shimmer colors={colors}>
              <View style={[styles.avatar, { backgroundColor: colors.border }]} />
            </Shimmer>
          ) : (
            <>
              <Image
                source={{
                  uri: profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop',
                }}
                style={styles.avatar}
              />
              <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="white" />
              </View>
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="white" />
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
        {loading ? (
          <Shimmer colors={colors}>
            <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
          </Shimmer>
        ) : (
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.first_name} {profile?.last_name}
          </Text>
        )}
        {loading ? (
          <Shimmer colors={colors}>
            <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
          </Shimmer>
        ) : (
          <Text style={[styles.userTitle, { color: colors.primary }]}>{profile?.selected_title}</Text>
        )}
      </View>

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
      {selectedTab === 'posts' && (
        <View style={styles.postsContainer}>
          {postsLoading ? (
            <>
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
            </>
          ) : userPosts.length === 0 ? (
            <View style={styles.noPosts}>
              <MessageSquare size={48} color={colors.text} opacity={0.5} />
              <Text style={[styles.noPostsText, { color: colors.text }]}>
                No posts yet
              </Text>
              <Text style={[styles.noPostsSubtext, { color: colors.text }]}>
                Start sharing your transportation experiences!
              </Text>
            </View>
          ) : (
            userPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[styles.postItem, { backgroundColor: colors.card }]}
                onPress={() => navigateToPost(post.id, post.type)}
                onLongPress={() => handleDeletePost(post.id, post.type)} // Added long press for delete

              >
                <View style={styles.postHeader}>
                  <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
                    {post.content}
                  </Text>
                  {/* {profile?.id === post.user_id && ( // Assuming post object has user_id */}
                    <TouchableOpacity onPress={() => handleDeletePost(post.id, post.type)}>
 <Trash size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                <Text style={[styles.postTimeAgo, { color: colors.text }]}>
                  {formatTimeAgo(post.created_at)}
                </Text>
                 <Text style={[styles.postTimeAgo, { color: colors.text }]}>
                  <View style={styles.postLocation}>
                    <MapPin size={12} color="#666666" />
                    <Text style={[styles.postLocationText, { color: colors.text }]}>
                      {post.location_name}
                    </Text>
                  </View>
                  <View style={styles.postReactions}>
                    <Flame size={14} color="#ff6b35" />
                    <Text style={[styles.postReactionCount, { color: colors.text }]}>
                      {post.likes_count}
                    </Text>
                    <MessageSquare size={14} color="#666666" style={{ marginLeft: 12 }} />
                    <Text style={[styles.postReactionCount, { color: colors.text }]}>
                      {post.comments_count}
                    </Text>
                  </View>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {selectedTab === 'basic-info' && (
        <View style={styles.menuContainer}>
          {basicMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => router.push(item.route)}
            >
              {item.icon}
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.text }]}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedTab === 'achievements' && (
        <View style={styles.menuContainer}>
          {/* Achievement Banners */}
          {loading ? (
            <>
              <AchievementBannerSkeleton colors={colors} />
              <AchievementBannerSkeleton colors={colors} />
            </>
          ) : (
            <>
              <View style={[styles.achievementBanner, { backgroundColor: colors.card }]}>
                <Star size={24} color="#fbbf24" />
                <View style={styles.achievementText}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>Eco Warrior</Text>
                  <Text style={[styles.achievementDescription, { color: colors.text }]}>
                    You've helped reduce carbon emissions by using public transport!
                  </Text>
                </View>
              </View>

              <View style={[styles.achievementBanner, { backgroundColor: colors.card }]}>
                <Star size={24} color="#34d399" />
                <View style={styles.achievementText}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>Early Adopter</Text>
                  <Text style={[styles.achievementDescription, { color: colors.text }]}>
                    Thanks for being one of the first to try Uthutho!
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Sign Out Button (only show on basic-info tab) */}
      {selectedTab === 'basic-info' && (
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: '#ef4444' }]}
          onPress={handleSignOut}
        >
          <LogOut size={24} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpace} />

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.text }]}>Uthutho v0.0.1</Text>
        <Text style={[styles.motto, { color: colors.primary }]}>"Izindlela zakho ziqinisekisa impumelelo!"</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({  postTimeAgo: {   fontSize: 12,    color: '#999999',    marginBottom: 8, },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userTitle: {
    fontSize: 16,
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
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  postsContainer: {
    padding: 20,
    gap: 15,
  },
  postItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postReactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  noPosts: {
    alignItems: 'center',
    padding: 40,
  },
  noPostsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noPostsSubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  menuContainer: {
    padding: 20,
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
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
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 20,
  },
  achievementBanner: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  achievementText: {
    flex: 1,
    marginLeft: 12,
  },
  // Skeleton styles
  skeletonName: {
    width: 200,
    height: 30,
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
  },
  skeletonTab: {
    width: 80,
    height: 30,
    borderRadius: 4,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
    width: '70%',
  },
  skeletonSubtext: {
    height: 14,
    borderRadius: 4,
    width: '90%',
  },
  skeletonSignOut: {
    height: 50,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  skeletonAppInfo: {
    height: 16,
    width: 100,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMotto: {
    height: 16,
    width: 200,
    borderRadius: 4,
  },
  skeletonPostContent: {
    height: 60,
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonPostLocation: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  skeletonPostReactions: {
    width: 40,
    height: 14,
    borderRadius: 4,
  },
});