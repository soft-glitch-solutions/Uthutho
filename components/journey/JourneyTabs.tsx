import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MessageCircle, MapPin } from 'lucide-react-native';

interface JourneyTabsProps {
  activeTab: 'info' | 'chat';
  onTabChange: (tab: 'info' | 'chat') => void;
  unreadMessages?: number;
}

export const JourneyTabs = ({ activeTab, onTabChange, unreadMessages = 0 }: JourneyTabsProps) => {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'info' && styles.activeTab]}
        onPress={() => onTabChange('info')}
      >
        <MapPin size={20} color={activeTab === 'info' ? '#1ea2b1' : '#666666'} />
        <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
          Journey Info
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
        onPress={() => onTabChange('chat')}
      >
        <MessageCircle size={20} color={activeTab === 'chat' ? '#1ea2b1' : '#666666'} />
        <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
          Group Chat
        </Text>
        {unreadMessages > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadMessages}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#0a0a0a',
  },
  tabText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#1ea2b1',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});