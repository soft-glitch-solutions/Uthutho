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
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users, X, Flame, Car, Heart } from 'lucide-react-native';
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
  reaction_count?: number;
  favorite_count?: number;
  driver_rating?: number;
  total_trips?: number;
}

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={styles.headerTitle}>
          <View style={[styles.skeleton, { width: 120, height: 24 }]} />
        </View>
        <View style={[styles.clearButton, styles.skeleton]} />
      </View>

      {/* Entity Info Skeleton */}
      <View style={[styles.entityInfo, { justifyContent: 'center' }]}>
        <View style={[styles.skeleton, { width: 200, height: 16 }]} />
      </View>

      {/* Tab Skeleton */}
      <View style={styles.tabContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={[styles.tab, styles.skeleton, { height: 40 }]} />
        ))}
      </View>

      {/* Current User Section Skeleton */}
      <View style={styles.currentUserSection}>
        <View style={[styles.skeleton, { width: 120, height: 20, marginBottom: 16 }]} />
        <View style={[styles.leaderboardItem, styles.skeleton, { height: 80 }]} />
      </View>

      {/* Leaderboard Section Skeleton */}
      <View style={styles.leaderboardSection}>
        <View style={[styles.skeleton, { width: 100, height: 20, marginBottom: 16 }]} />
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={[styles.leaderboardItem, styles.skeleton, { height: 70, marginBottom: 8 }]} />
        ))}
      </View>
    </View>
  );
};

