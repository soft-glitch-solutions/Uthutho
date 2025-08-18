import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

interface Notification {
  id: string;
  type: 'new_feed' | 'liked_post' | 'commented_on_post';
  message: string;
  timestamp: string;
  postId?: string;
  userId?: string;
}

const notificationsData: Notification[] = [
  {
    id: '1',
    type: 'new_feed',
    message: 'A new transport experience has been shared in your area.',
    timestamp: '2023-10-27T10:00:00Z',
  },
  {
    id: '2',
    type: 'liked_post',
    message: 'John Doe liked your post "My bus was late today!".',
    timestamp: '2023-10-27T09:30:00Z',
    postId: 'abc',
    userId: 'user123',
  },
  {
    id: '3',
    type: 'commented_on_post',
    message: 'Jane Smith commented on your post "Great experience with the train!"',
    timestamp: '2023-10-27T09:00:00Z',
    postId: 'def',
    userId: 'user456',
  },
  {
    id: '4',
    type: 'new_feed',
    message: 'There is a new update about bus routes in your city.',
    timestamp: '2023-10-26T18:00:00Z',
  },
];

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  // Get colors with fallback values
  const colors = {
    background: theme?.colors?.background || '#000000',
    card: theme?.colors?.card || '#000000',
    text: theme?.colors?.text || '#FFFFFF',
    textSecondary: theme?.colors?.textSecondary || '#6C757D',
    primary: theme?.colors?.primary || '#1EA2B1',
    border: theme?.colors?.border || '#DEE2E6'
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const handlePress = () => {
      if (item.type === 'liked_post' || item.type === 'commented_on_post') {
        // navigation.navigate('PostDetails', { postId: item.postId });
      }
      // navigation.navigate('Feeds');
    };

    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { 
            backgroundColor: colors.card,
            borderLeftWidth: 4,
            borderLeftColor: item.type === 'new_feed' ? colors.primary : '#1EA2B1',
            shadowColor: theme?.colors?.shadow || '#000',
          }
        ]} 
        onPress={handlePress}
      >
        <Text style={[styles.notificationMessage, { color: colors.text }]}>
          {item.message}
        </Text>
        <Text style={[styles.notificationTimestamp, { color: colors.textSecondary }]}>
          {new Date(item.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>
      
      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications yet
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  notificationItem: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '500',
  },
  notificationTimestamp: {
    fontSize: 13,
    textAlign: 'right',
    opacity: 0.7,
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default NotificationsScreen;