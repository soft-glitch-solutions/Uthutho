import React, { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users, Flame, Car, TrendingUp, Heart, TrendingDown, User, Award, ChevronRight, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_COLOR = '#1ea2b1';

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

const SkeletonItem = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.listItem, { opacity, borderColor: '#111' }]}>
      <View style={styles.itemLeft}>
        <View style={[styles.rankText, { width: 32, height: 14, backgroundColor: '#222', borderRadius: 4 }]} />
        <View style={[styles.itemAvatar, { backgroundColor: '#222' }]} />
        <View style={{ gap: 6 }}>
          <View style={{ width: 100, height: 14, backgroundColor: '#222', borderRadius: 4 }} />
          <View style={{ width: 60, height: 10, backgroundColor: '#222', borderRadius: 4 }} />
        </View>
      </View>
      <View style={{ width: 40, height: 20, backgroundColor: '#222', borderRadius: 4 }} />
    </Animated.View>
  );
};

const LeaderboardSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <View style={styles.headerTitleBox}>
          <View style={{ width: 120, height: 24, backgroundColor: '#111', borderRadius: 4 }} />
          <View style={{ width: 80, height: 10, backgroundColor: '#111', borderRadius: 4, marginTop: 4 }} />
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.podium}>
        <View style={[styles.podiumItem, { opacity: 0.5 }]}>
          <View style={[styles.podiumAvatarBox, { backgroundColor: '#111' }]} />
          <View style={{ width: 60, height: 12, backgroundColor: '#111', borderRadius: 4, marginTop: 12 }} />
        </View>
        <View style={[styles.podiumItem, styles.podiumFirst, { opacity: 0.5 }]}>
          <View style={[styles.podiumAvatarBox, { width: 80, height: 80, backgroundColor: '#111' }]} />
          <View style={{ width: 80, height: 14, backgroundColor: '#111', borderRadius: 4, marginTop: 12 }} />
        </View>
        <View style={[styles.podiumItem, { opacity: 0.5 }]}>
          <View style={[styles.podiumAvatarBox, { backgroundColor: '#111' }]} />
          <View style={{ width: 60, height: 12, backgroundColor: '#111', borderRadius: 4, marginTop: 12 }} />
        </View>
      </View>
      <View style={styles.list}>
        {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: allProfiles } = await supabase.from('profiles').select('*').limit(100);
      const { data: hubReactions } = await supabase.from('hub_posts').select('user_id, post_reactions(count)');
      const { data: stopReactions } = await supabase.from('stop_posts').select('user_id, post_reactions(count)');
      const { data: driversData } = await supabase.from('drivers').select('user_id, rating, total_trips').eq('is_verified', true).eq('is_active', true);

      const reactionCounts: { [key: string]: number } = {};
      [...(hubReactions || []), ...(stopReactions || [])].forEach(post => {
        const count = (post as any).post_reactions?.[0]?.count || 0;
        reactionCounts[post.user_id] = (reactionCounts[post.user_id] || 0) + count;
      });

      const driverRatings: { [key: string]: any } = {};
      driversData?.forEach(d => driverRatings[d.user_id] = { rating: d.rating || 0, trips: d.total_trips || 0 });

      const process = (list: any[], sortFn: any, metricFn: any) => 
        list.sort(sortFn).map((p, i) => ({ ...p, rank: i + 1, isCurrentUser: p.id === user?.id, metric: metricFn(p) }));

      setPopularUsers(process([...(allProfiles || [])], (a, b) => (reactionCounts[b.id] || 0) - (reactionCounts[a.id] || 0), p => reactionCounts[p.id] || 0));
      setPointsUsers(process([...(allProfiles || [])].filter(p => p.points > 0), (a, b) => b.points - a.points, p => p.points || 0));
      setDriverUsers(process([...(allProfiles || [])].filter(p => driverRatings[p.id]), (a, b) => (driverRatings[b.id]?.rating || 0) - (driverRatings[a.id]?.rating || 0), p => driverRatings[p.id]?.rating.toFixed(1) || '0.0'));
      setMoverUsers(process([...(allProfiles || [])], (a, b) => (b.favorites_count || 0) - (a.favorites_count || 0), p => p.favorites_count || 0));

      setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  useEffect(() => {
    const dataMap = { popular: popularUsers, points: pointsUsers, drivers: driverUsers, movers: moverUsers };
    setUsers(dataMap[activeTab]);
  }, [activeTab, popularUsers, pointsUsers, driverUsers, moverUsers]);

  const onRefresh = () => { setRefreshing(true); loadLeaderboard(); };

  if (loading) return <LeaderboardSkeleton />;

  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);
  const currentUser = users.find(u => u.isCurrentUser);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.readyText}>READY TO MOVE</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {[
          { id: 'popular', icon: Flame, label: 'POPULAR', color: '#FF6B35' },
          { id: 'points', icon: Trophy, label: 'POINTS', color: '#FFD700' },
          { id: 'drivers', icon: Car, label: 'DRIVERS', color: BRAND_COLOR },
          { id: 'movers', icon: Heart, label: 'MOVERS', color: '#ED67B1' }
        ].map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, activeTab === t.id && styles.activeTab]} onPress={() => setActiveTab(t.id as any)}>
            <t.icon size={14} color={activeTab === t.id ? t.color : '#444'} />
            <Text style={[styles.tabLabel, activeTab === t.id && { color: '#FFF' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLOR} />}>
        {/* Podium */}
        {topThree.length > 0 && (
          <View style={styles.podium}>
            {/* 2nd Place */}
            {topThree[1] && (
              <View style={[styles.podiumItem, styles.podiumSecond]}>
                <View style={styles.podiumAvatarBox}>
                  <Image source={{ uri: topThree[1].avatar_url || 'https://ui-avatars.com/api/?name=' + topThree[1].first_name }} style={styles.podiumAvatar} />
                  <View style={[styles.podiumBadge, { backgroundColor: '#C0C0C0' }]}><Text style={styles.podiumBadgeText}>2</Text></View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].first_name}</Text>
                <Text style={styles.podiumScore}>{(topThree[1] as any).metric}</Text>
              </View>
            )}
            {/* 1st Place */}
            {topThree[0] && (
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <Crown size={24} color="#FFD700" style={{ marginBottom: -8, zIndex: 1 }} />
                <View style={[styles.podiumAvatarBox, { width: 80, height: 80, borderRadius: 40, borderColor: '#FFD700', borderWidth: 3 }]}>
                  <Image source={{ uri: topThree[0].avatar_url || 'https://ui-avatars.com/api/?name=' + topThree[0].first_name }} style={[styles.podiumAvatar, { width: 74, height: 74 }]} />
                  <View style={[styles.podiumBadge, { backgroundColor: '#FFD700', width: 24, height: 24, borderRadius: 12 }]}><Text style={[styles.podiumBadgeText, { color: '#000' }]}>1</Text></View>
                </View>
                <Text style={[styles.podiumName, { fontSize: 16 }]} numberOfLines={1}>{topThree[0].first_name}</Text>
                <Text style={[styles.podiumScore, { color: '#FFD700' }]}>{(topThree[0] as any).metric}</Text>
              </View>
            )}
            {/* 3rd Place */}
            {topThree[2] && (
              <View style={[styles.podiumItem, styles.podiumThird]}>
                <View style={styles.podiumAvatarBox}>
                  <Image source={{ uri: topThree[2].avatar_url || 'https://ui-avatars.com/api/?name=' + topThree[2].first_name }} style={styles.podiumAvatar} />
                  <View style={[styles.podiumBadge, { backgroundColor: '#CD7F32' }]}><Text style={styles.podiumBadgeText}>3</Text></View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].first_name}</Text>
                <Text style={styles.podiumScore}>{(topThree[2] as any).metric}</Text>
              </View>
            )}
          </View>
        )}

        {/* Current User Highlighting */}
        {currentUser && currentUser.rank > 3 && (
          <TouchableOpacity style={styles.currentUserCard} onPress={() => router.push(`/user/${currentUser.id}`)}>
            <View style={styles.itemLeft}>
              <Text style={styles.rankText}>#{currentUser.rank}</Text>
              <Image source={{ uri: currentUser.avatar_url || 'https://ui-avatars.com/api/?name=' + currentUser.first_name }} style={styles.itemAvatar} />
              <View>
                <Text style={styles.itemName}>{currentUser.first_name} {currentUser.last_name}</Text>
                <Text style={styles.itemTitle}>{currentUser.selected_title || 'COMMUTER'}</Text>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemMetric}>{(currentUser as any).metric}</Text>
              <ChevronRight size={16} color="#333" />
            </View>
          </TouchableOpacity>
        )}

        {/* List */}
        <View style={styles.list}>
          {remaining.map((u, i) => (
            <TouchableOpacity key={u.id} style={styles.listItem} onPress={() => router.push(`/user/${u.id}`)}>
              <View style={styles.itemLeft}>
                <Text style={styles.rankText}>#{u.rank}</Text>
                <Image source={{ uri: u.avatar_url || 'https://ui-avatars.com/api/?name=' + u.first_name }} style={styles.itemAvatar} />
                <View>
                  <Text style={styles.itemName}>{u.first_name} {u.last_name}</Text>
                  <Text style={styles.itemTitle}>{u.selected_title || 'COMMUTER'}</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemMetric}>{(u as any).metric}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', letterSpacing: -1 },
  readyText: { fontSize: 10, fontWeight: '900', color: BRAND_COLOR, letterSpacing: 2 },
  tabScroll: { maxHeight: 60, marginBottom: 16 },
  tabContent: { paddingHorizontal: 24, gap: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#222' },
  activeTab: { backgroundColor: '#222', borderColor: BRAND_COLOR },
  tabLabel: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  main: { flex: 1 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 24, paddingVertical: 32, gap: 12 },
  podiumItem: { alignItems: 'center', width: (SCREEN_WIDTH - 80) / 3 },
  podiumAvatarBox: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: '#111', borderWidth: 2, borderColor: '#222', position: 'relative' },
  podiumAvatar: { width: 56, height: 56, borderRadius: 28 },
  podiumBadge: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  podiumBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  podiumName: { color: '#FFF', fontWeight: 'bold', fontSize: 14, fontStyle: 'italic', marginTop: 12 },
  podiumScore: { color: '#666', fontSize: 12, fontWeight: '900', marginTop: 2 },
  podiumFirst: { width: (SCREEN_WIDTH - 80) / 2.5, paddingBottom: 16 },
  currentUserCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 20, borderRadius: 24, marginHorizontal: 24, marginBottom: 24, borderWidth: 1, borderColor: BRAND_COLOR },
  list: { paddingHorizontal: 24, gap: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  rankText: { fontSize: 14, fontWeight: '900', color: '#444', width: 32 },
  itemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic' },
  itemTitle: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 0.5, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemMetric: { fontSize: 16, fontWeight: '900', color: BRAND_COLOR },
});