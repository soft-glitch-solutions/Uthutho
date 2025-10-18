import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface LeaderboardUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  points: number;
  selected_title: string | null;
  rank: number;
  isCurrentUser?: boolean;
}

export default function FilteredLeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const entityId = params.entityId as string;
  const entityType = params.entityType as 'hub' | 'stop';
  const entityName = params.name as string;

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (entityId && entityType) {
      loadFilteredLeaderboard();
    }
  }, [entityId, entityType]);

  const loadFilteredLeaderboard = async () => {
    try {
      setLoading(true);
      
      // First, get all users who have this entity as favorite
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, favorites');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        return;
      }

      // Filter users who have this entity in their favorites
      const fanIds = (allProfiles || [])
        .filter(profile => {
          const favs = profile.favorites || [];
          return favs.some((fav: any) => fav.id === entityId && fav.type === entityType);
        })
        .map(profile => profile.id);

      setFollowerCount(fanIds.length);

      if (fanIds.length === 0) {
        setUsers([]);
        setCurrentUserRank(null);
        return;
      }

      // Get the complete profiles of these fans with their points, ordered by points
      const { data: fanProfiles, error: fansError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', fanIds)
        .not('points', 'is', null)
        .order('points', { ascending: false });

      if (fansError) {
        console.error('Error loading fan profiles:', fansError);
        return;
      }

      const rankedUsers: LeaderboardUser[] = (fanProfiles || []).map((profile, index) => ({
        ...profile,
        rank: index + 1,
        points: profile.points || 0,
        isCurrentUser: profile.id === user?.id,
      }));

      setUsers(rankedUsers);

      // Find current user's rank
      if (user) {
        const currentUserIndex = rankedUsers.findIndex(u => u.id === user.id);
        setCurrentUserRank(currentUserIndex >= 0 ? currentUserIndex + 1 : null);
      }
    } catch (error) {
      console.error('Error loading filtered leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFilteredLeaderboard();
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: <Crown size={20} color="#FFD700" />, color: '#FFD700', label: '1st' };
      case 2:
        return { icon: <Trophy size={18} color="#C0C0C0" />, color: '#C0C0C0', label: '2nd' };
      case 3:
        return { icon: <Medal size={18} color="#CD7F32" />, color: '#CD7F32', label: '3rd' };
      default:
        return { icon: <Star size={16} color="#666" />, color: '#666', label: `${rank}` };
    }
  };

  const clearFilter = () => {
    router.push('/leaderboard');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Trophy size={24} color="#FFD700" />
            <Text style={styles.headerTitleText}>Loading...</Text>
          </View>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1ea2b1"
          colors={['#1ea2b1']}
        />
      }
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitleText}>Leaderboard</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
          <X size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Entity Info */}
      <View style={styles.entityInfo}>
        <MapPin size={16} color="#1ea2b1" />
        <Text style={styles.entityName}>{entityName}</Text>
      </View>

      {/* Current User Card */}
      {currentUserRank && (
        <View style={styles.currentUserSection}>
          <Text style={styles.sectionTitle}>Your Position</Text>
          <View style={[styles.leaderboardItem, styles.currentUserHighlight]}>
            <View style={styles.rankContainer}>
              <View style={[
                styles.rankBadge,
                { backgroundColor: getRankBadge(currentUserRank).color + '20' }
              ]}>
                {getRankBadge(currentUserRank).icon}
                <Text style={[
                  styles.rankText,
                  { color: getRankBadge(currentUserRank).color }
                ]}>
                  {getRankBadge(currentUserRank).label}
                </Text>
              </View>
            </View>

            <View style={styles.userInfo}>
              {users.find(u => u.isCurrentUser)?.avatar_url ? (
                <Image 
                  source={{ uri: users.find(u => u.isCurrentUser)?.avatar_url || '' }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {users.find(u => u.isCurrentUser)?.first_name?.[0]}{users.find(u => u.isCurrentUser)?.last_name?.[0]}
                  </Text>
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {users.find(u => u.isCurrentUser)?.first_name} {users.find(u => u.isCurrentUser)?.last_name}
                </Text>
                <Text style={styles.userTitle}>
                  {users.find(u => u.isCurrentUser)?.selected_title || 'Newbie Explorer'}
                </Text>
              </View>
            </View>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsNumber}>{users.find(u => u.isCurrentUser)?.points || 0}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Fans Leaderboard */}
      <View style={styles.leaderboardSection}>
        <Text style={styles.sectionTitle}>
          {users.length > 0 ? 'Top Fans' : 'No Fans Yet'}
        </Text>
        
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#666" />
            <Text style={styles.emptyStateText}>No fans yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to add this {entityType} to your favorites!
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View 
              key={user.id} 
              style={[
                styles.leaderboardItem,
                user.isCurrentUser && styles.currentUserInList
              ]}
            >
              <View style={styles.rankContainer}>
                <View style={[
                  styles.rankBadge,
                  { backgroundColor: getRankBadge(user.rank).color + '20' }
                ]}>
                  {getRankBadge(user.rank).icon}
                  <Text style={[
                    styles.rankText,
                    { color: getRankBadge(user.rank).color }
                  ]}>
                    {getRankBadge(user.rank).label}
                  </Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                {user.avatar_url ? (
                  <Image 
                    source={{ uri: user.avatar_url }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text style={styles.userTitle}>
                    {user.selected_title || 'Newbie Explorer'}
                  </Text>
                </View>
              </View>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsNumber}>{user.points}</Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  entityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  entityName: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  followerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  followerCountText: {
    color: '#666',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  currentUserSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  currentUserHighlight: {
    backgroundColor: '#1ea2b120',
    borderColor: '#1ea2b1',
    borderWidth: 2,
  },
  currentUserInList: {
    backgroundColor: '#1ea2b110',
    borderLeftWidth: 4,
    borderLeftColor: '#1ea2b1',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  leaderboardSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userTitle: {
    color: '#1ea2b1',
    fontSize: 11,
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  pointsLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  bottomSpace: {
    height: 20,
  },
});