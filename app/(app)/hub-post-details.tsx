import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '@/hook/useProfile';

export default function HubPostDetailsScreen() {
  const { postId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const { data, error } = await supabase
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
            post_comments (
              id,
              content,
              created_at,
              user_id,
              profiles (
                id,
                first_name,
                last_name,
                avatar_url,
                selected_title
              )
            ),
            post_reactions (
              id,
              reaction_type,
              user_id
            )
          `)
          .eq('id', postId)
          .single();

        if (error) throw error;

        setPost(data);
        setComments(data.post_comments || []);
      } catch (error) {
        console.error('Error fetching post details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        Alert.alert('Error', 'You must be logged in to comment.');
        return;
      }

      const { data: newCommentData, error } = await supabase
        .from('post_comments')
        .insert([
          { 
            content: newComment, 
            hub_post: postId, 
            user_id: user.user.id 
          }
        ])
        .select('*, profiles (first_name, last_name, avatar_url, selected_title)')
        .single();

      if (error) throw error;

      setComments([...comments, newCommentData]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error submitting comment', error.message);
    }
  };

  if (loading || profileLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: post.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.postHeaderText}>
          <Pressable onPress={() => router.push(`/social-profile?id=${post.profiles.id}`)}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {post.profiles.first_name} {post.profiles.last_name}
            </Text>
          </Pressable>
          {post.profiles.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {post.profiles.selected_title}
            </Text>
          )}
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={[styles.postContent, { color: colors.text }]}>
        {post.content}
      </Text>

      {/* Hub Information */}
      <Pressable 
        onPress={() => router.push(`/hub-details?hubId=${post.hubs?.id}`)}
        style={styles.hubInfo}
      >
        <Text style={[styles.hubName, { color: colors.primary }]}>
          Hub: {post.hubs?.name || 'Unknown Hub'}
        </Text>
      </Pressable>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={[styles.commentsTitle, { color: colors.text }]}>
          Comments ({comments.length})
        </Text>
        {comments.map((comment) => {
          const commentProfile = comment.profiles || {
            first_name: 'Unknown',
            last_name: 'User',
            avatar_url: 'https://via.placeholder.com/50',
          };

          return (
            <View key={comment.id} style={styles.commentContainer}>
              <Image
                source={{ uri: commentProfile.avatar_url }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Pressable onPress={() => router.push(`/social-profile?id=${commentProfile.id}`)}>
                  <Text style={[styles.commentUserName, { color: colors.text }]}>
                    {commentProfile.first_name} {commentProfile.last_name}
                  </Text>
                </Pressable>
                {commentProfile.selected_title && (
                  <Text style={[styles.selectedTitle, { color: colors.primary }]}>
                    {commentProfile.selected_title}
                  </Text>
                )}
                <Text style={[styles.commentText, { color: colors.text }]}>
                  {comment.content}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Add Comment */}
        <View style={styles.addCommentContainer}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
          />
          <Pressable
            style={[styles.commentButton, { backgroundColor: colors.primary }]}
            onPress={handleCommentSubmit}
          >
            <MaterialCommunityIcons name="send" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  postTime: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 16,
  },
  hubInfo: {
    marginBottom: 16,
  },
  hubName: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 14,
    marginTop: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  commentButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});