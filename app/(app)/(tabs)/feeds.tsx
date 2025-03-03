import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Image, ActivityIndicator, Share, Animated, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase'; // Adjust the path
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext'; // Import useTheme
import { useRouter } from 'expo-router'; // Ensure you have this import
import * as Animatable from 'react-native-animatable';
import { Picker } from '@react-native-picker/picker'; // Import Picker

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
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [profiles, setProfiles] = useState(null); // State to hold user profile data
  const [isPostDetailsLoading, setIsPostDetailsLoading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [isCommentDialogVisible, setIsCommentDialogVisible] = useState(false); // For comment dialog
  const [refreshing, setRefreshing] = useState(false); // State for refreshing
  const router = useRouter(); // Initialize the router
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState(null);
  const [favoriteHubs, setFavoriteHubs] = useState([]);

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

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsPostsLoading(true);
      try {
        const { data: postsData, error } = await supabase
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
          `);

        if (error) {
          console.error('Error fetching posts:', error.message);
          Alert.alert('Error fetching posts', error.message);
          return;
        }

        console.log('Fetched Posts Data:', postsData); // Log the fetched posts data

        // Create an array of hub IDs to fetch hub names
        const hubIds = postsData.map(post => post.hub_id);
        
        // Fetch hub names based on hub IDs
        const { data: hubsData, error: hubsError } = await supabase
          .from('hubs')
          .select('id, name')
          .in('id', hubIds);

        if (hubsError) {
          console.error('Error fetching hubs:', hubsError.message);
          Alert.alert('Error fetching hubs', hubsError.message);
          return;
        }

        // Create a mapping of hub IDs to hub names
        const hubMap = {};
        hubsData.forEach(hub => {
          hubMap[hub.id] = hub.name;
        });

        // Process posts to include the user's reaction and hub name if available
        const processedPosts = postsData.map(post => {
          const userReaction = post.post_reactions.find(reaction => reaction.user_id === supabase.auth.user()?.id);
          const reactionCounts = reactions.map(reaction => ({
            ...reaction,
            count: post.post_reactions.filter(r => r.reaction_type === reaction.id).length,
          }));

          return {
            ...post,
            userReaction: userReaction ? reactions.find(r => r.id === userReaction.reaction_type) : null,
            reactionCounts,
            hub_name: hubMap[post.hub_id] || 'Unknown Hub', // Get the hub name from the map
          };
        });

        setPosts(processedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        alert('Failed to fetch posts');
      } finally {
        setIsPostsLoading(false);
      }
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

  // Create post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedHubId) {
      Alert.alert('Error', 'Please enter content and select a hub.');
      return;
    }

    setIsCreatingPost(true);
    try {
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession?.session?.user.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hub_posts')
        .insert({
          content: newPostContent,
          user_id: userSession.session.user.id,
          hub_id: selectedHubId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPosts((prevPosts) => [data, ...prevPosts]);
      setNewPostContent('');
      setSelectedHubId(null);
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setIsCreatingPost(false);
    }
  };

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
    setSelectedPostId(selectedPostId === postId ? null : postId);
  };

  const handleReactionSelect = async (reaction) => {
    const { user } = supabase.auth;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to react.');
      return;
    }

    // Check if the user has already reacted to the post
    const { data: existingReaction, error: fetchError } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', selectedPostId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing reaction:', fetchError.message);
      Alert.alert('Error', 'Failed to check existing reaction.');
      return;
    }

    if (existingReaction) {
      console.log('Updating existing reaction:', existingReaction.id);
      // Update logic...
    } else {
      console.log('Inserting new reaction for post:', selectedPostId);
      // Insert logic...
    }

    // Refresh posts to show updated reactions
    fetchPosts();
    setSelectedPostId(null); // Close the reaction section
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Create Post Form */}
      <View style={[styles.createPostContainer, { backgroundColor: colors.card }]}>
        <View style={styles.postInputContainer}>
          <Image
          source={{ uri: profiles?.avatar_url || 'https://static.vecteezy.com/system/resources/thumbnails/005/129/844/small_2x/profile-user-icon-isolated-on-white-background-eps10-free-vector.jpg' }}
            style={styles.avatar}
          />
          <TextInput
            value={newPostContent}
            onChangeText={setNewPostContent}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.text}
            style={[styles.postInput, { color: colors.text }]}
            multiline
          />
        </View>

        {/* Dropdown for Hub Selection */}
        <Picker
          selectedValue={selectedHubId || ''}
          onValueChange={(itemValue) => setSelectedHubId(itemValue)}
          style={{ height: 50, width: '100%', color: colors.text }}
        >
          <Picker.Item label="Select a hub" value="" />
          {favoriteHubs.map((hub) => (
            <Picker.Item key={hub.hub_id} label={hub.hubs.name} value={hub.hub_id} />
          ))}
        </Picker>

        <Pressable
          onPress={handleCreatePost}
          style={[styles.postButton, { backgroundColor: colors.primary }]}
          disabled={isCreatingPost}
        >
          <Text style={[styles.postButtonText, { color: colors.buttonText }]}>Post</Text>
        </Pressable>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleReactionPress(item.id)}>
            <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: item.profiles?.avatar_url }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.profiles?.first_name} {item.profiles?.last_name}
                  </Text>
                  <Text style={[styles.postTime, { color: colors.text }]}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </Text>
                  {item.stop_post?.stop_name && (
                    <Text style={[styles.stopName, { color: colors.text }]}>Stop: {item.stop_post.stop_name}</Text>
                  )}
                  {item.hub_name && (
                    <Text style={[styles.stopName, { color: colors.text }]}>Hub: {item.hub_name}</Text>
                  )}
                  {item.route_name && (
                    <Text style={[styles.stopName, { color: colors.text }]}>Hub: {item.route_name}</Text>
                  )}
                </View>
              </View>
              <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
              {/* Display reaction counts */}
              <View style={styles.reactionCounts}>
                {item.reactionCounts.map((reaction) => (
                  reaction.count > 0 && (
                    <Text key={reaction.id} style={styles.reactionCountText}>
                      {reaction.emoji} {reaction.count}
                    </Text>
                  )
                ))}
              </View>
              <View style={styles.postActions}>
                <Pressable onPress={() => router.push(`/post-details?postId=${item.id}`)}>
                  <Text style={{ color: colors.text }}>Comment</Text>
                </Pressable>
                <Pressable onPress={() => handleSharePost(item)}>
                  <Text style={{ color: colors.text }}>Share</Text>
                </Pressable>
              </View>

              {/* Reaction Section */}
              {selectedPostId === item.id && (
                <View style={styles.reactionSection}>
                  {reactions.map((reaction) => (
                    <Pressable
                      key={reaction.id}
                      onPress={() => handleReactionSelect(reaction)}
                      style={styles.reactionButton}
                    >
                        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {item.userReaction && (
                <Animatable.Text
                  animation="bounceIn"
                  style={styles.reactionText}
                >
                  {item.userReaction.emoji}
                </Animatable.Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          isPostsLoading ? (
            <>
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
            </>
          ) : (
            <Text style={{ color: colors.text }}>No posts found.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  createPostContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  postButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    fontWeight: 'bold',
  },
  postContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontWeight: 'bold',
  },
  postTime: {
    color: '#666',
  },
  stopName: {
    color: '#888',
    fontSize: 12,
  },
  postContent: {
    marginBottom: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
});