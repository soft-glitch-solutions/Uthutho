import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Badge, Star, ChevronRight, Users, Trophy, Lock, CheckCircle, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_COLOR = '#1ea2b1';

interface TitleDefinition {
  name: string;
  points: number;
  lore: string;
  icon: string;
  accent: string;
  gradient: [string, string];
}

const TITLES: TitleDefinition[] = [
  {
    name: 'Rookie Rider',
    points: 0,
    lore: 'Every legend starts somewhere. You\'ve just boarded the first wagon of an epic journey.',
    icon: '🚌',
    accent: '#888',
    gradient: ['#111', '#1a1a1a'],
  },
  {
    name: 'Commuter',
    points: 500,
    lore: 'The roads know your name. You move with purpose, rhythm and respect.',
    icon: '🛤️',
    accent: '#1ea2b1',
    gradient: ['#0d3a3f', '#111'],
  },
  {
    name: 'Transit Ace',
    points: 1500,
    lore: 'You\'ve cracked the code. No delay rattles you, no detour catches you off guard.',
    icon: '⚡',
    accent: '#8B5CF6',
    gradient: ['#1e1040', '#111'],
  },
  {
    name: 'Road Warrior',
    points: 3000,
    lore: 'No route is too far, no stop too obscure. You ride when others rest.',
    icon: '🔥',
    accent: '#ef4444',
    gradient: ['#3a0d0d', '#111'],
  },
  {
    name: 'Hub Legend',
    points: 6000,
    lore: 'The community stops when you speak. Drivers nod. Commuters listen. You are the pulse.',
    icon: '👑',
    accent: '#fbbf24',
    gradient: ['#3a2a00', '#111'],
  },
  {
    name: 'Legion Commander',
    points: 10000,
    lore: 'You lead, others follow. A true tactician of the transit grid — fear and respect, in equal measure.',
    icon: '🏆',
    accent: '#fbbf24',
    gradient: ['#3a2a00', '#1a1000'],
  },
];

interface AchievementsTabProps {
  colors: any;
  loading: boolean;
  isDesktop?: boolean;
  profile?: {
    points?: number;
    selected_title?: string;
  } | null;
}

function getCurrentTitle(points: number): TitleDefinition {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (points >= t.points) current = t;
  }
  return current;
}

function getNextTitle(points: number): TitleDefinition | null {
  for (const t of TITLES) {
    if (points < t.points) return t;
  }
  return null;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  colors,
  loading,
  isDesktop,
  profile,
}) => {
  const userPoints = profile?.points || 0;
  const currentTitle = getCurrentTitle(userPoints);
  const nextTitle = getNextTitle(userPoints);
  const progressToNext = nextTitle
    ? Math.min((userPoints - currentTitle.points) / (nextTitle.points - currentTitle.points), 1)
    : 1;

  return (
    <View style={styles.container}>

      {/* Points Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressLabel}>CURRENT RANK</Text>
            <Text style={[styles.progressTitle, { color: currentTitle.accent }]}>
              {currentTitle.icon} {currentTitle.name}
            </Text>
          </View>
          <View style={styles.pointsBubble}>
            <Zap size={14} color={BRAND_COLOR} />
            <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
            <Text style={styles.pointsSuffix}>pts</Text>
          </View>
        </View>

        {nextTitle ? (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressToNext * 100}%`, backgroundColor: nextTitle.accent }]} />
            </View>
            <Text style={styles.progressHint}>
              {(nextTitle.points - userPoints).toLocaleString()} pts to unlock <Text style={{ color: nextTitle.accent, fontWeight: '800' }}>{nextTitle.name}</Text>
            </Text>
          </>
        ) : (
          <Text style={[styles.progressHint, { color: '#fbbf24' }]}>
            🏆 You have reached the highest rank!
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/changetitle' as any)}>
        <View style={styles.itemLeft}>
          <View style={styles.iconBox}><Badge size={20} color={BRAND_COLOR} /></View>
          <View>
            <Text style={styles.menuTitle}>Change Title</Text>
            <Text style={styles.menuSubtitle}>Set your displayed profile rank</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/squads' as any)}>
        <View style={styles.itemLeft}>
          <View style={styles.iconBox}><Users size={20} color={BRAND_COLOR} /></View>
          <View>
            <Text style={styles.menuTitle}>My Travel Squad</Text>
            <Text style={styles.menuSubtitle}>Manage your legion and recruit members</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#333" />
      </TouchableOpacity>

      {/* Titles Lore Grid */}
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>HALL OF GLORY</Text>
      <Text style={styles.sectionSubtitle}>
        Each title is a chapter of your story. Earn them by accumulating Uthutho Points on every journey.
      </Text>

      {TITLES.map((title, index) => {
        const unlocked = userPoints >= title.points;
        const isCurrent = currentTitle.name === title.name;

        return (
          <View key={index} style={[styles.titleCard, isCurrent && { borderColor: title.accent }]}>
            <LinearGradient
              colors={unlocked ? title.gradient : ['#0a0a0a', '#0a0a0a']}
              style={styles.titleCardInner}
            >
              <View style={styles.titleCardLeft}>
                <View style={[styles.titleIconBox, { backgroundColor: unlocked ? title.accent + '22' : '#111', borderColor: unlocked ? title.accent + '44' : '#222' }]}>
                  <Text style={styles.titleEmoji}>{title.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleNameRow}>
                    <Text style={[styles.titleName, { color: unlocked ? title.accent : '#444' }]}>{title.name}</Text>
                    {isCurrent && (
                      <View style={[styles.activeBadge, { backgroundColor: title.accent + '22' }]}>
                        <Text style={[styles.activeBadgeText, { color: title.accent }]}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.titlePts}>{title.points === 0 ? 'Default' : `${title.points.toLocaleString()} pts required`}</Text>
                  <Text style={[styles.titleLore, { color: unlocked ? '#aaa' : '#333' }]} numberOfLines={3}>
                    {title.lore}
                  </Text>
                </View>
              </View>

              <View style={styles.titleStatus}>
                {unlocked ? (
                  <CheckCircle size={22} color={title.accent} />
                ) : (
                  <Lock size={18} color="#333" />
                )}
              </View>
            </LinearGradient>
          </View>
        );
      })}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  progressCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#444',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pointsBubble: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(30,162,177,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.15)',
  },
  pointsValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  pointsSuffix: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressHint: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#444',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(30,162,177,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  titleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
    overflow: 'hidden',
  },
  titleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  titleCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  titleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  titleEmoji: {
    fontSize: 22,
  },
  titleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  titleName: {
    fontSize: 16,
    fontWeight: '900',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titlePts: {
    fontSize: 10,
    color: '#444',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleLore: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  titleStatus: {
    marginLeft: 8,
    flexShrink: 0,
  },
});