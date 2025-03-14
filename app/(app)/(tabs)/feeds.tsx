import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Image, ActivityIndicator, Share, Animated, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase'; // Adjust the path
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext'; // Import useTheme
import { useRouter } from 'expo-router'; // Ensure you have this import
import * as Animatable from 'react-native-animatable';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importing Expo vector icons

// Add this component above your PostSkeleton component
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
    <View style={{ overflow: 'hidden' }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

// Add this new component for the skeleton
const PostSkeleton = ({ colors }) => {
  return (
    <Shimmer colors={colors}>
      <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
        <View style={styles.postHeader}>
          <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonHeaderContent}>
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '40%' }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '20%' }]} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '100%' }]} />
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '80%' }]} />
        </View>
        <View style={styles.postActions}>
          {[1, 2, 3].map((i) => (
            <View 
              key={i} 
              style={[styles.skeletonAction, { backgroundColor: colors.border }]} 
            />
          ))}
        </View>
      </View>
    </Shimmer>
  );
};

// Define the emoji reactions
const reactions = [
  { id: 'heart', emoji: '❤️' },
  { id: 'laugh', emoji: '😂' },
  { id: 'shit', emoji: '💩' },
  { id: 'middleFinger', emoji: '🖕' },
  { id: 'angry', emoji: '😡' },
];

