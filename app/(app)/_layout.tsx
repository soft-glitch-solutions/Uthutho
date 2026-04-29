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
  Car,

  BarChart3,
  X
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
  ScrollView,
  Dimensions
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallMobile = SCREEN_HEIGHT < 700;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FallbackIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, opacity: 0.3, borderRadius: 4 }} />
);

const VISIBLE_DRAWER_SCREENS = [
  '(tabs)',
  'Leaderboard',
  'trips',
  'profile',
  'settings',
  'help'
];

const BRAND_COLOR = '#1ea2b1';

const CustomDrawerContent = (props) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
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
        const { data: userRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
        if (userRoles && userRoles.role === 'driver') {
          setUserRole('driver');
          setIsDriver(true);
          setIsPending(false);
        } else {
          const { data: driverData } = await supabase.from('drivers').select('id, is_verified').eq('user_id', user.id).maybeSingle();
          if (driverData) {
            if (driverData.is_verified) {
              setUserRole('driver');
              setIsDriver(true);
              setIsPending(false);
            } else {
              setUserRole('user');
              setIsDriver(false);
              setIsPending(true);
            }
          } else {
            setUserRole('user');
            setIsDriver(false);
            setIsPending(false);
          }
        }
      } catch (error) {
        console.error('Error fetching role:', error);
      } finally {
        setLoadingRole(false);
      }
    };
    fetchUserRole();
  }, [user]);

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();

  const visibleRoutes = props.state.routes.filter(route => VISIBLE_DRAWER_SCREENS.includes(route.name));

  return (
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={[styles.drawerHeader, isSmallMobile && styles.drawerHeaderSmall]}>
        <View style={[styles.headerTop, isSmallMobile && styles.headerTopSmall]}>
          <View style={[styles.logoContainer, isSmallMobile && styles.logoContainerSmall]}>
            <Image source={require('../../assets/uthutho-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
        <Text style={[styles.appTitle, isSmallMobile && styles.appTitleSmall]}>Uthutho</Text>
        <Text style={styles.readyText}>Move Smarter</Text>
      </View>

      {/* Navigation */}
      <ScrollView style={styles.drawerScrollView} contentContainerStyle={styles.drawerItems} showsVerticalScrollIndicator={false}>
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
                { transform: [{ scale: scaleAnim }], backgroundColor: isFocused ? '#111' : 'transparent' },
                isSmallMobile && styles.drawerItemSmall
              ]}
            >
              <View style={styles.drawerItemContent}>
                <View style={[styles.iconContainer, { backgroundColor: isFocused ? BRAND_COLOR : '#111' }, isSmallMobile && styles.iconContainerSmall]}>
                  <IconComponent color={isFocused ? '#000' : '#444'} size={16} />
                </View>
                <Text style={[styles.drawerLabel, { color: isFocused ? '#FFF' : '#666', fontWeight: isFocused ? '900' : '600' }, isSmallMobile && styles.drawerLabelSmall]}>
                  {options.title || route.name}
                </Text>
              </View>
              {isFocused && <View style={styles.activeIndicator} />}
            </AnimatedPressable>
          );
        })}

        {/* Driver Dashboard / Apply Section */}
        {!loadingRole && (
          <AnimatedPressable
            onPress={() => isDriver ? props.navigation.navigate('driver-dashboard') : props.navigation.navigate('driver-onboarding')}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.driverItem, { transform: [{ scale: scaleAnim }] }, isSmallMobile && styles.driverItemSmall]}
          >
            <View style={styles.driverContent}>
              <View style={[
                styles.driverIconBox,
                { backgroundColor: isDriver ? BRAND_COLOR : isPending ? '#fbbf24' : '#8B5CF6' },
                isSmallMobile && styles.driverIconBoxSmall
              ]}>
                {isDriver ? <BarChart3 size={16} color="#000" strokeWidth={2.5} /> : isPending ? <Clock size={16} color="#000" /> : <Car size={16} color="#FFF" />}
              </View>
              <View style={styles.driverTexts}>
                <Text style={[styles.driverTitle, isPending && { color: '#fbbf24' }]}>
                  {isDriver ? 'DASHBOARD' : isPending ? 'STATUS PENDING' : 'BECOME DRIVER'}
                </Text>
                <Text style={styles.driverSubtitle}>
                  {isDriver ? 'Manage Services' : isPending ? 'Reviewing Documents' : 'Earn with Uthutho'}
                </Text>
              </View>
            </View>
            <ChevronRight size={14} color="#333" />
          </AnimatedPressable>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.drawerFooter, isSmallMobile && styles.drawerFooterSmall]}>
        <View style={[styles.socialContainer, isSmallMobile && styles.socialContainerSmall]}>
          <Pressable onPress={() => Linking.openURL('https://www.linkedin.com/company/uthutho')} style={styles.socialIcon}>
            <Linkedin size={14} color="#444" />
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://www.facebook.com/uthuthorsa/')} style={styles.socialIcon}>
            <Facebook size={14} color="#444" />
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://www.instagram.com/uthuthorsa/')} style={styles.socialIcon}>
            <Instagram size={14} color="#444" />
          </Pressable>
        </View>
        <Text style={styles.versionText}>v1.8.2 — READY TO MOVE</Text>
      </View>
    </View>
  );
};

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#000',
          width: 280,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.8)',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Home', drawerIcon: House }} />
      <Drawer.Screen name="Leaderboard" options={{ title: 'Leaderboard', drawerIcon: Trophy }} />
      <Drawer.Screen name="trips" options={{ title: 'Trip History', drawerIcon: Clock }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile', drawerIcon: User }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings', drawerIcon: Settings }} />
      <Drawer.Screen name="help" options={{ title: 'Help', drawerIcon: HelpCircle }} />
      <Drawer.Screen name="driver-dashboard" options={{ title: 'Driver Dashboard', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="driver-onboarding" options={{ title: 'Become a Driver', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  drawerHeaderSmall: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTopSmall: {
    marginBottom: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  logoContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  logo: {
    width: '100%',
    height: '100%'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  appTitleSmall: {
    fontSize: 20,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND_COLOR,
    letterSpacing: 2,
    marginTop: 4,
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerItems: {
    paddingHorizontal: 16,
    gap: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    marginVertical: 2,
  },
  drawerItemSmall: {
    paddingVertical: 10,
    borderRadius: 16,
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  drawerLabel: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  drawerLabelSmall: {
    fontSize: 13,
  },
  activeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: BRAND_COLOR,
  },
  driverItem: {
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#222',
    marginHorizontal: 16,
  },
  driverItemSmall: {
    marginTop: 16,
    padding: 12,
    borderRadius: 20,
  },
  driverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  driverIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverIconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  driverTexts: {
    gap: 2,
  },
  driverTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  driverSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  drawerFooter: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  drawerFooterSmall: {
    padding: 16,
    paddingBottom: 24,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  socialContainerSmall: {
    marginBottom: 12,
    gap: 12,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  versionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#222',
    letterSpacing: 1,
  },
});
import { TouchableOpacity } from 'react-native-gesture-handler';