import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Image 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Bell, CircleCheck as CheckCircle, Clock, MapPin, Users, Flame, MessageCircle, Heart, UserPlus, Star } from 'lucide-react-native';
import { useNotifications } from '@/hook/useNotifications';
import { supabase } from '@/lib/supabase';

// Skeleton Loading Component
const NotificationSkeleton = () => {
  return (
    <View style={styles.skeletonItem}>
      {/* Skeleton Profile Picture */}
      <View style={styles.skeletonProfile} />
      
      {/* Skeleton Notification Icon */}
      <View style={styles.skeletonIcon} />
      
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonMessage]} />
        <View style={[styles.skeletonLine, styles.skeletonTime]} />
      </View>
    </View>
  );
};

export default function NotificationScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (notifications.length > 0) {
      loadUserProfiles();
    }
  }, [notifications]);

  const loadUserProfiles = async () => {
    try {
      // Extract unique user IDs from notifications
      const userIds = new Set<string>();
      
      notifications.forEach(notification => {
        const data = notification.data || {};
        // Check various possible sender ID fields
        if (data.senderId) userIds.add(data.senderId);
        if (data.followerId) userIds.add(data.followerId);
        if (data.userId) userIds.add(data.userId);
      });

      if (userIds.size === 0) return;

      // Fetch user profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(userIds));

      if (error) {
        console.error('Error fetching user profiles:', error);
        return;
      }

      // Create a map of user profiles
      const profilesMap: {[key: string]: any} = {};
      profiles?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Enhanced navigation logic with better context
    const data = notification.data || {};
    const type = notification.type;

    // Post-related notifications - navigate to post details
    if (type === 'post_reaction' || type === 'post_comment' || type === 'comment_reaction' || type === 'mention') {
      if (data.postId) {
        // Navigate to the post details page
        router.push(`/post/${data.postId}`);
        return;
      }
    }
    // User profile navigation
    else if (data.senderId) {
      router.push(`/user/${data.senderId}`);
    }
    // Follow notifications
    else if (type === 'new_follower' && data.followerId) {
      router.push(`/user/${data.followerId}`);
    }
    // Journey notifications
    else if (data.journeyId) {
      router.push(`/journey/${data.journeyId}`);
    }
    // Hub notifications
    else if (data.hubId) {
      router.push(`/hub/${data.hubId}`);
    }
    // Stop notifications
    else if (data.stopId) {
      router.push(`/stop-details?stopId=${data.stopId}`);
    }
    // Route notifications
    else if (data.routeId) {
      router.push(`/route-details?routeId=${data.routeId}`);
    }
    // Achievement notifications
    else if (type === 'achievement_unlocked') {
      // Navigate to achievements or profile page
      router.push('/profile');
    }
    // Points earned notifications
    else if (type === 'points_earned') {
      // Navigate to profile or leaderboard
      router.push('/profile');
    }
    // Default fallback - try to navigate to post if postId exists
    else if (data.postId) {
      router.push(`/post/${data.postId}`);
    } else {
      console.log('No specific navigation for notification:', notification);
      // Fallback to home or stay on notifications
      router.push('/(tabs)');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_reaction':
        return <Heart size={20} color="#ff6b35" fill="#ff6b35" />;
      case 'post_comment':
        return <MessageCircle size={20} color="#1ea2b1" />;
      case 'comment_reaction':
        return <Heart size={20} color="#ff6b35" fill="#ff6b35" />;
      case 'new_follower':
        return <UserPlus size={20} color="#10b981" />;
      case 'journey_update':
        return <MapPin size={20} color="#1ea2b1" />;
      case 'route_update':
        return <Star size={20} color="#FFD700" />;
      case 'hub_update':
        return <Users size={20} color="#8B5CF6" />;
      case 'stop_update':
        return <MapPin size={20} color="#1ea2b1" />;
      case 'achievement_unlocked':
        return <Star size={20} color="#FFD700" fill="#FFD700" />;
      case 'points_earned':
        return <Flame size={20} color="#FF6B35" />;
      case 'mention':
        return <MessageCircle size={20} color="#1ea2b1" />;
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

  // Function to get user profile data
  const getUserProfile = (notification: any) => {
    const data = notification.data || {};
    
    // Try different possible sender ID fields
    const senderId = data.senderId || data.followerId || data.userId;
    
    if (senderId && userProfiles[senderId]) {
      return userProfiles[senderId];
    }
    
    // Fallback to data from notification if available
    return {
      first_name: data.senderName?.split(' ')[0] || 'User',
      last_name: data.senderName?.split(' ')[1] || '',
      avatar_url: data.senderAvatar
    };
  };

  // Function to render profile picture with fallback
  const renderProfilePicture = (notification: any) => {
    const userProfile = getUserProfile(notification);
    const firstName = userProfile.first_name || 'U';
    const lastName = userProfile.last_name || '';
    const fallbackLetter = firstName ? firstName.charAt(0).toUpperCase() : 'U';

    if (userProfile.avatar_url) {
      return (
        <Image 
          source={{ uri: userProfile.avatar_url }} 
          style={styles.profileImage}
        />
      );
    } else {
      return (
        <View style={styles.profileFallback}>
          <Text style={styles.profileFallbackText}>{fallbackLetter}</Text>
        </View>
      );
    }
  };

  // Function to get sender name for display
  const getSenderName = (notification: any) => {
    const userProfile = getUserProfile(notification);
    
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile.first_name) {
      return userProfile.first_name;
    }
    
    // Fallback to data from notification
    const data = notification.data || {};
    return data.senderName || 'Someone';
  };

  // Use the actual message from the database instead of generating it
  const getDisplayMessage = (notification: any) => {
    // Use the message field from the database as the primary content
    return notification.message || 'You have a new notification';
  };

  // Check if notification is post-related
  const isPostNotification = (notification: any) => {
    const type = notification.type;
    return type === 'post_reaction' || type === 'post_comment' || type === 'comment_reaction' || type === 'mention';
  };

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups: { [key: string]: any[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  };

  const notificationGroups = groupNotificationsByDate();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#1ea2b1']}
          tintColor="#1ea2b1"
        />
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCircle size={20} color="#1ea2b1" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <View style={styles.content}>
        {loading ? (
          // Skeleton Loading State
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <NotificationSkeleton key={index} />
            ))}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#666666" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You'll see updates about your posts, reactions, comments, and followers here.
            </Text>
          </View>
        ) : (
          Object.entries(notificationGroups).map(([date, groupNotifications]) => (
            <View key={date} style={styles.notificationGroup}>
              <Text style={styles.groupDate}>{date}</Text>
              {groupNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.unreadNotification,
                    isPostNotification(notification) && styles.postNotification
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  {/* Profile Picture */}
                  <View style={styles.profileContainer}>
                    {renderProfilePicture(notification)}
                  </View>
                  
                  {/* Notification Icon */}
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationIcon(notification.type).props.color + '20' }
                  ]}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationMessage,
                      !notification.is_read && styles.unreadText
                    ]}>
                      {getDisplayMessage(notification)}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                  </View>

                  {!notification.is_read && (
                    <View style={styles.unreadDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  unreadBadge: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  markAllText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
  },
  notificationGroup: {
    marginBottom: 24,
  },
  groupDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    maxWidth: 300,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  unreadNotification: {
    borderColor: '#1ea2b1',
    backgroundColor: '#1ea2b110',
  },
  postNotification: {
    // Optional: Add specific styling for post notifications
    borderLeftWidth: 3,
    borderLeftColor: '#1ea2b1',
  },
  profileContainer: {
    marginRight: 12,
    position: 'relative',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
  },
  profileFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFallbackText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1ea2b120',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#ffffff',
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
  // Skeleton Styles
  skeletonContainer: {
    paddingVertical: 8,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonProfile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    marginRight: 12,
  },
  skeletonIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    zIndex: 2,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 8,
  },
  skeletonLine: {
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMessage: {
    height: 14,
    width: '90%',
  },
  skeletonTime: {
    height: 12,
    width: '30%',
  },
});