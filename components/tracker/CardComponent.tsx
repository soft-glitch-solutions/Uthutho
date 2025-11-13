import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  PanResponder,
  Vibration,
  Modal, // Add Modal import
  Alert, // Add Alert import for web fallback
} from 'react-native';
import { MoreVertical, ArrowUpRight, Trash2, Edit3, Move, AlertTriangle } from 'lucide-react-native';
import { UserCard } from '@/types/tracker';

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti',
    color: '#1ea2b1',
    pointsName: 'Points',
    gradient: ['#1ea2b1', '#158194', '#0f6173'],
    cardImage: 'https://www.sapeople.com/wp-content/uploads/2023/10/MyCiTi-bus-2-1024x683.jpg',
    backgroundColor: '#1a2b3c',
    type: 'CONTACTLESS CARD'
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    cardImage: null,
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Golden_Arrow_Bus_Services_logo.png',
    backgroundColor: '#3c2a1a',
    type: 'BUS CARD'
  },
  go_george: {
    name: 'Go George',
    color: '#2563eb',
    pointsName: 'Trips',
    gradient: ['#2563eb', '#1d4ed8', '#1e40af'],
    cardImage: null,
    logoImage: 'https://www.gogeorge.org.za/wp-content/uploads/2024/06/GO-GEORGE-logo-10-Years-icon.jpg',
    backgroundColor: '#1a1f2b',
    type: 'BUS CARD'
  },
  rea_vaya: {
    name: 'Rea Vaya',
    color: '#dc2626',
    pointsName: 'Trips',
    gradient: ['#dc2626', '#b91c1c', '#991b1b'],
    cardImage: null,
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Rea_Vaya_logo.svg/1200px-Rea_Vaya_logo.svg.png',
    backgroundColor: '#2b1a1a',
    type: 'BUS RAPID TRANSIT'
  },
  gautrain: {
    name: 'Gautrain',
    color: '#0f172a',
    pointsName: 'Trips',
    gradient: ['#0f172a', '#1e293b', '#334155'],
    cardImage: null,
    logoImage: 'https://icon2.cleanpng.com/20180804/ske/kisspng-logo-product-design-centurion-breakfast-brand-file-gautrain-logo-svg-wikipedia-5b65261ce4d854.0570432315333555489374.jpg',
    backgroundColor: '#0a0a0a',
    type: 'TRAIN CARD'
  }
};

interface CardComponentProps {
  card: UserCard;
  index: number;
  onPress: () => void;
  onRemoveCard: (cardId: string) => void;
  onEditCard: (card: UserCard) => void;
  onPositionChange: (fromIndex: number, toIndex: number) => void;
  isSelected?: boolean;
}

