import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { PlusCircle, Heart } from 'lucide-react-native'; // Icons
import { supabase } from '../../../lib/supabase'; // Adjust the path
import { useRouter } from 'expo-router'; // Use useRouter for navigation

export default function RoutesScreen() {
  const { colors } = useTheme();
  const router = useRouter(); // Initialize the router
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFavorites, setUserFavorites] = useState([]);
  const [userSession, setUserSession] = useState(null);

  // Fetch routes from Supabase
  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch the current user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
    };

    fetchSession();
  }, []);

  // Fetch the user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      const userId = userSession?.user?.id;
      if (!userId) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('favorites')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUserFavorites(profile.favorites || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, [userSession]);

  // Initial data fetch
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoutes();
  };

  // Add or remove a route from favorites
  const handleFavorite = async (routeName) => {
    const userId = userSession?.user?.id;
    if (!userId) return;

    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      let updatedFavorites;
      if (profile.favorites.includes(routeName)) {
        updatedFavorites = profile.favorites.filter((favorite) => favorite !== routeName);
        alert('Route removed from favorites!');
      } else {
        updatedFavorites = [...profile.favorites, routeName];
        alert('Route added to favorites!');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorites: updatedFavorites })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUserFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Filter routes based on search query
  const filteredRoutes = routes.filter((route) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>Routes</Text>
        <TouchableOpacity
          style={[styles.addButton , { backgroundColor: colors.primary }]}
          onPress={() => router.push('/AddRoutes')}
        >
          <PlusCircle size={24} color={colors.text} />
          <Text style={[styles.addButtonText , { color: colors.text }]}>Add Route</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TextInput
        style={[styles.searchBar, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Search routes..."
        placeholderTextColor={colors.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={[styles.routeCard, { backgroundColor: colors.card }]}>
              <View style={[styles.skeletonText, { backgroundColor: colors.background }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '70%' }]} />
              <View style={[styles.skeletonText, { backgroundColor: colors.background, width: '50%' }]} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[styles.routeCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/route-details?routeId=${route.id}`)} // Navigate to RouteDetails
            >
              <Text style={[styles.routeName, { color: colors.text }]}>{route.name}</Text>
              <View style={styles.routeDetails}>
                <Text style={[styles.routeDetail, { color: colors.text }]}>
                  From: {route.start_point}
                </Text>
                <Text style={[styles.routeDetail, { color: colors.text }]}>
                  To: {route.end_point}
                </Text>
              </View>
              <View style={styles.routeFooter}>
                <Text style={[styles.routeType, { color: colors.text }]}>
                  {route.transport_type}
                </Text>
                <Text style={[styles.routeCost, { color: colors.text }]}>
                  R{route.cost}
                </Text>
              </View>
              {/* Heart Icon */}
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleFavorite(route.name)}
              >
                <Heart
                  size={20}
                  color={colors.primary}
                  fill={userFavorites.includes(route.name) ? colors.primary : 'transparent'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  searchBar: {
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  grid: {
    gap: 20,
  },
  routeCard: {
    borderRadius: 15,
    padding: 15,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  routeDetails: {
    gap: 5,
    marginBottom: 10,
  },
  routeDetail: {
    fontSize: 14,
  },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeType: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
});