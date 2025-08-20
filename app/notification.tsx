import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Bell, Check, CheckCheck, Users, Heart, MessageCircle, Car } from 'lucide-react-native';
import { useNotifications } from '@/hook/useNotifications';
import { useAuth } from '@/hook/useAuth';

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'carpool_application':
        return <Car size={20} color="#1ea2b1" />;
      case 'application_response':
        return <Users size={20} color="#1ea2b1" />;
      case 'post_reaction':
        return <Heart size={20} color="#ff6b35" />;
      case 'post_comment':
        return <MessageCircle size={20} color="#1ea2b1" />;
      default:
        return <Bell size={20} color="#888888" />;
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'carpool_application':
      case 'application_response':
        // Navigate to carpool details or applications
        break;
      case 'post_reaction':
      case 'post_comment':
        // Navigate to post details
        break;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.emptyState}>
          <Bell size={48} color="#888888" />
          <Text style={styles.emptyStateText}>Sign in to view notifications</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCheck size={16} color="#1ea2b1" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading notifications...</Text>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Bell size={48} color="#888888" />
          <Text style={styles.emptyStateText}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {filter === 'unread' 
              ? 'All caught up!' 
              : 'Notifications will appear here when you get them'
            }
          </Text>
        </View>
      ) : (
        filteredNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.is_read && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(notification)}
          >
            <View style={styles.notificationIcon}>
              {getNotificationIcon(notification.type)}
            </View>

            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                {new Date(notification.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>

            {!notification.is_read && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  markAllText: {
    color: '#1ea2b1',
    fontSize: 12,
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111111',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeFilterTab: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  filterText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  unreadNotification: {
    borderColor: '#1ea2b1',
    backgroundColor: '#0a1a1c',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    color: '#888888',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1ea2b1',
    marginLeft: 8,
    marginTop: 8,
  },
});