import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [stop, setStop] = useState(null);
  const [posts, setPosts] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    fetchStopDetails();
  }, [stopId]);

  const fetchStopDetails = async () => {
    try {
      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('*')
        .eq('id', stopId)
        .single();

      if (stopError) throw stopError;
      setStop(stopData);

      const { data: postsData, error: postsError } = await supabase
        .from('stop_posts')
        .select('*')
        .eq('stop_id', stopId);

      if (postsError) throw postsError;
      setPosts(postsData);

      const { data: waitingData, error: waitingError } = await supabase
        .from('stop_waiting')
        .select('id')
        .eq('stop_id', stopId)
        .gt('expires_at', new Date().toISOString());

      if (waitingError) throw waitingError;
      setWaitingCount(waitingData.length);
    } catch (error) {
      console.error('Error fetching stop details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsWaiting = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('stop_waiting')
        .insert({
          stop_id: stopId,
          user_id: session.user.id,
          transport_type: 'bus', // Example transport type
        });

      if (error) throw error;
      alert('Marked as waiting!');
      fetchStopDetails(); // Refresh data
    } catch (error) {
      console.error('Error marking as waiting:', error);
      alert('Failed to mark as waiting');
    }
  };

  const handleAddPost = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('stop_posts')
        .insert({
          stop_id: stopId,
          user_id: session.user.id,
          content: newPostContent,
        });

      if (error) throw error;
      alert('Post added!');
      setNewPostContent('');
      fetchStopDetails(); // Refresh data
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to add post');
    }
  };

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
        <Text style={[styles.title, { color: colors.text }]}>{stop?.name}</Text>
        <Text style={[styles.details, { color: colors.text }]}>
          {stop?.latitude}, {stop?.longitude}
        </Text>
        <Text style={[styles.waitingCount, { color: colors.text }]}>
          People waiting: {waitingCount}
        </Text>

        <TouchableOpacity
          style={[styles.waitingButton, { backgroundColor: colors.primary }]}
          onPress={handleMarkAsWaiting}
        >
          <Text style={styles.waitingButtonText}>Mark as Waiting</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add a Post</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
          {posts.map((post) => (
            <View key={post.id} style={styles.postItem}>
              <Text style={[styles.postLabel, { color: colors.text }]}>Post</Text>
              <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
              <Text style={[styles.postTime, { color: colors.text }]}>
                {new Date(post.created_at).toLocaleString()}
              </Text>
            </View>
          ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  details: {
    fontSize: 16,
    marginBottom: 10,
  },
  waitingCount: {
    fontSize: 16,
    marginBottom: 20,
  },
  waitingButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  postButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postItem: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  postLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  postTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
  },
});