import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge, Star, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

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
      icon: <Badge size={20} color="#1ea2b1" />,
      title: 'Change Title',
      subtitle: 'Change your profile title',
      route: '/changetitle'
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>RANK & TITLES</Text>
      
      {rankMenuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => router.push('/changetitle')}
        >
          <View style={styles.itemLeft}>
            <View style={styles.iconBox}>
              {item.icon}
            </View>
            <View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#333" />
        </TouchableOpacity>
      ))}
      
      <Text style={[styles.sectionTitle, { marginTop: 40 }]}>ACHIEVEMENTS</Text>
      
      <View style={styles.achievementBanner}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
          <Star size={20} color="#fbbf24" />
        </View>
        <View style={styles.achievementText}>
          <Text style={styles.achievementTitle}>Eco Warrior</Text>
          <Text style={styles.achievementDescription}>
            You've helped reduce carbon emissions by using public transport!
          </Text>
        </View>
      </View>

      <View style={styles.achievementBanner}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
          <Star size={20} color="#34d399" />
        </View>
        <View style={styles.achievementText}>
          <Text style={styles.achievementTitle}>Early Adopter</Text>
          <Text style={styles.achievementDescription}>
            Thanks for being one of the first to try Uthutho!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#444',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
    gap: 16,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});