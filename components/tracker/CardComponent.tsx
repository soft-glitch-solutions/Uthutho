import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MoreVertical, ArrowUpRight, Trash2 } from 'lucide-react-native';
import { UserCard } from '@/types/tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    color: '#1ea2b1',
    pointsName: 'Points',
    gradient: ['#1ea2b1', '#158194'],
    cardImage: 'https://www.sapeople.com/wp-content/uploads/2023/10/MyCiTi-bus-2-1024x683.jpg',
    backgroundColor: '#1a2b3c'
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    gradient: ['#f59e0b', '#d97706'],
    cardImage: null,
    logoImage: 'https://www.gabs.co.za/Assets/Images/logo_main.png',
    backgroundColor: '#3c2a1a'
  }
};

interface CardComponentProps {
  card: UserCard;
  onPress: () => void;
  onRemoveCard: (cardId: string) => void;
  isSelected?: boolean;
}

const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  onPress,
  onRemoveCard,
  isSelected = false
}) => {
  const cardType = CARD_TYPES[card.card_type];
  const scaleAnim = new Animated.Value(1);
  const [showMenu, setShowMenu] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatCardNumber = (number: string) => {
    return `•••• ${number.slice(-4)}`;
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleRemoveCard = () => {
    setShowMenu(false);
    onRemoveCard(card.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCard,
          { backgroundColor: cardType.backgroundColor }
        ]}
      >
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
            }]} />
          )}
          <View style={styles.cardOverlay} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLogo}>
              {card.card_type === 'golden_arrow' ? (
                <Image 
                  source={{ uri: cardType.logoImage }}
                  style={styles.goldenArrowLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.mycitiLogo}>
                  <Text style={styles.mycitiLogoText}>my</Text>
                  <Text style={[styles.mycitiLogoText, styles.mycitiLogoHighlight]}>Citi</Text>
                </View>
              )}
              <Text style={styles.cardName}>{cardType.name}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <MoreVertical size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardNumberSection}>
            <Text style={styles.cardNumber}>{formatCardNumber(card.card_number)}</Text>
            <Text style={styles.cardHolder}>{card.card_holder}</Text>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {card.current_balance} {cardType.pointsName.toLowerCase()}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardTypeText}>
              {card.card_type === 'myciti' ? 'CONTACTLESS BUS CARD' : 'BUS CARD'}
            </Text>
            <ArrowUpRight size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </View>

        {showMenu && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity 
              style={styles.menuBackdrop}
              onPress={() => setShowMenu(false)}
            />
            <View style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleRemoveCard}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={[styles.menuItemText, styles.removeText]}>Remove Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1ea2b1',
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
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
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldenArrowLogo: {
    width: 24,
    height: 24,
  },
  mycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mycitiLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mycitiLogoHighlight: {
    color: '#1ea2b1',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuButton: {
    padding: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 20,
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
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },
  removeText: {
    color: '#ef4444',
  },
  cardNumberSection: {
    marginVertical: 8,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardHolder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default CardComponent;