import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Bell, CircleCheck as CheckCircle, Clock, MapPin, Users, Flame } from 'lucide-react-native';
import { useNotifications } from '@/hook/useNotifications';

export default function NotificationScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.postId) {
      router.push(`/post/${notification.data.postId}`);
    } else if (notification.data?.userId) {
      router.push(`/user/${notification.data.userId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_reaction':
        return <Flame size={20} color="#ff6b35" />;
      case 'post_comment':
        return <Users size={20} color="#1ea2b1" />;
      case 'journey_update':
        return <MapPin size={20} color="#1ea2b1" />;
      default:
        return <Bell size={20} color="#1ea2b1" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCircle size={20} color="#1ea2b1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#666666" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You'll see updates about your journeys, reactions, and comments here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.is_read && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </View>
              
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.is_read && styles.unreadText
                ]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTimeAgo(notification.created_at)}
                </Text>
              </View>

              {!notification.is_read && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  markAllButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  unreadNotification: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b110',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1ea2b1',
    marginTop: 8,
  },
  bottomSpace: {
    height: 20,
  },
});