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
  Modal,
  ScrollView,
  Dimensions, // Add Dimensions import
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { UserCard } from '@/types/tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

// Define CARD_TYPES inside the file
const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    color: '#1ea2b1',
    pointsName: 'Points',
    backgroundColor: '#1a2b3c',
    logoImage: null,
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    backgroundColor: '#3c2a1a',
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Golden_Arrow_Bus_Services_logo.png',
  },
  go_george: {
    name: 'Go George',
    color: '#2563eb',
    pointsName: 'Trips',
    backgroundColor: '#1a1f2b',
    logoImage: 'https://www.gogeorge.org.za/wp-content/uploads/2024/06/GO-GEORGE-logo-10-Years-icon.jpg',
  },
  rea_vaya: {
    name: 'Rea Vaya',
    color: '#dc2626',
    pointsName: 'Trips',
    backgroundColor: '#2b1a1a',
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Rea_Vaya_logo.svg/1200px-Rea_Vaya_logo.svg.png',
  },
  gautrain: {
    name: 'Gautrain',
    color: '#0f172a',
    pointsName: 'Trips',
    backgroundColor: '#0a0a0a',
    logoImage: 'https://icon2.cleanpng.com/20180804/ske/kisspng-logo-product-design-centurion-breakfast-brand-file-gautrain-logo-svg-wikipedia-5b65261ce4d854.0570432315333555489374.jpg',
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
      setErrors({});
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

      onCardUpdated();
      resetForm();
      onClose();
      
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

  // Get card type info
  const cardType = card ? CARD_TYPES[card.card_type as keyof typeof CARD_TYPES] : null;

  // Render logo based on card type
  const renderLogo = () => {
    if (!cardType) return null;

    if (card.card_type === 'myciti') {
      return (
        <View style={[
          styles.previewMycitiLogo,
          isDesktop && styles.desktopPreviewMycitiLogo
        ]}>
          <Text style={[
            styles.previewMycitiText,
            isDesktop && styles.desktopPreviewMycitiText
          ]}>my</Text>
          <Text style={[
            styles.previewMycitiText,
            styles.previewMycitiHighlight,
            isDesktop && styles.desktopPreviewMycitiText
          ]}>Citi</Text>
        </View>
      );
    } else if (cardType.logoImage) {
      return (
        <Image 
          source={{ uri: cardType.logoImage }}
          style={[
            styles.previewLogoImage,
            isDesktop && styles.desktopPreviewLogoImage
          ]}
          resizeMode="contain"
        />
      );
    } else {
      return (
        <View style={[
          styles.fallbackLogo, 
          isDesktop && styles.desktopFallbackLogo,
          { backgroundColor: cardType.color }
        ]}>
          <Text style={[
            styles.fallbackLogoText,
            isDesktop && styles.desktopFallbackLogoText
          ]}>
            {cardType.name.charAt(0)}
          </Text>
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={isDesktop ? "fade" : "slide"}
      presentationStyle={isDesktop ? "formSheet" : "pageSheet"}
      onRequestClose={handleClose}
      transparent={isDesktop}
    >
      <View style={[
        styles.modalContainer,
        isDesktop && styles.desktopModalContainer
      ]}>
        <View style={[
          styles.modalContentWrapper,
          isDesktop && styles.desktopModalContentWrapper
        ]}>
          {/* Modal Header */}
          <View style={[
            styles.modalHeader,
            isDesktop && styles.desktopModalHeader
          ]}>
            <Text style={[
              styles.modalTitle,
              isDesktop && styles.desktopModalTitle
            ]}>
              Edit Card
            </Text>
            <TouchableOpacity 
              style={[
                styles.closeButton,
                isDesktop && styles.desktopCloseButton
              ]}
              onPress={handleClose}
              disabled={loading}
            >
              <X size={isDesktop ? 20 : 24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={[
              styles.modalContent,
              isDesktop && styles.desktopModalContent
            ]} 
            showsVerticalScrollIndicator={false}
          >
            {/* Card Holder Input */}
            <Text style={[
              styles.inputLabel,
              isDesktop && styles.desktopInputLabel
            ]}>
              Card Holder Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                isDesktop && styles.desktopTextInput,
                errors.cardHolder && styles.inputError
              ]}
              placeholder="Enter card holder name"
              value={cardHolder}
              onChangeText={(text) => {
                setCardHolder(text);
                if (errors.cardHolder) {
                  setErrors(prev => ({ ...prev, cardHolder: undefined }));
                }
              }}
              placeholderTextColor="#666"
              editable={!loading}
            />
            {errors.cardHolder && (
              <Text style={[
                styles.errorText,
                isDesktop && styles.desktopErrorText
              ]}>
                {errors.cardHolder}
              </Text>
            )}

            {/* Card Number Input */}
            <Text style={[
              styles.inputLabel,
              isDesktop && styles.desktopInputLabel,
              { marginTop: isDesktop ? 12 : 16 }
            ]}>
              Card Number
            </Text>
            <TextInput
              style={[
                styles.textInput,
                isDesktop && styles.desktopTextInput,
                errors.cardNumber && styles.inputError
              ]}
              placeholder="Enter card number"
              value={cardNumber}
              onChangeText={(text) => {
                setCardNumber(text);
                if (errors.cardNumber) {
                  setErrors(prev => ({ ...prev, cardNumber: undefined }));
                }
              }}
              placeholderTextColor="#666"
              editable={!loading}
              keyboardType="numeric"
            />
            {errors.cardNumber && (
              <Text style={[
                styles.errorText,
                isDesktop && styles.desktopErrorText
              ]}>
                {errors.cardNumber}
              </Text>
            )}

            {/* Card Preview */}
            {card && cardType && (
              <View style={[
                styles.cardPreview,
                isDesktop && styles.desktopCardPreview
              ]}>
                <Text style={[
                  styles.previewLabel,
                  isDesktop && styles.desktopPreviewLabel
                ]}>
                  Preview:
                </Text>
                <View style={[
                  styles.previewCard,
                  isDesktop && styles.desktopPreviewCard,
                  { backgroundColor: cardType.backgroundColor }
                ]}>
                  <View style={[
                    styles.previewHeader,
                    isDesktop && styles.desktopPreviewHeader
                  ]}>
                    <View style={styles.previewLogo}>
                      {renderLogo()}
                      <Text style={[
                        styles.previewCardName,
                        isDesktop && styles.desktopPreviewCardName
                      ]}>
                        {cardType.name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.previewDetails}>
                    <Text style={[
                      styles.previewNumber,
                      isDesktop && styles.desktopPreviewNumber
                    ]}>
                      •••• {cardNumber.slice(-4) || '••••'}
                    </Text>
                    <Text style={[
                      styles.previewHolder,
                      isDesktop && styles.desktopPreviewHolder
                    ]}>
                      {cardHolder || 'Card Holder'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[
            styles.buttonContainer,
            isDesktop && styles.desktopButtonContainer
          ]}>
            <TouchableOpacity 
              style={[
                styles.cancelButton,
                isDesktop && styles.desktopCancelButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[
                styles.cancelButtonText,
                isDesktop && styles.desktopCancelButtonText
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                isDesktop && styles.desktopSaveButton,
                (!cardHolder.trim() || !cardNumber.trim() || loading) && styles.saveButtonDisabled
              ]}
              onPress={handleUpdateCard}
              disabled={!cardHolder.trim() || !cardNumber.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size={isDesktop ? "small" : "small"} color="#ffffff" />
              ) : (
                <Text style={[
                  styles.saveButtonText,
                  isDesktop && styles.desktopSaveButtonText
                ]}>
                  Update Card
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  desktopModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    flex: 1,
  },
  desktopModalContentWrapper: {
    width: 400,
    maxHeight: '80%',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopModalHeader: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopModalTitle: {
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
  },
  desktopCloseButton: {
    padding: 2,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  desktopModalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  desktopInputLabel: {
    fontSize: 14,
    marginBottom: 6,
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
  desktopTextInput: {
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
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
  desktopErrorText: {
    fontSize: 11,
  },
  cardPreview: {
    marginTop: 20,
  },
  desktopCardPreview: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  desktopPreviewLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  previewCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  desktopPreviewCard: {
    borderRadius: 6,
    padding: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  desktopPreviewHeader: {
    marginBottom: 10,
  },
  previewLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLogoImage: {
    width: 20,
    height: 20,
  },
  desktopPreviewLogoImage: {
    width: 18,
    height: 18,
  },
  previewMycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  desktopPreviewMycitiLogo: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  previewMycitiText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  desktopPreviewMycitiText: {
    fontSize: 9,
  },
  previewMycitiHighlight: {
    color: '#1ea2b1',
  },
  previewCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  desktopPreviewCardName: {
    fontSize: 11,
    marginLeft: 5,
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
  desktopPreviewNumber: {
    fontSize: 13,
    marginBottom: 3,
  },
  previewHolder: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  desktopPreviewHolder: {
    fontSize: 11,
  },
  fallbackLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopFallbackLogo: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  fallbackLogoText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  desktopFallbackLogoText: {
    fontSize: 9,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  desktopButtonContainer: {
    padding: 16,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  desktopCancelButton: {
    padding: 14,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  desktopCancelButtonText: {
    fontSize: 14,
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
  desktopSaveButton: {
    padding: 14,
    borderRadius: 6,
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
  desktopSaveButtonText: {
    fontSize: 14,
  },
});

export default EditCardModal;