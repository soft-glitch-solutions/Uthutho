import { Tabs } from 'expo-router';
import { House, MapPin, Newspaper, Flag, Route } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

export default function TabLayout() {
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
        name="hubs"
        options={{
          title: 'Hubs',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'Feeds',
          tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stops"
        options={{
          title: 'Stops',
          tabBarIcon: ({ color, size }) => <Flag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Route',
          tabBarIcon: ({ color, size }) => <Route color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}