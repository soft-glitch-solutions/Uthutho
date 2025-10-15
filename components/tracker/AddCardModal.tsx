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
    logoImage: 'https://www.gogeorge.org.za/wp-content/uploads/2024/06/GO-GEORGE-logo-10-Years-icon.jpghttps://scontent-cpt1-1.xx.fbcdn.net/v/t39.30808-6/472786018_991934252967660_1152141784284113326_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=_kFUT2azoLIQ7kNvwHUqguO&_nc_oc=AdlHkuFF-ajOEGuCk_StYAwGeonzXax6xWU33omdJ7K5OoBLENe4Tsx_4aAWj2FeSiQ&_nc_zt=23&_nc_ht=scontent-cpt1-1.xx&_nc_gid=7iub8H3VRzKPjKigx4bgew&oh=00_AffP-6CwmhPjRso4fhJsuXoqicUZql_pyF3HNWjW2A8wHQ&oe=68F5319B'
  },
  rea_vaya: {
    name: 'Rea Vaya',
    color: '#dc2626',
    pointsName: 'Trips',
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Rea_Vaya_logo.svg/1200px-Rea_Vaya_logo.svg.png'
  },
  gautrain: {
    name: 'Gautrain',
    color: '#0f172a',
    pointsName: 'Trips',
    logoImage: 'https://icon2.cleanpng.com/20180804/ske/kisspng-logo-product-design-centurion-breakfast-brand-file-gautrain-logo-svg-wikipedia-5b65261ce4d854.0570432315333555489374.jpghttps://images.seeklogo.com/logo-png/22/2/gautrain-logo-png_seeklogo-224452.png'
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
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.cardOptionsScroll}
  >
    {Object.entries(CARD_TYPES).map(([key, config]) => {
      const isSelected = cardType === key;
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.cardOption,
            isSelected && {
              borderColor: config.color,
              backgroundColor: config.color + '20',
              shadowColor: config.color,
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 3
            }
          ]}
          onPress={() => setCardType(key as any)}
          activeOpacity={0.8}
        >
          {config.logoImage ? (
            <Image
              source={{ uri: config.logoImage }}
              style={styles.cardOptionLogo}
              resizeMode="contain"
            />
          ) : (
            <CreditCard size={22} color={isSelected ? config.color : '#888'} />
          )}
          <Text
            style={[
              styles.cardOptionText,
              isSelected && { color: config.color, fontWeight: '600' }
            ]}
          >
            {config.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
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
cardOptionsScroll: {
  flexDirection: 'row',
  gap: 12,
  paddingVertical: 4,
  paddingHorizontal: 2
},

cardOption: {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: 100,
  height: 100,
  marginRight: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#333333',
  backgroundColor: '#1a1a1a',
  padding: 10,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 2
},

cardOptionLogo: {
  width: 40,
  height: 40,
  marginBottom: 8
},

cardOptionText: {
  fontSize: 13,
  color: '#aaa',
  textAlign: 'center'
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