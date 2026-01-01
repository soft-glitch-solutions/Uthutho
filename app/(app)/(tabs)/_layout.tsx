import { Tabs } from 'expo-router';
import { House, User, Rss, Route, WalletCards, Search } from 'lucide-react-native';
import { View, Text, Dimensions, Pressable, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInUp,
  ZoomIn,
  BounceIn,
  SlideInLeft,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '../../../hook/useNotifications';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StreakOverlay from '@/components/StreakOverlay';
import { useRouter, useNavigation } from 'expo-router';
import BannerAdComponent from '@/components/ads/BannerAd';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_COUNT = 5;
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);

// Check if desktop
const isDesktop = SCREEN_WIDTH >= 1024;

// Animated Components
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

// Floating Background Indicator for Mobile
const FloatingBackground = ({ activeIndex, colors }) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
    };
  });

  useEffect(() => {
    const tabWidth = TAB_BAR_WIDTH / TAB_COUNT;
    translateX.value = withSpring(activeIndex * tabWidth, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [activeIndex]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          width: TAB_BAR_WIDTH / TAB_COUNT,
          height: 80,
          backgroundColor: colors.primary,
          borderRadius: 16,
          shadowColor: colors.primary,
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 12,
          zIndex: 0,
        },
        animatedStyle,
      ]}
    />
  );
};

// Animated Tab Icon with Floating Effect for Mobile
const FloatingTabIcon = ({ color, size, focused, children, notificationCount = 0, index, colors }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: interpolate(
            translateY.value,
            [0, -8],
            [0.8, 1.2],
            Extrapolate.CLAMP
          )
        }
      ],
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (focused) {
        translateY.value = withSpring(-8, {
          damping: 12,
          stiffness: 140,
          mass: 0.7,
        });
        scale.value = withSpring(1.2, {
          damping: 12,
          stiffness: 140,
          mass: 0.7,
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 12,
          stiffness: 140,
          mass: 0.7,
        });
        scale.value = withSpring(1, {
          damping: 12,
          stiffness: 140,
          mass: 0.7,
        });
      }
      opacity.value = withTiming(1, { duration: 300 });
    }, index * 100);

    return () => clearTimeout(timer);
  }, [focused, index]);

  return (
    <AnimatedView style={{ position: 'relative', alignItems: 'center' }}>
      <AnimatedView style={iconAnimatedStyle}>
        {children}
      </AnimatedView>
      
      {notificationCount > 0 && (
        <AnimatedView 
          style={[
            {
              position: 'absolute',
              top: -6,
              right: -8,
              backgroundColor: '#ef4444',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.background,
              zIndex: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 4,
            },
            badgeAnimatedStyle
          ]}
          entering={BounceIn.duration(600).delay(800 + index * 100)}
        >
          <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </Text>
        </AnimatedView>
      )}
    </AnimatedView>
  );
};

// Desktop Top Navigation Bar
const DesktopTopNavBar = ({ state, descriptors, navigation, colors, unreadCount }) => {
  const router = useRouter();
  const openSidebar = () => {
    navigation.toggleDrawer();
  };

  return (
    <AnimatedView
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: colors.card || 'rgba(30, 30, 30, 0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border || 'rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
      }}
      entering={FadeIn.duration(500)}
    >
      {/* App Logo/Brand */}
      <View style={{ 
        position: 'absolute', 
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
      }}>
        <Pressable 
          onPress={openSidebar}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Image
            source={require('../../../assets/uthutho-logo.png')}
            style={{ width: 30, height: 30, marginRight: 8 }}
          />
          <Text style={{ 
            fontSize: 30, 
            fontWeight: 'bold', 
            color: colors.primary,
            letterSpacing: -0.5 
          }}>
            Uthutho
          </Text>
        </Pressable>
      </View>

      {/* Navigation Items */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 8,
      }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const IconComponent = options.tabBarIcon;

          // Get notification count for feeds tab
          const notificationCount = route.name === 'feeds' ? unreadCount : 0;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: isFocused ? colors.primary : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
              }}
            >
              <IconComponent 
                color={isFocused ? '#ffffff' : colors.text} 
                size={18} 
                focused={isFocused}
              />
              
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: isFocused ? '#ffffff' : colors.text,
              }}>
                {options.title || route.name}
              </Text>

              {notificationCount > 0 && (
                <View 
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.card,
                    zIndex: 10,
                  }}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 8, 
                    fontWeight: 'bold',
                    lineHeight: 12,
                  }}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Search Icon instead of Profile Icon */}
      <View style={{ position: 'absolute', right: 20 }}>
        <Pressable
          onPress={() => router.push('/favorites')}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: colors.primary + '20',
          }}
        >
          <Search size={20} color={colors.primary} />
        </Pressable>
      </View>
    </AnimatedView>
  );
};

