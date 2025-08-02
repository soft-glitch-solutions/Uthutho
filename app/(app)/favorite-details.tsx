import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Clock, Users, ThumbsUp } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import StopBlock from '../../components/stop/StopBlock'; 
// Import the StopBlock component

export default function FavoriteDetailsScreen() {
  const { favoriteId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [favorite, setFavorite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubPosts, setHubPosts] = useState([]);
  const [routeDetails, setRouteDetails] = useState(null); // State for route details
  const [newComment, setNewComment] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    fetchFavoriteDetails();
  }, [favoriteId]);

  const fetchFavoriteDetails = async () => {
    try {

      const encodedFavoriteId = encodeURIComponent(favoriteId);

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
        .eq('name', encodedFavoriteId)
        .single();

      if (routeData) {
        setFavorite({ ...routeData, type: 'route' });
        // Fetch additional route details if needed
        const { data: routeDetails } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeData.id)
          .single();
        setRouteDetails(routeDetails); // Set route details
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

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now - postDate;

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} style={[styles.postContainer, { backgroundColor: colors.card }]}>
    <View style={styles.postHeader}>
        <Image
            source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
        />
        <View style={styles.postHeaderText}>
  <Pressable onPress={() => router.push(`/social-profile?id=${item.profiles.id}`)}>
            <Text style={[styles.userName, { color: colors.text }]}>
                {item.profiles.first_name} {item.profiles.last_name}
            </Text>
</Pressable>
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
    <Text style={[styles.postContent, { color: colors.text }]}>
        {item.content}
    </Text>
    {item.type === 'hub' && (
        <Text style={[styles.hubName, { color: colors.primary }]}>
            Hub: {item.hubs?.name || 'Unknown Hub'}
        </Text>
    )}
    {item.type === 'stop' && (
        <Text style={[styles.routeName, { color: colors.primary }]}>
            Related Route: {item.stops?.routes?.name || 'Unknown Route'}
        </Text>
    )}
    {/* Reaction Counter */}
    {item.reaction_count > 0 && (
        <View style={styles.reactionCounter}>
            <Text style={[styles.reactionCounterText, { color: colors.text }]}>
                {item.reaction_count} {reactionEmojis[item.selected_reaction] || '👍'}
            </Text>
        </View>
    )}

</TouchableOpacity>
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

        {/* Render the StopBlock if the favorite is a stop */}
        {favorite?.type === 'stop' && (
          <View style={styles.stopBlockContainer}>
            <StopBlock
              stopId={favorite.id}
              stopName={favorite.name}
              stopLocation={{
                latitude: favorite.latitude,
                longitude: favorite.longitude,
              }}
              colors={colors}
            />
          </View>
        )}

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

        {favorite?.type === 'route' && routeDetails && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Route Information</Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              From: {routeDetails.start_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              To: {routeDetails.end_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              Cost: R{routeDetails.cost}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              Transport Type: {routeDetails.transport_type}
            </Text>
          </View>
        )}


        {favorite?.type === 'hub' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
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
  routeInfo: {
    fontSize: 16,
    marginBottom: 10,
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
  stopBlockContainer: {
    marginBottom: 20,
  },
});