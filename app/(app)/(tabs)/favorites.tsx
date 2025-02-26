import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Animated } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../../lib/supabase';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Search hubs, routes, and stops
      const { data: hubs } = await supabase
        .from('hubs')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      const { data: routes } = await supabase
        .from('routes')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      setSearchResults([...hubs, ...routes, ...stops]);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (item) => {
    try {
      // Add item to favorites
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: (await supabase.auth.getSession()).data.session?.user.id, item_id: item.id, item_type: item.type }]);

      if (error) throw error;
      alert('Added to favorites!');
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
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
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Pressable onPress={() => addToFavorites(item)}>
                <Text style={[styles.addButton, { color: colors.primary }]}>Add to Favorites</Text>
              </Pressable>
            </View>
          )}
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
    padding: 8,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: '48%',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
  },
}); 