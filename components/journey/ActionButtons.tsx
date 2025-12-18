// components/journey/ActionButtons.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Share2 } from 'lucide-react-native';

interface ActionButtonsProps {
  participantStatus: 'waiting' | 'picked_up' | 'arrived';
  onPickedUp: () => void;
  onArrived: () => void;
  onNotifyAhead: () => void;
  onShare: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  participantStatus,
  onPickedUp,
  onArrived,
  onNotifyAhead,
  onShare
}) => {
  return (
    <View style={styles.actionsRow}>
      {participantStatus === 'waiting' && (
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={onPickedUp}
        >
          <Text style={styles.primaryActionText}>Picked Up</Text>
        </TouchableOpacity>
      )}
      
      {participantStatus === 'picked_up' && (
        <TouchableOpacity
          style={[styles.primaryActionButton, styles.arrivedButton]}
          onPress={onArrived}
        >
          <Text style={styles.primaryActionText}>Arrived</Text>
        </TouchableOpacity>
      )}
      
      {participantStatus === 'waiting' && (
        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={onNotifyAhead}
        >
          <Text style={styles.secondaryActionText}>Notify Ahead</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onShare}
      >
        <Share2 size={18} color="#1ea2b1" />
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  arrivedButton: {
    backgroundColor: '#fbbf24',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1ea2b1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  secondaryActionText: {
    color: '#1ea2b1',
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
};