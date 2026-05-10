import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Share,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  Users,
  Trophy,
  ChevronLeft,
  Star,
  Zap,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

// Components
import { MySquadTab } from '@/components/squads/MySquadTab';
import { DiscoveryTab } from '@/components/squads/DiscoveryTab';
import { LeaderboardTab } from '@/components/squads/LeaderboardTab';
import { CreateSquadModal } from '@/components/squads/CreateSquadModal';
import { PostModal } from '@/components/squads/PostModal';
import { ContributeModal } from '@/components/squads/ContributeModal';

const BRAND_COLOR = '#1ea2b1';

type Squad = {
  id: string;
  name: string;
  description: string;
  points: number;
  level: number;
  avatar_url: string;
  invite_code: string;
  member_count?: number;
  owner_id?: string;
};

type SquadMember = {
  user_id: string;
  role: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    points: number;
  };
};

type SquadPost = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
};

// Simple inline skeleton component to avoid external dependency
const SquadsSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ marginBottom: 20 }}>
        <View style={{ height: 100, backgroundColor: '#111', borderRadius: 12, marginBottom: 10 }} />
        <View style={{ height: 60, backgroundColor: '#111', borderRadius: 12 }} />
      </View>
    ))}
  </View>
);

export default function SquadsScreen() {
  const { colors } = useTheme();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { join_code } = useLocalSearchParams<{ join_code: string }>();

  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [posts, setPosts] = useState<SquadPost[]>([]);
  const [allSquads, setAllSquads] = useState<Squad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-squad' | 'discovery' | 'leaderboard'>('discovery');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const initialTabSet = useRef(false);

  const isLeader = members.find(m => m.user_id === profile?.id)?.role === 'leader' || squad?.owner_id === profile?.id;

  // Set initial tab based on squad membership only once
  useEffect(() => {
    if (!loading && !initialTabSet.current) {
      if (squad) {
        setActiveTab('my-squad');
      } else {
        setActiveTab('discovery');
      }
      initialTabSet.current = true;
    }
  }, [loading, squad]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 100], [0, 1]),
      transform: [
        { translateY: interpolate(scrollY.value, [0, 100], [10, 0]) }
      ]
    };
  });

  const fetchSquadData = useCallback(async () => {
    console.log('🔍 fetchSquadData called. Profile ID:', profile?.id);
    if (!profile?.id) {
      console.log('⚠️ No profile ID, fetching only discovery squads...');
      await fetchAllSquads(searchQuery);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Fetching membership for:', profile.id);

      // Single query to get membership and squad details
      const { data: memberInfo, error: memError } = await supabase
        .from('squad_members')
        .select(`
          status,
          squad_id,
          squads (*)
        `)
        .eq('user_id', profile.id)
        .maybeSingle();

      console.log('📊 Membership fetch result:', {
        status: memberInfo?.status,
        hasSquad: !!memberInfo?.squads,
        error: memError
      });

      if (memError) {
        console.error('❌ Membership fetch error:', memError);
        throw memError;
      }

      // Fix: Handle null status as 'accepted' for now to allow user access
      const isActiveMember = memberInfo && memberInfo.squads && (memberInfo.status === 'accepted' || memberInfo.status === null);

      if (isActiveMember) {
        const squadData = memberInfo.squads;
        console.log('✅ Squad found:', squadData.name);
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
          .eq('squad_id', memberInfo.squad_id);

        if (membersError) {
          console.error('❌ Members fetch error:', membersError);
        } else {
          setMembers(membersData as any);
        }

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('squad_posts')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('squad_id', memberInfo.squad_id)
          .order('created_at', { ascending: false });

        if (postsError) {
          console.error('❌ Posts fetch error:', postsError);
        } else {
          setPosts(postsData as any);
        }
      } else {
        // Not an active member of any squad
        setSquad(null);
        setMembers([]);
        setPosts([]);
      }

      await fetchAllSquads(searchQuery);

    } catch (error) {
      console.error('Error fetching squad data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, searchQuery]);

  const fetchAllSquads = async (query = '') => {
    try {
      let supabaseQuery = supabase
        .from('squads')
        .select('*, squad_members(count)');

      if (query) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }

      const { data: squadsData, error } = await supabaseQuery;

      if (error) throw error;

      if (squadsData) {
        console.log(`✨ Fetched ${squadsData.length} discovery squads`);
        const formatted = squadsData.map(s => {
          const mCount = Array.isArray(s.squad_members)
            ? (s.squad_members[0]?.count || 0)
            : (s.squad_members?.count || 0);

          return {
            ...s,
            member_count: mCount
          };
        });
        setAllSquads(formatted);
      }
    } catch (err) {
      console.error('Error fetching discovery squads:', err);
    }
  };

  useEffect(() => {
    console.log('🔄 Profile sync effect. ID:', profile?.id, 'Loading:', profileLoading);
    fetchSquadData();
  }, [profile?.id, profileLoading]);

  useEffect(() => {
    if (join_code && profile?.id && !squad && !loading) {
      handleJoinByCode(join_code);
    }
  }, [join_code, profile?.id, squad, loading]);

  const handleJoinByCode = async (code: string) => {
    try {
      setJoining(true);
      const { data: targetSquad, error: findError } = await supabase
        .from('squads')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (findError || !targetSquad) {
        Alert.alert('Invalid Code', 'The squad you are trying to join does not exist.');
        return;
      }

      if (squad) {
        Alert.alert('Already in a Squad', 'You are already in a squad. You must leave your current squad to join a new one.');
        return;
      }

      Alert.alert(
        'Join Squad?',
        `Do you want to join "${targetSquad.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: async () => {
              const { error: joinError } = await supabase
                .from('squad_members')
                .insert({ squad_id: targetSquad.id, user_id: profile?.id, role: 'member', status: 'accepted' });

              if (joinError) {
                Alert.alert('Error', 'Could not join squad. You might already be in a squad.');
              } else {
                fetchSquadData();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error joining squad:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!profile?.id || !squad) return;

    Alert.alert(
      'Leave Squad?',
      `Are you sure you want to leave "${squad.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('squad_members')
                .delete()
                .eq('squad_id', squad.id)
                .eq('user_id', profile.id);

              if (error) throw error;

              Alert.alert('Left Squad', `You have left ${squad.name}.`);
              fetchSquadData();
            } catch (err) {
              console.error('Error leaving squad:', err);
              Alert.alert('Error', 'Failed to leave squad.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleKickMember = async (member: SquadMember) => {
    if (!isLeader || !squad) return;

    Alert.alert(
      'Remove Member?',
      `Are you sure you want to remove ${member.profiles?.first_name} from the squad?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('squad_members')
                .delete()
                .eq('squad_id', squad.id)
                .eq('user_id', member.user_id);

              if (error) throw error;

              Alert.alert('Member Removed', `${member.profiles?.first_name} has been removed.`);
              fetchSquadData();
            } catch (err) {
              console.error('Error removing member:', err);
              Alert.alert('Error', 'Failed to remove member.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim() || !profile?.id) return;

    if (squad) {
      Alert.alert('In a Squad', 'You are already in a squad. You cannot create a new one until you leave.');
      return;
    }

    if ((profile.points || 0) < 1000) {
      Alert.alert('Insufficient Points', 'You need at least 1,000 points to create a squad.');
      return;
    }

    try {
      setCreating(true);

      const { error: pointError } = await supabase
        .from('profiles')
        .update({ points: profile.points - 1000 })
        .eq('id', profile.id);

      if (pointError) throw pointError;

      const { data, error } = await supabase
        .from('squads')
        .insert({
          name: newSquadName.trim(),
          owner_id: profile.id,
          description: 'Our elite travel squad'
        })
        .select()
        .single();

      if (error) throw error;

      if (updateProfile) {
        updateProfile({ points: profile.points - 1000 });
      }

      setShowCreateModal(false);
      setNewSquadName('');
      fetchSquadData();
    } catch (err) {
      console.error('Error creating squad:', err);
      Alert.alert('Error', 'Failed to create squad.');
    } finally {
      setCreating(false);
    }
  };

  const handleContributePoints = async () => {
    const amount = parseInt(contributionAmount);
    if (isNaN(amount) || amount <= 0 || !profile?.id || !squad) return;

    if ((profile.points || 0) < amount) {
      Alert.alert('Insufficient Points', 'You do not have enough points to contribute this amount.');
      return;
    }

    try {
      setContributing(true);

      const { error: userError } = await supabase
        .from('profiles')
        .update({ points: profile.points - amount })
        .eq('id', profile.id);

      if (userError) throw userError;

      const { error: squadError } = await supabase
        .from('squads')
        .update({ points: (squad.points || 0) + amount })
        .eq('id', squad.id);

      if (squadError) throw squadError;

      if (updateProfile) {
        updateProfile({ points: profile.points - amount });
      }

      Alert.alert('Contribution Successful', `You contributed ${amount} points to ${squad.name}!`);
      setShowContributeModal(false);
      setContributionAmount('');
      fetchSquadData();
    } catch (err) {
      console.error('Error contributing points:', err);
      Alert.alert('Error', 'Failed to process contribution.');
    } finally {
      setContributing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !squad || !profile?.id) return;

    try {
      setPosting(true);
      const { error } = await supabase
        .from('squad_posts')
        .insert({
          squad_id: squad.id,
          user_id: profile.id,
          content: postContent.trim()
        });

      if (error) throw error;

      setShowPostModal(false);
      setPostContent('');
      fetchSquadData();
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', 'Failed to share update.');
    } finally {
      setPosting(false);
    }
  };

  const handleShareInvite = async () => {
    if (!squad) return;
    try {
      const shareUrl = `https://uthutho.com/squads?join_code=${squad.invite_code}`;
      await Share.share({
        message: `Join my Uthutho Travel Squad "${squad.name}"! Let's commute together and earn rewards.\n\nJoin here: ${shareUrl}\n\nDownload Uthutho: https://uthutho.com/download`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchAllSquads(text);
  };

  if (loading && !squad && allSquads.length === 0) {
    return <SquadsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Sticky Animated Header */}
      <Animated.View style={[styles.stickyHeader, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{squad ? squad.name : 'Squad Discovery'}</Text>
        {!squad && (
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.headerActionBtn}>
            <Plus color={BRAND_COLOR} size={24} />
          </TouchableOpacity>
        )}
        {squad && <View style={{ width: 40 }} />}
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.homeStyleHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.largeBackButton}>
              <ChevronLeft color="#FFF" size={28} />
            </TouchableOpacity>
            <Text style={[styles.readyText, { color: BRAND_COLOR }]}>
              BATTLE READY
            </Text>
            {!squad && (
              <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.headerPlusBtn}>
                <Plus color={BRAND_COLOR} size={28} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.greetingText, { color: '#FFF' }]}>
            {squad ? 'Dominating with,' : 'Choose your side,'}
          </Text>
          <Text style={[styles.headingText, { color: BRAND_COLOR }]}>
            {squad ? squad.name : 'and start the grind.'}
          </Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          {[
            { id: 'my-squad', label: 'MY SQUAD', icon: ShieldCheck, disabled: !squad },
            { id: 'discovery', label: 'DISCOVERY', icon: Users },
            { id: 'leaderboard', label: 'LEADER', icon: Trophy }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && styles.activeTabItem,
                tab.disabled && { opacity: 0.3 }
              ]}
              onPress={() => !tab.disabled && setActiveTab(tab.id as any)}
              disabled={tab.disabled}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.id ? BRAND_COLOR : '#666'}
                strokeWidth={activeTab === tab.id ? 2.5 : 2}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Render tabs */}
        <View style={styles.tabContent}>
          {activeTab === 'my-squad' && squad && (
            <MySquadTab
              squad={squad}
              members={members}
              posts={posts}
              profile={profile}
              isLeader={isLeader}
              onShareInvite={handleShareInvite}
              onShowPostModal={() => setShowPostModal(true)}
              onShowContributeModal={() => setShowContributeModal(true)}
              onLeaveSquad={handleLeaveSquad}
              onKickMember={handleKickMember}
              onViewLeaderboard={() => setActiveTab('leaderboard')}
              BRAND_COLOR={BRAND_COLOR}
            />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryTab
              allSquads={allSquads}
              searchQuery={searchQuery}
              onSearch={handleSearch}
              onSelectSquad={(id) => router.push({ pathname: '/squad-details', params: { id } })}
              joining={joining}
              BRAND_COLOR={BRAND_COLOR}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              allSquads={allSquads}
              onSelectSquad={(id) => router.push({ pathname: '/squad-details', params: { id } })}
              BRAND_COLOR={BRAND_COLOR}
            />
          )}
        </View>
      </Animated.ScrollView>

      {/* Modals */}
      <CreateSquadModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newSquadName={newSquadName}
        setNewSquadName={setNewSquadName}
        onCreate={handleCreateSquad}
        creating={creating}
        BRAND_COLOR={BRAND_COLOR}
      />

      <PostModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        postContent={postContent}
        setPostContent={setPostContent}
        onCreatePost={handleCreatePost}
        posting={posting}
        BRAND_COLOR={BRAND_COLOR}
      />

      <ContributeModal
        visible={showContributeModal}
        onClose={() => setShowContributeModal(false)}
        amount={contributionAmount}
        setAmount={setContributionAmount}
        onConfirm={handleContributePoints}
        loading={contributing}
        userPoints={profile?.points || 0}
        BRAND_COLOR={BRAND_COLOR}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: 'rgba(0,0,0,0.9)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlusBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  homeStyleHeader: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 4,
  },
  headingText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    padding: 6,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  activeTabItem: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#222',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1,
  },
  activeTabLabel: {
    color: BRAND_COLOR,
  },
  tabContent: {
    flex: 1,
  },
});