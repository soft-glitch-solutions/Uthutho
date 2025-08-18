import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface FavoriteItem {
  id: string;
  type: 'route' | 'stop' | 'hub' | 'nearby_spot';
  name: string;
  data: any;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFavorites(data?.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (item: FavoriteItem) => {
    if (!user) return;

    const newFavorites = [...favorites, item];
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', user.id);

      if (error) throw error;

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (itemId: string) => {
    if (!user) return;

    const newFavorites = favorites.filter(fav => fav.id !== itemId);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', user.id);

      if (error) throw error;

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (itemId: string) => {
    return favorites.some(fav => fav.id === itemId);
  };

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refetch: fetchFavorites,
  };
}