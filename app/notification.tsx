import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext'; // Assuming ThemeContext is in this path
 
// Define the structure for a notification
interface Notification {
  id: string;
  type: 'new_feed' | 'liked_post' | 'commented_on_post';
  message: string;
  timestamp: string; // Or use a Date object
  postId?: string; // Optional, for liked/commented posts
  userId?: string; // Optional, for liked/commented posts
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

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const handlePress = () => {
      // Navigate to the relevant screen based on notification type
      if (item.type === 'liked_post' || item.type === 'commented_on_post') {
        // Assuming you have a screen to display a single post
        // navigation.navigate('PostDetails', { postId: item.postId });
      }
      // For new_feed, you might navigate to the feeds list or a specific section
      // navigation.navigate('Feeds');
    };

    return (
      <TouchableOpacity style={[styles.notificationItem, { backgroundColor: theme.colors.card }]} onPress={handlePress}>
        <Text style={[styles.notificationMessage, { color: theme.colors.text }]}>{item.message}</Text>
        <Text style={[styles.notificationTimestamp, { color: theme.colors.textSecondary }]}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,    
  },
  notificationItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,    
    elevation: 2,    
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  notificationTimestamp: {
    fontSize: 12,    
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default NotificationsScreen;