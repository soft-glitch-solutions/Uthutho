import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import HeaderSkeleton from './skeletons/HeaderSkeleton';
import { useTranslation } from '@/hook/useTranslation';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HeaderSectionProps {
  isProfileLoading: boolean;
  userProfile: any;
  colors: any;
}

const HeaderSection = ({ isProfileLoading, userProfile, colors }: HeaderSectionProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  if (isProfileLoading) {
    return <HeaderSkeleton colors={colors} />;
  }

  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <View>
        <View style={[styles.firstRow, isDesktop && styles.firstRowDesktop]}>
          <Pressable onPress={() => router.push('/profile')}>
            <Text style={[styles.title, { color: colors.text }, isDesktop && styles.titleDesktop]}>
              {t('greeting')}, {userProfile?.first_name || 'User'}
            </Text>
            <Text style={[styles.subGreeting, isDesktop && styles.subGreetingDesktop]}>
              {t('ready_journey')}
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/favorites')} 
            style={[styles.addButton, isDesktop && styles.addButtonDesktop]}
          >
            <Search size={isDesktop ? 20 : 24} color={colors.text} />
          </Pressable>
        </View>
        {userProfile?.selected_title && (
          <Text style={[styles.selectedTitle, { color: colors.primary }, isDesktop && styles.selectedTitleDesktop]}>
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
  headerDesktop: {
    marginBottom: 16,
  },
  firstRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'space-between' as 'space-between',
  },
  firstRowDesktop: {
    alignItems: 'flex-start' as 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
  },
  titleDesktop: {
    fontSize: 20,
  },
  selectedTitle: {
    fontSize: 16,
    fontStyle: 'italic' as 'italic',
    marginTop: 4,
  },
  selectedTitleDesktop: {
    fontSize: 14,
  },
  addButton: {
    padding: 8,
  },
  addButtonDesktop: {
    padding: 6,
  },
  subGreeting: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
  },
  subGreetingDesktop: {
    fontSize: 14,
  },
};

export default HeaderSection;