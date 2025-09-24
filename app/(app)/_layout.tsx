import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../context/ThemeContext';
import { Route, House, Flag , Settings, CircleHelp as HelpCircle, User , MapPin } from 'lucide-react-native';
import NetworkGate from '@/components/NetworkGate';

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
        name="profile"
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <User color={color} size={size} />
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
    name="favorities"
    options={{
      drawerItemStyle: { height: 0 },
      title: 'favorities'
    }}
  />
  <Drawer.Screen
  name="AddRoutes"
  options={{
    drawerItemStyle: { height: 0 },
    title: 'AddRoutes'
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
        name="favorites"
        options={{
          drawerItemStyle: { height: 0 },
          title: 'Favourites'
        }}
      />
      <Drawer.Screen name="titleearn" options={{ drawerItemStyle: { height: 0 }, title: 'Change Title' }} />

       <Drawer.Screen name="changetitle" options={{ drawerItemStyle: { height: 0 }, title: 'Change Title' }} />
      <Drawer.Screen name="help/UsingFeedScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Using Feed' }} />
      <Drawer.Screen name="help/FindingHubsScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Finding Hubs' }} />
      <Drawer.Screen name="help/ContactSupportScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Contact Support' }} />
      <Drawer.Screen name="help/GettingStartedScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Getting Started' }} />
      <Drawer.Screen name="help/ManagingProfileScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Managing Profile' }} />
            <Drawer.Screen name="post/[id]" options={{ drawerItemStyle: { height: 0 }, title: 'Managing Profile' }} />
            <Drawer.Screen name="user/[id]" options={{ drawerItemStyle: { height: 0 }, title: 'Managing Profile' }} />
                        <Drawer.Screen name="hub/[id]" options={{ drawerItemStyle: { height: 0 }, title: 'Managing Profile' }} />
            <Drawer.Screen name="PrivacyScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Privacy Screen' }} />
            <Drawer.Screen name="SecurityScreen" options={{ drawerItemStyle: { height: 0 }, title: 'Security Screen' }} />
            <Drawer.Screen name="notification" options={{ drawerItemStyle: { height: 0 }, title: 'Notification' }} />
            <Drawer.Screen name="carpool" options={{ drawerItemStyle: { height: 0 }, title: 'CarPool' }} />
            <Drawer.Screen name="journeyComplete" options={{ drawerItemStyle: { height: 0 }, title: 'JourneyComplete' }} />
          <Drawer.Screen name="journey" options={{ drawerItemStyle: { height: 0 }, title: 'journey' }} />
          <Drawer.Screen name="hubs" options={{ drawerItemStyle: { height: 0 }, title: 'hubs' }} />
          <Drawer.Screen name="stops" options={{ drawerItemStyle: { height: 0 }, title: 'stops' }} />
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
        title: 'Favorite Details'
      }}
    />
    <Drawer.Screen
    name="stop-post-details"
    options={{
      drawerItemStyle: { height: 0 },
      title: 'Favorite Details'
    }}
  />
  <Drawer.Screen
  name="social-profile"
  options={{
    drawerItemStyle: { height: 0 },
    title: 'Favorite Details'
  }}
/>
    </Drawer>
  );
}