import { Tabs } from 'expo-router';
import { House, User, Rss, Route ,MessageCircle } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '../../../hook/useNotifications';
export default function TabLayout() {
  const { unreadCount } = useNotifications();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false, 
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'Feeds',
          tabBarIcon: ({ color, size }) => (
 <View style={{ position: 'relative' }}>
 <Rss color={color} size={size} />
              {unreadCount > 0 && (
 <View
 style={{
 position: 'absolute',
 top: -5,
 right: -5,
 backgroundColor: 'red',
 borderRadius: 10,
 width: 20,
 height: 20,
 justifyContent: 'center',
 alignItems: 'center',
                  }}
 >
 <Text style={{ color: 'white', fontSize: 12 }}>{unreadCount}</Text>
 </View>
              )}
 </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: 'Route',
          tabBarIcon: ({ color, size }) => <Route color={color} size={size} />,
        }}
      />
            <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
    
  );
}