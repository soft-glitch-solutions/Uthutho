import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, FlatList, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

const Post = ({ post }) => {
  const { colors } = useTheme();
  const timestamp = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={[styles.userName, { color: colors.text }]}>{post.profiles.first_name} {post.profiles.last_name}</Text>
          <Text style={[styles.timestamp, { color: colors.text }]}>{timestamp}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
    </View>
  );
};

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [stopDetails, setStopDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchStopDetails();
  }, [stopId]);

  const fetchStopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*, stop_posts(*, profiles(*))')
        .eq('id', stopId)
        .single();

      if (error) throw error;
      setStopDetails(data);
    } catch (error) {
      console.error('Error fetching stop details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsWaiting = async () => {
    if (isWaiting) return;

    setIsWaiting(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(waitingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waitingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return;

      const { error } = await supabase
        .from('stop_waiting')
        .insert({
          stop_id: stopId,
          user_id: userId,
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
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return;


      const { error } = await supabase
        .from('stop_posts')
        .insert({
          stop_id: stopId,
          user_id: userId,
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

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
    </View>
  );

  const buttonText = isWaiting ? "Waiting" : "Mark as Waiting";
  const buttonStyle = isWaiting ? styles.buttonDisabled : styles.buttonEnabled;

  if (isLoading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSkeletonLoader()}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
          <Image
          source={{ uri: stopDetails?.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={[styles.title, { color: colors.text }]}>{stopDetails.name}</Text>
        <Text style={[styles.waitingCount, { color: colors.text }]}>
          People waiting: {stopDetails.stop_posts.length}
        </Text>

        <Pressable
          onPress={handleMarkAsWaiting}
          style={[styles.waitingButton, buttonStyle]}
          disabled={isWaiting}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>


        <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
        <FlatList
          data={stopDetails.stop_posts}
          renderItem={({ item }) => <Post post={item} />}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={{ color: colors.text }}>No posts available.</Text>}
          contentContainerStyle={{ padding: 20 }}
        />
      </View>

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
  buttonEnabled: {
    backgroundColor: '#007BFF',
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
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
  image: {
    width: '100%',
    height: 200,
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
  postContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
  headerText: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  postContent: {
    fontSize: 14,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonHeader: {
    width: '60%',
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonText: {
    width: '100%',
    height: 15,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginBottom: 5,
  },
});