import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Bus, Clock, Plus, Heart } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

// Shimmer component for loading state
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

// Skeleton component for loading state
const HubDetailsSkeleton = ({ colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Shimmer colors={colors}>
        <View style={[styles.imageSkeleton, { backgroundColor: colors.card }]} />
      </Shimmer>
      <View style={styles.content}>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '60%', backgroundColor: colors.card }]} />
        </Shimmer>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '80%', backgroundColor: colors.card }]} />
        </Shimmer>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '40%', backgroundColor: colors.card }]} />
        </Shimmer>
      </View>
    </View>
  );
};

// ChatBox Component
const ChatBox = ({ onPost, colors }) => {
  const [postContent, setPostContent] = useState('');

  const handlePost = () => {
    if (postContent.trim()) {
      onPost(postContent);
      setPostContent('');
    }
  };

  return (
    <View style={[styles.chatBoxContainer, { backgroundColor: colors.card }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        placeholder="Write your post..."
        placeholderTextColor={colors.text}
        value={postContent}
        onChangeText={setPostContent}
        multiline
      />
      <TouchableOpacity
        style={[styles.postButton, { backgroundColor: colors.primary }]}
        onPress={handlePost}
      >
        <Text style={[styles.postButtonText, { color: colors.text }]}>Post</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main HubDetailsScreen component
export default function HubDetailsScreen() {
  const { hubId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('EkSe Wall'); // State to manage active tab
  const [hub, setHub] = useState(null); // State to manage hub details
  const [loading, setLoading] = useState(true); // State to manage loading state
  const { colors } = useTheme(); // Get theme colors

  // Fetch hub details
  useEffect(() => {
    const fetchHubDetails = async () => {
      try {
        const { data: hubData, error: hubError } = await supabase
          .from('hubs')
          .select('*')
          .eq('id', hubId)
          .single();

        if (hubError) throw hubError;
        setHub(hubData);
      } catch (error) {
        console.error('Error fetching hub details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHubDetails();
  }, [hubId]);

  const openMap = () => {
    if (!hub) return; // Guard clause to prevent errors
    const lat = hub.latitude;
    const long = hub.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    Linking.openURL(url).catch((err) => console.error('Error opening map:', err));
  };

  if (loading) {
    return <HubDetailsSkeleton colors={colors} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hub Image, Name, and Address */}
      <Image
        source={{ uri: hub?.image }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
      <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: colors.text }]}>{hub?.name}</Text>
      <TouchableOpacity onPress={openMap}>
        <MapPin size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
        <View style={styles.infoRow}>
          <MapPin size={20} color={colors.text} />
          <Text style={[styles.address, { color: colors.text }]}>{hub?.address}</Text>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'EkSe Wall' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('EkSe Wall')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'EkSe Wall' && styles.activeTabText,
                { color: colors.text },
              ]}
            >
              EkSe Wall
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Route Info' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('Route Info')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Route Info' && styles.activeTabText,
                { color: colors.text },
              ]}
            >
              Route Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Render Active Tab */}
        {activeTab === 'EkSe Wall' ? (
          <EkSeWall hubId={hubId} hub={hub} colors={colors} />
        ) : (
          <RouteInfo hubId={hubId} hub={hub} colors={colors} />
        )}
      </View>
    </View>
  );
}

// EkSe Wall Tab
function EkSeWall({ hubId, hub, colors }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [hubId]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('hub_posts')
        .select('*, profiles(first_name, last_name, avatar_url, selected_title)')
        .eq('hub_id', hubId);

      if (postsError) throw postsError;
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now.getTime() - postDate.getTime();
    const [hub, setHub] = useState(null);

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const handlePost = async (content) => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    try {
      const { data: postData, error: postError } = await supabase
        .from('hub_posts')
        .insert([{ hub_id: hubId, user_id: userId, content }])
        .select();

      if (postError) throw postError;

      setPosts([...posts, postData[0]]);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) {
    return <HubDetailsSkeleton colors={colors} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            No posts yet. Be the first to post and earn 1 point!
          </Text>
          <TouchableOpacity
            style={[styles.firstPostButton, { backgroundColor: colors.primary }]}
            onPress={() => handlePost('First post!')}
          >
            <Text style={[styles.firstPostButtonText, { color: colors.text }]}>
              Be the first to post
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={[styles.postContainer, { backgroundColor: colors.card }]}>
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
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
          </View>

          {/* Post Content */}
          <Text style={[styles.postContent, { color: colors.text }]}>
            {post.content}
          </Text>

          {/* Post Footer */}
          <View style={styles.postFooter}>
            <Text style={[styles.postDate, { color: colors.text }]}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
            <Heart size={20} color={colors.text} />
          </View>
        </View>
        ))
      )}

      {/* Chat Box for creating posts */}
      <ChatBox onPost={handlePost} colors={colors} />
    </ScrollView>
  );
}

// Route Info Tab
function RouteInfo({ hubId, hub, colors }) {
  const router = useRouter();
  const [relatedRoutes, setRelatedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    fetchRelatedRoutes();
  }, [hubId]);

  const fetchRelatedRoutes = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('*')
        .eq('hub_id', hubId);

      if (routesError) throw routesError;
      setRelatedRoutes(routesData);
    } catch (error) {
      console.error('Error fetching related routes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HubDetailsSkeleton colors={colors} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}      contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>

      <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Routes</Text>
          <Pressable onPress={() => router.push('/AddRoute')} style={styles.addButton}>
            <Plus size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search related routes..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {relatedRoutes.map((route) => (
          <Pressable
            key={route.id}
            style={[styles.routeItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/route-details?routeId=${route.id}`)}
          >
            <Bus size={20} color={colors.text} />
            <View style={styles.routeInfo}>
              <Text style={[styles.routeName, { color: colors.text }]}>
                {route.name}
              </Text>
              <Text style={[styles.routeDetails, { color: colors.text }]}>
                {route.start_point} → {route.end_point}
              </Text>
            </View>
            <Text style={[styles.routePrice, { color: colors.primary }]}>
              R{route.cost}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
  },
  scrollContent: {
    flexGrow: 1, // Ensure the content can scroll
  },
  content: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 20,
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
    selectedTitle: {
      fontSize: 14,
      marginTop: 2,
    },
    postTime: {
      fontSize: 12,
      opacity: 0.8,
    },
    postContent: {
      fontSize: 16,
      marginBottom: 10,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    postDate: {
      fontSize: 14,
      opacity: 0.8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    emptyStateText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    firstPostButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    firstPostButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  tabButton: {
    padding: 10,
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  firstPostButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  firstPostButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addButton: {
    padding: 5,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  postCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 14,
    opacity: 0.8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 15,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  routePrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatBoxContainer: {
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    minHeight: 50,
  },
  postButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  postButtonText: {
    fontWeight: 'bold',
  },
});