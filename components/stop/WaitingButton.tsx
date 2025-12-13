import React, { useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated,
  Platform 
} from 'react-native';

const WaitingButton = ({ isWaiting, onPress }) => {
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

  const handlePress = () => {
    if (isWaiting) return; // Don't press if disabled
    
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

  const buttonColor = isWaiting ? 'green' : 'blue';
  const disabledOpacity = isWaiting ? 0.7 : 1;

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isWaiting}
      style={[
        styles.touchable,
        isWaiting && styles.disabledTouchable
      ]}
    >
      <Animated.View
        style={[
          styles.button,
          { 
            backgroundColor: buttonColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, disabledOpacity]
            }),
          }
        ]}
      >
        <Text style={styles.buttonText}>
          {isWaiting ? 'Got Picked Up' : "I'm Waiting"}
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WaitingButton;