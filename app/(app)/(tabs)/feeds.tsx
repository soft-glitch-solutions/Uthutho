import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Share,
  Animated,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Picker } from '@react-native-picker/picker';
import { Flag, MapPin, Route , ThumbsUp, Heart,  Frown, AlertTriangle , Smile, MessageCircle, Search} from 'lucide-react-native';
import LocationAutocomplete from '@/components/LocationAutocomplete';

const Shimmer = ({ children, colors }) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmerAnimation());
    };

    shimmerAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const PostSkeleton = ({ colors }) => {
  return (
    <Shimmer colors={colors}>
      <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
        <View style={styles.postHeader}>
          <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonHeaderContent}>
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '40%' }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '20%' }]} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '100%' }]} />
          <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '80%' }]} />
        </View>
        <View style={styles.postActions}>
          {[1, 2, 3].map((i) => (
            <View 
              key={i} 
              style={[styles.skeletonAction, { backgroundColor: colors.border }]} 
            />
          ))}
        </View>
      </View>
    </Shimmer>
  );
};

interface Location {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export default function Feed() {
  const { colors } = useTheme();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPostDetails, setSelectedPostDetails] = useState(null);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [profiles, setProfiles] = useState(null);
  const [isPostDetailsLoading, setIsPostDetailsLoading] = useState(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [isCommentDialogVisible, setIsCommentDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState(null);
  const [favoriteHubs, setFavoriteHubs] = useState([]);
  const [hubPosts, setHubPosts] = useState([]);
  const [stopPosts, setStopPosts] = useState([]);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [showReactions, setShowReactions] = useState({});

  const [routeInstructions, setRouteInstructions] = useState(null);
  const [searchingRoute, setSearchingRoute] = useState(false);

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setProfiles(data);
        }
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchFavoriteHubs();
  }, []);

  const fetchFavoriteHubs = async () => {
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      Alert.alert('Error', 'Could not retrieve session. Please log in again.');
      return;
    }

    const userId = session?.session?.user.id;

    if (!userId) {
      console.error('User ID not found in session.');
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      setFavoriteHubs(profile.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error fetching favorites', error.message);
    }
  };

  const fetchCommentCounts = async (postIds: string[], postType: 'hub' | 'stop') => {
    try {
      const columnName = postType === 'hub' ? 'hub_post' : 'stop_post';
      const { data, error } = await supabase
        .from('post_comments')
        .select(columnName)
        .in(columnName, postIds);

      if (error) throw error;

      const counts = {};
      data.forEach(comment => {
        const postId = comment[columnName];
        counts[postId] = (counts[postId] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error fetching comment counts:', error);
      return {};
    }
  };

  const fetchHubPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
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
          post_reactions!post_reactions_post_hub_id_fkey (
            id,
            reaction_type,
            user_id
          )
        `);

      if (error) {
        console.error('Error fetching hub posts:', error.message);
        Alert.alert('Error fetching hub posts', error.message);
        return;
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const post of postsData) {
        const postDate = new Date(post.created_at);
        if (postDate < oneDayAgo) {
          const { error: deleteError } = await supabase
            .from('hub_posts')
            .delete()
            .eq('id', post.id);

          if (deleteError) {
            console.error('Error deleting post:', deleteError);
            Alert.alert('Error', 'Failed to delete old hub post.');
          }
        }
      }

      const filteredPosts = postsData.filter(post => new Date(post.created_at) >= oneDayAgo);
      const hubPostIds = filteredPosts.map(post => post.id);
      const hubCommentCounts = await fetchCommentCounts(hubPostIds, 'hub');

      return filteredPosts.map(post => ({
        ...post,
        commentCount: hubCommentCounts[post.id] || 0,
        type: 'hub'
      }));
    } catch (error) {
      console.error('Error fetching hub posts:', error);
      return [];
    }
  };

  const fetchStopPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('stop_posts')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            selected_title
          ),
          stops (
            id,
            name,
            routes (
              name
            )
          ),
          post_reactions!post_reactions_post_stop_id_fkey (
            id,
            reaction_type,
            user_id
          )
        `);

      if (error) {
        console.error('Error fetching stop posts:', error.message);
        Alert.alert('Error fetching stop posts', error.message);
        return;
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const post of postsData) {
        const postDate = new Date(post.created_at);
        if (postDate < oneDayAgo) {
          const { error: deleteError } = await supabase
            .from('stop_posts')
            .delete()
            .eq('id', post.id);

          if (deleteError) {
            console.error('Error deleting post:', deleteError);
            Alert.alert('Error', 'Failed to delete old stop post.');
          }
        }
      }

      const filteredPosts = postsData.filter(post => new Date(post.created_at) >= oneDayAgo);
      const stopPostIds = filteredPosts.map(post => post.id);
      const stopCommentCounts = await fetchCommentCounts(stopPostIds, 'stop');

      return filteredPosts.map(post => ({
        ...post,
        commentCount: stopCommentCounts[post.id] || 0,
        type: 'stop'
      }));
    } catch (error) {
      console.error('Error fetching stop posts:', error);
      return [];
    }
  };

  const fetchPosts = async () => {
    setIsPostsLoading(true);
    try {
      const [hubPostsData, stopPostsData] = await Promise.all([
        fetchHubPosts(),
        fetchStopPosts()
      ]);
      
      setHubPosts(hubPostsData);
      setStopPosts(stopPostsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleReactionPress = (postId) => {
    setShowReactions((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleReactionSelect = async (reactionType, postId) => {
    const { data: userSession } = await supabase.auth.getSession();
    if (!userSession?.session?.user.id) {
      Alert.alert('Error', 'You must be logged in to react.');
      return;
    }
  
    try {
      const { data: hubPost, error: hubPostError } = await supabase
        .from('hub_posts')
        .select('id')
        .eq('id', postId)
        .single();
  
      let postType = null;
      if (hubPost && !hubPostError) {
        postType = 'hub';
      } else {
        const { data: stopPost, error: stopPostError } = await supabase
          .from('stop_posts')
          .select('id')
          .eq('id', postId)
          .single();
  
        if (stopPost && !stopPostError) {
          postType = 'stop';
        } else {
          console.error('Post not found in hub_posts or stop_posts:', postId);
          Alert.alert('Error', 'Post not found.');
          return;
        }
      }
  
      const reactionData = {
        user_id: userSession.session.user.id,
        reaction_type: reactionType,
        created_at: new Date().toISOString(),
      };
  
      if (postType === 'hub') {
        reactionData.post_hub_id = postId;
      } else if (postType === 'stop') {
        reactionData.post_stop_id = postId;
      }
  
      const { data: existingReaction, error: fetchError } = await supabase
        .from('post_reactions')
        .select('id')
        .eq(postType === 'hub' ? 'post_hub_id' : 'post_stop_id', postId)
        .eq('user_id', userSession.session.user.id)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing reaction:', fetchError.message);
        Alert.alert('Error', 'Failed to check existing reaction.');
        return;
      }
  
      if (existingReaction) {
        const { error: updateError } = await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id);
  
        if (updateError) {
          console.error('Error updating existing reaction:', updateError.message);
          Alert.alert('Error', 'Failed to update existing reaction.');
        }
      } else {
        const { error: insertError } = await supabase
          .from('post_reactions')
          .insert(reactionData);
  
        if (insertError) {
          console.error('Error inserting new reaction:', insertError.message);
          Alert.alert('Error', 'Failed to insert new reaction.');
        }
      }
  
      fetchPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to react to the post.');
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

    const findRoute = async () => {
    if (!fromLocation || !toLocation) return;
    
    setSearchingRoute(true);
    try {
      // Find matching routes from database
      const { data: matchingRoutes, error } = await supabase
        .from('routes')
        .select('*')
        .ilike('start_point', `%${fromLocation.display_name.split(',')[0]}%`)
        .ilike('end_point', `%${toLocation.display_name.split(',')[0]}%`);

      if (matchingRoutes && matchingRoutes.length > 0) {
        // Generate route instructions based on found routes
        const instructions = generateRouteInstructions(fromLocation, toLocation, matchingRoutes);
        setRouteInstructions(instructions);
      } else {
        // Generate general instructions if no exact routes found
        const generalInstructions = generateGeneralInstructions(fromLocation, toLocation);
        setRouteInstructions(generalInstructions);
      }
    } catch (error) {
      console.error('Error finding route:', error);
    }
    setSearchingRoute(false);
  };

  const generateRouteInstructions = (from: Location, to: Location, routes: Route[]) => {
    const bestRoute = routes[0]; // Use first matching route
    return {
      fromLocation: from.display_name.split(',')[0],
      toLocation: to.display_name.split(',')[0],
      totalDuration: '45-60 min',
      totalCost: bestRoute.cost,
      steps: [
        {
          instruction: `Walk to the nearest ${bestRoute.transport_type} stop`,
          transport_type: 'Walking',
          duration: '5-10 min',
        },
        {
          instruction: `Take ${bestRoute.name} from ${bestRoute.start_point} to ${bestRoute.end_point}`,
          transport_type: bestRoute.transport_type,
          duration: '30-45 min',
          cost: bestRoute.cost,
        },
        {
          instruction: `Walk to your destination`,
          transport_type: 'Walking',
          duration: '5-10 min',
        },
      ],
    };
  };

  const generateGeneralInstructions = (from: Location, to: Location) => {
    return {
      fromLocation: from.display_name.split(',')[0],
      toLocation: to.display_name.split(',')[0],
      totalDuration: '60-90 min',
      totalCost: 25,
      steps: [
        {
          instruction: 'Walk to the nearest taxi rank or bus stop',
          transport_type: 'Walking',
          duration: '10-15 min',
        },
        {
          instruction: 'Take a taxi or bus towards your destination area',
          transport_type: 'Taxi/Bus',
          duration: '40-60 min',
          cost: 20,
        },
        {
          instruction: 'Transfer to local transport if needed',
          transport_type: 'Local Transport',
          duration: '10-15 min',
          cost: 5,
        },
        {
          instruction: 'Walk to your final destination',
          transport_type: 'Walking',
          duration: '5-10 min',
        },
      ],
    };
  };


  const handlePostPress = async (post) => {
    if (post.type === 'hub') {
      router.push({
        pathname: '/hub-post-details',
        params: { 
          postId: post.id,
          commentCount: post.commentCount || 0 
        }
      });
    } else if (post.type === 'stop') {
      router.push({
        pathname: '/stop-post-details',
        params: { 
          postId: post.id,
          commentCount: post.commentCount || 0 
        }
      });
    }
  };

const renderReactionOptions = (postId) => (
  <View style={styles.reactionOptions}>
    <Pressable onPress={() => handleReactionSelect('like', postId)}>
      <ThumbsUp size={24} color={colors.text} />
    </Pressable>
    <Pressable onPress={() => handleReactionSelect('love', postId)}>
      <Heart size={24} color={colors.text} />
    </Pressable>
    <Pressable onPress={() => handleReactionSelect('laugh', postId)}>
      <Smile size={24} color={colors.text} />
    </Pressable>
    <Pressable onPress={() => handleReactionSelect('sad', postId)}>
      <Frown size={24} color={colors.text} />
    </Pressable>
    <Pressable onPress={() => handleReactionSelect('angry', postId)}>
      <AlertTriangle size={24} color={colors.text} />
    </Pressable>
  </View>
);

  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} style={[styles.postContainer, { backgroundColor: colors.card }]}>
          <View style={styles.postTypeIndicator}>
      {item.type === 'hub' ? (
        <MapPin size={20} color={colors.primary} />
      ) : item.type === 'stop' ? (
        <Flag size={20} color={colors.primary} />
      ) : (
        <Route size={20} color={colors.primary} />
      )}
    </View>
      
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
        <Pressable onPress={() => router.push(`/hub-details?hubId=${item.hubs?.id}`)}>
          <Text style={[styles.hubName, { color: colors.primary }]}>
            Hub: {item.hubs?.name || 'Unknown Hub'}
          </Text>
        </Pressable>
      )}
      {item.type === 'stop' && (
        <View>
          <Pressable onPress={() => router.push(`/stop-details?stopId=${item.stops?.id}`)}>
            <Text style={[styles.stopName, { color: colors.primary }]}>
              Stop: {item.stops?.name || 'Unknown Stop'}
            </Text>
          </Pressable>
          <Text style={[styles.routeName, { color: colors.primary }]}>
            Related Route: {item.stops?.routes?.name || 'Unknown Route'}
          </Text>
        </View>
      )}
      
      <View style={styles.postFooter}>
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            onPress={() => handleReactionPress(item.id)} 
            style={styles.reactionButton}
          >
          <Smile size={24} color={colors.text} />
          </TouchableOpacity>
          {showReactions[item.id] && renderReactionOptions(item.id)}
        </View>
        
        <TouchableOpacity 
          onPress={() => handlePostPress(item)}
          style={styles.commentCounter}
        >
          <MessageCircle size={20} color={colors.text} />
          <Text style={[styles.commentCountText, { color: colors.text }]}>
            {item.commentCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      

       {/* Search Form */}
      <View style={styles.searchCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>From</Text>
          <LocationAutocomplete
            placeholder="Your current location"
            value={fromText}
            onChangeText={setFromText}
            onLocationSelect={setFromLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>To</Text>
          <LocationAutocomplete
            placeholder="Your destination"
            value={toText}
            onChangeText={setToText}
            onLocationSelect={setToLocation}
          />
        </View>

        <TouchableOpacity 
          style={[styles.searchButton, (!fromLocation || !toLocation) && styles.searchButtonDisabled]}
          onPress={findRoute}
          disabled={!fromLocation || !toLocation || searchingRoute}
        >
          <Search size={20} color="#ffffff" style={styles.searchIcon} />
          <Text style={styles.searchButtonText}>
            {searchingRoute ? 'Finding Route...' : 'Find Route'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...hubPosts, ...stopPosts]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        ListEmptyComponent={
          isPostsLoading ? (
            <>
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
              <PostSkeleton colors={colors} />
            </>
          ) : (
            <View style={styles.noPostsContainer}>
              <Text style={[styles.noPostsText, { color: colors.text }]}>
                No posts available.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      />

      <Modal
        visible={reactionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a Reaction</Text>
            {renderReactionOptions(selectedPostId)}
            <Pressable onPress={() => setReactionModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  hubName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  routeName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noPostsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  reactionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  reactionButton: {
    padding: 5,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  searchCard: {
    borderRadius: 16,
    paddingBottom: 20,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  searchButtonDisabled: {
  },
  searchButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  skeletonHeaderContent: {
    flex: 1,
    gap: 8,
  },
  skeletonText: {
    height: 12,
    borderRadius: 4,
    marginVertical: 4,
  },
  postTypeIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  skeletonContent: {
    marginVertical: 12,
    gap: 8,
  },
  skeletonAction: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  commentCountText: {
    marginLeft: 5,
    fontSize: 14,
  },
});