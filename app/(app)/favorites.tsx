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
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
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
  const cardWidth = width / 2 - 16; // 3 columns with 8px gap on each side

  // Fetch user location
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

  // Fetch user favorites
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

  // Fetch suggested hubs and stops
  useEffect(() => {
    const fetchSuggestedLocations = async () => {
      if (!userLocation) return;

      try {
        const { data: hubs } = await supabase.from('hubs').select('*');
        const { data: stops } = await supabase.from('stops').select('*');

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
          const toRadians = (degrees) => (degrees * Math.PI) / 180;
          const R = 6371; // Earth's radius in km
          const dLat = toRadians(lat2 - lat1);
          const dLon = toRadians(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
              Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c * 1000; // Distance in meters
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
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.cardType, { color: colors.primary }]}>
            {item.type.toUpperCase()}
          </Text>
          <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
            {item.distance.toFixed(0)} meters away
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

      {!searchQuery && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Hubs</Text>
          <View style={styles.grid}>
            {suggestedHubs.map((hub) => (
              <Pressable
                key={hub.id}
                onPress={() => handleItemPress({ ...hub, type: 'hub' })}
              >
                <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{hub.name}</Text>
                  <Text style={[styles.cardType, { color: colors.primary }]}>HUB</Text>
                  <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                    {hub.distance.toFixed(0)} meters away
                  </Text>
                  <Pressable
                    onPress={() => toggleFavorite(hub)}
                    style={styles.favoriteButton}
                  >
                    <Ionicons
                      name={userFavorites.includes(hub.id) ? 'heart' : 'heart-outline'}
                      size={24}
                      color={userFavorites.includes(hub.id) ? colors.primary : colors.text}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Suggested Stops</Text>
          <View style={styles.grid}>
            {suggestedStops.map((stop) => (
              <Pressable
                key={stop.id}
                onPress={() => handleItemPress({ ...stop, type: 'stop' })}
              >
                <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{stop.name}</Text>
                  <Text style={[styles.cardType, { color: colors.primary }]}>STOP</Text>
                  <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                    {stop.distance.toFixed(0)} meters away
                  </Text>
                  <Pressable
                    onPress={() => toggleFavorite(stop)}
                    style={styles.favoriteButton}
                  >
                    <Ionicons
                      name={userFavorites.includes(stop.id) ? 'heart' : 'heart-outline'}
                      size={24}
                      color={userFavorites.includes(stop.id) ? colors.primary : colors.text}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {searchQuery && (
        loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.grid}
          />
        )
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
  distanceText: {
    fontSize: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});