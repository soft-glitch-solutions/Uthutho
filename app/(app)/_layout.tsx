import React, { useEffect, useRef } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../context/ThemeContext';
import {
  House,
  Trophy,
  Settings,
  CircleHelp as HelpCircle,
  User,
  Bot,
  ChevronRight,
  Linkedin,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react-native';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Linking
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Fallback icon component
const FallbackIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, opacity: 0.3, borderRadius: 4 }} />
);

// Screens visible in drawer
const VISIBLE_DRAWER_SCREENS = [
  '(tabs)',
  'Leaderboard',
  'ai',
  'profile',
  'settings',
  'help'
];

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const { colors } = useTheme();

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

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/uthutho-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
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
              onPress={() => props.navigation.navigate(route.name)}
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
                    size={22}
                    fill={isFocused ? colors.primary : 'transparent'}
                  />
                </View>
                <Text
                  style={[
                    styles.drawerLabel,
                    {
                      color: isFocused ? colors.primary : colors.text,
                      fontWeight: isFocused ? '600' : '400',
                    },
                  ]}
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
      </View>

      {/* Footer */}
      <View style={styles.drawerFooter}>

        {/* Social Media Icons */}
        <View style={styles.socialContainer}>
          <Pressable onPress={() => Linking.openURL('https://www.linkedin.com/company/uthutho')} style={styles.socialIcon}>
            <Linkedin size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://www.facebook.com/uthuthorsa/')} style={styles.socialIcon}>
            <Facebook size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://www.instagram.com/uthuthorsa/')} style={styles.socialIcon}>
            <Instagram size={20} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VbBvCFSFMqrRi2c83q0Z')} style={styles.socialIcon}>
            <MessageCircle size={20} color={colors.text} />
          </Pressable>
        </View>

        <Text style={[styles.footerText, { color: `${colors.text}40` }]}>
          Version 1.5.1
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
        drawerStyle: { backgroundColor: colors.background },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Home', drawerIcon: House }} />
      <Drawer.Screen name="Leaderboard" options={{ title: 'Leaderboard', drawerIcon: Trophy }} />
      <Drawer.Screen name="ai" options={{ title: 'AI Assistant', drawerIcon: Bot }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile', drawerIcon: User }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings', drawerIcon: Settings }} />
      <Drawer.Screen name="help" options={{ title: 'Help', drawerIcon: HelpCircle }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logo: { width: '100%', height: '100%' },
  appTitle: { fontSize: 24, fontWeight: '700' },
  appSubtitle: { fontSize: 14 },
  drawerItems: { flex: 1, paddingVertical: 10 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  drawerItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerLabel: { fontSize: 16 },
  drawerFooter: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 12 },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  socialIcon: {
    marginHorizontal: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
