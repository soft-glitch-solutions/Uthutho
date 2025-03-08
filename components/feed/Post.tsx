// components/Post.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

interface PostProps {
  item: {
    id: string;
    profiles: {
      avatar_url: string;
      first_name: string;
      last_name: string;
      selected_title?: string;
    };
    content: string;
    created_at: string;
    type: 'hub' | 'stop';
    hubs?: { name: string };
    stops?: { routes: { name: string } };
  };
  colors: {
    card: string;
    text: string;
    primary: string;
    textSecondary: string;
  };
  onCommentPress: (postId: string) => void;
  onSharePress: (post: any) => void;
}

const Post: React.FC<PostProps> = ({ item, colors, onCommentPress, onSharePress }) => {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now.getTime() - postDate.getTime();

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.profiles.first_name} {item.profiles.last_name}
          </Text>
          {item.profiles.selected_title && (
            <Text style={[styles.selectedTitle, { color: colors.primary }]}>
              {item.profiles.selected_title}
            </Text>
          )}
          <Text style={[styles.postTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>
        {item.content}
      </Text>
      {item.type === 'hub' && (
        <Text style={[styles.hubName, { color: colors.primary }]}>
          Hub: {item.hubs?.name || 'Unknown Hub'}
        </Text>
      )}
      {item.type === 'stop' && (
        <Text style={[styles.routeName, { color: colors.primary }]}>
          Related Route: {item.stops?.routes?.name || 'Unknown Route'}
        </Text>
      )}
      <View style={styles.postActions}>
        <Pressable onPress={() => onCommentPress(item.id)}>
          <Text style={{ color: colors.primary }}>Comment</Text>
        </Pressable>
        <Pressable onPress={() => onSharePress(item)}>
          <Text style={{ color: colors.primary }}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postHeaderText: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  selectedTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  postTime: {
    color: '#666',
  },
  postContent: {
    marginBottom: 8,
  },
  hubName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  routeName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default Post;