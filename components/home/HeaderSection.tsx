import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Mic } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { useTranslation } from '@/hook/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HeaderSectionProps {
  isProfileLoading: boolean;
  userProfile: any;
  colors: any;
  onSearchPress?: (y: number) => void;
}

const HeaderSection = ({ isProfileLoading, userProfile, colors, onSearchPress }: HeaderSectionProps) => {
  const router = useRouter();
  const searchBarRef = React.useRef<View>(null);

  if (isProfileLoading) {
    return <HeaderSkeleton colors={colors} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePress = () => {
    if (onSearchPress && searchBarRef.current) {
      searchBarRef.current.measureInWindow((x, y) => {
        onSearchPress(y);
      });
    } else {
      router.push('/favorites');
    }
  };

  const nameString = userProfile?.first_name ? ` ${userProfile.first_name}` : '';

  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <Text style={[styles.readyText, { color: colors.primary }]}>
        READY TO MOVE
      </Text>

      <Text style={[styles.greetingText, { color: colors.text }]}>
        {getGreeting()}{nameString},
      </Text>

      <Text style={[styles.headingText, { color: colors.primary }]}>
        where are we heading?
      </Text>

      <Pressable
        ref={searchBarRef}
        style={[styles.searchBar, { backgroundColor: colors.card || '#1A1D1E' }]}
        onPress={handlePress}
      >
        <Search size={22} color="#888888" />
        <Text style={styles.searchPlaceholder}>Search destinations, stations</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerDesktop: {
    marginBottom: 32,
    paddingTop: 16,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headingText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#888888',
    marginLeft: 12,
  },
});

export default HeaderSection;