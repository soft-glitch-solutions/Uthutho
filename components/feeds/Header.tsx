import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Animated } from 'react-native';
import { Bell, Plus, Users, MapPin, Bus, Share2, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Community } from '@/types/feeds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_HUB_IMAGE = '@/assets/images/Community.jpg';
const DEFAULT_STOP_IMAGE = '@/assets/images/Community.jpg';

interface HeaderProps {
  unreadNotifications: number;
  router: any;
  selectedCommunity?: Community | null;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  postCount?: number;
  reactionCount?: number;
  scrollY?: Animated.Value; // Add scrollY prop for animated header
}

const Header: React.FC<HeaderProps> = ({
  unreadNotifications,
  router,
  selectedCommunity,
  isFollowing,
  onFollow,
  onUnfollow,
  postCount = 0,
  reactionCount = 0,
  scrollY = new Animated.Value(0) // Default if not provided
}) => {
  if (selectedCommunity) {
    const imageUrl = selectedCommunity.image || (selectedCommunity.type === 'hub' ? DEFAULT_HUB_IMAGE : DEFAULT_STOP_IMAGE);

    // Animation values for collapsible header
    const headerHeight = scrollY.interpolate({
      inputRange: [0, 150],
      outputRange: [320, 120],
      extrapolate: 'clamp'
    });

    const imageOpacity = scrollY.interpolate({
      inputRange: [0, 100, 150],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp'
    });

    const contentOpacity = scrollY.interpolate({
      inputRange: [0, 80, 150],
      outputRange: [1, 0.3, 0],
      extrapolate: 'clamp'
    });

    const compactOpacity = scrollY.interpolate({
      inputRange: [0, 100, 150],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp'
    });

    const compactTranslateY = scrollY.interpolate({
      inputRange: [0, 150],
      outputRange: [50, 0],
      extrapolate: 'clamp'
    });

    const titleScale = scrollY.interpolate({
      inputRange: [0, 150],
      outputRange: [1, 0.8],
      extrapolate: 'clamp'
    });

    const statsOpacity = scrollY.interpolate({
      inputRange: [0, 100, 150],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View style={[styles.heroContainer, { height: headerHeight }]}>
        <Animated.Image
          source={{ uri: imageUrl }}
          style={[styles.heroImage, { opacity: imageOpacity }]}
          blurRadius={scrollY.interpolate({
            inputRange: [0, 150],
            outputRange: [0, 5],
            extrapolate: 'clamp'
          }) as any}
        />

        <Animated.View style={[styles.heroGradient, { opacity: imageOpacity }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', '#000000']}
            style={styles.gradientContent}
          >
            <Animated.View style={[styles.heroTopRow, { opacity: contentOpacity }]}>
              <View style={styles.typeBadge}>
                {selectedCommunity.type === 'hub' ? (
                  <Bus size={12} color="#1ea2b1" />
                ) : (
                  <MapPin size={12} color="#1ea2b1" />
                )}
                <Text style={styles.typeText}>{selectedCommunity.type.toUpperCase()}</Text>
              </View>

              <TouchableOpacity
                style={styles.notificationButtonHero}
                onPress={() => router.push('/notification')}
              >
                <Bell size={20} color="#ffffff" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>{unreadNotifications}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.heroBottomContent, { opacity: contentOpacity }]}>
              <View style={styles.heroMainInfo}>
                <Animated.Text style={[styles.heroCommunityName, { transform: [{ scale: titleScale }] }]}>
                  {selectedCommunity.name}
                </Animated.Text>
                {selectedCommunity.address && (
                  <View style={styles.heroAddressRow}>
                    <MapPin size={12} color="#888888" style={{ marginRight: 4 }} />
                    <Text style={styles.heroAddressText} numberOfLines={1}>{selectedCommunity.address}</Text>
                  </View>
                )}
              </View>

              <Animated.View style={[styles.heroStatsAndActions, { opacity: statsOpacity }]}>
                <View style={styles.heroStatsContainer}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNumber}>{postCount}</Text>
                    <Text style={styles.heroStatLabel}>Posts</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNumber}>{reactionCount}</Text>
                    <Text style={styles.heroStatLabel}>Reactions</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.heroFollowButton,
                    isFollowing && styles.heroFollowingButton
                  ]}
                  onPress={isFollowing ? onUnfollow : onFollow}
                >
                  {!isFollowing && <Users size={16} color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={[styles.heroFollowButtonText, isFollowing && styles.heroFollowingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Compact Header for when scrolled */}
        <Animated.View
          style={[
            styles.compactHeader,
            {
              opacity: compactOpacity,
              transform: [{ translateY: compactTranslateY }]
            }
          ]}
        >
          <View style={styles.compactContent}>
            <TouchableOpacity
              style={styles.compactBackButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {selectedCommunity.name}
              </Text>
              <View style={styles.compactTypeBadge}>
                {selectedCommunity.type === 'hub' ? (
                  <Bus size={10} color="#1ea2b1" />
                ) : (
                  <MapPin size={10} color="#1ea2b1" />
                )}
                <Text style={styles.compactTypeText}>{selectedCommunity.type.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.compactActions}>
              <TouchableOpacity
                style={styles.compactNotificationButton}
                onPress={() => router.push('/notification')}
              >
                <Bell size={20} color="#ffffff" />
                {unreadNotifications > 0 && (
                  <View style={styles.compactNotificationBadge}>
                    <Text style={styles.compactNotificationCount}>{unreadNotifications}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.compactFollowButton,
                  isFollowing && styles.compactFollowingButton
                ]}
                onPress={isFollowing ? onUnfollow : onFollow}
              >
                <Users size={14} color={isFollowing ? "#1ea2b1" : "#ffffff"} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Communities</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notification')}
        >
          <Bell size={24} color="#ffffff" />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push('/favorites')}
        >
          <Plus size={24} color="#1ea2b1" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addIconButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Header Styles
  heroContainer: {
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageStyle: {
    opacity: 0.85,
  },
  heroGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.4)',
  },
  typeText: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1,
  },
  notificationButtonHero: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroBottomContent: {
    width: '100%',
  },
  heroMainInfo: {
    marginBottom: 20,
  },
  heroCommunityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  heroAddressText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  heroStatsAndActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  heroStatNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroStatLabel: {
    color: '#BBBBBB',
    fontSize: 10,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
  heroFollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroFollowingButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  heroFollowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroFollowingButtonText: {
    color: '#FFFFFF',
  },

  // Compact Header Styles
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    backdropFilter: 'blur(10px)',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  compactTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  compactTypeText: {
    color: '#1ea2b1',
    fontSize: 9,
    fontWeight: 'bold',
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactNotificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compactNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactNotificationCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  compactFollowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactFollowingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
});

export default Header;