// Custom Floating Tab Bar for Mobile
const FloatingTabBar = ({ state, descriptors, navigation, colors, unreadCount }) => {
  return (
    <AnimatedView
      style={{
        position: 'absolute',
        bottom: 25,
        left: TAB_BAR_MARGIN,
        right: TAB_BAR_MARGIN,
        width: TAB_BAR_WIDTH,
        height: 70,
        backgroundColor: colors.card || 'rgba(30, 30, 30, 0.95)',
        borderRadius: 25,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: colors.border || 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
      entering={FadeInUp.duration(800)}
    >
      {/* Floating Background Indicator */}
      <FloatingBackground activeIndex={state.index} colors={colors} />
      
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const IconComponent = options.tabBarIcon;

        // Get notification count for feeds tab
        const notificationCount = route.name === 'feeds' ? unreadCount : 0;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <AnimatedView
              entering={SlideInLeft.delay(index * 120).duration(500)}
              style={{ 
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                width: '100%',
              }}
            >
              <FloatingTabIcon
                color={isFocused ? '#ffffff' : colors.text}
                size={22}
                focused={isFocused}
                notificationCount={notificationCount}
                index={index}
                colors={colors}
              >
                <IconComponent 
                  color={isFocused ? '#ffffff' : colors.text} 
                  size={22} 
                  focused={isFocused}
                />
              </FloatingTabIcon>
              
              <AnimatedText
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  marginTop: 4,
                  color: isFocused ? '#ffffff' : colors.text,
                }}
                entering={FadeIn.delay(400 + index * 100).duration(400)}
              >
                {options.title || route.name}
              </AnimatedText>
            </AnimatedView>
          </Pressable>
        );
      })}
    </AnimatedView>
  );
};

export default function EnhancedTabLayout() {
  const { unreadCount } = useNotifications();
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [showStreakOverlay, setShowStreakOverlay] = useState(false);

  // Check for streak overlay when component mounts
  useEffect(() => {
    checkAndShowStreakOverlay();
  }, []);

  const checkAndShowStreakOverlay = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found for streak overlay');
        return;
      }

      setUserId(user.id);

      // Check if we've shown the overlay today
      const today = new Date().toISOString().split('T')[0];
      const shownKey = `streakOverlayShown_${user.id}_${today}`;
      const hasShownToday = await AsyncStorage.getItem(shownKey);
      
      console.log('Streak overlay check:', { userId: user.id, today, hasShownToday });

      if (!hasShownToday) {
        // Small delay to let the app load first
        setTimeout(() => {
          setShowStreakOverlay(true);
          AsyncStorage.setItem(shownKey, 'true');
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking streak overlay:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => 
          isDesktop ? 
            <DesktopTopNavBar {...props} colors={colors} unreadCount={unreadCount} /> 
            : <FloatingTabBar {...props} colors={colors} unreadCount={unreadCount} />
        }
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          tabBarStyle: {
            display: 'none', // Hide default tab bar
          },
          headerShown: false,
          // Add padding to content for desktop to account for top nav bar
          contentStyle: isDesktop ? {
            paddingTop: 60, // Height of desktop top nav
            backgroundColor: colors.background,
          } : undefined,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <House color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="feeds"
          options={{
            title: 'Feeds',
            tabBarIcon: ({ color, size, focused }) => (
              <Rss color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="tracker"
          options={{
            title: 'Cards',
            tabBarIcon: ({ color, size, focused }) => (
              <WalletCards color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="routes"
          options={{
            title: 'Planner',
            tabBarIcon: ({ color, size, focused }) => (
              <Route color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <User color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      {/* Streak Overlay - Shows across all tabs */}
      <StreakOverlay
        visible={showStreakOverlay}
        userId={userId}
        onClose={() => setShowStreakOverlay(false)}
      />

      {/* Banner Ad */}
      <BannerAdComponent />
    </View>
  );
}