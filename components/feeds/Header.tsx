// components/feeds/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { Bell, Plus, Users, MapPin, Bus, Share2, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Community } from '@/types/feeds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_HUB_IMAGE = 'https://images.theconversation.com/files/347103/original/file-20200713-42-1scm7g7.jpg?ixlib=rb-4.1.0&q=45&auto=format&w=1356&h=668&fit=crop';
const DEFAULT_STOP_IMAGE = 'https://images.caxton.co.za/wp-content/uploads/sites/10/2023/03/IMG_9281_07602-e1680074626338-780x470.jpg';

interface HeaderProps {
  unreadNotifications: number;
  router: any;
  selectedCommunity?: Community | null;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  postCount?: number;
  reactionCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  unreadNotifications, 
  router,
  selectedCommunity,
  isFollowing,
  onFollow,
  onUnfollow,
  postCount = 0,
  reactionCount = 0
}) => {
  if (selectedCommunity) {
    const imageUrl = selectedCommunity.image || (selectedCommunity.type === 'hub' ? DEFAULT_HUB_IMAGE : DEFAULT_STOP_IMAGE);
    
    return (
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', '#000000']}
            style={styles.heroGradient}
          >
            <View style={styles.heroTopRow}>
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
            </View>

            <View style={styles.heroBottomContent}>
              <View style={styles.heroMainInfo}>
                <Text style={styles.heroCommunityName}>{selectedCommunity.name}</Text>
                {selectedCommunity.address && (
                  <View style={styles.heroAddressRow}>
                    <MapPin size={12} color="#888888" style={{ marginRight: 4 }} />
                    <Text style={styles.heroAddressText} numberOfLines={1}>{selectedCommunity.address}</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroStatsAndActions}>
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
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
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
    height: 320,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 0.85,
  },
  heroGradient: {
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
});

export default Header;