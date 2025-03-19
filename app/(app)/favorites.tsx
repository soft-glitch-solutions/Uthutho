import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons'; // Import icons
import { useRouter } from 'expo-router'; // Import router for navigation

// Add the Shimmer component
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

// Add skeleton components
const SearchResultSkeleton = ({ colors }) => {
  return (
    <View style={styles.grid}>
      {[1, 2, 3].map((i) => (
        <Shimmer key={i} colors={colors}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '60%' }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border, width: '80%' }]} />
          </View>
        </Shimmer>
      ))}
    </View>
  );
};

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter(); // Initialize router
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const { width } = useWindowDimensions(); // Get screen width

  // Calculate card width based on screen size
  const cardWidth = width / 2 - 24; // 2 columns with 12px gap on each side

  useEffect(() => {
    const fetchFavorites = async () => {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('favorites')
          .eq('id', userId)
          .single();
        setUserFavorites(profile?.favorites || []);
      }
    };
    fetchFavorites();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Fetch hubs
      const { data: hubs } = await supabase
        .from('hubs')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      // Fetch routes
      const { data: routes } = await supabase
        .from('routes')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      // Fetch stops
      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      // Combine results into a single array
      const combinedResults = [
        ...(hubs ? hubs.map((hub) => ({ ...hub, type: 'hub' })) : []),
        ...(routes ? routes.map((route) => ({ ...route, type: 'route' })) : []),
        ...(stops ? stops.map((stop) => ({ ...stop, type: 'stop' })) : []),
      ];

      setSearchResults(combinedResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item) => {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    try {
      let updatedFavorites;
      if (userFavorites.includes(item.id)) {
        updatedFavorites = userFavorites.filter((favorite) => favorite !== item.id);
        alert('Removed from favorites!');
      } else {
        updatedFavorites = [...userFavorites, item.id];
        alert('Added to favorites!');
      }

      await supabase
        .from('profiles')
        .update({ favorites: updatedFavorites })
        .eq('id', userId);

      setUserFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const handleItemPress = (item) => {
    // Navigate to the respective details screen based on the item type
    if (item.type === 'hub') {
      router.push(`/hub-details?hubId=${item.id}`);
    } else if (item.type === 'route') {
      router.push(`/route-details?routeId=${item.id}`);
    } else if (item.type === 'stop') {
      router.push(`/stop-details?stopId=${item.id}`);
    }
  };

  const renderItem = ({ item }) => {
    const isFavorited = userFavorites.includes(item.id);

    // Get image URL (assuming images are stored in Supabase Storage)
    const imageUrl = item.image_url
      ? supabase.storage.from('your-bucket-name').getPublicUrl(item.image_url).data.publicUrl
      : null;

    return (
      <Pressable onPress={() => handleItemPress(item)}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          {/* Display image if available */}
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.cardType, { color: colors.primary }]}>
            {item.type.toUpperCase()}
          </Text>
          <Pressable
            onPress={() => toggleFavorite(item)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorited ? colors.primary : colors.text}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.searchBar, { borderColor: colors.border, color: colors.text }]}
        placeholder="Search hubs, routes, or stops"
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
      />
      {loading ? (
        <SearchResultSkeleton colors={colors} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2} // Display items in a grid
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper} // Add spacing between columns
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // Increased gap for better spacing
    justifyContent: 'space-between',
  },
  columnWrapper: {
    justifyContent: 'space-between', // Add spacing between columns
  },
  card: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  favoriteButton: {
    alignSelf: 'flex-end',
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
});