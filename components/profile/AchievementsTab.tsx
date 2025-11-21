import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge, Star } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { AchievementBannerSkeleton, MenuItemSkeleton } from './SkeletonComponents';

interface AchievementsTabProps {
  colors: any;
  loading: boolean;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  colors,
  loading
}) => {
  const rankMenuItems = [
    {
      icon: <Badge size={24} color={colors.primary} />,
      title: 'Change Title',
      subtitle: 'Change your profile title',
      route: '/changetitle'
    },
  ];

  if (loading) {
    return (
      <View style={styles.menuContainer}>
        <MenuItemSkeleton colors={colors} />
        <AchievementBannerSkeleton colors={colors} />
        <AchievementBannerSkeleton colors={colors} />
      </View>
    );
  }

  return (
    <View style={styles.menuContainer}>
      {rankMenuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => {
            if (item.title === 'Change Title') {
              router.push('/changetitle');
            }
          }}
        >
          {item.icon}
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.text }]}>
              {item.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {/* Achievement Banners */}
      <View style={[styles.achievementBanner, { backgroundColor: colors.card }]}>
        <Star size={24} color="#fbbf24" />
        <View style={styles.achievementText}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>Eco Warrior</Text>
          <Text style={[styles.achievementDescription, { color: colors.text }]}>
            You've helped reduce carbon emissions by using public transport!
          </Text>
        </View>
      </View>

      <View style={[styles.achievementBanner, { backgroundColor: colors.card }]}>
        <Star size={24} color="#34d399" />
        <View style={styles.achievementText}>
          <Text style={[styles.achievementTitle, { color: colors.text }]}>Early Adopter</Text>
          <Text style={[styles.achievementDescription, { color: colors.text }]}>
            Thanks for being one of the first to try Uthutho!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    padding: 20,
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  achievementBanner: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  achievementText: {
    flex: 1,
    marginLeft: 12,
  },
});