// components/feeds/CommunityTabs.tsx
import React from 'react';
import { FlatList, Pressable, View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Community } from '@/types/feeds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface CommunityTabsProps {
  communities: Community[];
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community) => void;
  followerCounts: Record<string, number>;
  isDesktop?: boolean;
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({
  communities,
  selectedCommunity,
  setSelectedCommunity,
  followerCounts,
  isDesktop: propIsDesktop = false,
}) => {
  const desktopMode = isDesktop || propIsDesktop;

  const renderCommunityTab = ({ item }: { item: Community }) => {
    const selected = selectedCommunity?.id === item.id;
    const followerCount = followerCounts[item.id] || 0;
    
    return (
      <Pressable
        onPress={() => setSelectedCommunity(item)}
        android_ripple={{ color: '#0f3e45', borderless: false }}
        style={[
          styles.communityTab, 
          desktopMode && styles.communityTabDesktop,
          selected && styles.selectedTab,
          selected && desktopMode && styles.selectedTabDesktop
        ]}
      >
        <View style={[styles.communityTabContent, desktopMode && styles.communityTabContentDesktop]}>
          <Text style={[
            styles.communityTabText, 
            desktopMode && styles.communityTabTextDesktop,
            selected && styles.selectedTabText
          ]} numberOfLines={1}>
            {item.name}
          </Text>
          {followerCount > 0 && (
            <Text style={[
              styles.followerCount, 
              desktopMode && styles.followerCountDesktop,
              selected && styles.selectedFollowerCount
            ]}>
              Followers : {followerCount}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  if (desktopMode) {
    // Desktop view - vertical list
    return (
      <View style={[styles.tabsWrapper, styles.tabsWrapperDesktop]}>
        <Text style={styles.communitiesTitle}>Your Communities</Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.communitiesScroll}
          contentContainerStyle={styles.communitiesScrollContent}
        >
          {communities.map((item) => {
            const selected = selectedCommunity?.id === item.id;
            const followerCount = followerCounts[item.id] || 0;
            
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedCommunity(item)}
                style={[
                  styles.desktopCommunityItem,
                  selected && styles.desktopCommunityItemSelected
                ]}
              >
                <View style={styles.desktopCommunityInfo}>
                  <Text style={[
                    styles.desktopCommunityName,
                    selected && styles.desktopCommunityNameSelected
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={[
                    styles.desktopCommunityType,
                    selected && styles.desktopCommunityTypeSelected
                  ]}>
                    {item.type === 'hub' ? 'Hub' : 'Stop'}
                  </Text>
                </View>
                {followerCount > 0 && (
                  <View style={styles.desktopFollowerCount}>
                    <Text style={[
                      styles.desktopFollowerNumber,
                      selected && styles.desktopFollowerNumberSelected
                    ]}>
                      {followerCount}
                    </Text>
                    <Text style={[
                      styles.desktopFollowerLabel,
                      selected && styles.desktopFollowerLabelSelected
                    ]}>
                      Followers
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Mobile view - horizontal tabs
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
  // Mobile styles
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
  communityTabDesktop: {
    minHeight: 32,
    maxHeight: 32,
    paddingHorizontal: 12,
    marginHorizontal: 3,
    borderRadius: 16,
  },
  selectedTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  selectedTabDesktop: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  communityTabContent: {
    alignItems: 'center',
  },
  communityTabContentDesktop: {
    alignItems: 'center',
  },
  communityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cccccc',
    maxWidth: 160,
  },
  communityTabTextDesktop: {
    fontSize: 12,
    maxWidth: 140,
  },
  selectedTabText: {
    color: '#ffffff',
  },
  followerCount: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    fontWeight: '600',
  },
  followerCountDesktop: {
    fontSize: 9,
    marginTop: 1,
  },
  selectedFollowerCount: {
    color: '#ffffff',
  },

  // Desktop styles
  tabsWrapperDesktop: {
    borderBottomWidth: 0,
    width: '100%',
    paddingTop: 8,
  },
  communitiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  communitiesScroll: {
    flex: 1,
    width: '100%',
  },
  communitiesScrollContent: {
    paddingBottom: 16,
  },
  desktopCommunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  desktopCommunityItemSelected: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  desktopCommunityInfo: {
    flex: 1,
  },
  desktopCommunityName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  desktopCommunityNameSelected: {
    color: '#ffffff',
  },
  desktopCommunityType: {
    fontSize: 11,
    color: '#666666',
  },
  desktopCommunityTypeSelected: {
    color: '#ffffff',
  },
  desktopFollowerCount: {
    alignItems: 'center',
    marginLeft: 8,
  },
  desktopFollowerNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1ea2b1',
  },
  desktopFollowerNumberSelected: {
    color: '#ffffff',
  },
  desktopFollowerLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 1,
  },
  desktopFollowerLabelSelected: {
    color: '#ffffff',
  },
});

export default CommunityTabs;