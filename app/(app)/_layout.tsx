import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../context/ThemeContext';
import {
  House,
  Trophy,
  Settings,
  CircleHelp as HelpCircle,
  User,
  Clock,
  ChevronRight,
  Linkedin,
  Facebook,
  Instagram,
  MessageCircle,
  Car,
  BarChart3,
  Youtube,
} from 'lucide-react-native';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* TikTok Icon */
const TikTokIcon = ({ size = 20, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M21 8.5c-1.9 0-3.7-.6-5.1-1.8v8.3c0 4.2-3.4 7.5-7.6 7.5S.8 19.2.8 15s3.4-7.5 7.6-7.5c.4 0 .9 0 1.3.1v3.9c-.4-.1-.8-.2-1.3-.2-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V.5h4c.3 1.9 2.2 4 5.1 4v4z"
    />
  </Svg>
);

// Fallback icon
const FallbackIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, opacity: 0.3, borderRadius: 4 }} />
);

const VISIBLE_DRAWER_SCREENS = [
  '(tabs)',
  'Leaderboard',
  'trips',
  'profile',
  'settings',
  'help',
];

const CustomDrawerContent = (props) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoadingRole(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setUserRole(data.role);
          setIsDriver(data.role === 'driver');
        } else {
          setUserRole('user');
          setIsDriver(false);
        }
      } catch {
        setUserRole('user');
        setIsDriver(false);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const visibleRoutes = props.state.routes.filter(route =>
    VISIBLE_DRAWER_SCREENS.includes(route.name)
  );

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Image source={require('../../assets/uthutho-logo.png')} style={styles.logo} />
        <Text style={[styles.appTitle, { color: colors.text }]}>Uthutho</Text>
        <Text style={[styles.appSubtitle, { color: `${colors.text}70` }]}>
          Your Journey Companion
        </Text>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        {visibleRoutes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const isFocused = props.state.index === index;
          const IconComponent = options.drawerIcon || FallbackIcon;

          return (
            <AnimatedPressable
              key={route.key}
              onPress={() => props.navigation.navigate(route.name)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[
                styles.drawerItem,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: isFocused ? `${colors.primary}15` : 'transparent',
                },
              ]}
            >
              <View style={styles.drawerItemContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <IconComponent size={22} color={colors.background} />
                </View>
                <Text style={[styles.drawerLabel, { color: colors.text }]}>
                  {options.title || route.name}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.text} />
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <View style={styles.socialContainer}>

          <Pressable onPress={() => Linking.openURL('https://www.facebook.com/uthuthorsa/')} style={styles.socialIcon}>
            <Facebook size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://www.instagram.com/uthuthorsa/')} style={styles.socialIcon}>
            <Instagram size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://www.youtube.com/@Uthutho')} style={styles.socialIcon}>
            <Youtube size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://www.tiktok.com/@uthuthorsa')} style={styles.socialIcon}>
            <TikTokIcon size={20} color={colors.text} />
          </Pressable>

        </View>

        <Text style={[styles.footerText, { color: `${colors.text}40` }]}>
          Version 1.8.2
        </Text>
      </View>
    </View>
  );
};

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { backgroundColor: colors.background } }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Home', drawerIcon: House }} />
      <Drawer.Screen name="Leaderboard" options={{ title: 'Leaderboard', drawerIcon: Trophy }} />
      <Drawer.Screen name="trips" options={{ title: 'Trip History', drawerIcon: Clock }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile', drawerIcon: User }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings', drawerIcon: Settings }} />
      <Drawer.Screen name="help" options={{ title: 'Help', drawerIcon: HelpCircle }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: { padding: 20, alignItems: 'center' },
  logo: { width: 50, height: 50, marginBottom: 10 },
  appTitle: { fontSize: 24, fontWeight: '700' },
  appSubtitle: { fontSize: 14 },
  drawerItems: { flex: 1 },
  drawerItem: { padding: 14, margin: 6, borderRadius: 12 },
  drawerItemContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  drawerLabel: { fontSize: 16 },
  drawerFooter: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 12 },
  socialContainer: { flexDirection: 'row', marginBottom: 12 },
  socialIcon: { marginHorizontal: 8, padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
});
