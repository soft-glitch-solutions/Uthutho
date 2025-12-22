import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Image,
  Platform,
  Share,
  Linking,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Flame, MessageCircle, Send, MapPin, Download, Share as ShareIcon, User, Smartphone, MoreVertical, Home, Navigation } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '@/hook/useAuth';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface UserProfile {
  first_name: string;
  last_name: string;
  selected_title: string;
  avatar_url?: string;
}

interface PostReaction {
  id: string;
  reaction_type: string;
  user_id: string;
}

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: UserProfile;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  hub_id?: string;
  stop_id?: string;
  post_type: 'hub' | 'stop';
  profiles: UserProfile;
  hubs?: {
    name: string;
  };
  stops?: {
    name: string;
  };
  post_reactions: PostReaction[];
  post_comments: PostComment[];
}

// Desktop Layout Component
const DesktopPostDetail = ({ 
  post, 
  newComment, 
  setNewComment, 
  addComment, 
  toggleReaction, 
  sharePost, 
  downloadPost, 
  navigateToUserProfile, 
  getReactionCount, 
  hasUserReacted, 
  formatTimeAgo, 
  isLoggedIn, 
  sharing, 
  router, 
  showDownloadOption,
  handleLogin,
  handleDownloadApp,
  showLoginPrompt 
}) => {
  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.desktopHeaderTitle}>Post Details</Text>
        <View style={styles.desktopHeaderPlaceholder} />
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Post Content */}
        <View style={styles.leftColumn}>
          {/* Post Card */}
          <View style={[styles.postCard, styles.postCardDesktop]}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={() => navigateToUserProfile(post.user_id)}
              >
                <View style={[styles.avatar, styles.avatarDesktop]}>
                  <Image
                    source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                    style={styles.avatarImage}
                  />
                </View>
                <View>
                  <Text style={[styles.userName, styles.userNameDesktop]}>
                    {post.profiles.first_name} {post.profiles.last_name}
                  </Text>
                  <Text style={[styles.userTitle, styles.userTitleDesktop]}>{post.profiles.selected_title}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.postTime}>
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>

            {/* Location Info */}
            <View style={[styles.locationInfo, styles.locationInfoDesktop]}>
              <MapPin size={16} color="#666666" />
              <Text style={[styles.locationText, styles.locationTextDesktop]}>
                {post.post_type === 'hub' ? post.hubs?.name : post.stops?.name || 'Unknown Location'}
              </Text>
              <View style={styles.postTypeBadge}>
                <Text style={styles.postTypeText}>
                  {post.post_type.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Post Content */}
            <Text style={[styles.postContent, styles.postContentDesktop]}>{post.content}</Text>

            {/* Desktop Post Stats */}
            <View style={styles.desktopStats}>
              <View style={styles.desktopStatItem}>
                <Flame size={16} color="#ff7b25" />
                <Text style={styles.desktopStatValue}>{getReactionCount('fire')}</Text>
                <Text style={styles.desktopStatLabel}>Fire Reactions</Text>
              </View>
              <View style={styles.desktopStatItem}>
                <MessageCircle size={16} color="#1ea2b1" />
                <Text style={styles.desktopStatValue}>{post.post_comments.length}</Text>
                <Text style={styles.desktopStatLabel}>Comments</Text>
              </View>
            </View>

            {/* Desktop Post Actions */}
            <View style={styles.desktopPostActions}>
              <TouchableOpacity
                style={[
                  styles.desktopActionButton,
                  hasUserReacted('fire') && styles.desktopActionButtonActive,
                  !isLoggedIn && styles.disabledAction
                ]}
                onPress={() => toggleReaction('fire')}
                disabled={!isLoggedIn}
              >
                <Flame 
                  size={20} 
                  color={
                    !isLoggedIn ? '#444' : 
                    hasUserReacted('fire') ? '#ff7b25' : '#666'
                  } 
                  fill={
                    !isLoggedIn ? 'none' :
                    hasUserReacted('fire') ? '#ff7b25' : 'none'
                  } 
                />
                <Text style={[
                  styles.desktopActionText,
                  hasUserReacted('fire') && { color: '#ff7b25' },
                  !isLoggedIn && styles.disabledText
                ]}>
                  Fire
                </Text>
              </TouchableOpacity>
              
              {showDownloadOption && (
                <TouchableOpacity
                  style={[styles.desktopActionButton, !isLoggedIn && styles.disabledAction]}
                  onPress={downloadPost}
                  disabled={!isLoggedIn || sharing}
                >
                  <Download size={20} color={!isLoggedIn ? '#444' : '#666'} />
                  <Text style={[styles.desktopActionText, !isLoggedIn && styles.disabledText]}>
                    Save
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.desktopActionButton}
                onPress={sharePost}
                disabled={sharing}
              >
                <ShareIcon size={20} color="#666" />
                <Text style={styles.desktopActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right Column - Comments */}
        <ScrollView style={styles.rightColumn} showsVerticalScrollIndicator={true}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitleDesktop}>Comments ({post.post_comments.length})</Text>
            {post.post_comments.length > 0 && (
              <Text style={styles.commentsSubtitle}>
                Recent comments on this post
              </Text>
            )}
          </View>
          
          {post.post_comments.length === 0 ? (
            <View style={styles.noCommentsContainer}>
              <View style={styles.noCommentsIllustration}>
                <MessageCircle size={48} color="#666666" />
              </View>
              <Text style={styles.noCommentsTextDesktop}>No comments yet</Text>
              <Text style={styles.noCommentsSubtitle}>
                {isLoggedIn ? 'Be the first to comment' : 'Login to be the first to comment'}
              </Text>
            </View>
          ) : (
            <View style={styles.commentsGrid}>
              {post.post_comments.map((comment) => (
                <View key={comment.id} style={[styles.commentCard, styles.commentCardDesktop]}>
                  <TouchableOpacity 
                    style={styles.commentHeader}
                    onPress={() => navigateToUserProfile(comment.user_id)}
                  >
                    <View style={[styles.commentAvatar, styles.commentAvatarDesktop]}>
                      <Image
                        source={{ uri: comment.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                        style={styles.avatarImage}
                      />
                    </View>
                    <View style={styles.commentUserInfo}>
                      <Text style={[styles.commentAuthor, styles.commentAuthorDesktop]}>
                        {comment.profiles.first_name} {comment.profiles.last_name}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(comment.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.commentContent, styles.commentContentDesktop]}>{comment.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add Comment Section */}
          <View style={styles.addCommentSection}>
            <Text style={styles.addCommentTitle}>Add a Comment</Text>
            <View style={[
              styles.addCommentContainer,
              styles.addCommentContainerDesktop,
              !isLoggedIn && styles.disabledCommentContainer
            ]}>
              <TextInput
                style={[
                  styles.commentInput,
                  styles.commentInputDesktop,
                  !isLoggedIn && styles.disabledCommentInput
                ]}
                placeholder={!isLoggedIn ? "Login to comment..." : "Share your thoughts..."}
                placeholderTextColor={!isLoggedIn ? "#444" : "#666666"}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                editable={isLoggedIn}
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[
                  styles.commentButton,
                  styles.commentButtonDesktop,
                  (!newComment.trim() || !isLoggedIn) && styles.commentButtonDisabled
                ]}
                onPress={addComment}
                disabled={!newComment.trim() || !isLoggedIn}
              >
                <Send size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Call to Action for Non-Logged-In Users */}
          {!isLoggedIn && (
            <View style={styles.ctaContainerDesktop}>
              <View style={styles.ctaContent}>
                <User size={32} color="#1ea2b1" />
                <Text style={styles.ctaTitleDesktop}>Join the Conversation</Text>
                <Text style={styles.ctaDescriptionDesktop}>
                  Login to react, comment, and connect with your community
                </Text>
                <View style={styles.ctaButtonsDesktop}>
                  <TouchableOpacity style={styles.loginButtonDesktop} onPress={handleLogin}>
                    <Text style={styles.loginButtonTextDesktop}>Login to Comment</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'web' && (
                    <TouchableOpacity style={styles.downloadButtonDesktop} onPress={handleDownloadApp}>
                      <Smartphone size={20} color="#ffffff" />
                      <Text style={styles.downloadButtonTextDesktop}>Download App</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </View>
  );
};

// Mobile Layout Component
const MobilePostDetail = ({ 
  post, 
  newComment, 
  setNewComment, 
  addComment, 
  toggleReaction, 
  sharePost, 
  downloadPost, 
  navigateToUserProfile, 
  getReactionCount, 
  hasUserReacted, 
  formatTimeAgo, 
  isLoggedIn, 
  sharing, 
  router, 
  showDownloadOption,
  handleLogin,
  handleDownloadApp,
  showLoginPrompt 
}) => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Post Content */}
      <View style={styles.viewShotContainer}>
        <View style={styles.postCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => navigateToUserProfile(post.user_id)}
            >
              <View style={styles.avatar}>
                <Image
                  source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                  style={styles.avatarImage}
                />
              </View>
              <View>
                <Text style={styles.userName}>
                  {post.profiles.first_name} {post.profiles.last_name}
                </Text>
                <Text style={styles.userTitle}>{post.profiles.selected_title}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.postTime}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <MapPin size={14} color="#666666" />
            <Text style={styles.locationText}>
              {post.post_type === 'hub' ? post.hubs?.name : post.stops?.name || 'Unknown Location'}
            </Text>
          </View>

          {/* Post Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Post Actions - Disabled for non-logged-in users */}
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[
                styles.actionItem, 
                hasUserReacted('fire') && styles.actionActive,
                !isLoggedIn && styles.disabledAction
              ]}
              onPress={() => toggleReaction('fire')}
              disabled={!isLoggedIn}
            >
              <Flame 
                size={18} 
                color={
                  !isLoggedIn ? '#444' : 
                  hasUserReacted('fire') ? '#ff7b25' : '#666'
                } 
                fill={
                  !isLoggedIn ? 'none' :
                  hasUserReacted('fire') ? '#ff7b25' : 'none'
                } 
              />
              <Text style={[
                styles.actionCount, 
                hasUserReacted('fire') && { color: '#ff7b25' },
                !isLoggedIn && styles.disabledText
              ]}>
                {getReactionCount('fire')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionItem, !isLoggedIn && styles.disabledAction]}
              disabled={!isLoggedIn}
            >
              <MessageCircle size={18} color={!isLoggedIn ? '#444' : '#666'} />
              <Text style={[styles.actionCount, !isLoggedIn && styles.disabledText]}>
                {post.post_comments.length}
              </Text>
            </TouchableOpacity>
            
            {/* Only show download button on native platforms */}
            {showDownloadOption && (
              <TouchableOpacity
                style={[styles.actionItem, !isLoggedIn && styles.disabledAction]}
                onPress={downloadPost}
                disabled={!isLoggedIn || sharing}
              >
                <Download size={18} color={!isLoggedIn ? '#444' : '#666'} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={sharePost}
              disabled={sharing}
            >
              <ShareIcon size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments ({post.post_comments.length})</Text>
        
        {post.post_comments.map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <TouchableOpacity 
              style={styles.commentHeader}
              onPress={() => navigateToUserProfile(comment.user_id)}
            >
              <View style={styles.commentAvatar}>
                <Image
                  source={{ uri: comment.profiles.avatar_url || 'https://via.placeholder.com/50' }}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.commentUserInfo}>
                <Text style={styles.commentAuthor}>
                  {comment.profiles.first_name} {comment.profiles.last_name}
                </Text>
                <Text style={styles.commentTime}>
                  {formatTimeAgo(comment.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        ))}

        {/* Add Comment - Disabled for non-logged-in users */}
        <View style={[
          styles.addCommentContainer,
          !isLoggedIn && styles.disabledCommentContainer
        ]}>
          <TextInput
            style={[
              styles.commentInput,
              !isLoggedIn && styles.disabledCommentInput
            ]}
            placeholder={!isLoggedIn ? "Login to comment..." : "Add a comment..."}
            placeholderTextColor={!isLoggedIn ? "#444" : "#666666"}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            editable={isLoggedIn}
          />
          <TouchableOpacity
            style={[
              styles.commentButton, 
              (!newComment.trim() || !isLoggedIn) && styles.commentButtonDisabled
            ]}
            onPress={addComment}
            disabled={!newComment.trim() || !isLoggedIn}
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Call to Action for Non-Logged-In Users */}
      {!isLoggedIn && (
        <View style={styles.ctaContainer}>
          <View style={styles.ctaContent}>
            <User size={24} color="#1ea2b1" />
            <Text style={styles.ctaTitle}>Join the Conversation</Text>
            <Text style={styles.ctaDescription}>
              Login to react, comment, and connect with your community
            </Text>
            <View style={styles.ctaButtons}>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login to Comment</Text>
              </TouchableOpacity>
              {Platform.OS === 'web' && (
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadApp}>
                  <Smartphone size={16} color="#ffffff" />
                  <Text style={styles.downloadButtonText}>Download App</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';
  
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<View>(null);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      // First try to load as hub post
      let { data, error } = await supabase
        .from('hub_posts')
        .select(`
          *,
          profiles (first_name, last_name, selected_title, avatar_url),
          hubs (name),
          post_reactions (id, user_id, reaction_type),
          post_comments (
            id, content, user_id, created_at,
            profiles (first_name, last_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        // If not found as hub post, try as stop post
        const stopPostResponse = await supabase
          .from('stop_posts')
          .select(`
            *,
            profiles (first_name, last_name, selected_title, avatar_url),
            stops (name),
            post_reactions (id, user_id, reaction_type),
            post_comments (
              id, content, user_id, created_at,
              profiles (first_name, last_name, avatar_url)
            )
          `)
          .eq('id', id)
          .single();

        if (stopPostResponse.error) throw stopPostResponse.error;
        
        data = {
          ...stopPostResponse.data,
          post_type: 'stop'
        };
      } else {
        data = {
          ...data,
          post_type: 'hub'
        };
      }

      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    }
    setLoading(false);
  };

  const PostSkeleton = () => {
    if (isDesktop) {
      return (
        <View style={[styles.container, styles.containerDesktop]}>
          {/* Desktop Header Skeleton */}
          <View style={styles.desktopHeader}>
            <View style={[styles.skeletonItem, { width: 100, height: 44, borderRadius: 12 }]} />
            <View style={[styles.skeletonItem, { width: 120, height: 24 }]} />
            <View style={[styles.skeletonItem, { width: 44, height: 44, borderRadius: 22 }]} />
          </View>

          {/* Desktop Layout Skeleton */}
          <View style={styles.desktopLayout}>
            {/* Left Column Skeleton */}
            <View style={styles.leftColumn}>
              <View style={[styles.postCard, styles.postCardDesktop]}>
                <View style={styles.postHeader}>
                  <View style={styles.userInfo}>
                    <View style={[styles.skeletonItem, { width: 48, height: 48, borderRadius: 24 }]} />
                    <View>
                      <View style={[styles.skeletonItem, { width: 120, height: 16, marginBottom: 4 }]} />
                      <View style={[styles.skeletonItem, { width: 80, height: 12 }]} />
                    </View>
                  </View>
                  <View style={[styles.skeletonItem, { width: 60, height: 12 }]} />
                </View>
                <View style={[styles.skeletonItem, { width: '40%', height: 14, marginBottom: 16 }]} />
                <View style={[styles.skeletonItem, { width: '100%', height: 80, marginBottom: 16 }]} />
                <View style={[styles.skeletonItem, { width: '100%', height: 40, borderRadius: 8 }]} />
              </View>
            </View>

            {/* Right Column Skeleton */}
            <View style={styles.rightColumn}>
              <View style={[styles.skeletonItem, { width: 120, height: 24, marginBottom: 16 }]} />
              
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={[styles.commentCard, styles.commentCardDesktop]}>
                  <View style={styles.commentHeader}>
                    <View style={[styles.skeletonItem, { width: 32, height: 32, borderRadius: 16 }]} />
                    <View style={styles.commentUserInfo}>
                      <View style={[styles.skeletonItem, { width: 100, height: 14, marginBottom: 4 }]} />
                      <View style={[styles.skeletonItem, { width: 60, height: 10 }]} />
                    </View>
                  </View>
                  <View style={[styles.skeletonItem, { width: '100%', height: 40 }]} />
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <StatusBar style="light" backgroundColor="#000000" />
        <PostSkeletonMobile />
      </ScrollView>
    );
  };

  const PostSkeletonMobile = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonCommentBlock} />
      <View style={styles.skeletonCommentBlock} />
    </View>
  );

  const toggleReaction = async (reactionType: string) => {
    if (!post || !isLoggedIn) {
      showLoginPrompt();
      return;
    }

    try {
      const existingReaction = post.post_reactions
        .find(r => r.user_id === currentUserId && r.reaction_type === reactionType);

      if (existingReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        const reactionData: any = {
          user_id: currentUserId,
          reaction_type: reactionType,
        };

        if (post.post_type === 'hub') {
          reactionData.post_hub_id = post.id;
        } else {
          reactionData.post_stop_id = post.id;
        }

        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert([reactionData]);

        if (insertError) {
          // Handle trigger error gracefully
          if (insertError.code === '42703' && insertError.message?.includes('username')) {
            console.warn('Trigger error, but reaction was created');
          } else {
            throw insertError;
          }
        }
      }

      loadPost();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !post) {
      if (!isLoggedIn) {
        showLoginPrompt();
      }
      return;
    }

    try {
      const commentData: any = {
        user_id: currentUserId,
        content: newComment.trim(),
      };

      if (post.post_type === 'hub') {
        commentData.hub_post = post.id;
      } else {
        commentData.stop_post = post.id;
      }

      const { error } = await supabase
        .from('post_comments')
        .insert([commentData]);

      if (!error) {
        await awardPoints(1);
        setNewComment('');
        loadPost();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const awardPoints = async (points: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', currentUserId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + points })
          .eq('id', currentUserId);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const sharePost = async () => {
    if (!post) return;

    try {
      setSharing(true);
      
      const communityName = post.post_type === 'hub' ? post.hubs?.name : post.stops?.name || "Uthutho Community";
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
          const result = await Share.share({
            message: message,
            title: `Post from ${communityName}`,
          });
          
          if (result.action === Share.sharedAction) {
            console.log('Post shared successfully');
          } else if (result.action === Share.dismissedAction) {
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
      setSharing(false);
    }
  };

  const downloadPost = async () => {
    if (!post || !viewShotRef.current || Platform.OS === 'web') {
      return;
    }

    try {
      setSharing(true);
      
      // Capture the post as an image
      const uri = await captureRef(viewShotRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (Platform.OS === 'android') {
        // For Android, use the Share API instead of MediaLibrary
        // This avoids the need for READ_MEDIA_IMAGES permission
        const result = await Share.share({
          title: 'Save Post to Gallery',
          message: 'Save this post image to your gallery',
          url: uri,
        });
        
        if (result.action === Share.sharedAction) {
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
            const result = await Share.share({
              title: 'Save Post to Gallery',
              message: 'Save this post image to your gallery',
              url: uri,
            });
            
            if (result.action === Share.sharedAction) {
              Alert.alert('Success', 'Use the share options to save the post to your gallery!');
            }
          }
        } catch (iosError) {
          console.error('iOS save error:', iosError);
          // Fallback to sharing
          const result = await Share.share({
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
      setSharing(false);
    }
  };

  const navigateToUserProfile = (userId: string) => {
    if (!isLoggedIn) {
      showLoginPrompt();
      return;
    }
    router.push(`/user/${userId}`);
  };

  const getReactionCount = (reactionType: string) => {
    if (!post) return 0;
    return post.post_reactions.filter(r => r.reaction_type === reactionType).length;
  };

  const hasUserReacted = (reactionType: string) => {
    if (!post || !currentUserId) return false;
    return post.post_reactions.some(r => r.user_id === currentUserId && r.reaction_type === reactionType);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const showLoginPrompt = () => {
    Alert.alert(
      'Login Required',
      'Please log in to interact with posts and comments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]
    );
  };

  const handleDownloadApp = () => {
    // You can update this URL to your actual app store links
    const appStoreUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/uthutho' 
      : 'https://play.google.com/store/apps/details?id=com.uthutho.app';
    
    Linking.openURL(appStoreUrl).catch(err => {
      Alert.alert('Error', 'Could not open app store');
    });
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // Only show download option on native platforms (not web)
  const showDownloadOption = Platform.OS !== 'web';

  if (loading) {
    return <PostSkeleton />;
  }

  if (!post) {
    return (
      <View style={[styles.errorContainer, isDesktop && styles.errorContainerDesktop]}>
        <Text style={[styles.errorText, isDesktop && styles.errorTextDesktop]}>Post not found</Text>
        <TouchableOpacity style={[styles.backButton, styles.errorBackButton]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDesktop) {
    return (
      <DesktopPostDetail
        post={post}
        newComment={newComment}
        setNewComment={setNewComment}
        addComment={addComment}
        toggleReaction={toggleReaction}
        sharePost={sharePost}
        downloadPost={downloadPost}
        navigateToUserProfile={navigateToUserProfile}
        getReactionCount={() => getReactionCount('fire')}
        hasUserReacted={hasUserReacted}
        formatTimeAgo={formatTimeAgo}
        isLoggedIn={isLoggedIn}
        sharing={sharing}
        router={router}
        showDownloadOption={showDownloadOption}
        handleLogin={handleLogin}
        handleDownloadApp={handleDownloadApp}
        showLoginPrompt={showLoginPrompt}
      />
    );
  }

  return (
    <MobilePostDetail
      post={post}
      newComment={newComment}
      setNewComment={setNewComment}
      addComment={addComment}
      toggleReaction={toggleReaction}
      sharePost={sharePost}
      downloadPost={downloadPost}
      navigateToUserProfile={navigateToUserProfile}
      getReactionCount={() => getReactionCount('fire')}
      hasUserReacted={hasUserReacted}
      formatTimeAgo={formatTimeAgo}
      isLoggedIn={isLoggedIn}
      sharing={sharing}
      router={router}
      showDownloadOption={showDownloadOption}
      handleLogin={handleLogin}
      handleDownloadApp={handleDownloadApp}
      showLoginPrompt={showLoginPrompt}
    />
  );
}

const styles = StyleSheet.create({
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopHeaderPlaceholder: {
    width: 100,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    flex: 1,
  },
  leftColumn: {
    width: '45%',
    minWidth: 0,
  },
  rightColumn: {
    width: '55%',
    minWidth: 0,
    flex: 1,
  },
  
  // Desktop Post Card
  postCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postCardDesktop: {
    borderRadius: 20,
    padding: 24,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
  },
  userNameDesktop: {
    fontSize: 18,
  },
  userTitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  userTitleDesktop: {
    fontSize: 14,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationInfoDesktop: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.1)',
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  locationTextDesktop: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  postContent: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 12,
  },
  postContentDesktop: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 20,
  },
  
  // Desktop Post Stats
  desktopStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  desktopStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopStatLabel: {
    fontSize: 12,
    color: '#666666',
  },
  
  // Desktop Post Actions
  desktopPostActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  desktopActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
    justifyContent: 'center',
  },
  desktopActionButtonActive: {
    backgroundColor: 'rgba(255, 123, 37, 0.1)',
    borderColor: 'rgba(255, 123, 37, 0.2)',
  },
  desktopActionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  
  // Desktop Comments
  commentsHeader: {
    marginBottom: 24,
  },
  commentsTitleDesktop: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  commentsSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  commentsGrid: {
    gap: 16,
  },
  commentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  commentCardDesktop: {
    borderRadius: 16,
    padding: 20,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  commentAvatarDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1ea2b1',
  },
  commentAuthorDesktop: {
    fontSize: 16,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  commentContentDesktop: {
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Desktop Add Comment Section
  addCommentSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  addCommentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addCommentContainerDesktop: {
    borderRadius: 16,
    padding: 20,
  },
  disabledCommentContainer: {
    opacity: 0.6,
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 4,
  },
  commentInputDesktop: {
    fontSize: 16,
    minHeight: 100,
    paddingVertical: 8,
  },
  disabledCommentInput: {
    color: '#666666',
  },
  commentButton: {
    backgroundColor: '#1ea2b1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentButtonDesktop: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  commentButtonDisabled: {
    backgroundColor: '#333333',
  },
  
  // Desktop CTA
  ctaContainerDesktop: {
    marginTop: 32,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  ctaTitleDesktop: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  ctaDescriptionDesktop: {
    fontSize: 15,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButtonsDesktop: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  loginButtonDesktop: {
    flex: 2,
    backgroundColor: '#1ea2b1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonTextDesktop: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  downloadButtonDesktop: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonTextDesktop: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Post Type Badge
  postTypeBadge: {
    backgroundColor: '#1ea2b115',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postTypeText: {
    fontSize: 11,
    color: '#1ea2b1',
    fontWeight: '600',
  },
  
  // No Comments Desktop
  noCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noCommentsIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noCommentsTextDesktop: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  noCommentsSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Mobile Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  
  // View Shot Container
  viewShotContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  // Mobile Post Actions
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  actionActive: {
    // Active state styling if needed
  },
  disabledAction: {
    opacity: 0.5,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  disabledText: {
    color: '#444444',
  },
  
  // Mobile Comments Section
  commentsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  
  // Mobile CTA
  ctaContainer: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  loginButton: {
    flex: 2,
    backgroundColor: '#1ea2b1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Bottom Space
  bottomSpace: {
    height: 20,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainerDesktop: {
    paddingTop: 100,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  errorTextDesktop: {
    fontSize: 24,
  },
  errorBackButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  // Skeleton Styles
  skeletonContainer: {
    padding: 20,
  },
  skeletonItem: {
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: '60%',
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonCommentBlock: {
    height: 60,
    backgroundColor: '#222',
    borderRadius: 12,
    marginTop: 12,
  },
});