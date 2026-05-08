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
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable
} from 'react-native';
import {
  Users,
  UserPlus,
  Trophy,
  ChevronLeft,
  Share2,
  Star,
  Zap,
  MapPin,
  MessageSquare,
  Plus,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  Search as SearchIcon,
  Sword,
  Camera,
  Send,
  MoreVertical,
  Heart
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  FadeInUp
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BRAND_COLOR = '#1ea2b1';

interface SquadMember {
  user_id: string;
  role: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    points: number;
  };
}

interface Squad {
  id: string;
  name: string;
  description: string;
  level: number;
  points: number;
  invite_code: string;
  owner_id: string;
  member_count?: number;
}

interface SquadPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const SkeletonItem = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.memberCard, animatedStyle, { borderColor: '#111' }]}>
      <View style={[styles.avatar, { backgroundColor: '#222' }]} />
      <View style={styles.memberInfo}>
        <View style={{ width: 120, height: 16, backgroundColor: '#222', borderRadius: 4, marginBottom: 8 }} />
        <View style={{ width: 80, height: 12, backgroundColor: '#222', borderRadius: 4 }} />
      </View>
      <View style={{ width: 60, height: 24, backgroundColor: '#222', borderRadius: 12 }} />
    </Animated.View>
  );
};

const SquadsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.stickyHeader, { opacity: 1 }]}>
        <View style={styles.backButton} />
        <View style={{ width: 100, height: 20, backgroundColor: '#111', borderRadius: 4 }} />
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ height: 100, marginBottom: 20 }}>
          <View style={{ width: 150, height: 24, backgroundColor: '#111', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: 250, height: 32, backgroundColor: '#111', borderRadius: 4 }} />
        </View>
        <View style={[styles.heroCard, { backgroundColor: '#111', height: 200, borderWidth: 0 }]} />
        <View style={styles.section}>
          {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
        </View>
      </ScrollView>
    </View>
  );
};

