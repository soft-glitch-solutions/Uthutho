import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import StopBlock from '../../components/stop/StopBlock';
import { Plus, Map, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { formatTimeAgo } from '../../components/utils';

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [stopDetails, setStopDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showAddPost, setShowAddPost] = useState(false);
  const router = useRouter();
  const [nearbyStops, setNearbyStops] = useState([]);

  useEffect(() => {
    fetchStopDetails();
    fetchNearbyStops(); 
  }, [stopId]);

  const fetchStopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('*, stop_posts(*, profiles(*))')
        .eq('id', stopId)
        .single();

      if (error) throw error;

      const filteredPosts = data.stop_posts.filter((post) => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const timeDiff = now - postDate;
        return timeDiff < 24 * 60 * 60 * 1000;
      });

      setStopDetails({ ...data, stop_posts: filteredPosts });
    } catch (error) {
      console.error('Error fetching stop details:', error);
      Alert.alert('Error', 'Failed to fetch stop details.');
    } finally {
      setIsLoading(false);
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
      Alert.alert('Success', 'Post added!');
      setNewPostContent('');
      setShowAddPost(false);
      fetchStopDetails();
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to add post');
    }
  };

  const handlePostPress = (postId) => {
    router.push(`/stop-post-details?postId=${postId}`);
  };

  const fetchNearbyStops = async () => {
    try {
      const { data, error } = await supabase
        .from('nearby_spots')
        .select('*')
        .eq('stop_id', stopId);
  
      if (error) throw error;
  
      setNearbyStops(data);
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
      Alert.alert('Error', 'Failed to fetch nearby stops.');
    }
  };

  const handleSharePost = async (postContent) => {
    try {
      await Sharing.shareAsync({
        message: postContent,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePostPress(item.id)} style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.profiles.first_name} {item.profiles.last_name}
          </Text>
          {item.profiles.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {item.profiles.selected_title}
            </Text>
          )}
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => handleSharePost(item.content)}
      >
        <Share2 size={18} color={colors.primary} />
        <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const openMap = () => {
    if (!stopDetails) return;
    const lat = stopDetails.latitude;
    const long = stopDetails.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url).catch((err) => console.error('Error opening map:', err));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stopDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Failed to load stop details.</Text>
      </View>
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
        
        <View style={styles.waitingCountContainer}>
          <Text style={[styles.waitingCount, { color: colors.text }]}>
            People waiting: {stopDetails.stop_posts.length}
          </Text>

          <TouchableOpacity
            onPress={openMap}
            style={[styles.mapButton, { backgroundColor: colors.primary }]}
          >
            <Map size={24} color="white" />
          </TouchableOpacity>
        </View>

        <StopBlock
          stopId={stopId}
          stopName={stopDetails.name}
          stopLocation={{ latitude: stopDetails.latitude, longitude: stopDetails.longitude }}
          colors={colors}
          radius={0.5}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Spots</Text>
          {nearbyStops.length > 0 ? (
            nearbyStops.map((stop) => (
              <View key={stop.id} style={[styles.nearbyStopContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.nearbyStopName, { color: colors.text }]}>{stop.name}</Text>
                {stop.description && (
                  <Text style={[styles.nearbyStopDescription, { color: colors.textSecondary }]}>
                    {stop.description}
                  </Text>
                )}
                {stop.distance_meters && (
                  <Text style={[styles.nearbyStopDistance, { color: colors.textSecondary }]}>
                    {stop.distance_meters} meters away
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noNearbyStopsContainer}>
              <Text style={[styles.noNearbyStopsText, { color: colors.text }]}>
                No nearby stops found.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
            <TouchableOpacity
              onPress={() => setShowAddPost(!showAddPost)}
              style={styles.addPostButton}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={stopDetails.stop_posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.noPostsContainer}>
                <Text style={[styles.noPostsText, { color: colors.text, textAlign: 'center' }]}>
                  Be the first to post and get 1 point for early bird!
                </Text>
              </View>
            }
          />
        </View>

        {showAddPost && (
          <View style={styles.section}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textSecondary}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
            />
            <TouchableOpacity
              style={[styles.postButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPost}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waitingCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapButton: {
    padding: 10,
    borderRadius: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addPostButton: {
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  postButton: {
    padding: 15,
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
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nearbyStopContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nearbyStopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nearbyStopDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  nearbyStopDistance: {
    fontSize: 12,
    color: '#666',
  },
  noNearbyStopsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  noNearbyStopsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});