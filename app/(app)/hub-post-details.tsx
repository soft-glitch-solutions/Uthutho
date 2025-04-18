import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Send, MapPin, User } from 'lucide-react-native';
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
        style={[styles.hubInfo, { backgroundColor: colors.card }]}
      >
        <MapPin size={16} color={colors.primary} />
        <Text style={[styles.hubName, { color: colors.primary }]}>
          {post.hubs?.name || 'Unknown Hub'}
        </Text>
      </Pressable>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={[styles.commentsTitle, { color: colors.text }]}>
          Comments ({comments.length})
        </Text>
        
        {comments.length === 0 ? (
          <View style={styles.noCommentsContainer}>
            <User size={24} color={colors.textSecondary} />
            <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          comments.map((comment) => {
            const commentProfile = comment.profiles || {
              first_name: 'Unknown',
              last_name: 'User',
              avatar_url: 'https://via.placeholder.com/50',
            };

            return (
              <View key={comment.id} style={[styles.commentContainer, { backgroundColor: colors.card }]}>
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
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                    {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Add Comment */}
        <View style={[styles.addCommentContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.commentInput, { color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable
            style={[styles.commentButton, { backgroundColor: colors.primary }]}
            onPress={handleCommentSubmit}
            disabled={!newComment.trim()}
          >
            <Send size={20} color="white" />
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
    marginRight: 12,
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
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    marginTop: 4,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  hubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  hubName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noCommentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  commentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});