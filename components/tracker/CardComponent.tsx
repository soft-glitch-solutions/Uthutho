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
} from 'react-native';
import { MoreVertical, ArrowUpRight, Trash2, Edit3, Move } from 'lucide-react-native';
import { UserCard } from '@/types/tracker';

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti',
    color: '#1ea2b1',
    pointsName: 'Points',
    gradient: ['#1ea2b1', '#158194', '#0f6173'],
    cardImage: 'https://www.sapeople.com/wp-content/uploads/2023/10/MyCiTi-bus-2-1024x683.jpg',
    backgroundColor: '#1a2b3c',
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    cardImage: null,
    logoImage: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Golden_Arrow_Bus_Services_logo.png',
    backgroundColor: '#3c2a1a',
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
  const cardType = CARD_TYPES[card.card_type];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  
  const [showMenu, setShowMenu] = useState(false);
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

  const handleRemoveCard = () => {
    setShowMenu(false);
    onRemoveCard(card.id);
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

  // Combined transform for smooth animations
  const cardTransform = [
    { scale: scaleAnim },
    { translateY: translateY },
  ];

  return (
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
              {card.card_type === 'golden_arrow' ? (
                <Image 
                  source={{ uri: cardType.logoImage }}
                  style={[
                    styles.goldenArrowLogo,
                    isVerySmallScreen && styles.verySmallLogo
                  ]}
                  resizeMode="contain"
                />
              ) : (
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
              )}
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
          </View>

          {/* Compact Footer */}
          <View style={styles.cardFooter}>
            <Text style={[
              styles.cardTypeText,
              { fontSize: getResponsiveFontSize(9) }
            ]}>
              {card.card_type === 'myciti' ? 'CONTACTLESS CARD' : 'BUS CARD'}
            </Text>
            <ArrowUpRight 
              size={isVerySmallScreen ? 12 : 14} 
              color="rgba(255,255,255,0.7)" 
            />
          </View>
        </View>

        {/* Drag Instructions Overlay */}

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
                onPress={handleRemoveCard}
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
  dragHint: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dragHintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goldenArrowLogo: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  cardNumberSection: {
    alignItems: 'center',
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
});

export default CardComponent;