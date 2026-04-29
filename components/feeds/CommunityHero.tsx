import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Users, MapPin, Bus, Share2, Info } from 'lucide-react-native';
import { Community } from '@/types/feeds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface CommunityHeroProps {
  community: Community;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  postCount: number;
  reactionCount: number;
  compact?: boolean;
}

const DEFAULT_HUB_IMAGE = '@/assets/images/community.jpg';
const DEFAULT_STOP_IMAGE = '@/assets/images/community.jpg';

const CommunityHero: React.FC<CommunityHeroProps> = ({
  community,
  isFollowing,
  onFollow,
  onUnfollow,
  postCount,
  reactionCount,
  compact = false
}) => {
  const getHeaderImage = () => {
    if (community.id === 'all_communities') {
      return require('@/assets/images/community.jpg');
    }

    if (community.image) {
      return { uri: community.image };
    }

    return community.type === 'hub'
      ? require('@/assets/images/school-transport.jpg')
      : require('@/assets/images/community.jpg');
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <ImageBackground
        source={getHeaderImage()}
        style={[styles.heroImage, compact && styles.heroImageCompact]}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', '#000000']}
          style={[styles.gradient, compact && styles.gradientCompact]}
        >
          <View style={[styles.headerContent, compact && styles.headerContentCompact]}>
            {!compact && (
              <View style={styles.topRow}>
                <View style={styles.typeBadge}>
                  {community.type === 'hub' ? (
                    <Bus size={12} color="#1ea2b1" />
                  ) : (
                    <MapPin size={12} color="#1ea2b1" />
                  )}
                  <Text style={styles.typeText}>{community.type.toUpperCase()}</Text>
                </View>

                <TouchableOpacity style={styles.iconButton}>
                  <Share2 size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.mainInfo, compact && styles.mainInfoCompact]}>
              <Text style={[styles.communityName, compact && styles.communityNameCompact]}>{community.name}</Text>
              {community.address && !compact && (
                <View style={styles.addressRow}>
                  <MapPin size={12} color="#888888" style={{ marginRight: 4 }} />
                  <Text style={styles.addressText} numberOfLines={1}>{community.address}</Text>
                </View>
              )}
            </View>

            <View style={[styles.statsAndActions, compact && styles.statsAndActionsCompact]}>
              <View style={[styles.statsContainer, compact && styles.statsContainerCompact]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, compact && styles.statNumberCompact]}>{postCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: '#333333' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, compact && styles.statNumberCompact]}>{reactionCount}</Text>
                  <Text style={styles.statLabel}>Reactions</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  compact && styles.followButtonCompact
                ]}
                onPress={isFollowing ? onUnfollow : onFollow}
              >
                {!isFollowing && <Users size={compact ? 12 : 16} color="#FFFFFF" style={{ marginRight: compact ? 4 : 6 }} />}
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                  compact && styles.followButtonTextCompact
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  containerCompact: {
    height: 200,
    borderRadius: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroImageCompact: {
    // any compact specific styling for bg
  },
  imageStyle: {
    opacity: 0.8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 15,
  },
  gradientCompact: {
    padding: 12,
  },
  headerContent: {
    width: '100%',
  },
  headerContentCompact: {
    //
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: -180,
    left: 0,
    right: 0,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.3)',
  },
  typeText: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    marginBottom: 20,
  },
  mainInfoCompact: {
    marginBottom: 10,
  },
  communityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  communityNameCompact: {
    fontSize: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addressText: {
    color: '#888888',
    fontSize: 14,
  },
  statsAndActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsAndActionsCompact: {
    //
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsContainerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statNumberCompact: {
    fontSize: 12,
  },
  statLabel: {
    color: '#888888',
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 0,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  followButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  followButtonTextCompact: {
    fontSize: 12,
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
});

export default CommunityHero;
