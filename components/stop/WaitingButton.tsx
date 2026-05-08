import React, { useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated,
  Platform 
} from 'react-native';

interface WaitingButtonProps {
  isWaiting?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

const WaitingButton = ({ isWaiting, isLoading, onPress, variant = 'default' }: WaitingButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (isWaiting) return; // Don't animate if disabled
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 150,
        friction: 3,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (isWaiting) return; // Don't animate if disabled
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 3,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const handlePress = () => {
    if (isWaiting || isLoading) return;
    
    // Reset animation quickly
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Execute the press action
    setTimeout(() => {
      onPress();
    }, 150);
  };

  if (isLoading) {
    return (
      <View style={[
        variant === 'compact' ? styles.compactButton : styles.button,
        { backgroundColor: variant === 'compact' ? '#10b981' : '#1ea2b1', overflow: 'hidden' }
      ]}>
        <Animated.View style={[
          styles.shimmer,
          {
            backgroundColor: '#ffffff',
            opacity: 0.3,
            transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }],
          }
        ]} />
      </View>
    );
  }

  const buttonColor = isWaiting ? '#ef4444' : '#10b981';

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isWaiting}
      style={[
        styles.touchable,
        variant === 'compact' && styles.compactTouchable,
        isWaiting && styles.disabledTouchable
      ]}
    >
      <Animated.View
        style={[
          variant === 'compact' ? styles.compactButton : styles.button,
          variant === 'compact' && styles.compactWithShadow,
          { 
            backgroundColor: buttonColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Text style={variant === 'compact' ? styles.compactButtonText : styles.buttonText}>
          {isWaiting ? (variant === 'compact' ? 'Done' : 'Got Picked Up') : (variant === 'compact' ? 'Waiting' : "I'm Waiting")}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  disabledTouchable: {
    // Additional disabled styling if needed
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  compactButton: {
    width: 70,
    height: 80,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  compactButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compactTouchable: {
    marginTop: 0,
  },
});

export default WaitingButton;