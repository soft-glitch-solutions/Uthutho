import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Shield, School, MapPin, Share2 } from 'lucide-react-native';
import { SchoolTransport } from '@/types/transport';

interface TransportHeaderProps {
  transport: SchoolTransport;
  onBack: () => void;
  onShare: () => void;
}

export const TransportHeader: React.FC<TransportHeaderProps> = ({
  transport,
  onBack,
  onShare,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Share2 size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export const TransportInfoHeader: React.FC<{ transport: SchoolTransport }> = ({ transport }) => {
  return (
    <View style={styles.transportHeader}>
      <View style={styles.schoolInfo}>
        <View style={styles.schoolIcon}>
          <School size={24} color="#1ea2b1" />
        </View>
        <View style={styles.schoolText}>
          <Text style={styles.schoolName}>{transport.school_name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#888888" />
            <Text style={styles.schoolArea}>{transport.school_area}</Text>
          </View>
        </View>
      </View>
      
      {transport.is_verified && (
        <View style={styles.verifiedBadge}>
          <Shield size={16} color="#10B981" />
          <Text style={styles.verifiedText}>Verified Service</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  schoolText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolArea: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});