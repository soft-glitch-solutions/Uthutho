import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  ShieldCheck,
  Sword,
  Users,
  Trophy,
  Zap,
  Star,
  ChevronLeft,
  ArrowRight,
  UserPlus
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const BRAND_COLOR = '#1ea2b1';

export default function SquadDetailsScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [squad, setSquad] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [userMembership, setUserMembership] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, profile?.id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      // Fetch squad info
      const { data: squadData, error: squadError } = await supabase
        .from('squads')
        .select('*')
        .eq('id', id)
        .single();

      if (squadError) throw squadError;
      setSquad(squadData);

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('squad_members')
        .select(`
          user_id,
          role,
          status,
          profiles (
            first_name,
            last_name,
            avatar_url,
            points
          )
        `)
        .eq('squad_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check current user's membership in ANY squad
      if (profile?.id) {
        const { data: membership } = await supabase
          .from('squad_members')
          .select('squad_id, status')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        setUserMembership(membership);
      }

    } catch (error) {
      console.error('Error fetching squad details:', error);
      Alert.alert('Error', 'Could not load squad details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!profile?.id || !squad) return;

    if (userMembership) {
      Alert.alert('Already in a Squad', 'You must leave your current squad before joining a new one.');
      return;
    }

    try {
      setJoining(true);
      const { error } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: profile.id,
          role: 'member',
          status: 'accepted'
        });

      if (error) throw error;
      
      Alert.alert('Success', `You have joined ${squad.name}!`);
      fetchDetails();
    } catch (err) {
      console.error('Error joining squad:', err);
      Alert.alert('Error', 'Failed to join squad.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  const leaders = members.filter(m => m.role === 'leader' || m.user_id === squad.owner_id);
  const normalMembers = members.filter(m => m.role !== 'leader' && m.user_id !== squad.owner_id);
  const isMember = userMembership?.squad_id === squad.id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Legion Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.heroCard}>
          <LinearGradient
            colors={['#111', '#050505']}
            style={styles.heroInner}
          >
            <View style={styles.squadBadge}>
              <ShieldCheck size={48} color={BRAND_COLOR} strokeWidth={1.5} />
            </View>
            <Text style={styles.squadName}>{squad.name}</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Zap size={14} color={BRAND_COLOR} fill={BRAND_COLOR} />
                <Text style={styles.statLabel}>Level {squad.level}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Trophy size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.statLabel}>{squad.points} Influence</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>LEGION INTEL</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {squad.description || "An elite legion dedicated to the commute revolution. Join us to dominate the streets and earn collective rewards."}
            </Text>
          </View>
        </Animated.View>

        {/* Leadership */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>COMMANDERS</Text>
          <View style={styles.membersGrid}>
            {leaders.map((leader, index) => (
              <View key={leader.user_id} style={styles.leaderCard}>
                <Image
                  source={{ uri: leader.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${leader.profiles?.first_name}+${leader.profiles?.last_name}&background=111&color=fff` }}
                  style={styles.leaderAvatar}
                />
                <Text style={styles.leaderName}>{leader.profiles?.first_name}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{leader.user_id === squad.owner_id ? 'GENERAL' : 'COMMANDER'}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Members */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WARRIORS</Text>
            <Text style={styles.memberCount}>{members.length}/10</Text>
          </View>
          {normalMembers.map((member, index) => (
            <View key={member.user_id} style={styles.memberListItem}>
              <Image
                source={{ uri: member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${member.profiles?.first_name}+${member.profiles?.last_name}&background=111&color=fff` }}
                style={styles.memberAvatar}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.profiles?.first_name} {member.profiles?.last_name?.charAt(0)}.</Text>
                <Text style={styles.memberPoints}>{member.profiles?.points} Influence points</Text>
              </View>
              <Users size={16} color="#444" />
            </View>
          ))}
          {normalMembers.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No warriors recruited yet.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Action Button */}
      {!isMember && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.joinBtn, userMembership && { opacity: 0.5 }]}
            onPress={handleJoin}
            disabled={joining}
          >
            <LinearGradient
              colors={[BRAND_COLOR, '#15808d']}
              style={styles.joinBtnInner}
            >
              {joining ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <UserPlus size={20} color="#FFF" />
                  <Text style={styles.joinBtnText}>JOIN THIS LEGION</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {isMember && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.activeBtn}
            onPress={() => router.push('/squads')}
          >
            <ShieldCheck size={20} color={BRAND_COLOR} />
            <Text style={styles.activeBtnText}>ALREADY IN THIS LEGION</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  heroInner: {
    padding: 32,
    alignItems: 'center',
  },
  squadBadge: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  squadName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#333',
  },
  statLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  descriptionCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  descriptionText: {
    color: '#CCC',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  leaderCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#222',
  },
  leaderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginBottom: 12,
  },
  leaderName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: '900',
  },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  memberPoints: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  memberCount: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  joinBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeBtn: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
  },
  activeBtnText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
