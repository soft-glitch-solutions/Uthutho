import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Bookmark, BookmarkCheck, Users } from "lucide-react-native";
import { useAuth } from '@/hook/useAuth';
import { useFavorites } from '@/hook/useFavorites';

interface HubFollowButtonProps {
  hubId: string;
  hubName: string;
  colors: {
    text: string;
    background: string;
  };
}

const HubFollowButton = ({ hubId, hubName, colors }: HubFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite, favorites } = useFavorites();

  useEffect(() => {
    if (hubId) {
      checkIfFollowing();
      loadFollowerCount();
    }
  }, [hubId]);

  // Add this useEffect to watch for changes in favorites
  useEffect(() => {
    if (hubId) {
      checkIfFollowing();
    }
  }, [favorites, hubId]);

  const loadFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'hub')
        .eq('entity_id', hubId);

      if (!error) {
        setFollowerCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading follower count:', error);
    }
  };

  const checkIfFollowing = async () => {
    try {
      if (!user) {
        setIsFollowing(false);
        return;
      }
      
      // Use the isFavorite function from useFavorites hook
      const isHubFavorite = isFavorite(hubId);
      setIsFollowing(isHubFavorite);

      // Also check in the database to ensure consistency
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('entity_type', 'hub')
        .eq('entity_id', hubId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      // If there's a discrepancy between local state and database, sync them
      const isInDatabase = !!data;
      if (isInDatabase !== isHubFavorite) {
        setIsFollowing(isInDatabase);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    try {
      if (!user) {
        Alert.alert('Login Required', 'Please login to follow hubs.');
        return;
      }

      const entityType = 'hub';
      const entityId = hubId;
      const isCurrentlyFollowing = isFollowing;
      const delta = isCurrentlyFollowing ? -1 : 1;

      // Optimistic UI update
      setIsFollowing(!isCurrentlyFollowing);
      setFollowerCount(prev => Math.max(0, prev + delta));

      try {
        if (isCurrentlyFollowing) {
          const { error: favErr } = await supabase.rpc('remove_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          await removeFromFavorites(entityId);
        } else {
          const { error: favErr } = await supabase.rpc('add_favorite', {
            p_user_id: user.id,
            p_entity_type: entityType,
            p_entity_id: entityId,
          });
          if (favErr) throw favErr;

          await addToFavorites({ 
            id: entityId, 
            type: entityType, 
            name: hubName, 
            data: { id: hubId, name: hubName } 
          });
        }
      } catch (e) {
        // Revert optimistic change on error
        setIsFollowing(isCurrentlyFollowing);
        setFollowerCount(prev => Math.max(0, prev - delta));
        console.error('Follow toggle failed:', e);
        Alert.alert('Error', 'Could not update follow status. Please try again.');
      }
    } catch (error) {
      console.error('Error in toggleFollow:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button, 
          isFollowing 
            ? { backgroundColor: '#1ea2b1' } 
            : { backgroundColor: '#10b981' }
        ]}
        onPress={toggleFollow}
      >
        {isFollowing ? (
          <BookmarkCheck size={18} color="white" />
        ) : (
          <Bookmark size={18} color="white" />
        )}
        
        <Text style={styles.buttonText}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
        

      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  followerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HubFollowButton;