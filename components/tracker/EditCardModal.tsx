import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
  const [errors, setErrors] = useState<{cardHolder?: string; cardNumber?: string}>({});

  useEffect(() => {
    if (card) {
      setCardHolder(card.card_holder);
      setCardNumber(card.card_number);
      setErrors({}); // Clear errors when card changes
    }
  }, [card]);

  const validateForm = (): boolean => {
    const newErrors: {cardHolder?: string; cardNumber?: string} = {};

    if (!cardHolder.trim()) {
      newErrors.cardHolder = 'Card holder name is required';
    }

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumber.trim().length < 4) {
      newErrors.cardNumber = 'Card number must be at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setCardHolder('');
    setCardNumber('');
    setLoading(false);
    setErrors({});
  };

  const handleUpdateCard = async () => {
    if (!card) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_cards')
        .update({
          card_holder: cardHolder.trim(),
          card_number: cardNumber.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', card.id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to update card');
      }

      // Success - update parent and close
      onCardUpdated();
      resetForm();
      onClose(); // Close modal after successful update
      
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update card. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Don't render if not visible or no card
  if (!visible || !card) return null;

  const cardType = CARD_TYPES[card.card_type];

  return (
    <View style={styles.container}>
      {/* Card Holder Input */}
      <Text style={styles.inputLabel}>Card Holder Name</Text>
      <TextInput
        style={[
          styles.textInput,
          errors.cardHolder && styles.inputError
        ]}
        placeholder="Enter card holder name"
        value={cardHolder}
        onChangeText={(text) => {
          setCardHolder(text);
          // Clear error when user starts typing
          if (errors.cardHolder) {
            setErrors(prev => ({ ...prev, cardHolder: undefined }));
          }
        }}
        placeholderTextColor="#666"
        editable={!loading}
      />
      {errors.cardHolder && (
        <Text style={styles.errorText}>{errors.cardHolder}</Text>
      )}

      {/* Card Number Input */}
      <Text style={[styles.inputLabel, { marginTop: 16 }]}>Card Number</Text>
      <TextInput
        style={[
          styles.textInput,
          errors.cardNumber && styles.inputError
        ]}
        placeholder="Enter card number"
        value={cardNumber}
        onChangeText={(text) => {
          setCardNumber(text);
          // Clear error when user starts typing
          if (errors.cardNumber) {
            setErrors(prev => ({ ...prev, cardNumber: undefined }));
          }
        }}
        placeholderTextColor="#666"
        editable={!loading}
        keyboardType="numeric"
      />
      {errors.cardNumber && (
        <Text style={styles.errorText}>{errors.cardNumber}</Text>
      )}

      {/* Card Preview */}
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
            <Text style={styles.previewHolder}>
              {cardHolder || 'Card Holder'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={handleClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!cardHolder.trim() || !cardNumber.trim() || loading) && styles.saveButtonDisabled
          ]}
          onPress={handleUpdateCard}
          disabled={!cardHolder.trim() || !cardNumber.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Update Card</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EditCardModal;