// components/feeds/CommunityTabs.tsx
import React from 'react';
import { FlatList, Pressable, View, Text, StyleSheet } from 'react-native';
import { Community } from '@/types/feeds';

interface CommunityTabsProps {
  communities: Community[];
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community) => void;
  followerCounts: Record<string, number>;
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({
  communities,
  selectedCommunity,
  setSelectedCommunity,
  followerCounts,
}) => {
  const renderCommunityTab = ({ item }: { item: Community }) => {
    const selected = selectedCommunity?.id === item.id;
    const followerCount = followerCounts[item.id] || 0;
    
    return (
      <Pressable
        onPress={() => setSelectedCommunity(item)}
        android_ripple={{ color: '#0f3e45', borderless: false }}
        style={[styles.communityTab, selected && styles.selectedTab]}
      >
        <View style={styles.communityTabContent}>
          <Text style={[styles.communityTabText, selected && styles.selectedTabText]} numberOfLines={1}>
            {item.name}
          </Text>
          {followerCount > 0 && (
            <Text style={[styles.followerCount, selected && styles.selectedFollowerCount]}>
              Followers : {followerCount}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.tabsWrapper}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={communities}
        keyExtractor={(item) => item.id}
        renderItem={renderCommunityTab}
        contentContainerStyle={styles.communityTabsContent}
        getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
  },
  communityTabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  communityTab: {
    minHeight: 36,
    maxHeight: 36,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  communityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cccccc',
    maxWidth: 160,
  },
  selectedTabText: {
    color: '#ffffff',
  },
  communityTabContent: {
    alignItems: 'center',
  },
  followerCount: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    fontWeight: '600',
  },
  selectedFollowerCount: {
    color: '#ffffff',
  },
});

export default CommunityTabs;