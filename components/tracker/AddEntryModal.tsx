import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { X, TrendingDown, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { UserCard } from '@/types/tracker';

const CARD_TYPES = {
  myciti: {
    name: 'MyCiTi Card',
    color: '#1ea2b1',
    pointsName: 'Points',
    logoImage: null
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    logoImage: 'https://www.gabs.co.za/Assets/Images/logo_main.png'
  },
  go_george: {
    name: 'Go George',
    color: '#2563eb',
    pointsName: 'Trips',
    logoImage: 'https://www.go-george.co.za/wp-content/uploads/2019/07/GoGeorge-Logo.png'
  },
  rea_vaya: {
    name: 'Rea Vaya',
    color: '#dc2626',
    pointsName: 'Trips',
    logoImage: 'https://www.reavaya.org.za/images/reavaya-logo.png'
  },
  gautrain: {
    name: 'Gautrain',
    color: '#0f172a',
    pointsName: 'Trips',
    logoImage: 'https://www.gautrain.co.za/media/jf1h0atx/gautrain-logo.png'
  }
};


interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCard: UserCard | null;
  selectedAction?: 'purchase' | 'ride';
  onEntryAdded: () => void;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  selectedCard,
  selectedAction = 'ride',
  onEntryAdded
}) => {
  const { user } = useAuth();
  const [action, setAction] = useState<'purchase' | 'ride'>(selectedAction);
  const [amount, setAmount] = useState('');
  const [balanceAfter, setBalanceAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setAction('ride');
    setAmount('');
    setBalanceAfter('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddEntry = async () => {
    if (!selectedCard) return;

    if (!amount || parseFloat(amount) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!balanceAfter || parseFloat(balanceAfter) < 0) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    setLoading(true);

    try {
      const entryData = {
        user_id: user?.id,
        card_id: selectedCard.id,
        action: action,
        amount: parseFloat(amount),
        balance_after: parseFloat(balanceAfter),
        date: date,
        notes: notes.trim() || null,
      };

      const { error } = await supabase
        .from('card_entries')
        .insert([entryData]);

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('user_cards')
        .update({ current_balance: parseFloat(balanceAfter) })
        .eq('id', selectedCard.id);

      if (updateError) throw updateError;

      resetForm();
      onEntryAdded();
      Alert.alert('Success', 'Entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!selectedCard) return null;

  const cardType = CARD_TYPES[selectedCard.card_type];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card</Text>
              <View style={styles.selectedCardInfo}>
                <View style={styles.cardInfo}>
                  {selectedCard.card_type === 'golden_arrow' ? (
                    <Image 
                      source={{ uri: cardType.logoImage }}
                      style={styles.cardInfoLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.mycitiLogo, { backgroundColor: 'rgba(255,255,255,0.1)', padding: 4 }]}>
                      <Text style={[styles.mycitiLogoText, { fontSize: 12 }]}>my</Text>
                      <Text style={[styles.mycitiLogoText, styles.mycitiLogoHighlight, { fontSize: 12 }]}>Citi</Text>
                    </View>
                  )}
                  <Text style={styles.cardInfoText}>
                    {cardType.name} •••• {selectedCard.card_number.slice(-4)}
                  </Text>
                </View>
                <Text style={styles.cardBalance}>
                  Balance: {selectedCard.current_balance} {cardType.pointsName.toLowerCase()}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Action</Text>
              <View style={styles.actionOptions}>
                <TouchableOpacity
                  style={[
                    styles.actionOption,
                    action === 'ride' && { borderColor: '#ef4444', backgroundColor: '#ef444420' }
                  ]}
                  onPress={() => setAction('ride')}
                >
                  <TrendingDown size={20} color={action === 'ride' ? '#ef4444' : '#666'} />
                  <Text style={[
                    styles.actionOptionText,
                    action === 'ride' && { color: '#ef4444', fontWeight: '600' }
                  ]}>
                    Used Ride
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.actionOption,
                    action === 'purchase' && { borderColor: '#10b981', backgroundColor: '#10b98120' }
                  ]}
                  onPress={() => setAction('purchase')}
                >
                  <TrendingUp size={20} color={action === 'purchase' ? '#10b981' : '#666'} />
                  <Text style={[
                    styles.actionOptionText,
                    action === 'purchase' && { color: '#10b981', fontWeight: '600' }
                  ]}>
                    Loaded Card
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {action === 'purchase' ? 'Amount Loaded' : 'Rides Used'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={action === 'purchase' ? "e.g., 200" : "e.g., 2"}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Balance After This Action</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 150"
                value={balanceAfter}
                onChangeText={setBalanceAfter}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g., Loaded at Canal Walk, Used for work commute..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor="#666"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, (!amount || !balanceAfter) && styles.saveButtonDisabled]}
              onPress={handleAddEntry}
              disabled={!amount || !balanceAfter || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectedCardInfo: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfoLogo: {
    width: 20,
    height: 20,
  },
  cardInfoText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  cardBalance: {
    color: '#666',
    fontSize: 14,
  },
  mycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mycitiLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  mycitiLogoHighlight: {
    color: '#1ea2b1',
  },
  actionOptions: {
    gap: 8,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  actionOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddEntryModal;