import React, { useState, useEffect } from 'react';
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
  FlatList
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
  MessageSquare
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

const BRAND_COLOR = '#1ea2b1';

// Mock Data for Squad Members
const MOCK_MEMBERS = [
  { id: '1', name: 'Zolani D.', role: 'Squad Leader', level: 45, avatar: 'https://i.pravatar.cc/150?u=zolani', status: 'In Transit' },
  { id: '2', name: 'Sihle M.', role: 'Eco Warrior', level: 32, avatar: 'https://i.pravatar.cc/150?u=sihle', status: 'At Stop' },
  { id: '3', name: 'Thabo K.', role: 'Commuter', level: 18, avatar: 'https://i.pravatar.cc/150?u=thabo', status: 'Offline' },
];

// Mock Data for Squad Achievements
const SQUAD_ACHIEVEMENTS = [
  { id: '1', title: 'Carbon Crushers', description: '50 combined journeys as a squad', progress: 0.8, icon: <Zap size={20} color="#fbbf24" /> },
  { id: '2', title: 'Route Masters', description: 'Explored 10 different routes together', progress: 0.4, icon: <MapPin size={20} color="#1ea2b1" /> },
];

export default function CliqScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
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

  const handleShareInvite = async () => {
    try {
      const result = await Share.share({
        message: `Join my Uthutho Travel Squad! Let's commute together and earn rewards. Use my link to download the app: https://uthutho.com/invite/${profile?.id || 'squad'}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sticky Animated Header */}
      <Animated.View style={[styles.stickyHeader, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Travel Squad</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <LinearGradient
            colors={[BRAND_COLOR, '#111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroLabel}>THE CLIQ</Text>
                <Text style={styles.heroName}>Phambili Squad</Text>
                <View style={styles.levelBadge}>
                  <Star size={12} color="#000" fill="#000" />
                  <Text style={styles.levelText}>Lvl 12</Text>
                </View>
              </View>
              <View style={styles.squadIconContainer}>
                <Users size={40} color="#FFF" strokeWidth={1.5} />
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Squad Goal: Platinum Tier</Text>
                <Text style={styles.progressValue}>75%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '75%' }]} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.actionBtn, { flex: 0, width: '100%' }]} onPress={handleShareInvite}>
            <LinearGradient
              colors={['#222', '#111']}
              style={styles.actionBtnInner}
            >
              <UserPlus size={20} color={BRAND_COLOR} />
              <Text style={styles.actionBtnText}>Invite Buddy to Squad</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.actionBar, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.actionBtn}>
            <LinearGradient
              colors={['#222', '#111']}
              style={styles.actionBtnInner}
            >
              <MessageSquare size={20} color={BRAND_COLOR} />
              <Text style={styles.actionBtnText}>Squad Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/Leaderboard')}>
            <LinearGradient
              colors={['#222', '#111']}
              style={styles.actionBtnInner}
            >
              <Trophy size={20} color={BRAND_COLOR} />
              <Text style={styles.actionBtnText}>Leaderboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Squad Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SQUAD MEMBERS</Text>
            <Text style={styles.sectionCount}>3/5</Text>
          </View>

          {MOCK_MEMBERS.map((member, index) => (
            <Animated.View
              key={member.id}
              entering={FadeInRight.delay(index * 100).duration(500)}
              style={styles.memberCard}
            >
              <Image source={{ uri: member.avatar }} style={styles.avatar} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <View style={styles.memberStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: member.status === 'Offline' ? '#444' : BRAND_COLOR }
                ]} />
                <Text style={styles.statusText}>{member.status}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Squad Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SQUAD ACHIEVEMENTS</Text>

          {SQUAD_ACHIEVEMENTS.map((ach, index) => (
            <Animated.View
              key={ach.id}
              entering={FadeInDown.delay(400 + index * 100)}
              style={styles.achievementCard}
            >
              <View style={styles.achIconBox}>
                {ach.icon}
              </View>
              <View style={styles.achContent}>
                <Text style={styles.achTitle}>{ach.title}</Text>
                <Text style={styles.achDesc}>{ach.description}</Text>
                <View style={styles.achProgressBg}>
                  <View style={[styles.achProgressFill, { width: `${ach.progress * 100}%` }]} />
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Referral Program Info */}
        <View style={styles.referralCard}>
          <Trophy size={32} color="#fbbf24" style={styles.referralIcon} />
          <Text style={styles.referralTitle}>Expand Your Cliq</Text>
          <Text style={styles.referralDesc}>
            Invite 2 more friends to unlock the "Squad Goals" badge and earn 500 bonus points!
          </Text>
          <TouchableOpacity style={styles.referralBtn} onPress={handleShareInvite}>
            <Text style={styles.referralBtnText}>Share Invitation Link</Text>
            <Share2 size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
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
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
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
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionCount: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: '900',
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
    width: 48,
    height: 48,
    borderRadius: 16,
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
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    gap: 16,
  },
  achIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achContent: {
    flex: 1,
  },
  achTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  achDesc: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
  },
  achProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achProgressFill: {
    height: '100%',
    backgroundColor: BRAND_COLOR,
  },
  referralCard: {
    marginTop: 32,
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
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
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  referralDesc: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
  },
  referralBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});
