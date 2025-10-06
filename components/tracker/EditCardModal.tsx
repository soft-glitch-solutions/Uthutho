import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { UserCard } from '@/types/tracker';

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

interface EditCardModalProps {
  visible: boolean;
  card: UserCard | null;
  onClose: () => void;
  onCardUpdated: () => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({
  visible,
  card,
  onClose,
  onCardUpdated,
}) => {
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setCardHolder(card.card_holder);
      setCardNumber(card.card_number);
    }
  }, [card]);

  const resetForm = () => {
    setCardHolder('');
    setCardNumber('');
    setLoading(false);
  };

  const handleUpdateCard = async () => {
    if (!card) return;

    if (!cardHolder.trim()) {
      // We'll handle this with the modal system
      return;
    }

    if (!cardNumber.trim()) {
      // We'll handle this with the modal system
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_cards')
        .update({
          card_holder: cardHolder.trim(),
          card_number: cardNumber.trim(),
        })
        .eq('id', card.id);

      if (error) throw error;

      resetForm();
      onCardUpdated();
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!card || !visible) return null;

  const cardType = CARD_TYPES[card.card_type];

  return (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>Card Holder Name</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter card holder name"
        value={cardHolder}
        onChangeText={setCardHolder}
        placeholderTextColor="#666"
      />

      <Text style={[styles.inputLabel, { marginTop: 16 }]}>Card Number</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter card number"
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholderTextColor="#666"
      />

      <View style={styles.cardPreview}>
        <Text style={styles.previewLabel}>Preview:</Text>
        <View style={[styles.previewCard, { backgroundColor: cardType.backgroundColor }]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewLogo}>
              {card.card_type === 'golden_arrow' ? (
                <Image 
                  source={{ uri: cardType.logoImage }}
                  style={styles.previewLogoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.previewMycitiLogo}>
                  <Text style={styles.previewMycitiText}>my</Text>
                  <Text style={[styles.previewMycitiText, styles.previewMycitiHighlight]}>Citi</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.previewDetails}>
            <Text style={styles.previewNumber}>
              •••• {cardNumber.slice(-4) || '••••'}
            </Text>
            <Text style={styles.previewHolder}>{cardHolder || 'Card Holder'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!cardHolder.trim() || !cardNumber.trim()) && styles.saveButtonDisabled
          ]}
          onPress={handleUpdateCard}
          disabled={!cardHolder.trim() || !cardNumber.trim() || loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Updating...' : 'Update Card'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
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
  cardPreview: {
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  previewCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLogoImage: {
    width: 20,
    height: 20,
  },
  previewMycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  previewMycitiText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  previewMycitiHighlight: {
    color: '#1ea2b1',
  },
  previewDetails: {
    alignItems: 'flex-start',
  },
  previewNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  previewHolder: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
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

export default EditCardModal;