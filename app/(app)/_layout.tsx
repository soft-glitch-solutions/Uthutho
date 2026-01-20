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
  BarChart3
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Fallback icon component
const FallbackIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, opacity: 0.3, borderRadius: 4 }} />
);

// Screens visible in drawer
const VISIBLE_DRAWER_SCREENS = [
  '(tabs)',
  'Leaderboard',
  'trips',
  'profile',
  'settings',
  'help'
];

// Custom Drawer Content
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
        // First check user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (rolesError && rolesError.code !== 'PGRST116') {
          console.error('Error fetching user roles:', rolesError);
        }

        if (userRoles) {
          setUserRole(userRoles.role);
          setIsDriver(userRoles.role === 'driver');
        } else {
          // Fallback: check if user exists in drivers table
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (driverError && driverError.code !== 'PGRST116') {
            console.error('Error checking driver status:', driverError);
          }

          if (driverData) {
            setUserRole('driver');
            setIsDriver(true);
          } else {
            setUserRole('user');
            setIsDriver(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
        setIsDriver(false);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const visibleRoutes = props.state.routes.filter(route =>
    VISIBLE_DRAWER_SCREENS.includes(route.name)
  );

  const handleDriverAction = () => {
    console.log('Driver action clicked. Is driver:', isDriver);
    
    if (isDriver) {
      // SIMPLE APPROACH: Navigate directly to the dashboard screen
      console.log('Navigating to driver-dashboard...');
      
      // Close drawer first for better UX
      props.navigation.closeDrawer();
      
      // Small delay to ensure drawer is closed
      setTimeout(() => {
        // Navigate to the actual screen name
        props.navigation.navigate('driver-dashboard');
      }, 100);
      
    } else {
      // Navigate to driver onboarding
      console.log('Navigating to driver-onboarding...');
      props.navigation.navigate('driver-onboarding');
    }
  };

  const handleNavigation = (routeName) => {
    console.log('Navigating to:', routeName);
    props.navigation.navigate(routeName);
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
      {/* Header - Made more compact */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/uthutho-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={[styles.appTitle, { color: colors.text }]}>Uthutho</Text>
          <Text style={[styles.appSubtitle, { color: `${colors.text}70` }]}>
            Your Journey Companion
          </Text>
        </View>
      </View>

      {/* Drawer Items - Now in a ScrollView */}
      <ScrollView 
        style={styles.drawerScrollView}
        contentContainerStyle={styles.drawerItems}
        showsVerticalScrollIndicator={false}
      >
        {visibleRoutes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const isFocused = props.state.index === index;
          const IconComponent = options.drawerIcon || FallbackIcon;

          const translateX = slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          });

          const opacity = slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <AnimatedPressable
              key={route.key}
              onPress={() => handleNavigation(route.name)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[
                styles.drawerItem,
                {
                  transform: [{ scale: scaleAnim }, { translateX }],
                  opacity,
                  backgroundColor: isFocused ? `${colors.primary}15` : 'transparent',
                  borderLeftWidth: isFocused ? 4 : 0,
                  borderLeftColor: colors.primary,
                  height: 52, // Fixed height for consistency
                },
              ]}
            >
              <View style={styles.drawerItemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isFocused ? colors.primary : `${colors.text}20` },
                  ]}
                >
                  <IconComponent
                    color={isFocused ? colors.background : colors.text}
                    size={20} // Slightly smaller icons
                    fill={isFocused ? colors.primary : 'transparent'}
                  />
                </View>
                <Text
                  style={[
                    styles.drawerLabel,
                    {
                      color: isFocused ? colors.primary : colors.text,
                      fontWeight: isFocused ? '600' : '400',
                      fontSize: 15, // Slightly smaller font
                    },
                  ]}
                  numberOfLines={1}
                >
                  {options.title || route.name}
                </Text>
              </View>
              <ChevronRight
                size={16}
                color={isFocused ? colors.primary : `${colors.text}50`}
              />
            </AnimatedPressable>
          );
        })}

        {/* Driver Section */}
        {!loadingRole && (
          <AnimatedPressable
            onPress={handleDriverAction}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.drawerItem,
              styles.driverItem,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: isDriver ? 'rgba(30, 162, 177, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                borderLeftWidth: 4,
                borderLeftColor: isDriver ? '#1ea2b1' : '#8B5CF6',
                marginTop: 12,
                marginBottom: 12,
                height: 60, // Slightly taller for emphasis
              },
            ]}
          >
            <View style={styles.drawerItemContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDriver ? '#1ea2b1' : '#8B5CF6' },
                ]}
              >
                {isDriver ? (
                  <BarChart3 size={20} color="#FFFFFF" />
                ) : (
                  <Car size={20} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.driverTextContainer}>
                <Text
                  style={[
                    styles.drawerLabel,
                    {
                      color: isDriver ? '#1ea2b1' : '#8B5CF6',
                      fontWeight: '600',
                      fontSize: 15,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isDriver ? 'Driver Dashboard' : 'Apply as Driver'}
                </Text>
                <Text 
                  style={[styles.driverSubtitle, { color: `${colors.text}70` }]}
                  numberOfLines={1}
                >
                  {isDriver ? 'Manage your transport services' : 'Get Clients with Uthutho'}
                </Text>
              </View>
            </View>
            <ChevronRight
              size={16}
              color={isDriver ? '#1ea2b1' : '#8B5CF6'}
            />
          </AnimatedPressable>
        )}

        {loadingRole && (
          <View style={[styles.drawerItem, styles.loadingItem, { height: 52 }]}>
            <View style={styles.drawerItemContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.text} />
              </View>
              <Text style={[styles.drawerLabel, { color: colors.text, fontSize: 15 }]}>
                Loading...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer - Made more compact */}
      <View style={styles.drawerFooter}>
        <View style={styles.socialContainer}>
          <Pressable 
            onPress={() => Linking.openURL('https://www.linkedin.com/company/uthutho')} 
            style={styles.socialIcon}
          >
            <Linkedin size={18} color={colors.text} />
          </Pressable>

          <Pressable 
            onPress={() => Linking.openURL('https://www.facebook.com/uthuthorsa/')} 
            style={styles.socialIcon}
          >
            <Facebook size={18} color={colors.text} />
          </Pressable>

          <Pressable 
            onPress={() => Linking.openURL('https://www.instagram.com/uthuthorsa/')} 
            style={styles.socialIcon}
          >
            <Instagram size={18} color={colors.text} />
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
      screenOptions={{
        headerShown: false,
        drawerStyle: { 
          backgroundColor: colors.background,
          width: Math.min(300, SCREEN_HEIGHT * 0.8), // Responsive width
        },
        drawerType: 'front', // Better for small screens
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Main Screens */}
      <Drawer.Screen 
        name="(tabs)" 
        options={{ 
          title: 'Home', 
          drawerIcon: House 
        }} 
      />
      <Drawer.Screen 
        name="Leaderboard" 
        options={{ 
          title: 'Leaderboard', 
          drawerIcon: Trophy 
        }} 
      />
      <Drawer.Screen 
        name="trips" 
        options={{ 
          title: 'Trip History', 
          drawerIcon: Clock 
        }} 
      />
      <Drawer.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          drawerIcon: User 
        }} 
      />
      <Drawer.Screen 
        name="settings" 
        options={{ 
          title: 'Settings', 
          drawerIcon: Settings 
        }} 
      />
      <Drawer.Screen 
        name="help" 
        options={{ 
          title: 'Help', 
          drawerIcon: HelpCircle 
        }} 
      />

      {/* Driver Screens - Registered as flat screens, NOT nested */}
      <Drawer.Screen 
        name="driver-dashboard" 
        options={{ 
          title: 'Driver Dashboard', 
          drawerItemStyle: { display: 'none' }
        }} 
      />
      
      <Drawer.Screen 
        name="driver-onboarding" 
        options={{ 
          title: 'Become a Driver', 
          drawerItemStyle: { display: 'none' }
        }} 
      />
    </Drawer>
  );
};

const styles = StyleSheet.create({
  drawerContainer: { 
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 40, // Reduced padding
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40, // Smaller logo
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  logo: { 
    width: '100%', 
    height: '100%' 
  },
  appTitle: { 
    fontSize: 18, // Smaller font
    fontWeight: '700',
    marginBottom: 2,
  },
  appSubtitle: { 
    fontSize: 12 // Smaller font
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerItems: { 
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8, // Reduced padding
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 10,
  },
  drawerItemContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
  iconContainer: {
    width: 36, // Smaller container
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerLabel: { 
    fontSize: 15,
    flexShrink: 1,
  },
  driverTextContainer: {
    flex: 1,
  },
  driverSubtitle: {
    fontSize: 11, // Smaller font
    marginTop: 2,
  },
  drawerFooter: { 
    padding: 16, // Reduced padding
    paddingBottom: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: { 
    fontSize: 11, // Smaller font
    marginTop: 8,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialIcon: {
    marginHorizontal: 8,
    padding: 6, // Reduced padding
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  driverItem: {
    borderLeftWidth: 4,
  },
  loadingItem: {
    opacity: 0.7,
  },
});