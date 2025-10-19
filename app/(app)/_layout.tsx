import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../context/ThemeContext';
import { 
  Route, 
  House, 
  Trophy, 
  Settings, 
  CircleHelp as HelpCircle, 
  User, 
  MapPin, 
  Bot,
  Sparkles,
  ChevronRight
} from 'lucide-react-native';
import { 
  Pressable, 
  View, 
  Text, 
  StyleSheet,
  Animated,
  Image,
  Easing 
} from 'react-native';
import NetworkGate from '@/components/NetworkGate';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Fallback icon component
const FallbackIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, backgroundColor: color, opacity: 0.3, borderRadius: 4 }} />
);

export default function AppLayout() {
  const { colors } = useTheme();
  
  // Animation values
  const scaleAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Start slide-in animation when component mounts
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

  const CustomDrawerContent = (props) => {
    return (
      <View style={[styles.drawerContainer, { backgroundColor: colors.background }]}>
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/uthutho-logo.png')}
              style={styles.logoContainer}
            />
          </View>
          <Text style={[styles.appTitle, { color: colors.text }]}>Uthutho</Text>
          <Text style={[styles.appSubtitle, { color: `${colors.text}70` }]}>
            Your Journey Companion
          </Text>
        </View>

        {/* Drawer Items */}
        <View style={styles.drawerItems}>
          {props.state.routes.map((route, index) => {
            const { options } = props.descriptors[route.key];
            const isFocused = props.state.index === index;
            
            // Skip hidden drawer items
            if (options.drawerItemStyle?.height === 0) {
              return null;
            }

            const onPress = () => {
              const event = props.navigation.emit({
                type: 'drawerItemPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };

            // Get the icon component or use fallback
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
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                  styles.drawerItem,
                  {
                    transform: [
                      { scale: scaleAnim },
                      { translateX }
                    ],
                    opacity,
                    backgroundColor: isFocused ? `${colors.primary}15` : 'transparent',
                    borderLeftWidth: isFocused ? 4 : 0,
                    borderLeftColor: colors.primary,
                  }
                ]}
              >
                <View style={styles.drawerItemContent}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: isFocused ? colors.primary : `${colors.text}20` }
                  ]}>
                    <IconComponent 
                      color={isFocused ? colors.background : colors.text} 
                      size={22} 
                      fill={isFocused ? colors.primary : 'transparent'}
                    />
                  </View>
                  <Text style={[
                    styles.drawerLabel,
                    { 
                      color: isFocused ? colors.primary : colors.text,
                      fontWeight: isFocused ? '600' : '400'
                    }
                  ]}>
                    {options.title || route.name}
                  </Text>
                </View>
                <ChevronRight 
                  size={16} 
                  color={isFocused ? colors.primary : `${colors.text}50`}
                  style={{ opacity: isFocused ? 1 : 0.5 }}
                />
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Drawer Footer */}
        <View style={styles.drawerFooter}>
          <Text style={[styles.footerText, { color: `${colors.text}40` }]}>
            Version 1.0.1
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        drawerStyle: {
          backgroundColor: colors.background,
          borderRightWidth: 1,
          borderRightColor: `${colors.text}10`,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        headerShown: false,
        drawerLabelStyle: {
          fontSize: 16,
          marginLeft: -16,
        },
        drawerType: 'front',
        overlayColor: 'transparent',
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size, focused }) => (
            <House color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />

      <Drawer.Screen
        name="Leaderboard"
        options={{
          title: 'Leaderboard',
          drawerIcon: ({ color, size, focused }) => (
            <Trophy color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />

      <Drawer.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          drawerIcon: ({ color, size, focused }) => (
            <Bot color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size, focused }) => (
            <User color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size, focused }) => (
            <Settings color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="help"
        options={{
          title: 'Help',
          drawerIcon: ({ color, size, focused }) => (
            <HelpCircle color={color} size={size} fill={focused ? color : 'transparent'} />
          ),
        }}
      />

      {/* Hidden screens - they will still be accessible but won't appear in drawer */}
      <Drawer.Screen
        name="hub-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Hub Details'
        }}
      />
      <Drawer.Screen
        name="AddRoute"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Add Route'
        }}
      />
      <Drawer.Screen
        name="favorities"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favorites'
        }}
      />
      <Drawer.Screen
        name="AddRoutes"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Add Routes'
        }}
      />
      <Drawer.Screen
        name="AddHub"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Add Hub'
        }}
      />
      <Drawer.Screen
        name="AddStop"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Add Stop'
        }}
      />
      <Drawer.Screen
        name="EditProfileScreen"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Edit Profile'
        }}
      />
      <Drawer.Screen
        name="request"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Request'
        }}
      />
      <Drawer.Screen
        name="route-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Route Details'
        }}
      />
      <Drawer.Screen
        name="FavoriteDetailsScreen"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favorite Details'
        }}
      />
      <Drawer.Screen
        name="favorites"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favorites'
        }}
      />
      <Drawer.Screen 
        name="titleearn" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Change Title' 
        }} 
      />
      <Drawer.Screen 
        name="changetitle" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Change Title' 
        }} 
      />
      <Drawer.Screen 
        name="help/UsingFeedScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Using Feed' 
        }} 
      />
      <Drawer.Screen 
        name="help/FindingHubsScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Finding Hubs' 
        }} 
      />
      <Drawer.Screen 
        name="help/ContactSupportScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Contact Support' 
        }} 
      />
      <Drawer.Screen 
        name="help/GettingStartedScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Getting Started' 
        }} 
      />
      <Drawer.Screen 
        name="help/ManagingProfileScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Managing Profile' 
        }} 
      />
      <Drawer.Screen 
        name="post/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Post Details' 
        }} 
      />
      <Drawer.Screen 
        name="user/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'User Profile' 
        }} 
      />
      <Drawer.Screen 
        name="card/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Card' 
        }} 
      />
      <Drawer.Screen 
        name="hub/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Hub Details' 
        }} 
      />
      <Drawer.Screen 
        name="nearby/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Nearby' 
        }} 
      />
      <Drawer.Screen 
        name="PrivacyScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Privacy' 
        }} 
      />
      <Drawer.Screen 
        name="SecurityScreen" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Security' 
        }} 
      />
      <Drawer.Screen 
        name="notification" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Notification' 
        }} 
      />
      <Drawer.Screen 
        name="carpool" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'CarPool' 
        }} 
      />
      <Drawer.Screen 
        name="journeyComplete" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Journey Complete' 
        }} 
      />
      <Drawer.Screen 
        name="journey" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Journey' 
        }} 
      />
      <Drawer.Screen 
        name="hubs" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Hubs' 
        }} 
      />
      <Drawer.Screen 
        name="stops" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Stops' 
        }} 
      />
      <Drawer.Screen 
        name="OnboardDriver" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Onboard Driver' 
        }} 
      />
      <Drawer.Screen 
        name="leaderboard/[id]" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Leaderboard User' 
        }} 
      />
      <Drawer.Screen 
        name="driver/signup" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Driver Signup' 
        }} 
      />
      <Drawer.Screen 
        name="FilteredLeaderboard" 
        options={{ 
          drawerItemStyle: { height: 0 }, 
          title: 'Filtered Leaderboard' 
        }} 
      />
      <Drawer.Screen
        name="post-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Post Details'
        }}
      />
      <Drawer.Screen
        name="stop-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Stop Details'
        }}
      />
      <Drawer.Screen
        name="favorite-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favorite Details'
        }}
      />
      <Drawer.Screen
        name="hub-post-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Hub Post Details'
        }}
      />
      <Drawer.Screen
        name="stop-post-details"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Stop Post Details'
        }}
      />
      <Drawer.Screen
        name="social-profile"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Social Profile'
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  drawerItems: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  drawerFooter: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
  },
});