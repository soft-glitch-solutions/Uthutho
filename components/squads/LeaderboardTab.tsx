import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LeaderboardTabProps {
  allSquads: any[];
  onSelectSquad: (squadId: string) => void;
  BRAND_COLOR: string;
}

export const LeaderboardTab = ({
  allSquads,
  onSelectSquad,
  BRAND_COLOR
}: LeaderboardTabProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RIVALS & RANKS</Text>
      </View>

      {allSquads
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((s, index) => (
          <TouchableOpacity 
            key={s.id} 
            style={styles.leaderboardItem}
            onPress={() => onSelectSquad(s.id)}
          >
            <View style={styles.leaderboardLeft}>
              <Text style={[styles.rankText, index < 3 && { color: BRAND_COLOR }]}>#{index + 1}</Text>
              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName}>{s.name}</Text>
                <Text style={styles.leaderboardStats}>Lvl {s.level} • {s.member_count} Members</Text>
              </View>
            </View>
            <View style={styles.leaderboardRight}>
              <Text style={styles.leaderboardPoints}>{s.points} pts</Text>
            </View>
          </TouchableOpacity>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
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
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#444',
    width: 32,
  },
  leaderboardInfo: {
    gap: 2,
  },
  leaderboardName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  leaderboardStats: {
    color: '#444',
    fontSize: 11,
    fontWeight: '600',
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardPoints: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