export default function FilteredLeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const entityId = params.entityId as string;
  const entityType = params.entityType as 'hub' | 'stop';
  const entityName = params.name as string;

  const [activeTab, setActiveTab] = useState<'popular' | 'points' | 'drivers' | 'movers'>('points');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [popularUsers, setPopularUsers] = useState<LeaderboardUser[]>([]);
  const [pointsUsers, setPointsUsers] = useState<LeaderboardUser[]>([]);
  const [driverUsers, setDriverUsers] = useState<LeaderboardUser[]>([]);
  const [moverUsers, setMoverUsers] = useState<LeaderboardUser[]>([]);
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
        setPointsUsers([]);
        setPopularUsers([]);
        setDriverUsers([]);
        setMoverUsers([]);
        setCurrentUserRank(null);
        return;
      }

      // Get the complete profiles of these fans
      const { data: fanProfiles, error: fansError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', fanIds);

      if (fansError) {
        console.error('Error loading fan profiles:', fansError);
        return;
      }

      // Load additional data for different leaderboard types
      const { data: hubReactions, error: hubReactionsError } = await supabase
        .from('hub_posts')
        .select('user_id, post_reactions(count)')
        .in('user_id', fanIds);

      const { data: stopReactions, error: stopReactionsError } = await supabase
        .from('stop_posts')
        .select('user_id, post_reactions(count)')
        .in('user_id', fanIds);

      // Load drivers data
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('user_id, rating, total_trips')
        .eq('is_verified', true)
        .eq('is_active', true)
        .in('user_id', fanIds);

      // Process reaction counts
      const reactionCounts: { [key: string]: number } = {};
      
      hubReactions?.forEach(post => {
        const userId = post.user_id;
        const count = (post as any).post_reactions?.[0]?.count || 0;
        reactionCounts[userId] = (reactionCounts[userId] || 0) + count;
      });

      stopReactions?.forEach(post => {
        const userId = post.user_id;
        const count = (post as any).post_reactions?.[0]?.count || 0;
        reactionCounts[userId] = (reactionCounts[userId] || 0) + count;
      });

      // Process drivers data
      const driverRatings: { [key: string]: { rating: number; total_trips: number } } = {};
      driversData?.forEach(driver => {
        driverRatings[driver.user_id] = {
          rating: driver.rating || 0,
          total_trips: driver.total_trips || 0
        };
      });

      // Process points users
      const processedPointsUsers: LeaderboardUser[] = (fanProfiles || [])
        .filter(profile => (profile.points || 0) > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          points: profile.points || 0,
          isCurrentUser: profile.id === user?.id,
        }));

      // Process popular users (reaction-based)
      const processedPopularUsers: LeaderboardUser[] = (fanProfiles || [])
        .map(profile => ({
          ...profile,
          reaction_count: reactionCounts[profile.id] || 0,
          points: profile.points || 0,
        }))
        .sort((a, b) => (b.reaction_count || 0) - (a.reaction_count || 0))
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          isCurrentUser: profile.id === user?.id,
        }));

      // Process driver users
      const processedDriverUsers: LeaderboardUser[] = (fanProfiles || [])
        .filter(profile => driverRatings[profile.id])
        .map(profile => ({
          ...profile,
          driver_rating: driverRatings[profile.id]?.rating || 0,
          total_trips: driverRatings[profile.id]?.total_trips || 0,
          points: profile.points || 0,
        }))
        .sort((a, b) => (b.driver_rating || 0) - (a.driver_rating || 0))
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          isCurrentUser: profile.id === user?.id,
        }));

      // Process mover users (using favorites_count from profiles)
      const processedMoverUsers: LeaderboardUser[] = (fanProfiles || [])
        .map(profile => ({
          ...profile,
          favorite_count: profile.favorites_count || 0,
          points: profile.points || 0,
        }))
        .sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0))
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          isCurrentUser: profile.id === user?.id,
        }));

      setPointsUsers(processedPointsUsers);
      setPopularUsers(processedPopularUsers);
      setDriverUsers(processedDriverUsers);
      setMoverUsers(processedMoverUsers);

      // Set initial active tab data
      handleTabChange(activeTab, {
        popular: processedPopularUsers,
        points: processedPointsUsers,
        drivers: processedDriverUsers,
        movers: processedMoverUsers
      });

    } catch (error) {
      console.error('Error loading filtered leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (
    tab: 'popular' | 'points' | 'drivers' | 'movers', 
    usersData?: any
  ) => {
    setActiveTab(tab);
    const data = usersData || {
      popular: popularUsers,
      points: pointsUsers,
      drivers: driverUsers,
      movers: moverUsers
    };
    
    switch (tab) {
      case 'popular':
        setUsers(data.popular);
        break;
      case 'points':
        setUsers(data.points);
        break;
      case 'drivers':
        setUsers(data.drivers);
        break;
      case 'movers':
        setUsers(data.movers);
        break;
    }

    // Update current user rank
    if (user) {
      const currentUserIndex = data[tab].findIndex((u: LeaderboardUser) => u.id === user.id);
      setCurrentUserRank(currentUserIndex >= 0 ? currentUserIndex + 1 : null);
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

  const getTabConfig = () => {
    const config = {
      popular: { 
        icon: <Flame size={20} color="#FF6B35" />, 
        title: 'Most Popular', 
        metric: 'reactions',
        color: '#FF6B35'
      },
      points: { 
        icon: <Trophy size={20} color="#FFD700" />, 
        title: 'Top Points', 
        metric: 'points',
        color: '#FFD700'
      },
      drivers: { 
        icon: <Car size={20} color="#1EA2B1" />, 
        title: 'Best Drivers', 
        metric: 'rating',
        color: '#1EA2B1'
      },
      movers: { 
        icon: <Heart size={20} color="#10B981" />, 
        title: 'Big Movers', 
        metric: 'favorites',
        color: '#10B981'
      },
    };
    return config[activeTab];
  };

  const getDisplayMetric = (user: LeaderboardUser) => {
    switch (activeTab) {
      case 'popular':
        return user.reaction_count || 0;
      case 'points':
        return user.points || 0;
      case 'drivers':
        return user.driver_rating ? Number(user.driver_rating).toFixed(1) : '0.0';
      case 'movers':
        return user.favorite_count || 0;
      default:
        return user.points || 0;
    }
  };

  const getDisplayUsers = () => {
    if (!users.length) return [];
    
    const currentUser = users.find(u => u.isCurrentUser);
    const topUsers = users.slice(0, 10);
    
    if (currentUser && !topUsers.find(u => u.isCurrentUser)) {
      return [...topUsers, currentUser];
    }
    
    return topUsers;
  };

  const clearFilter = () => {
    router.push('/leaderboard');
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const displayUsers = getDisplayUsers();
  const currentUser = users.find(u => u.isCurrentUser);
  const tabConfig = getTabConfig();

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
            <Text style={styles.headerSubtitle}>{entityName}</Text>
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
        <View style={styles.followerCount}>
          <Users size={12} color="#666" />
          <Text style={styles.followerCountText}>{followerCount} fans</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => handleTabChange('popular')}
        >
          <Flame size={16} color={activeTab === 'popular' ? '#FF6B35' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
            Popular
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'points' && styles.activeTab]}
          onPress={() => handleTabChange('points')}
        >
          <Trophy size={16} color={activeTab === 'points' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'points' && styles.activeTabText]}>
            Points
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'drivers' && styles.activeTab]}
          onPress={() => handleTabChange('drivers')}
        >
          <Car size={16} color={activeTab === 'drivers' ? '#1EA2B1' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'drivers' && styles.activeTabText]}>
            Drivers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'movers' && styles.activeTab]}
          onPress={() => handleTabChange('movers')}
        >
          <Heart size={16} color={activeTab === 'movers' ? '#10B981' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'movers' && styles.activeTabText]}>
            Movers
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Current User Card */}
      {currentUser && (
        <View style={styles.currentUserSection}>
          <Text style={styles.sectionTitle}>Your Position</Text>
          <TouchableOpacity 
            style={[
              styles.leaderboardItem, 
              styles.currentUserHighlight,
              { borderColor: tabConfig.color }
            ]}
            onPress={() => navigateToUserProfile(user?.id || '')}
          >
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
              <Text style={styles.pointsNumber}>{getDisplayMetric(currentUser)}</Text>
              <Text style={styles.pointsLabel}>{tabConfig.metric}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Leaderboard Section */}
      <View style={styles.leaderboardSection}>
        <View style={styles.sectionHeader}>
          {tabConfig.icon}
          <Text style={styles.sectionTitle}>{tabConfig.title}</Text>
        </View>
        
        {displayUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#666" />
            <Text style={styles.emptyStateText}>No fans yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to add this {entityType} to your favorites!
            </Text>
          </View>
        ) : (
          displayUsers.map((user) => (
            <TouchableOpacity 
              key={user.id} 
              style={[
                styles.leaderboardItem,
                user.isCurrentUser && styles.currentUserInList
              ]}
              onPress={() => navigateToUserProfile(user.id)}
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
                    {activeTab === 'drivers' && user.total_trips && ` • ${user.total_trips} trips`}
                  </Text>
                </View>
              </View>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsNumber}>{getDisplayMetric(user)}</Text>
                <Text style={styles.pointsLabel}>{tabConfig.metric}</Text>
              </View>
            </TouchableOpacity>
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
  tabScrollContainer: {
    marginBottom: 20,
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#1ea2b120',
    borderColor: '#1ea2b1',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  currentUserSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  currentUserHighlight: {
    backgroundColor: '#1ea2b120',
    borderWidth: 2,
  },
  currentUserInList: {
    backgroundColor: '#1ea2b110',
    borderLeftWidth: 4,
    borderLeftColor: '#1ea2b1',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
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