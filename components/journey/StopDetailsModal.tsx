// components/journey/StopDetailsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { JourneyStop, Passenger } from '@/types/journey';

interface StopDetailsModalProps {
  stop: JourneyStop | null;
  visible: boolean;
  onClose: () => void;
  passengers: Passenger[];
}

export const StopDetailsModal: React.FC<StopDetailsModalProps> = ({
  stop,
  visible,
  onClose,
  passengers
}) => {
  if (!stop) return null;

  const passengersAtStop = passengers.filter(p => p.stop_id === stop.id);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{stop.name}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.stopInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Stop:</Text>
                <Text style={styles.infoValue}>#{stop.order_number}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[
                  styles.statusBadge,
                  stop.passed && styles.passedBadge,
                  stop.current && styles.currentBadge,
                  stop.upcoming && styles.upcomingBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {stop.passed ? 'Passed' : 
                     stop.current ? 'Current' : 
                     stop.upcoming ? 'Upcoming' : 'Future'}
                  </Text>
                </View>
              </View>
              
              {passengersAtStop.length > 0 ? (
                <View style={styles.passengersSection}>
                  <Text style={styles.sectionTitle}>
                    Waiting: {passengersAtStop.length}
                  </Text>
                  {passengersAtStop.map(passenger => (
                    <View key={passenger.id} style={styles.passengerItem}>
                      <View style={styles.passengerAvatar}>
                        {passenger.profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: passenger.profiles.avatar_url }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                              {passenger.profiles?.first_name?.[0] || 'U'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.passengerInfo}>
                        <Text style={styles.passengerName} numberOfLines={1}>
                          {passenger.profiles?.first_name} {passenger.profiles?.last_name}
                        </Text>
                        <Text style={styles.waitingText}>
                          Waiting
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noPassengers}>
                  <Text style={styles.noPassengersText}>No passengers waiting</Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 2,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 20,
    fontWeight: '300',
  },
  stopInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
    width: 70,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  passedBadge: {
    backgroundColor: '#065f46',
  },
  currentBadge: {
    backgroundColor: '#1e40af',
  },
  upcomingBadge: {
    backgroundColor: '#78350f',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  passengersSection: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  passengerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flex: 1,
    minWidth: 0,
  },
  passengerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  waitingText: {
    color: '#666666',
    fontSize: 11,
  },
  noPassengers: {
    padding: 16,
    alignItems: 'center',
  },
  noPassengersText: {
    color: '#666666',
    fontSize: 13,
  },
  dismissButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
};