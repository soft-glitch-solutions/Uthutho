import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Search as SearchIcon, Sword, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface DiscoveryTabProps {
  allSquads: any[];
  searchQuery: string;
  onSearch: (text: string) => void;
  onSelectSquad: (squadId: string) => void;
  joining: boolean;
  BRAND_COLOR: string;
}

export const DiscoveryTab = ({
  allSquads,
  searchQuery,
  onSearch,
  onSelectSquad,
  joining,
  BRAND_COLOR
}: DiscoveryTabProps) => {
  return (
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
          onChangeText={onSearch}
        />
      </View>

      {allSquads.length === 0 ? (
        <View style={styles.emptySquads}>
          <Text style={styles.emptyText}>No rival squads detected.</Text>
        </View>
      ) : (
        allSquads.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.squadDiscoveryCard}
            onPress={() => onSelectSquad(s.id)}
          >
            <View style={styles.squadDiscoveryIcon}>
              <Sword size={24} color="#666" />
            </View>
            <View style={styles.squadDiscoveryInfo}>
              <Text style={styles.squadDiscoveryName}>{s.name}</Text>
              <Text style={styles.squadDiscoveryStats}>
                Level {s.level} • {s.member_count || 0} Members
              </Text>
            </View>
            <View style={styles.joinBadge}>
              <Text style={styles.joinBadgeText}>INFO</Text>
              <ArrowRight size={14} color="#000" />
            </View>
          </TouchableOpacity>
        ))
      )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySquads: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  squadDiscoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  squadDiscoveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadDiscoveryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  squadDiscoveryName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  squadDiscoveryStats: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  joinBadge: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
});
