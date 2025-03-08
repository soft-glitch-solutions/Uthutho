import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import StopBlock from '../../components/stop/StopBlock'; // Import the StopBlock component

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [stopDetails, setStopDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');

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

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <Image
        source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.postHeader}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
    </View>
  );

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

        {/* Add the StopBlock component here */}
        <StopBlock
          stopId={stopId}
          stopName={stopDetails.name}
          stopLocation={{ latitude: stopDetails.latitude, longitude: stopDetails.longitude }}
          colors={colors}
          radius={0.5} // Adjust the radius as needed (in kilometers)
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
          <FlatList
            data={stopDetails.stop_posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={{ color: colors.text }}>No posts available.</Text>}
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