export default function Feed() {
  const { colors } = useTheme(); // Get theme colors
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [profiles, setProfiles] = useState(null); // State to hold user profile data
  const [isPostDetailsLoading, setIsPostDetailsLoading] = useState(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [isCommentDialogVisible, setIsCommentDialogVisible] = useState(false); // For comment dialog
  const [refreshing, setRefreshing] = useState(false); // State for refreshing
  const router = useRouter(); // Initialize the router
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState(null);
  const [favoriteHubs, setFavoriteHubs] = useState([]);
  const [hubPosts, setHubPosts] = useState([]);
  const [stopPosts, setStopPosts] = useState([]);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [showReactions, setShowReactions] = useState({}); // Track which post's reactions are shown

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setProfiles(data); // Store the user profile data
        }
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchFavoriteHubs();
  }, []);

  const fetchFavoriteHubs = async () => {
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      Alert.alert('Error', 'Could not retrieve session. Please log in again.');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites') // Assuming 'favorites' contains the hub IDs
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Assuming favorites is an array of hub IDs
      setFavoriteHubs(profile.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error fetching favorites', error.message);
    }
  };

  useEffect(() => {
    const fetchHubPosts = async () => {
      try {
        const { data: postsData, error } = await supabase
          .from('hub_posts')
          .select(`
            *,
            profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              selected_title
            ),
            hubs (
              id,
              name
            ),
            post_comments (id),
            post_reactions (id, reaction_type)
          `);

        if (error) {
          console.error('Error fetching hub posts:', error.message);
          Alert.alert('Error fetching hub posts', error.message);
          return;
        }

        // Filter and delete posts older than a day
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const post of postsData) {
          const postDate = new Date(post.created_at);
          if (postDate < oneDayAgo) {
            const { error: deleteError } = await supabase
              .from('hub_posts')
              .delete()
              .eq('id', post.id);

            if (deleteError) {
              console.error('Error deleting post:', deleteError);
              Alert.alert('Error', 'Failed to delete old hub post.');
            }
          }
        }

        // Filter out deleted posts
        const filteredPosts = postsData.filter(post => new Date(post.created_at) >= oneDayAgo);
        setHubPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching hub posts:', error);
      }
    };

    const fetchStopPosts = async () => {
      try {
        const { data: postsData, error } = await supabase
          .from('stop_posts')
          .select(`
            *,
            profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              selected_title
            ),
            stops (
              id,
              name,
              routes (
                name
              )
            ),
            post_comments (id),
            post_reactions (id, reaction_type)
          `);

        if (error) {
          console.error('Error fetching stop posts:', error.message);
          Alert.alert('Error fetching stop posts', error.message);
          return;
        }

        // Filter and delete posts older than a day
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const post of postsData) {
          const postDate = new Date(post.created_at);
          if (postDate < oneDayAgo) {
            const { error: deleteError } = await supabase
              .from('stop_posts')
              .delete()
              .eq('id', post.id);

            if (deleteError) {
              console.error('Error deleting post:', deleteError);
              Alert.alert('Error', 'Failed to delete old stop post.');
            }
          }
        }

        // Filter out deleted posts
        const filteredPosts = postsData.filter(post => new Date(post.created_at) >= oneDayAgo);
        setStopPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching stop posts:', error);
      }
    };

    const fetchPosts = async () => {
      setIsPostsLoading(true);
      await Promise.all([fetchHubPosts(), fetchStopPosts()]);
      setIsPostsLoading(false);
    };

    fetchPosts();
  }, []);

  // Fetch selected post details
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!selectedPost) return;

      setIsPostDetailsLoading(true);
      try {
        const { data, error } = await supabase
          .from('hub_posts')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              avatar_url,
              selected_title
            ),
            post_comments (
              id,
              content,
              created_at,
              user_id,
              profiles (
                first_name,
                last_name,
                avatar_url
              )
            ),
            post_reactions (
              id,
              reaction_type,
              user_id
            )
          `)
          .eq('id', selectedPost)
          .single();

        if (error) {
          throw error;
        }
        setSelectedPostDetails(data);
      } catch (error) {
        console.error(`Error fetching post ${selectedPost} details:`, error);
        alert('Failed to fetch post details');
      } finally {
        setIsPostDetailsLoading(false);
      }
    };

    fetchPostDetails();
  }, [selectedPost]);

  // Create comment
  const handleCreateComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    setIsCreatingComment(true);
    try {
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession?.session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          content: newComment,
          user_id: userSession.session.user.id,
          post_id: selectedPost,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSelectedPostDetails((prevDetails) => ({
        ...prevDetails,
        post_comments: [data, ...prevDetails.post_comments],
      }));
      setNewComment('');
      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(`Error adding comment: ${error.message}`);
    } finally {
      setIsCreatingComment(false);
    }
  };

  // Share post
  const handleSharePost = async (post) => {
    try {
      const shareContent = {
        message: `Check out this post from ${post.profiles?.first_name} ${post.profiles?.last_name}:\n\n"${post.content}"\n\nPosted at ${post.stop_name || 'Unknown Stop'}`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post');
    }
  };

  // Open comment dialog
  const openCommentDialog = (postId) => {
    setSelectedPost(postId);
    setIsCommentDialogVisible(true);
  };

  // Close comment dialog
  const closeCommentDialog = () => {
    setIsCommentDialogVisible(false);
    setSelectedPost(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(); // Fetch posts again
    setRefreshing(false); // Reset refreshing state
  };

  const handleReactionPress = (postId) => {
    console.log(`Toggling reactions for post ID: ${postId}`);
    setShowReactions((prev) => ({
      ...prev,
      [postId]: !prev[postId], // Toggle the visibility of reactions for the selected post
    }));
  };

  const handleReactionSelect = async (reactionType, postId) => {
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session?.user.id) {
      Alert.alert('Error', 'You must be logged in to react.');
      return;
    }
  
    try {
      // Check if the post exists in hub_posts
      const { data: hubPost, error: hubPostError } = await supabase
        .from('hub_posts')
        .select('id')
        .eq('id', postId)
        .single();
  
      let postType = null;
      if (hubPost && !hubPostError) {
        postType = 'hub';
      } else {
        // Check if the post exists in stop_posts
        const { data: stopPost, error: stopPostError } = await supabase
          .from('stop_posts')
          .select('id')
          .eq('id', postId)
          .single();
  
        if (stopPost && !stopPostError) {
          postType = 'stop';
        } else {
          console.error('Post not found in hub_posts or stop_posts:', postId);
          Alert.alert('Error', 'Post not found.');
          return;
        }
      }
  
      // Determine which column to use based on the post type
      const reactionData = {
        user_id: userSession.session.user.id,
        reaction_type: reactionType,
        created_at: new Date().toISOString(),
      };
  
      if (postType === 'hub') {
        reactionData.post_hub_id = postId;
      } else if (postType === 'stop') {
        reactionData.post_stop_id = postId;
      }
  
      // Check for existing reaction
      const { data: existingReaction, error: fetchError } = await supabase
        .from('post_reactions')
        .select('id')
        .eq(postType === 'hub' ? 'post_hub_id' : 'post_stop_id', postId)
        .eq('user_id', userSession.session.user.id)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing reaction:', fetchError.message);
        Alert.alert('Error', 'Failed to check existing reaction.');
        return;
      }
  
      if (existingReaction) {
        // Update existing reaction
        const { error: updateError } = await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id);
  
        if (updateError) {
          console.error('Error updating existing reaction:', updateError.message);
          Alert.alert('Error', 'Failed to update existing reaction.');
        } else {
          console.log(`Updated existing reaction to ${reactionType} for post ID: ${postId}`);
        }
      } else {
        // Insert new reaction
        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert(reactionData);
  
        if (insertError) {
          console.error('Error inserting new reaction:', insertError.message);
          Alert.alert('Error', 'Failed to insert new reaction.');
        } else {
          console.log(`Inserted new ${reactionType} reaction for post ID: ${postId}`);
        }
      }
  
      // Refresh posts to show updated reactions
      fetchPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to react to the post.');
    }
  };
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now - postDate;

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const handlePostPress = async (post) => {
    if (post.type === 'hub') {
      router.push(`/hub-post-details?postId=${post.id}`); // Navigate to hub post details
    } else if (post.type === 'stop') {
      router.push(`/stop-post-details?postId=${post.id}`); // Navigate to stop post details
    }
  };

  const renderReactionOptions = (postId, postType) => (
    <View style={styles.reactionOptions}>
      <Pressable onPress={() => handleReactionSelect('like', postId, postType)}>
        <MaterialCommunityIcons name="thumb-up" size={24} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => handleReactionSelect('love', postId, postType)}>
        <MaterialCommunityIcons name="heart" size={24} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => handleReactionSelect('laugh', postId, postType)}>
        <MaterialCommunityIcons name="emoticon-happy" size={24} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => handleReactionSelect('sad', postId, postType)}>
        <MaterialCommunityIcons name="emoticon-sad" size={24} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => handleReactionSelect('angry', postId, postType)}>
        <MaterialCommunityIcons name="emoticon-angry" size={24} color={colors.text} />
      </Pressable>
    </View>
);

  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.postHeaderText}>
        <Pressable onPress={() => router.push(`/social-profile?id=${item.profiles.id}`)}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
      </Pressable>
          {item.profiles.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {item.profiles.selected_title}
            </Text>
          )}
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>
        {item.content}
      </Text>

      {item.type === 'hub' && (
        <Pressable onPress={() => router.push(`/hub-details?hubId=${item.hubs?.id}`)}>
          <Text style={[styles.hubName, { color: colors.primary }]}>
            Hub: {item.hubs?.name || 'Unknown Hub'}
          </Text>
        </Pressable>
      )}
      {item.type === 'stop' && (
        <View>
          <Pressable onPress={() => router.push(`/stop-details?stopId=${item.stops?.id}`)}>
            <Text style={[styles.stopName, { color: colors.primary }]}>
              Stop: {item.stops?.name || 'Unknown Stop'}
            </Text>
          </Pressable>
          <Text style={[styles.routeName, { color: colors.primary }]}>
            Related Route: {item.stops?.routes?.name || 'Unknown Route'}
          </Text>
        </View>
      )}
      <TouchableOpacity onPress={() => handleReactionPress(item.id)} style={styles.reactionButton}>
        <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color={colors.text} />
      </TouchableOpacity>
      {showReactions[item.id] && renderReactionOptions(item.id)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Posts Feed */}
      <FlatList
        data={[...hubPosts.map(post => ({ ...post, type: 'hub' })), ...stopPosts.map(post => ({ ...post, type: 'stop' }))]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        ListEmptyComponent={
          isPostsLoading ? (
            <>
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
            </>
          ) : (
            <View style={styles.noPostsContainer}>
              <Text style={[styles.noPostsText, { color: colors.text }]}>
                No posts available.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Customize the color of the spinner
          />
        }
      />

      {/* Comment Dialog */}
      <Modal
        visible={isCommentDialogVisible}
        animationType="slide"
        onRequestClose={closeCommentDialog}
        transparent
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
            <Pressable onPress={closeCommentDialog} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
            </Pressable>
            {isPostDetailsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              selectedPostDetails && (
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
                    onPress={handleCreateComment}
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
              )
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={reactionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a Reaction</Text>
            {renderReactionOptions(selectedPostId)}
            <Pressable onPress={() => setReactionModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  hubName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  routeName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noPostsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reactionSection: {
    flexDirection: 'row',
    marginTop: 5,
  },
  reactionButton: {
    padding: 5,
  },
  reactionEmojiContainer: {
    padding: 5,
  },
  reactionEmoji: {
    fontSize: 30,
  },
  reactionText: {
    fontSize: 24,
    marginTop: 5,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  skeletonHeaderContent: {
    flex: 1,
    gap: 8,
  },
  skeletonText: {
    height: 12,
    borderRadius: 4,
    marginVertical: 4,
  },
  skeletonContent: {
    marginVertical: 12,
    gap: 8,
  },
  skeletonAction: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
  reactionCounts: {
    flexDirection: 'row',
    marginTop: 5,
  },
  reactionCountText: {
    marginRight: 10,
    fontSize: 16,
  },
  reactionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  reactionOption: {
    padding: 5,
    marginHorizontal: 5,
  },
});