import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MessageCircle, MapPin } from 'lucide-react-native';

interface JourneyTabsProps {
  activeTab: 'info' | 'chat';
  onTabChange: (tab: 'info' | 'chat') => void;
  unreadMessages?: number;
  onlineCount?: number;
}

export const JourneyTabs = ({ 
  activeTab, 
  onTabChange, 
  unreadMessages = 0, 
  onlineCount = 0 
}: JourneyTabsProps) => {
  const hasOnlineIndicator = onlineCount > 0;
  const hasUnreadMessages = unreadMessages > 0;
  
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
        <View style={styles.chatTabText}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            Group Chat
          </Text>
          
          {/* Combined Badge */}
          {(hasOnlineIndicator || hasUnreadMessages) && (
            <View style={styles.combinedBadge}>
              {/* Online Indicator */}
              {hasOnlineIndicator && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineCountText}>{onlineCount}</Text>
                </View>
              )}
              
              {/* Separator if both indicators exist */}
              {hasOnlineIndicator && hasUnreadMessages && (
                <View style={styles.separator} />
              )}
              
              {/* Unread Messages */}
              {hasUnreadMessages && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
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
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  chatTabText: {
    alignItems: 'center',
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
  // Combined Badge Container
  combinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  // Online Indicator
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  onlineCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cccccc',
  },
  // Separator
  separator: {
    width: 1,
    height: 12,
    backgroundColor: '#444444',
  },
  // Unread Messages Badge
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});