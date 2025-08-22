import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import HeaderSkeleton from './skeletons/HeaderSkeleton';

interface HeaderSectionProps {
  isProfileLoading: boolean;
  userProfile: any;
  colors: any;
}

const HeaderSection = ({ isProfileLoading, userProfile, colors }: HeaderSectionProps) => {
  const router = useRouter();

  if (isProfileLoading) {
    return <HeaderSkeleton colors={colors} />;
  }

  return (
    <View style={styles.header}>
      <View>
        <View style={styles.firstRow}>
          <Pressable onPress={() => router.push('/profile')}>
            <Text style={[styles.title, { color: colors.text }]}>
              Hi {userProfile?.first_name || 'User'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/favorites')} style={styles.addButton}>
            <Search size={24} color={colors.text} />
          </Pressable>
        </View>
        {userProfile?.selected_title && (
          <Text style={[styles.selectedTitle, { color: colors.primary }]}>
            {userProfile.selected_title}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = {
  header: {
    marginBottom: 20,
  },
  firstRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
  },
  selectedTitle: {
    fontSize: 16,
    fontStyle: 'italic' as 'italic',
    marginTop: 4,
  },
  addButton: {
    padding: 8,
  },
};

export default HeaderSection;