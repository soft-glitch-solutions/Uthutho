import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Heart, Search, MapPin, Flag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [suggestedHubs, setSuggestedHubs] = useState([]);
  const [suggestedStops, setSuggestedStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const { width } = useWindowDimensions();
  const cardWidth = width / 2 - 16;

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocationError('Unable to fetch location');
      }
    };

    fetchUserLocation();
  }, []);

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

  useEffect(() => {
    const fetchSuggestedLocations = async () => {
      if (!userLocation) return;

      try {
        const { data: hubs } = await supabase.from('hubs').select('*');
        const { data: stops } = await supabase.from('stops').select('*');

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
          const toRadians = (degrees) => (degrees * Math.PI) / 180;
          const R = 6371;
          const dLat = toRadians(lat2 - lat1);
          const dLon = toRadians(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
              Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c * 1000;
        };

        const hubsWithDistance = hubs.map((hub) => ({
          ...hub,
          type: 'hub',
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            hub.latitude,
            hub.longitude
          ),
        }));

        const stopsWithDistance = stops.map((stop) => ({
          ...stop,
          type: 'stop',
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            stop.latitude,
            stop.longitude
          ),
        }));

        const sortedHubs = hubsWithDistance.sort((a, b) => a.distance - b.distance);
        const sortedStops = stopsWithDistance.sort((a, b) => a.distance - b.distance);

        setSuggestedHubs(sortedHubs.slice(0, 2));
        setSuggestedStops(sortedStops.slice(0, 2));
      } catch (error) {
        console.error('Error fetching suggested locations:', error);
      }
    };

    fetchSuggestedLocations();
  }, [userLocation]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data: hubs } = await supabase
        .from('hubs')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      const { data: stops } = await supabase
        .from('stops')
        .select('*')
        .ilike('name', `%${searchQuery}%`);

      const combinedResults = [
        ...(hubs ? hubs.map((hub) => ({ ...hub, type: 'hub' })) : []),
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
      } else {
        updatedFavorites = [...userFavorites, item.id];
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
    if (item.type === 'hub') {
      router.push(`/hub-details?hubId=${item.id}`);
    } else if (item.type === 'stop') {
      router.push(`/stop-details?stopId=${item.id}`);
    }
  };

  const renderItem = ({ item }) => {
    const isFavorited = userFavorites.includes(item.id);

    return (
      <Pressable onPress={() => handleItemPress(item)}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          {item.type === 'hub' ? (
            <MapPin size={24} color={colors.primary} style={styles.icon} />
          ) : (
            <Flag size={24} color={colors.primary} style={styles.icon} />
          )}
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.cardType, { color: colors.primary }]}>
            {item.type.toUpperCase()}
          </Text>
          {item.distance && (
            <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
              {item.distance.toFixed(0)} meters away
            </Text>
          )}
          <Pressable
            onPress={() => toggleFavorite(item)}
            style={styles.favoriteButton}
          >
            <Heart
              size={24}
              color={isFavorited ? colors.primary : colors.text}
              fill={isFavorited ? colors.primary : 'transparent'}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { borderColor: colors.border }]}>
        <Search size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchBar, { color: colors.text }]}
          placeholder="Search hubs or stops"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      {!searchQuery ? (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Hubs</Text>
          <FlatList
            data={suggestedHubs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No hubs found near you
              </Text>
            }
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Stops</Text>
          <FlatList
            data={suggestedStops}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No stops found near you
              </Text>
            }
          />
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No results found for "{searchQuery}"
            </Text>
          }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  icon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 12,
    marginBottom: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  loader: {
    marginTop: 40,
  },
});