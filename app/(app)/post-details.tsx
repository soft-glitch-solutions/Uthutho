import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';

const PostDetails = ({ route }) => {
  const { postId } = route.params; // Get postId from route parameters
  const { colors } = useTheme();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        // Fetch the post details
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (postError) throw postError;

        setPost(postData);

        // Fetch comments related to the post
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId); // Assuming post_id is the field linking comments to posts

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

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {post && (
        <View style={styles.postContainer}>
          <Text style={{ color: colors.text, fontSize: 20 }}>{post.content}</Text>
          <Text style={{ color: colors.text }}>Related to: {post.related_type}</Text>
        </View>
      )}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Text style={{ color: colors.text }}>{item.content}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  commentContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
});

export default PostDetails; 