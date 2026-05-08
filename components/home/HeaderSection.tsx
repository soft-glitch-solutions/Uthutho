import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Menu } from 'lucide-react-native';
import HeaderSkeleton from './skeletons/HeaderSkeleton';

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
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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

  const nameString = userProfile?.first_name ? `, ${userProfile.first_name}` : '';

  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <Text style={[styles.greetingText, { color: colors.text }]}>
        {getGreeting()}{nameString}
      </Text>

      <Text style={[styles.headingText, { color: '#fed43f' }]}>
        Where are we heading?
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
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headingText: {
    fontSize: 30,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1A1D1E',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#888888',
    marginLeft: 12,
  },
});

export default HeaderSection;