const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  index,
  onPress,
  onRemoveCard,
  onEditCard,
  onPositionChange,
  isSelected = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const cardType = CARD_TYPES[card.card_type as keyof typeof CARD_TYPES];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Add delete modal state
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | 'none'>('none');

  // Responsive calculations
  const cardWidth = windowWidth - 32;
  const cardHeight = 180;
  const isSmallScreen = windowWidth < 375;
  const isVerySmallScreen = windowWidth < 350;

  // PanResponder for drag and drop
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start dragging if vertical movement is significant
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // Vibrate on drag start for haptic feedback
        Vibration.vibrate(50);
        setIsDragging(true);
        setDragDirection('none');
        
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }).start();
        
        // Reset pan values
        pan.setValue({ x: 0, y: 0 });
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dragDistance = gestureState.dy;
        
        // Update drag direction for visual feedback
        if (dragDistance < -20) {
          setDragDirection('up');
        } else if (dragDistance > 20) {
          setDragDirection('down');
        } else {
          setDragDirection('none');
        }
        
        // Only allow vertical movement
        translateY.setValue(dragDistance);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dragDistance = gestureState.dy;
        const dragThreshold = cardHeight * 0.4; // 40% of card height
        
        let newIndex = index;
        
        // Determine if card should move up or down
        if (Math.abs(dragDistance) > dragThreshold) {
          if (dragDistance > 0) {
            // Dragged down - move card down in list
            newIndex = Math.min(index + 1, 99);
          } else {
            // Dragged up - move card up in list
            newIndex = Math.max(index - 1, 0);
          }
          
          if (newIndex !== index) {
            onPositionChange(index, newIndex);
            Vibration.vibrate(100); // Success haptic
          }
        }

        // Reset animations
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 15,
            stiffness: 200,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          })
        ]).start(() => {
          setIsDragging(false);
          setDragDirection('none');
        });
      },
      onPanResponderTerminate: () => {
        // Reset if drag is cancelled
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          })
        ]).start(() => {
          setIsDragging(false);
          setDragDirection('none');
        });
      },
    })
  ).current;

  const handlePressIn = () => {
    if (!isDragging) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isDragging) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatCardNumber = (number: string) => {
    return `•••• ${number.slice(-4)}`;
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleEditCard = () => {
    setShowMenu(false);
    onEditCard(card);
  };

  const handleRemoveCardPress = () => {
    console.log('Remove button pressed for card:', card.id, card.card_number);
    setShowMenu(false);
    setShowDeleteModal(true); // Show confirmation modal instead of directly removing
  };

  

  const handleConfirmRemove = () => {
     console.log('Confirming removal for card ID:', card.id);
    setShowDeleteModal(false);
    onRemoveCard(card.id);
  };

  const handleCancelRemove = () => {
    setShowDeleteModal(false);
  };

  // Responsive font sizes
  const getResponsiveFontSize = (baseSize: number) => {
    if (isVerySmallScreen) return baseSize - 3;
    if (isSmallScreen) return baseSize - 1;
    return baseSize;
  };

  // Get drag text based on direction
  const getDragText = () => {
    switch (dragDirection) {
      case 'up':
        return '↑ Move Up';
      case 'down':
        return '↓ Move Down';
      default:
        return 'Drag to reorder';
    }
  };

  // Render logo based on card type
  const renderLogo = () => {
    if (card.card_type === 'myciti') {
      return (
        <View style={[
          styles.mycitiLogo,
          isVerySmallScreen && styles.verySmallMycitiLogo
        ]}>
          <Text style={[
            styles.mycitiLogoText,
            isVerySmallScreen && { fontSize: 9 }
          ]}>my</Text>
          <Text style={[
            styles.mycitiLogoText, 
            styles.mycitiLogoHighlight,
            isVerySmallScreen && { fontSize: 9 }
          ]}>Citi</Text>
        </View>
      );
    } else if (cardType.logoImage) {
      return (
        <Image 
          source={{ uri: cardType.logoImage }}
          style={[
            styles.cardLogoImage,
            isVerySmallScreen && styles.verySmallLogo
          ]}
          resizeMode="contain"
        />
      );
    } else {
      // Fallback for cards without logo images
      return (
        <View style={[
          styles.fallbackLogo,
          { backgroundColor: cardType.color }
        ]}>
          <Text style={styles.fallbackLogoText}>
            {cardType.name.charAt(0)}
          </Text>
        </View>
      );
    }
  };

  // Combined transform for smooth animations
  const cardTransform = [
    { scale: scaleAnim },
    { translateY: translateY },
  ];

  return (
    <>
      <Animated.View 
        style={[
          styles.cardWrapper,
          {
            transform: cardTransform,
            zIndex: isDragging ? 1000 : 1,
            shadowOpacity: isDragging ? 0.5 : 0.3,
            elevation: isDragging ? 20 : 8,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[
            styles.cardContainer,
            isSelected && styles.selectedCard,
            isDragging && styles.draggingCard,
            { 
              backgroundColor: cardType.backgroundColor,
              width: cardWidth,
              height: cardHeight,
            }
          ]}
        >
          {/* Card Background */}
          <View style={styles.cardBackground}>
            {cardType.cardImage ? (
              <Image 
                source={{ uri: cardType.cardImage }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardGradient, { 
                backgroundColor: cardType.gradient[0] 
              }]}>
                <View style={[styles.gradientCircle, { 
                  backgroundColor: cardType.gradient[1],
                  top: -20,
                  right: -20,
                }]} />
                <View style={[styles.gradientCircle, { 
                  backgroundColor: cardType.gradient[2],
                  bottom: -15,
                  left: -15,
                }]} />
              </View>
            )}
            <View style={styles.cardOverlay} />
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Compact Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardLogo}>
                {renderLogo()}
                <Text style={[
                  styles.cardName,
                  { 
                    fontSize: getResponsiveFontSize(14),
                    marginLeft: isVerySmallScreen ? 4 : 6
                  }
                ]}>
                  {cardType.name}
                </Text>
              </View>
              
              <View style={styles.headerRight}>
                {isDragging && (
                  <View style={styles.dragIndicator}>
                    <Move size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.dragText}>
                      {getDragText()}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={handleMenuPress}
                  disabled={isDragging}
                >
                  <MoreVertical 
                    size={isVerySmallScreen ? 16 : 18} 
                    color={isDragging ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card Details - More Compact */}
            <View style={styles.cardDetails}>
              <View style={styles.cardNumberSection}>
                <Text style={[
                  styles.cardNumber,
                  { fontSize: getResponsiveFontSize(16) }
                ]}>
                  {formatCardNumber(card.card_number)}
                </Text>
                <Text style={[
                  styles.cardHolder,
                  { fontSize: getResponsiveFontSize(11) }
                ]}>
                  {card.card_holder}
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceSection}>
              <Text style={[
                styles.balanceLabel,
                { fontSize: getResponsiveFontSize(11) }
              ]}>
                Balance
              </Text>
              <Text style={[
                styles.balanceAmount,
                { fontSize: getResponsiveFontSize(22) }
              ]}>
                {card.current_balance}
              </Text>
              <Text style={[
                styles.balanceUnit,
                { fontSize: getResponsiveFontSize(10) }
              ]}>
                {cardType.pointsName.toLowerCase()}
              </Text>
            </View>

            {/* Compact Footer */}
            <View style={styles.cardFooter}>
              <Text style={[
                styles.cardTypeText,
                { fontSize: getResponsiveFontSize(9) }
              ]}>
                {cardType.type}
              </Text>
              <ArrowUpRight 
                size={isVerySmallScreen ? 12 : 14} 
                color="rgba(255,255,255,0.7)" 
              />
            </View>
          </View>

          {/* Menu Overlay */}
          {showMenu && (
            <View style={styles.menuOverlay}>
              <TouchableOpacity 
                style={styles.menuBackdrop}
                onPress={() => setShowMenu(false)}
              />
              <View style={[
                styles.menuContent,
                isVerySmallScreen && styles.verySmallMenuContent
              ]}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleEditCard}
                >
                  <Edit3 size={isVerySmallScreen ? 14 : 16} color="#1ea2b1" />
                  <Text style={[
                    styles.menuItemText,
                    isVerySmallScreen && { fontSize: 12 }
                  ]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.menuDivider} />
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleRemoveCardPress}
                >
                  <Trash2 size={isVerySmallScreen ? 14 : 16} color="#ef4444" />
                  <Text style={[
                    styles.menuItemText, 
                    styles.removeText,
                    isVerySmallScreen && { fontSize: 12 }
                  ]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelRemove}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <AlertTriangle size={24} color="#ef4444" />
              <Text style={styles.deleteModalTitle}>Remove Card</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete your {cardType.name} card?{'\n\n'}
              <Text style={styles.warningText}>
                This action cannot be undone. All card history and data will be permanently lost.
              </Text>
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteCancelButton}
                onPress={handleCancelRemove}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={handleConfirmRemove}
              >
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.deleteConfirmButtonText}>Delete Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  draggingCard: {
    shadowColor: '#1ea2b1',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 24,
  },
  cardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dragIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dragText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardLogoImage: {
    width: 20,
    height: 20,
  },
  verySmallLogo: {
    width: 16,
    height: 16,
  },
  mycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verySmallMycitiLogo: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  mycitiLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  mycitiLogoHighlight: {
    color: '#1ea2b1',
  },
  fallbackLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogoText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardName: {
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    padding: 2,
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  cardNumberSection: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardNumber: {
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardHolder: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontWeight: '500',
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontWeight: '500',
  },
  balanceAmount: {
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  balanceUnit: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  verySmallMenuContent: {
    minWidth: 100,
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  removeText: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 2,
  },
    deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 22,
    marginBottom: 24,
  },
  warningText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 14,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CardComponent;