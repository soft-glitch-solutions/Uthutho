import React from 'react';
import { View, Text, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Flag, Route, BookmarkCheck, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import FavoritesSkeleton from './skeletons/FavoritesSkeleton';

interface FavoriteItem {
  id: string;
  name: string;
  type: 'stop' | 'route' | 'hub';
  distance?: string;
}

interface FavoritesSectionProps {
  isProfileLoading: boolean;
  favorites: FavoriteItem[];
  favoriteDetails: any[];
  colors: any;
  toggleFavorite: (item: FavoriteItem) => void;
  favoritesCountMap: Record<string, number>;
}

const FavoritesSection = ({
  isProfileLoading,
  favorites,
  favoriteDetails,
  colors,
  toggleFavorite,
  favoritesCountMap
}: FavoritesSectionProps) => {
  const router = useRouter();

  if (isProfileLoading) {
    return <FavoritesSkeleton colors={colors} />;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Favorites</Text>
      
      {favorites.length > 0 ? (
        <View style={styles.grid}>
          {favorites.map((favorite, index) => {
            const details = favoriteDetails.find(d => d.id === favorite.id) || {};
            
            return (
              <Pressable
                key={`${favorite.id}-${index}`}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => {
                  if (details.type === 'hub') {
                    router.push(`/hub-details?hubId=${details.id}`);
                  } else if (details.type === 'stop') {
                    router.push(`/stop-details?stopId=${details.id}`);
                  } else if (details.type === 'route') {
                    router.push(`/route-details?routeId=${details.id}`);
                  } else {
                    Alert.alert('Info', `Favorite: ${favorite.name}`);
                  }
                }}
              >
                <View style={styles.favoriteItem}>
                  {details.type === 'hub' && <MapPin size={24} color={colors.primary} />}
                  {details.type === 'stop' && <Flag size={24} color={colors.primary} />}
                  {details.type === 'route' && <Route size={24} color={colors.primary} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardText, { color: colors.text }]}>
                      {favorite.name}
                    </Text>
                    {favorite.distance && (
                      <Text style={[styles.distanceText, { color: colors.text }]}>
                        {favorite.distance} away
                      </Text>
                    )}
                    {/* Followers pill */}
                    {details.id && (
                      <View style={{
                        marginTop: 6,
                        alignSelf: 'flex-start',
                        backgroundColor: '#1ea2b120',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ color: '#1ea2b1', fontSize: 12 }}>
                          Followers: {favoritesCountMap[details.id] || 0}
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* show bookmarked status */}
                  <BookmarkCheck size={20} color={colors.primary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyFavoritesContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No favorites added yet.</Text>
          <Pressable
            onPress={() => router.push('/favorites')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = {
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
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
  },
  cardText: {
    fontSize: 14,
  },
  distanceText: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  emptyFavoritesContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
    marginTop: 10,
  },
  favoriteItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  addButton: {
    padding: 8,
  },
};

export default FavoritesSection;