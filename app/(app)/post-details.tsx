import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TextInput, Button, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const PostDetails = () => {
  const { postId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [relatedHub, setRelatedHub] = useState(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        // Fetch post details
        const { data: postData, error: postError } = await supabase
          .from('hub_posts')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('id', postId)
          .single();

        if (postError) throw postError;

        setPost(postData);

        // Fetch related hub details
        if (postData.related_type === 'hub' && postData.related_id) {
          const { data: hubData, error: hubError } = await supabase
            .from('hubs')
            .select('name')
            .eq('id', postData.related_id)
            .single();

          if (hubError) throw hubError;
          setRelatedHub(hubData);
        }

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('post_comments')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('post_id', postId);

        if (commentsError) throw commentsError;

        setComments(commentsData);
      } catch (error) {
        Alert.alert('Error fetching post details', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([
          { content: newComment, post_id: postId, user_id: supabase.auth.user()?.id }
        ]);

      if (error) throw error;

      // Add the new comment to the list
      const { data: newCommentData, error: newCommentError } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (newCommentError) throw newCommentError;

      setComments([...comments, newCommentData]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error submitting comment', error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {post && (
        <View style={styles.postContainer}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Image
              source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
            <View style={styles.postHeaderText}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {post.profiles.first_name} {post.profiles.last_name}
              </Text>
              <Text style={[styles.timestamp, { color: colors.text }]}>2 hours ago</Text>
            </View>
          </View>

          {/* Post Content */}
          <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

          {/* Related Hub */}
          {relatedHub && (
            <View style={styles.relatedHubContainer}>
              <Text style={[styles.relatedHubText, { color: colors.text }]}>
                Related to: {relatedHub.name}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Comments Section */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Image
              source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/150' }}
              style={styles.commentAvatar}
            />
            <View style={styles.commentTextContainer}>
              <Text style={[styles.commentUserName, { color: colors.text }]}>
                {item.profiles.first_name} {item.profiles.last_name}
              </Text>
              <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
            </View>
          </View>
        )}
      />

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.text}
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Comment" onPress={handleCommentSubmit} />
      </View>
    </View>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <View style={styles.skeletonLoaderContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonContent} />
      <View style={styles.skeletonRelatedHub} />
      <View style={styles.skeletonComment} />
      <View style={styles.skeletonComment} />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
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
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  relatedHubContainer: {
    marginTop: 10,
  },
  relatedHubText: {
    fontSize: 14,
    color: 'gray',
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLoaderContainer: {
    padding: 20,
    width: '100%',
  },
  skeletonHeader: {
    height: 20,
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonContent: {
    height: 15,
    width: '80%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonRelatedHub: {
    height: 15,
    width: '40%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonComment: {
    height: 15,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
});

export default PostDetails;