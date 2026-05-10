import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  Star,
  UserPlus,
  MessageSquare,
  Trophy,
  LogOut,
  Plus,
  Zap,
  X,
  Heart,
  MoreVertical
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';

interface MySquadTabProps {
  squad: any;
  members: any[];
  posts: any[];
  profile: any;
  isLeader: boolean;
  onShareInvite: () => void;
  onShowPostModal: () => void;
  onShowContributeModal: () => void;
  onLeaveSquad: () => void;
  onKickMember: (member: any) => void;
  onViewLeaderboard: () => void;
  BRAND_COLOR: string;
}

export const MySquadTab = ({
  squad,
  members,
  posts,
  profile,
  isLeader,
  onShareInvite,
  onShowPostModal,
  onShowContributeModal,
  onLeaveSquad,
  onKickMember,
  onViewLeaderboard,
  BRAND_COLOR
}: MySquadTabProps) => {
  return (
    <Animated.View entering={FadeInDown.duration(800)} style={{ flex: 1 }}>
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
            <View style={[styles.progressBarFill, { width: `${Math.min(100, (squad.points % 1000) / 10)}%`, backgroundColor: BRAND_COLOR }]} />
          </View>
          <TouchableOpacity
            style={[styles.contributeBtn, { backgroundColor: BRAND_COLOR }]}
            onPress={onShowContributeModal}
          >
            <Zap size={14} color="#000" fill="#000" />
            <Text style={styles.contributeBtnText}>CONTRIBUTE POINTS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={onShareInvite}>
          <View style={styles.actionBtnInner}>
            <UserPlus size={20} color={BRAND_COLOR} />
            <Text style={styles.actionBtnText}>Recruit Members</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={onShowPostModal}>
          <View style={styles.actionBtnInner}>
            <MessageSquare size={20} color={BRAND_COLOR} />
            <Text style={styles.actionBtnText}>War Room</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onViewLeaderboard}>
          <View style={styles.actionBtnInner}>
            <Trophy size={20} color={BRAND_COLOR} />
            <Text style={styles.actionBtnText}>Ranks</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={onLeaveSquad}>
          <View style={styles.actionBtnInner}>
            <LogOut size={20} color="#ef4444" />
            <Text style={[styles.actionBtnText, styles.dangerText]}>Leave Squad</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Squad Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SQUAD INTEL (FEED)</Text>
          <TouchableOpacity onPress={onShowPostModal}>
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
              <Text style={[styles.statusText, { color: BRAND_COLOR }]}>{member.profiles?.points} pts</Text>
            </View>
            {isLeader && member.user_id !== profile?.id && (
              <TouchableOpacity
                style={styles.kickBtn}
                onPress={() => onKickMember(member)}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroLabel: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  levelText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  squadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1A1D1E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  contributeBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  contributeBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    height: 56,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dangerBtn: {
    borderColor: '#ef444430',
  },
  dangerText: {
    color: '#ef4444',
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
    color: '#1ea2b1',
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
  },
  emptyText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
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
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  kickBtn: {
    padding: 8,
    marginLeft: 8,
  },
});