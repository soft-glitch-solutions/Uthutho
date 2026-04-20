import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ChevronLeft, Share2, School, MapPin } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';
import { useTheme } from '@/context/ThemeContext';

interface TransportHeaderProps {
  transport: SchoolTransport;
  onBack: () => void;
  onShare: () => void;
}

export const TransportHeader: React.FC<TransportHeaderProps> = ({
  onBack,
  onShare,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onBack}
      >
        <ChevronLeft size={22} color={colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onShare}
      >
        <Share2 size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export const TransportInfoHeader: React.FC<{ transport: SchoolTransport }> = ({ transport }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.infoContainer}>
      <View style={[styles.iconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <School size={28} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.schoolName, { color: colors.text }]}>{transport.school_name}</Text>
        <View style={styles.locationRow}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.schoolArea, { color: colors.text, opacity: 0.6 }]}>{transport.school_area}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  schoolArea: {
    fontSize: 15,
    fontWeight: '500',
  },
});