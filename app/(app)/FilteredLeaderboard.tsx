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
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Crown, Trophy, Medal, Star, MapPin, Users, Flame, Car, Heart, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

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
        <View style={{ width: 32, height: 14, backgroundColor: '#222', borderRadius: 4 }} />
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

const FilteredLeaderboardSkeleton = () => {
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
      <View style={styles.entitySection}>
        <View style={[styles.entityCard, { opacity: 0.5 }]}>
          <View style={styles.entityIconBox} />
          <View style={{ gap: 6 }}>
            <View style={{ width: 150, height: 18, backgroundColor: '#222', borderRadius: 4 }} />
            <View style={{ width: 100, height: 12, backgroundColor: '#222', borderRadius: 4 }} />
          </View>
        </View>
      </View>
      <View style={styles.list}>
        {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => { if (entityId && entityType) loadFilteredLeaderboard(); }, [entityId, entityType]);

  const loadFilteredLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: allProfiles } = await supabase.from('profiles').select('id, favorites');
      const fanIds = (allProfiles || []).filter(p => (p.favorites || []).some((f: any) => f.id === entityId && f.type === entityType)).map(p => p.id);
      setFollowerCount(fanIds.length);

      if (fanIds.length === 0) { setLoading(false); return; }

      const { data: fanProfiles } = await supabase.from('profiles').select('*').in('id', fanIds);
      const { data: hubReactions } = await supabase.from('hub_posts').select('user_id, post_reactions(count)').in('user_id', fanIds);
      const { data: stopReactions } = await supabase.from('stop_posts').select('user_id, post_reactions(count)').in('user_id', fanIds);
      const { data: driversData } = await supabase.from('drivers').select('user_id, rating, total_trips').eq('is_verified', true).eq('is_active', true).in('user_id', fanIds);

      const reactionCounts: { [key: string]: number } = {};
      [...(hubReactions || []), ...(stopReactions || [])].forEach(post => {
        const count = (post as any).post_reactions?.[0]?.count || 0;
        reactionCounts[post.user_id] = (reactionCounts[post.user_id] || 0) + count;
      });

      const driverRatings: { [key: string]: any } = {};
      driversData?.forEach(d => driverRatings[d.user_id] = { rating: d.rating || 0, trips: d.total_trips || 0 });

      const process = (list: any[], sortFn: any, metricFn: any) => 
        list.sort(sortFn).map((p, i) => ({ ...p, rank: i + 1, isCurrentUser: p.id === user?.id, metric: metricFn(p) }));

      setPopularUsers(process([...(fanProfiles || [])], (a, b) => (reactionCounts[b.id] || 0) - (reactionCounts[a.id] || 0), p => reactionCounts[p.id] || 0));
      setPointsUsers(process([...(fanProfiles || [])].filter(p => p.points > 0), (a, b) => b.points - a.points, p => p.points || 0));
      setDriverUsers(process([...(fanProfiles || [])].filter(p => driverRatings[p.id]), (a, b) => (driverRatings[b.id]?.rating || 0) - (driverRatings[a.id]?.rating || 0), p => driverRatings[p.id]?.rating.toFixed(1) || '0.0'));
      setMoverUsers(process([...(fanProfiles || [])], (a, b) => (b.favorites_count || 0) - (a.favorites_count || 0), p => p.favorites_count || 0));

      setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  useEffect(() => {
    const dataMap = { popular: popularUsers, points: pointsUsers, drivers: driverUsers, movers: moverUsers };
    setUsers(dataMap[activeTab]);
  }, [activeTab, popularUsers, pointsUsers, driverUsers, moverUsers]);

  const onRefresh = () => { setRefreshing(true); loadFilteredLeaderboard(); };

  if (loading) return <FilteredLeaderboardSkeleton />;

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

      <View style={styles.entitySection}>
        <View style={styles.entityCard}>
          <View style={styles.entityIconBox}>
            <MapPin size={20} color={BRAND_COLOR} />
          </View>
          <View style={styles.entityTexts}>
            <Text style={styles.entityName}>{entityName}</Text>
            <View style={styles.followerCount}>
              <Users size={12} color="#666" />
              <Text style={styles.followerCountText}>{followerCount} FANS</Text>
            </View>
          </View>
        </View>
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
        {currentUser && (
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

        <View style={styles.list}>
          {users.filter(u => !u.isCurrentUser || currentUser?.rank <= 10).slice(0, 50).map((u, i) => (
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
          {users.length === 0 && (
            <View style={styles.emptyState}>
              <Trophy size={48} color="#111" />
              <Text style={styles.emptyTitle}>NO FANS YET</Text>
              <Text style={styles.emptySubtitle}>Be the first to join this community!</Text>
            </View>
          )}
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
  entitySection: { paddingHorizontal: 24, marginBottom: 24 },
  entityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#222', gap: 16 },
  entityIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  entityTexts: { gap: 2 },
  entityName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic' },
  followerCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  followerCountText: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  tabScroll: { maxHeight: 60, marginBottom: 16 },
  tabContent: { paddingHorizontal: 24, gap: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#222' },
  activeTab: { backgroundColor: '#222', borderColor: BRAND_COLOR },
  tabLabel: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  main: { flex: 1 },
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
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: '#222', letterSpacing: 2 },
  emptySubtitle: { fontSize: 12, color: '#444', fontWeight: '600' }
});