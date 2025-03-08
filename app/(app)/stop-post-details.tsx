import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function StopPostDetails() {
  const { postId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [postDetails, setPostDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stop_posts')
        .select('*, profiles(*), post_comments(*, profiles(*)), post_reactions(*)')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPostDetails(data);
    } catch (error) {
      console.error('Error fetching post details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          content: newComment,
        });

      if (error) throw error;
      alert('Comment added!');
      setNewComment('');
      fetchPostDetails(); // Refresh data
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const renderComment = ({ item }) => (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <Image
        source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.commentContent}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Post Details */}
        <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: postDetails.profiles.avatar_url || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View style={styles.postHeader}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {postDetails.profiles.first_name} {postDetails.profiles.last_name}
            </Text>
            <Text style={[styles.userTitle, { color: colors.text }]}>
              {postDetails.profiles.selected_title}
            </Text>
          </View>
          <Text style={[styles.postContent, { color: colors.text }]}>{postDetails.content}</Text>
          <View style={styles.postFooter}>
            <Text style={[styles.footerText, { color: colors.text }]}>
              {postDetails.post_comments.length} Comments
            </Text>
            <Text style={[styles.footerText, { color: colors.text }]}>
              {postDetails.post_reactions.length} Reactions
            </Text>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Comments</Text>
          <FlatList
            data={postDetails.post_comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={{ color: colors.text }}>No comments available.</Text>}
          />
        </View>

        {/* Add a Comment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add a Comment</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.text}
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity
            style={[styles.commentButton, { backgroundColor: colors.primary }]}
            onPress={handleAddComment}
          >
            <Text style={styles.commentButtonText}>Post Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  postContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userTitle: {
    fontSize: 14,
    marginLeft: 10,
    opacity: 0.7,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  commentButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
  },
});