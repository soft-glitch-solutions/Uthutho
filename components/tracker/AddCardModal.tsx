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
import { X, CreditCard } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    color: '#1ea2b1',
    pointsName: 'Points',
    backgroundColor: '#1a2b3c'
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    logoImage: 'https://www.gabs.co.za/Assets/Images/logo_main.png',
    backgroundColor: '#3c2a1a'
  }
};

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onCardAdded: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({
  visible,
  onClose,
  onCardAdded
}) => {
  const { user } = useAuth();
  const [cardType, setCardType] = useState<'myciti' | 'golden_arrow'>('myciti');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCardType('myciti');
    setCardNumber('');
    setCardHolder('');
    setInitialBalance('');
  };

  const handleAddCard = async () => {
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please enter a card number');
      return;
    }

    if (!cardHolder.trim()) {
      Alert.alert('Error', 'Please enter card holder name');
      return;
    }

    if (!initialBalance || parseFloat(initialBalance) < 0) {
      Alert.alert('Error', 'Please enter a valid initial balance');
      return;
    }

    setLoading(true);

    try {
        const cardData = {
        user_id: user?.id,
        card_type: cardType,
        card_number: cardNumber.trim(),
        card_holder: cardHolder.trim(),
        current_balance: parseFloat(initialBalance),
        position: userCards.length, // New cards go to the end
        is_active: true
        };

      const { error } = await supabase
        .from('user_cards')
        .insert([cardData]);

      if (error) throw error;

      resetForm();
      onCardAdded();
      Alert.alert('Success', 'Card added successfully!');
    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
            <Text style={styles.modalTitle}>Add New Card</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Type</Text>
              <View style={styles.cardOptions}>
                {Object.entries(CARD_TYPES).map(([key, config]) => {
                  const isSelected = cardType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.cardOption,
                        isSelected && { 
                          borderColor: config.color, 
                          backgroundColor: config.color + '20' 
                        }
                      ]}
                      onPress={() => setCardType(key as any)}
                    >
                      {key === 'golden_arrow' ? (
                        <Image 
                          source={{ uri: config.logoImage }}
                          style={styles.cardOptionLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <CreditCard size={20} color={isSelected ? config.color : '#666'} />
                      )}
                      <Text style={[
                        styles.cardOptionText,
                        isSelected && { color: config.color, fontWeight: '600' }
                      ]}>
                        {config.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your card number"
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Holder Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name as on card"
                value={cardHolder}
                onChangeText={setCardHolder}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Initial Balance</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 100"
                value={initialBalance}
                onChangeText={setInitialBalance}
                keyboardType="decimal-pad"
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
              style={[
                styles.saveButton, 
                (!cardNumber || !cardHolder || !initialBalance) && styles.saveButtonDisabled
              ]}
              onPress={handleAddCard}
              disabled={!cardNumber || !cardHolder || !initialBalance || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Adding...' : 'Add Card'}
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
  cardOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  cardOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  cardOptionLogo: {
    width: 20,
    height: 20,
  },
  cardOptionText: {
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

export default AddCardModal;