export default function SquadsScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useProfile();
  const { join_code } = useLocalSearchParams<{ join_code: string }>();

  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [posts, setPosts] = useState<SquadPost[]>([]);
  const [allSquads, setAllSquads] = useState<Squad[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  const [newSquadName, setNewSquadName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [posting, setPosting] = useState(false);

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
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data: membership, error: memError } = await supabase
        .from('squad_members')
        .select('squad_id, status')
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (memError) throw memError;

      if (membership) {
        const { data: squadData, error: squadError } = await supabase
          .from('squads')
          .select('*')
          .eq('id', membership.squad_id)
          .single();

        if (squadError) throw squadError;
        setSquad(squadData);

        // Fetch members
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
          .eq('squad_id', membership.squad_id);

        if (membersError) throw membersError;
        setMembers(membersData as any);

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
          .eq('squad_id', membership.squad_id)
          .order('created_at', { ascending: false });

        if (!postsError) setPosts(postsData as any);
      } else {
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
      let rpcCall = supabase
        .from('squads')
        .select('*, squad_members(count)');

      if (query) {
        rpcCall = rpcCall.ilike('name', `%${query}%`);
      }

      const { data: squadsData, error: allSquadsError } = await rpcCall.limit(20);

      if (!allSquadsError) {
        const formatted = squadsData.map(s => ({
          ...s,
          member_count: s.squad_members[0]?.count || 0
        }));
        setAllSquads(formatted);
      }
    } catch (err) {
      console.error('Error fetching discovery squads:', err);
    }
  };

  useEffect(() => {
    fetchSquadData();
  }, [profile?.id]);

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

  const handleJoinSquad = async (targetSquad: Squad) => {
    if (!profile?.id) return;

    if (squad) {
      Alert.alert('Leave Current Squad?', 'You are already in a squad. You must leave your current squad to join a new one.');
      return;
    }

    try {
      setJoining(true);
      const { error } = await supabase
        .from('squad_members')
        .insert({
          squad_id: targetSquad.id,
          user_id: profile.id,
          role: 'member',
          status: 'accepted'
        });

      if (error) throw error;
      Alert.alert('Success', `You have joined ${targetSquad.name}!`);
      fetchSquadData();
    } catch (err) {
      console.error('Error joining squad:', err);
      Alert.alert('Error', 'Failed to join squad.');
    } finally {
      setJoining(false);
    }
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

      updateProfile({ points: profile.points - 1000 });

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
        <View style={{ width: 40 }} />
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
          </View>
          <Text style={[styles.greetingText, { color: '#FFF' }]}>
            {squad ? 'Dominating with,' : 'Choose your side,'}
          </Text>
          <Text style={[styles.headingText, { color: BRAND_COLOR }]}>
            {squad ? squad.name : 'and start the grind.'}
          </Text>
        </View>

        {!squad && (
          <Animated.View entering={FadeInDown.duration(800)}>
            <TouchableOpacity style={styles.createCtaCard} onPress={() => setShowCreateModal(true)}>
              <View style={styles.createCtaContent}>
                <View style={styles.createCtaIconBox}>
                  <Users size={24} color={BRAND_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createCtaTitle}>Form Your Own Legion</Text>
                  <Text style={styles.createCtaDesc}>Cost: 1,000 Points</Text>
                </View>
                <Plus size={24} color={BRAND_COLOR} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {squad && (
          <Animated.View entering={FadeInDown.duration(800)}>
            {/* Hero Section */}
            <View style={styles.heroCard}>
              <View style={styles.heroContent}>
                <View>
                  <Text style={styles.heroLabel}>YOUR SQUAD</Text>
                  <Text style={styles.heroName}>{squad.name}</Text>
                  <View style={styles.levelBadge}>
                    <Star size={12} color="#000" fill="#000" />
                    <Text style={styles.levelText}>Lvl {squad.level}</Text>
                  </View>
                </View>
                <View style={styles.squadIconContainer}>
                  <ShieldCheck size={40} color={BRAND_COLOR} strokeWidth={1.5} />
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Squad Influence: {squad.points} pts</Text>
                  <Text style={styles.progressValue}>{Math.round(Math.min(100, (squad.points % 1000) / 10))}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, (squad.points % 1000) / 10)}%` }]} />
                </View>
              </View>
            </View>

            <View style={styles.actionBar}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 0, width: '100%' }]} onPress={handleShareInvite}>
                <View style={styles.actionBtnInner}>
                  <UserPlus size={20} color={BRAND_COLOR} />
                  <Text style={styles.actionBtnText}>Recruit Members</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionBar, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPostModal(true)}>
                <View style={styles.actionBtnInner}>
                  <MessageSquare size={20} color={BRAND_COLOR} />
                  <Text style={styles.actionBtnText}>War Room</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/Leaderboard')}>
                <View style={styles.actionBtnInner}>
                  <Trophy size={20} color={BRAND_COLOR} />
                  <Text style={styles.actionBtnText}>Ranks</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Squad Feed - NEW SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SQUAD INTEL (FEED)</Text>
                <TouchableOpacity onPress={() => setShowPostModal(true)}>
                  <Plus size={18} color={BRAND_COLOR} />
                </TouchableOpacity>
              </View>

              {posts.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <Text style={styles.emptyText}>No intel reports yet. Be the first to post!</Text>
                </View>
              ) : (
                posts.map((post, index) => (
                  <Animated.View
                    key={post.id}
                    entering={FadeInUp.delay(index * 100).duration(600).springify()}
                    style={styles.postCard}
                  >
                    <View style={styles.postHeader}>
                      <Image
                        source={{ uri: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.first_name}+${post.profiles?.last_name}&background=111&color=fff` }}
                        style={styles.postAvatar}
                      />
                      <View style={styles.postAuthorInfo}>
                        <Text style={styles.postAuthorName}>{post.profiles?.first_name} {post.profiles?.last_name?.charAt(0)}.</Text>
                        <Text style={styles.postTime}>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      <TouchableOpacity>
                        <MoreVertical size={16} color="#444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.postContent}>{post.content}</Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity style={styles.postActionBtn}>
                        <Heart size={16} color="#444" />
                        <Text style={styles.postActionText}>Boost</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>

            {/* Squad Members */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SQUAD MATES</Text>
                <Text style={styles.sectionCount}>{members.length}/10</Text>
              </View>

              {members.map((member, index) => (
                <Animated.View
                  key={member.user_id}
                  entering={FadeInRight.delay(index * 100).duration(500)}
                  style={styles.memberCard}
                >
                  <Image
                    source={{ uri: member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${member.profiles?.first_name}+${member.profiles?.last_name}&background=111&color=fff` }}
                    style={styles.avatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.profiles?.first_name} {member.profiles?.last_name?.charAt(0)}.</Text>
                    <Text style={styles.memberRole}>{member.role.toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberStatus}>
                    <Text style={styles.statusText}>{member.profiles?.points} pts</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Discovery List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SQUAD DISCOVERY & RIVALS</Text>
            {joining && <ActivityIndicator size="small" color={BRAND_COLOR} />}
          </View>

          <View style={[styles.searchBar, { backgroundColor: '#1A1D1E', marginTop: 0 }]}>
            <SearchIcon size={22} color="#888888" />
            <TextInput
              style={styles.searchPlaceholder}
              placeholder="Search rivals..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {allSquads.length === 0 ? (
            <View style={styles.emptySquads}>
              <Text style={styles.emptyText}>No rival squads detected.</Text>
            </View>
          ) : (
            allSquads.map((s, index) => {
              const isOwnSquad = squad?.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.squadDiscoveryCard, isOwnSquad && { borderColor: BRAND_COLOR }]}
                  onPress={() => !isOwnSquad && handleJoinSquad(s)}
                  disabled={isOwnSquad}
                >
                  <View style={[styles.squadDiscoveryIcon, isOwnSquad && { backgroundColor: BRAND_COLOR }]}>
                    {isOwnSquad ? <ShieldCheck size={24} color="#000" /> : <Sword size={24} color="#666" />}
                  </View>
                  <View style={styles.squadDiscoveryInfo}>
                    <Text style={styles.squadDiscoveryName}>{s.name} {isOwnSquad && '(YOU)'}</Text>
                    <Text style={styles.squadDiscoveryStats}>
                      Level {s.level} • {s.member_count || 0} Members
                    </Text>
                  </View>
                  {!isOwnSquad ? (
                    <View style={styles.joinBadge}>
                      <Text style={styles.joinBadgeText}>JOIN</Text>
                      <ArrowRight size={14} color="#000" />
                    </View>
                  ) : (
                    <View style={[styles.joinBadge, { backgroundColor: '#111', borderWidth: 1, borderColor: BRAND_COLOR }]}>
                      <Text style={[styles.joinBadgeText, { color: BRAND_COLOR }]}>YOURS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.referralCard}>
          <Trophy size={32} color="#fbbf24" style={styles.referralIcon} />
          <Text style={styles.referralTitle}>Expand Your Legion</Text>
          <Text style={styles.referralDesc}>
            Recruit more members to increase your squad's power and dominate the leaderboard!
          </Text>
          <TouchableOpacity style={styles.referralBtn} onPress={handleShareInvite}>
            <Text style={styles.referralBtnText}>Recruit Buddies</Text>
            <Share2 size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Floating Action Button for Feed */}
      {squad && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowPostModal(true)}
        >
          <LinearGradient
            colors={[BRAND_COLOR, '#15808d']}
            style={styles.fabInner}
          >
            <MessageSquare size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* New Post Modal Overlay */}
      <Modal
        visible={showPostModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Intel</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)} style={styles.closeBtn}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>What's happening?</Text>
              <TextInput
                style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Share a status update with your squad..."
                placeholderTextColor="#444"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                autoFocus
              />
              <TouchableOpacity style={styles.addMediaBtn}>
                <Camera size={20} color={BRAND_COLOR} />
                <Text style={styles.addMediaText}>Attach Evidence (Photo)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, !postContent.trim() && { opacity: 0.5 }]}
              onPress={handleCreatePost}
              disabled={!postContent.trim() || posting}
            >
              <LinearGradient
                colors={[BRAND_COLOR, '#15808d']}
                style={styles.confirmBtnInner}
              >
                {posting ? <ActivityIndicator color="#FFF" /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Send size={18} color="#FFF" />
                    <Text style={styles.confirmBtnText}>Broadcast Update</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create Squad Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Form New Squad</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Squad Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Shadow Syndicate"
                placeholderTextColor="#444"
                value={newSquadName}
                onChangeText={setNewSquadName}
                autoFocus
              />
              <View style={styles.costInfo}>
                <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.inputHint}>Deducts 1,000 Points from your account.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, !newSquadName.trim() && { opacity: 0.5 }]}
              onPress={handleCreateSquad}
              disabled={!newSquadName.trim() || creating}
            >
              <LinearGradient
                colors={[BRAND_COLOR, '#15808d']}
                style={styles.confirmBtnInner}
              >
                {creating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Buy Legion</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
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
    marginBottom: 12,
    gap: 16,
  },
  largeBackButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headingText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 0,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    marginLeft: 12,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroName: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  levelText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  squadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BRAND_COLOR,
    borderRadius: 3,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionCount: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '900',
  },
  postCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  postAuthorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  postTime: {
    color: '#444',
    fontSize: 10,
    marginTop: 2,
  },
  postContent: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyFeed: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#222',
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
  memberRole: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  memberStatus: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: '900',
  },
  referralCard: {
    marginTop: 40,
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
  },
  referralIcon: {
    marginBottom: 16,
  },
  referralTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  referralDesc: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
  },
  referralBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  createCtaCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    borderStyle: 'dashed',
  },
  createCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  createCtaIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createCtaTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  createCtaDesc: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  squadDiscoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  squadDiscoveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadDiscoveryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  squadDiscoveryName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  squadDiscoveryStats: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  joinBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  emptySquads: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#444',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 40,
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.1)',
  },
  addMediaText: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '700',
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  inputLabel: {
    color: '#444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#222',
  },
  inputHint: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  confirmBtnInner: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  }
});












