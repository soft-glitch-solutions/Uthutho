import { Tabs } from 'expo-router';
import { House, User, Rss, Route, WalletCards } from 'lucide-react-native';
import { View, Text, Dimensions, Pressable } from 'react-native';
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
import { useEffect } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 5;
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);

// Animated Components
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

// Floating Background Indicator
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

// Animated Tab Icon with Floating Effect
const FloatingTabIcon = ({ color, size, focused, children, notificationCount = 0, index }) => {
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
              height: 80,
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

// Custom Floating Tab Bar
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

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} colors={colors} unreadCount={unreadCount} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          display: 'none', // Hide default tab bar
        },
        headerShown: false,
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
          title: 'Journey',
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
  );
}