import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../context/ThemeContext';
import { Route, House, Settings, CircleHelp as HelpCircle } from 'lucide-react-native';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        headerShown: false, 
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <House color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="routes"
        options={{
          title: 'Route',
          drawerIcon: ({ color, size }) => (
            <Route color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="help"
        options={{
          title: 'Help',
          drawerIcon: ({ color, size }) => (
            <HelpCircle color={color} size={size} />
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
        title: 'Hub Details'
      }}
    />
    <Drawer.Screen
    name="AddHub"
    options={{
      drawerItemStyle: { height: 0 },
      title: 'Hub Details'
    }}
  />
  <Drawer.Screen
  name="AddStop"
  options={{
    drawerItemStyle: { height: 0 },
    title: 'Hub Details'
  }}
/>
<Drawer.Screen
name="EditProfileScreen"
options={{
  drawerItemStyle: { height: 0 },
  title: 'Hub Details'
}}
/>
<Drawer.Screen
name="route-details"
options={{
  drawerItemStyle: { height: 0 },
  title: 'Hub Details'
}}
/>
<Drawer.Screen
name="FavoriteDetailsScreen"
options={{
  drawerItemStyle: { height: 0 },
  title: 'Hub Details'
}}
/>
      <Drawer.Screen
        name="FavoritesScreen"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favourites'
        }}
      />
      <Drawer.Screen
        name="PostDetails"
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
    </Drawer>
  );
}