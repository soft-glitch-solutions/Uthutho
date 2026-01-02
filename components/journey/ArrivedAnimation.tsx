// components/journey/ArrivedAnimation.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ArrivedAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  message?: string;
  duration?: number;
}

export const ArrivedAnimation: React.FC<ArrivedAnimationProps> = ({
  isVisible,
  onAnimationComplete,
  message = "Please wait while we process your arrival...",
  duration = 3000
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isVisible) {
      // Start the fade in and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Play Lottie animation
      animationRef.current?.play();

      // Auto-hide after duration if provided
      if (duration > 0) {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onAnimationComplete?.();
          });
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      // Fade out when not visible
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Congratulations! </Text>
        
        {/* Lottie Animation */}
        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <LottieView
            ref={animationRef}
            source={require('@/assets/animations/Celebrate.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        ) : ( 
          <DotLottieReact
          src="https://lottie.host/b6e8a86c-ab25-4d67-a925-3b343636293b/SY1IXt6wHF.lottie"
          loop
          autoplay
          style={styles.lottieAnimation}
        />
        )}
        
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  content: {
    alignItems: 'center',
    padding: 24,
    maxWidth: 300,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  placeholderAnimation: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 80,
  },
  message: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});