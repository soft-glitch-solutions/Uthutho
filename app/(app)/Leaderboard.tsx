import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users, Flame, Car, TrendingUp, Heart, TrendingDown, User, Award, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

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
  fire_count?: number;
  trips?: number;
  total_ride_time?: number;
  favorites_count?: number;
}

// Desktop Skeleton Loading Component
const DesktopSkeletonLoader = () => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonItem = ({ width, height, style = {} }) => (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Desktop Header Skeleton */}
      <View style={styles.desktopHeader}>
        <SkeletonItem width={100} height={44} style={{ borderRadius: 12 }} />
        <View style={styles.desktopHeaderTitle}>
          <SkeletonItem width={32} height={32} style={{ borderRadius: 16 }} />
          <SkeletonItem width={200} height={28} />
        </View>
        <View style={{ width: 100 }} />
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Current User & Top 3 */}
        <View style={styles.leftColumn}>
          {/* Current User Card Skeleton */}
          <View style={styles.desktopCurrentUserSection}>
            <SkeletonItem width={120} height={24} style={{ marginBottom: 16 }} />
            <View style={styles.desktopCurrentUserCard}>
              <SkeletonItem width={48} height={48} style={{ borderRadius: 24, marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <SkeletonItem width={150} height={18} style={{ marginBottom: 8 }} />
                <SkeletonItem width={100} height={14} />
              </View>
              <SkeletonItem width={80} height={40} style={{ borderRadius: 20 }} />
            </View>
          </View>

          {/* Top 3 Podium Skeleton */}
          <View style={styles.desktopPodiumSection}>
            <SkeletonItem width={120} height={24} style={{ marginBottom: 24 }} />
            <View style={styles.podiumSkeleton}>
              {/* 2nd Place */}
              <View style={[styles.podiumItemSkeleton, styles.podiumSecondSkeleton]}>
                <SkeletonItem width={40} height={40} style={{ borderRadius: 20, marginBottom: 12 }} />
                <SkeletonItem width={80} height={16} />
              </View>
              {/* 1st Place */}
              <View style={[styles.podiumItemSkeleton, styles.podiumFirstSkeleton]}>
                <SkeletonItem width={48} height={48} style={{ borderRadius: 24, marginBottom: 12 }} />
                <SkeletonItem width={100} height={18} />
              </View>
              {/* 3rd Place */}
              <View style={[styles.podiumItemSkeleton, styles.podiumThirdSkeleton]}>
                <SkeletonItem width={36} height={36} style={{ borderRadius: 18, marginBottom: 12 }} />
                <SkeletonItem width={70} height={14} />
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Leaderboard List */}
        <ScrollView style={styles.rightColumn} showsVerticalScrollIndicator={false}>
          {/* Tabs Skeleton */}
          <View style={styles.desktopTabsContainer}>
            {[1, 2, 3, 4].map((item) => (
              <SkeletonItem key={item} width={120} height={44} style={{ borderRadius: 12 }} />
            ))}
          </View>

          {/* Leaderboard List Skeleton */}
          <View style={styles.desktopLeaderboardList}>
            <SkeletonItem width={150} height={24} style={{ marginBottom: 24 }} />
            
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
              <View key={item} style={styles.leaderboardItemSkeletonDesktop}>
                <SkeletonItem width={40} height={40} style={{ borderRadius: 20, marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonItem width={120} height={16} style={{ marginBottom: 4 }} />
                  <SkeletonItem width={80} height={12} />
                </View>
                <SkeletonItem width={60} height={24} style={{ borderRadius: 12 }} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// Mobile Skeleton Loading Component
const MobileSkeletonLoader = () => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonItem = ({ width, height, style = {} }) => (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={[styles.headerTitle, styles.skeleton, { width: 200, height: 24 }]} />
        <View style={[styles.backButton, styles.skeleton, { opacity: 0 }]} />
      </View>

      {/* Tab Skeleton */}
      <View style={styles.tabContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={[styles.tab, styles.skeleton, { height: 40 }]} />
        ))}
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

// Desktop Layout Component
const DesktopLeaderboard = ({ 
  activeTab, 
  users, 
  currentUser, 
  handleTabChange, 
  getRankBadge, 
  getTabConfig, 
  getDisplayMetric, 
  displayUsers, 
  router,
  onRefresh,
  refreshing
}) => {
  const tabConfig = getTabConfig();
  
  // Get top 3 users for podium
  const topThree = displayUsers.slice(0, 3);
  
  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.desktopHeaderTitle}>
          <Trophy size={32} color="#FFD700" />
          <Text style={styles.desktopHeaderTitleText}>Community Leaderboard</Text>
        </View>
        <View style={styles.desktopHeaderRight} />
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Current User & Top 3 Podium */}
        <View style={styles.leftColumn}>
          {/* Current User Card */}
          {currentUser && (
            <View style={styles.desktopCurrentUserSection}>
              <Text style={styles.desktopSectionTitle}>Your Position</Text>
              <TouchableOpacity 
                style={[
                  styles.desktopCurrentUserCard,
                  { borderColor: tabConfig.color }
                ]}
                onPress={() => router.push(`/user/${currentUser.id}`)}
              >
                <View style={styles.currentUserAvatarContainer}>
                  {currentUser.avatar_url ? (
                    <Image 
                      source={{ uri: currentUser.avatar_url }}
                      style={styles.desktopUserAvatar}
                    />
                  ) : (
                    <View style={[styles.desktopUserAvatar, styles.desktopAvatarPlaceholder]}>
                      <Text style={styles.desktopAvatarText}>
                        {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.rankBadgeDesktop, { backgroundColor: tabConfig.color }]}>
                    <Text style={styles.rankBadgeTextDesktop}>
                      #{currentUser.rank}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.currentUserInfo}>
                  <Text style={styles.desktopUserName}>
                    {currentUser.first_name} {currentUser.last_name}
                  </Text>
                  <Text style={styles.desktopUserTitle}>
                    {currentUser.selected_title || 'Newbie Explorer'}
                  </Text>
                </View>
                
                <View style={[styles.currentUserMetric, { backgroundColor: `${tabConfig.color}15` }]}>
                  <Text style={[styles.metricValue, { color: tabConfig.color }]}>
                    {getDisplayMetric(currentUser)}
                  </Text>
                  <Text style={styles.metricLabel}>
                    {tabConfig.metric}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <View style={styles.desktopPodiumSection}>
              <Text style={styles.desktopSectionTitle}>Top Performers</Text>
              <View style={styles.desktopPodium}>
                {/* 2nd Place */}
                {topThree[1] && (
                  <TouchableOpacity 
                    style={[styles.podiumItem, styles.podiumSecond]}
                    onPress={() => router.push(`/user/${topThree[1].id}`)}
                  >
                    <View style={styles.podiumRankBadge}>
                      <Medal size={20} color="#C0C0C0" />
                      <Text style={[styles.podiumRankText, { color: '#C0C0C0' }]}>2</Text>
                    </View>
                    <View style={styles.podiumAvatar}>
                      {topThree[1].avatar_url ? (
                        <Image 
                          source={{ uri: topThree[1].avatar_url }}
                          style={styles.podiumAvatarImage}
                        />
                      ) : (
                        <View style={[styles.podiumAvatarImage, styles.podiumAvatarPlaceholder]}>
                          <Text style={styles.podiumAvatarText}>
                            {topThree[1].first_name?.[0]}{topThree[1].last_name?.[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {topThree[1].first_name}
                    </Text>
                    <Text style={[styles.podiumScore, { color: '#C0C0C0' }]}>
                      {getDisplayMetric(topThree[1])}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* 1st Place */}
                {topThree[0] && (
                  <TouchableOpacity 
                    style={[styles.podiumItem, styles.podiumFirst]}
                    onPress={() => router.push(`/user/${topThree[0].id}`)}
                  >
                    <View style={styles.podiumRankBadge}>
                      <Crown size={24} color="#FFD700" />
                      <Text style={[styles.podiumRankText, { color: '#FFD700' }]}>1</Text>
                    </View>
                    <View style={styles.podiumAvatar}>
                      {topThree[0].avatar_url ? (
                        <Image 
                          source={{ uri: topThree[0].avatar_url }}
                          style={styles.podiumAvatarImage}
                        />
                      ) : (
                        <View style={[styles.podiumAvatarImage, styles.podiumAvatarPlaceholder]}>
                          <Text style={styles.podiumAvatarText}>
                            {topThree[0].first_name?.[0]}{topThree[0].last_name?.[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {topThree[0].first_name}
                    </Text>
                    <Text style={[styles.podiumScore, { color: '#FFD700' }]}>
                      {getDisplayMetric(topThree[0])}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* 3rd Place */}
                {topThree[2] && (
                  <TouchableOpacity 
                    style={[styles.podiumItem, styles.podiumThird]}
                    onPress={() => router.push(`/user/${topThree[2].id}`)}
                  >
                    <View style={styles.podiumRankBadge}>
                      <Award size={20} color="#CD7F32" />
                      <Text style={[styles.podiumRankText, { color: '#CD7F32' }]}>3</Text>
                    </View>
                    <View style={styles.podiumAvatar}>
                      {topThree[2].avatar_url ? (
                        <Image 
                          source={{ uri: topThree[2].avatar_url }}
                          style={styles.podiumAvatarImage}
                        />
                      ) : (
                        <View style={[styles.podiumAvatarImage, styles.podiumAvatarPlaceholder]}>
                          <Text style={styles.podiumAvatarText}>
                            {topThree[2].first_name?.[0]}{topThree[2].last_name?.[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {topThree[2].first_name}
                    </Text>
                    <Text style={[styles.podiumScore, { color: '#CD7F32' }]}>
                      {getDisplayMetric(topThree[2])}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Right Column - Tabs & Leaderboard List */}
        <ScrollView 
          style={styles.rightColumn} 
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1ea2b1"
              colors={['#1ea2b1']}
            />
          }
        >
          {/* Desktop Tabs */}
          <View style={styles.desktopTabsContainer}>
            <TouchableOpacity 
              style={[
                styles.desktopTab,
                activeTab === 'popular' && { backgroundColor: `${getTabConfig('popular').color}15`, borderColor: getTabConfig('popular').color }
              ]}
              onPress={() => handleTabChange('popular')}
            >
              <Flame size={20} color={activeTab === 'popular' ? getTabConfig('popular').color : '#666'} />
              <Text style={[styles.desktopTabText, activeTab === 'popular' && { color: getTabConfig('popular').color }]}>
                Popular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.desktopTab,
                activeTab === 'points' && { backgroundColor: `${getTabConfig('points').color}15`, borderColor: getTabConfig('points').color }
              ]}
              onPress={() => handleTabChange('points')}
            >
              <Trophy size={20} color={activeTab === 'points' ? getTabConfig('points').color : '#666'} />
              <Text style={[styles.desktopTabText, activeTab === 'points' && { color: getTabConfig('points').color }]}>
                Points
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.desktopTab,
                activeTab === 'drivers' && { backgroundColor: `${getTabConfig('drivers').color}15`, borderColor: getTabConfig('drivers').color }
              ]}
              onPress={() => handleTabChange('drivers')}
            >
              <Car size={20} color={activeTab === 'drivers' ? getTabConfig('drivers').color : '#666'} />
              <Text style={[styles.desktopTabText, activeTab === 'drivers' && { color: getTabConfig('drivers').color }]}>
                Drivers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.desktopTab,
                activeTab === 'movers' && { backgroundColor: `${getTabConfig('movers').color}15`, borderColor: getTabConfig('movers').color }
              ]}
              onPress={() => handleTabChange('movers')}
            >
              <Heart size={20} color={activeTab === 'movers' ? getTabConfig('movers').color : '#666'} />
              <Text style={[styles.desktopTabText, activeTab === 'movers' && { color: getTabConfig('movers').color }]}>
                Movers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Leaderboard List */}
          <View style={styles.desktopLeaderboardList}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Top {tabConfig.title} • {displayUsers.length} Users
              </Text>
              <View style={styles.listHeaderRank}>
                <Text style={styles.listHeaderRankText}>Rank</Text>
              </View>
            </View>
            
            {displayUsers.length === 0 ? (
              <View style={styles.desktopEmptyState}>
                <Trophy size={64} color="#666" />
                <Text style={styles.desktopEmptyStateText}>No users yet</Text>
                <Text style={styles.desktopEmptyStateSubtext}>
                  Be the first to earn {tabConfig.metric} and climb the leaderboard!
                </Text>
              </View>
            ) : (
              <View style={styles.desktopLeaderboardGrid}>
                {displayUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.desktopLeaderboardItem,
                      user.isCurrentUser && styles.desktopCurrentUserItem
                    ]}
                    onPress={() => router.push(`/user/${user.id}`)}
                  >
                    <View style={styles.desktopItemRank}>
                      <View style={[
                        styles.desktopRankBadge,
                        { backgroundColor: getRankBadge(user.rank).color + '20' }
                      ]}>
                        {getRankBadge(user.rank).icon}
                        <Text style={[
                          styles.desktopRankText,
                          { color: getRankBadge(user.rank).color }
                        ]}>
                          {getRankBadge(user.rank).label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.desktopItemUser}>
                      {user.avatar_url ? (
                        <Image 
                          source={{ uri: user.avatar_url }}
                          style={styles.desktopItemAvatar}
                        />
                      ) : (
                        <View style={[styles.desktopItemAvatar, styles.desktopItemAvatarPlaceholder]}>
                          <Text style={styles.desktopItemAvatarText}>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </Text>
                        </View>
                      )}
                      <View style={styles.desktopItemInfo}>
                        <Text style={styles.desktopItemName}>
                          {user.first_name} {user.last_name}
                        </Text>
                        <Text style={styles.desktopItemTitle}>
                          {user.selected_title || 'Newbie Explorer'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.desktopItemMetric}>
                      <Text style={styles.desktopItemMetricValue}>
                        {getDisplayMetric(user)}
                      </Text>
                      <Text style={styles.desktopItemMetricLabel}>
                        {tabConfig.metric}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.desktopBottomSpace} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'popular' | 'points' | 'drivers' | 'movers'>('popular');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [popularUsers, setPopularUsers] = useState<LeaderboardUser[]>([]);
  const [pointsUsers, setPointsUsers] = useState<LeaderboardUser[]>([]);
  const [driverUsers, setDriverUsers] = useState<LeaderboardUser[]>([]);
  const [moverUsers, setMoverUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Load all profiles data first
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(100);

      if (profilesError) throw profilesError;

      // Load reaction counts separately
      const { data: hubReactions, error: hubReactionsError } = await supabase
        .from('hub_posts')
        .select('user_id, post_reactions(count)');

      if (hubReactionsError) throw hubReactionsError;

      const { data: stopReactions, error: stopReactionsError } = await supabase
        .from('stop_posts')
        .select('user_id, post_reactions(count)');

      if (stopReactionsError) throw stopReactionsError;

      // Load drivers data
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('user_id, rating, total_trips')
        .eq('is_verified', true)
        .eq('is_active', true);

      if (driversError) throw driversError;

      // Process reaction counts
      const reactionCounts: { [key: string]: number } = {};
      
      // Process hub post reactions
      hubReactions?.forEach(post => {
        const userId = post.user_id;
        const count = (post as any).post_reactions?.[0]?.count || 0;
        reactionCounts[userId] = (reactionCounts[userId] || 0) + count;
      });

      // Process stop post reactions
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
      const processedPointsUsers: LeaderboardUser[] = (allProfiles || [])
        .filter(profile => (profile.points || 0) > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((profile, index) => ({
          ...profile,
          rank: index + 1,
          points: profile.points || 0,
          isCurrentUser: profile.id === user?.id,
        }));

      // Process popular users (reaction-based)
      const processedPopularUsers: LeaderboardUser[] = (allProfiles || [])
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
      const processedDriverUsers: LeaderboardUser[] = (allProfiles || [])
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
      const processedMoverUsers: LeaderboardUser[] = (allProfiles || [])
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
      console.error('Error loading leaderboard:', error);
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

  const getTabConfig = (tab?: 'popular' | 'points' | 'drivers' | 'movers') => {
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
    return tab ? config[tab] : config[activeTab];
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
    const topUsers = users.slice(0, isDesktop ? 20 : 10);
    
    if (currentUser && !topUsers.find(u => u.isCurrentUser)) {
      return [...topUsers, currentUser];
    }
    
    return topUsers;
  };

  if (loading) {
    return isDesktop ? <DesktopSkeletonLoader /> : <MobileSkeletonLoader />;
  }

  const displayUsers = getDisplayUsers();
  const currentUser = users.find(u => u.isCurrentUser);

  if (isDesktop) {
    return (
      <DesktopLeaderboard
        activeTab={activeTab}
        users={users}
        currentUser={currentUser}
        handleTabChange={handleTabChange}
        getRankBadge={getRankBadge}
        getTabConfig={getTabConfig}
        getDisplayMetric={getDisplayMetric}
        displayUsers={displayUsers}
        router={router}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  }

  // Mobile Layout (original)
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
          <View style={[
            styles.leaderboardItem, 
            styles.currentUserHighlight,
            { borderColor: getTabConfig().color }
          ]}>
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
              <Text style={styles.pointsLabel}>{getTabConfig().metric}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard Section */}
      <View style={styles.leaderboardSection}>
        <View style={styles.sectionHeader}>
          {getTabConfig().icon}
          <Text style={styles.sectionTitle}>{getTabConfig().title}</Text>
        </View>
        
        {displayUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#666" />
            <Text style={styles.emptyStateText}>No users yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to earn {getTabConfig().metric} and climb the leaderboard!
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
                    {activeTab === 'drivers' && user.total_trips && ` • ${user.total_trips} trips`}
                  </Text>
                </View>
              </View>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsNumber}>{getDisplayMetric(user)}</Text>
                <Text style={styles.pointsLabel}>{getTabConfig().metric}</Text>
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
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Skeleton Styles
  skeletonItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopHeaderTitleText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  desktopHeaderRight: {
    width: 100,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    flex: 1,
  },
  leftColumn: {
    width: '35%',
    minWidth: 0,
  },
  rightColumn: {
    width: '65%',
    minWidth: 0,
    flex: 1,
  },
  
  // Desktop Current User Section
  desktopCurrentUserSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  desktopSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  desktopCurrentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  currentUserAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  desktopUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  desktopAvatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  rankBadgeDesktop: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1ea2b1',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTextDesktop: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  currentUserInfo: {
    flex: 1,
  },
  desktopUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  desktopUserTitle: {
    fontSize: 13,
    color: '#666666',
  },
  currentUserMetric: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666666',
  },
  
  // Desktop Podium Section
  desktopPodiumSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  desktopPodium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 200,
    gap: 16,
  },
  podiumItem: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
  },
  podiumFirst: {
    height: 180,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  podiumSecond: {
    height: 150,
    borderColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  podiumThird: {
    height: 130,
    borderColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  podiumRankBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  podiumAvatar: {
    marginBottom: 12,
  },
  podiumAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  podiumAvatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
  },
  podiumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Podium Skeleton
  podiumSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 180,
    gap: 16,
  },
  podiumItemSkeleton: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
  },
  podiumFirstSkeleton: {
    height: 180,
  },
  podiumSecondSkeleton: {
    height: 150,
  },
  podiumThirdSkeleton: {
    height: 130,
  },
  
  // Desktop Tabs
  desktopTabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  desktopTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
  },
  desktopTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Desktop Leaderboard List
  desktopLeaderboardList: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  listHeaderRank: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listHeaderRankText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  desktopLeaderboardGrid: {
    gap: 12,
  },
  desktopLeaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  desktopCurrentUserItem: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderColor: '#1ea2b1',
  },
  desktopItemRank: {
    width: 60,
  },
  desktopRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  desktopRankText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  desktopItemUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  desktopItemAvatarPlaceholder: {
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopItemAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  desktopItemInfo: {
    flex: 1,
  },
  desktopItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  desktopItemTitle: {
    fontSize: 12,
    color: '#666666',
  },
  desktopItemMetric: {
    alignItems: 'flex-end',
  },
  desktopItemMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  desktopItemMetricLabel: {
    fontSize: 11,
    color: '#666666',
  },
  
  // Desktop Empty State
  desktopEmptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  desktopEmptyStateText: {
    color: '#666',
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
  },
  desktopEmptyStateSubtext: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 400,
  },
  desktopBottomSpace: {
    height: 40,
  },
  
  // Leaderboard Item Skeleton
  leaderboardItemSkeletonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  
  // Mobile Header Styles
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
  transactionInfoSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
});