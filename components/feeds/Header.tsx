import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { Bell, Plus, MapPin, Bus, PenLine } from 'lucide-react-native';
import { Community } from '@/types/feeds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeaderProps {
  unreadNotifications: number;
  router: any;
  selectedCommunity?: Community | null;
  isDesktop?: boolean;
  onComposePress?: () => void;
  userAvatarUrl?: string;
  // legacy - kept for call-site compat, not used
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  postCount?: number;
  reactionCount?: number;
  scrollY?: any;
}

const Header: React.FC<HeaderProps> = ({
  unreadNotifications,
  router,
  selectedCommunity,
  onComposePress,
  userAvatarUrl,
}) => {
  const hasCommunity = !!selectedCommunity;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        {/* Left: label / type badge */}
        {hasCommunity ? (
          <View style={styles.typeBadge}>
            {selectedCommunity!.type === 'hub' ? (
              <Bus size={11} color="#1ea2b1" />
            ) : (
              <MapPin size={11} color="#1ea2b1" />
            )}
            <Text style={styles.typeBadgeText}>
              {selectedCommunity!.type.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={styles.readyLabel}>COMMUNITY</Text>
        )}

        {/* Right: bell + plus */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notification')}
          >
            <Bell size={20} color="#ffffff" />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/favorites')}
          >
            <Plus size={20} color="#1ea2b1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Title ── */}
      <View style={styles.titleBlock}>
        <Text style={styles.greetingText}>
          {hasCommunity ? 'Viewing community,' : 'Stay connected,'}
        </Text>
        <Text style={styles.headingText}>
          {hasCommunity ? selectedCommunity!.name : "what's happening?"}
        </Text>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000000',
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  readyLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#1ea2b1',
    textTransform: 'uppercase',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,162,177,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.2)',
    gap: 5,
  },
  typeBadgeText: {
    color: '#1ea2b1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Title ──
  titleBlock: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#cccccc',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headingText: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#1ea2b1',
    letterSpacing: -0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    color: '#444444',
    fontSize: 12,
  },

  // ── Compose bar (Twitter/Instagram style) ──
  composeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  composeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
  },
  composeAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeAvatarLetter: {
    color: '#555',
    fontSize: 14,
    fontWeight: '700',
  },
  composeFakeInput: {
    flex: 1,
    paddingVertical: 6,
  },
  composePlaceholder: {
    color: '#444444',
    fontSize: 14,
  },
  composePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1ea2b1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  composePostBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

});

export default Header;