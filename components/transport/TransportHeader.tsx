import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { ChevronLeft, Share2, School, MapPin } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { useTheme } from '@/context/ThemeContext';

interface TransportHeaderProps {
  transport: SchoolTransport;
  onBack: () => void;
  onShare: () => void;
  scrollY?: Animated.Value;
}

export const TransportHeader: React.FC<TransportHeaderProps> = ({
  transport,
  onBack,
  onShare,
  scrollY,
}) => {
  const { colors } = useTheme();

  const backgroundColor = scrollY?.interpolate({
    inputRange: [0, 100],
    outputRange: ['transparent', colors.card],
    extrapolate: 'clamp',
  }) || 'transparent';

  const borderOpacity = scrollY?.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }) || 0;

  const titleOpacity = scrollY?.interpolate({
    inputRange: [140, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  }) || 0;

  const titleTranslateY = scrollY?.interpolate({
    inputRange: [140, 200],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  }) || 0;

  return (
    <Animated.View style={[
      styles.header, 
      { 
        backgroundColor,
        borderBottomWidth: 1,
        borderBottomColor: scrollY ? Animated.multiply(borderOpacity, 1).interpolate({
          inputRange: [0, 1],
          outputRange: ['transparent', colors.border],
        }) : 'transparent'
      }
    ]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={onBack}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[
        styles.titleContainer, 
        { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }
      ]}>
        <Text style={[styles.stickyTitle, { color: colors.text }]} numberOfLines={1}>
          {transport.school_name}
        </Text>
      </Animated.View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={onShare}
        >
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const TransportInfoHeader: React.FC<{ transport: SchoolTransport; scrollY?: Animated.Value }> = ({ transport, scrollY }) => {
  const { colors } = useTheme();

  const opacity = scrollY?.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  }) || 1;

  const translateY = scrollY?.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  }) || 0;

  return (
    <Animated.View style={[
      styles.infoContainer, 
      { opacity, transform: [{ translateY }] }
    ]}>
      <View style={[styles.iconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <School size={28} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.schoolName, { color: '#FFFFFF' }]}>
          {transport.school_name}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.schoolArea, { color: '#FFFFFF', opacity: 0.8 }]}>
            {transport.school_area}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerLeft: {
    width: 44,
  },
  headerRight: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  schoolName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolArea: {
    fontSize: 16,
    fontWeight: '600',
  },
});