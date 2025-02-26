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
    </Drawer>
  );
}