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
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users } from 'lucide-react-native';
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

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={[styles.headerTitle, styles.skeleton, { width: 200, height: 24 }]} />
        <View style={[styles.backButton, styles.skeleton, { opacity: 0 }]} />
      </View>

      {/* Current User Skeleton */}
      <View style={styles.currentUserSection}>
        <View style={[styles.currentUserCard, styles.skeleton, { height: 80 }]} />
      </View>

      {/* Leaderboard Skeleton */}
      <View style={styles.leaderboardSection}>
        <View style={[styles.sectionTitle, styles.skeleton, { width: 180, height: 24, marginBottom: 20 }]} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.leaderboardItem, styles.skeleton, { height: 70 }]} />
        ))}
      </View>
    </ScrollView>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('points', 'is', null)
        .order('points', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      const rankedUsers: LeaderboardUser[] = (profiles || []).map((profile, index) => ({
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
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
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

  const getDisplayUsers = () => {
    if (!users.length) return [];
    
    const currentUser = users.find(u => u.isCurrentUser);
    const topUsers = users.slice(0, 10); // Show top 10
    
    // If current user is not in top 10, add them at the end
    if (currentUser && !topUsers.find(u => u.isCurrentUser)) {
      return [...topUsers, currentUser];
    }
    
    return topUsers;
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const displayUsers = getDisplayUsers();
  const currentUser = users.find(u => u.isCurrentUser);

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
          <Trophy size={24} color="#FFD700" />
          <Text style={styles.headerTitleText}>Leaderboard</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Current User Card */}
      {currentUser && (
        <View style={styles.currentUserSection}>
          <Text style={styles.sectionTitle}>Your Position</Text>
          <View style={[styles.leaderboardItem, styles.currentUserHighlight]}>
            <View style={styles.rankContainer}>
              <View style={[
                styles.rankBadge,
                { backgroundColor: getRankBadge(currentUser.rank).color + '20' }
              ]}>
                {getRankBadge(currentUser.rank).icon}
                <Text style={[
                  styles.rankText,
                  { color: getRankBadge(currentUser.rank).color }
                ]}>
                  {getRankBadge(currentUser.rank).label}
                </Text>
              </View>
            </View>

            <View style={styles.userInfo}>
              {currentUser.avatar_url ? (
                <Image 
                  source={{ uri: currentUser.avatar_url }}
                  style={styles.userAvatar}
                />
              ) : (
                <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                  </Text>
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {currentUser.first_name} {currentUser.last_name}
                </Text>
                <Text style={styles.userTitle}>
                  {currentUser.selected_title || 'Newbie Explorer'}
                </Text>
              </View>
            </View>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsNumber}>{currentUser.points}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Users Leaderboard */}
      <View style={styles.leaderboardSection}>
        <Text style={styles.sectionTitle}>Top Travelers</Text>
        
        {displayUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#666" />
            <Text style={styles.emptyStateText}>No users yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to earn points and climb the leaderboard!
            </Text>
          </View>
        ) : (
          displayUsers.map((user, index) => (
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
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
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