import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Clock, Users, ThumbsUp } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function FavoriteDetailsScreen() {
  const { favoriteId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [favorite, setFavorite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubPosts, setHubPosts] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    fetchFavoriteDetails();
  }, [favoriteId]);

  const fetchFavoriteDetails = async () => {
    try {
      // First try to find in stops
      let { data: stopData } = await supabase
        .from('stops')
        .select('*')
        .eq('name', favoriteId)
        .single();

      if (stopData) {
        setFavorite({ ...stopData, type: 'stop' });
        setLoading(false);
        return;
      }

      // Then try hubs
      let { data: hubData } = await supabase
        .from('hubs')
        .select('*, hub_posts(*, profiles(*), post_comments(*, profiles(*)))')
        .eq('name', favoriteId)
        .single();

      if (hubData) {
        setFavorite({ ...hubData, type: 'hub' });
        setHubPosts(hubData.hub_posts || []);
      }

      // Finally try routes
      let { data: routeData } = await supabase
        .from('routes')
        .select('*')
        .eq('name', favoriteId)
        .single();

      if (routeData) {
        setFavorite({ ...routeData, type: 'route' });
      }
    } catch (error) {
      console.error('Error fetching favorite details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId) => {
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
      setNewComment('');
      fetchFavoriteDetails(); // Refresh data
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleAddPost = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('hub_posts')
        .insert({
          hub_id: favorite.id,
          user_id: session.user.id,
          content: newPostContent,
        });

      if (error) throw error;
      setNewPostContent('');
      fetchFavoriteDetails(); // Refresh data
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to add post');
    }
  };

  const renderPost = ({ item }) => (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
      <FlatList
        data={item.post_comments}
        renderItem={({ item: comment }) => (
          <View style={styles.commentContainer}>
            <Text style={[styles.commentText, { color: colors.text }]}>
              {comment.profiles.first_name}: {comment.content}
            </Text>
          </View>
        )}
        keyExtractor={(comment) => comment.id.toString()}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Add a comment..."
        placeholderTextColor={colors.text}
        value={newComment}
        onChangeText={setNewComment}
      />
      <TouchableOpacity
        style={[styles.commentButton, { backgroundColor: colors.primary }]}
        onPress={() => handleAddComment(item.id)}
      >
        <Text style={styles.commentButtonText}>Comment</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{favorite?.name}</Text>
        <Text style={[styles.type, { color: colors.primary }]}>
          {favorite?.type?.charAt(0).toUpperCase() + favorite?.type?.slice(1)}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <MapPin size={20} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {favorite?.address || favorite?.location}
            </Text>
          </View>

          {favorite?.operating_hours && (
            <View style={styles.infoRow}>
              <Clock size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {favorite.operating_hours}
              </Text>
            </View>
          )}

          {favorite?.capacity && (
            <View style={styles.infoRow}>
              <Users size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Capacity: {favorite.capacity}
              </Text>
            </View>
          )}
        </View>

        {favorite?.type === 'stop' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Next Arrivals
            </Text>
            {/* Add real-time arrival data here */}
            <Text style={[styles.placeholder, { color: colors.text }]}>
              Real-time arrival data will be displayed here
            </Text>
          </View>
        )}

        {favorite?.type === 'hub' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.text}
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
            <TouchableOpacity
              style={[styles.postButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPost}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
            <FlatList
              data={hubPosts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<Text style={{ color: colors.text }}>No posts available.</Text>}
            />
          </View>
        )}

        {favorite?.type === 'route' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Route Information
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              From: {favorite.start_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              To: {favorite.end_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              Cost: R{favorite.cost}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  type: {
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  section: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  postButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
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
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  commentContainer: {
    paddingLeft: 60,
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
  },
  commentButton: {
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  commentButtonText: {
    color: 'white',
    fontSize: 14,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  routeInfo: {
    fontSize: 16,
    marginBottom: 10,
  },
});