import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
};

export default function ScreenTransition({ children, duration = 280, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const translate = useRef(new Animated.Value(16)).current; // slight nudge from top-left

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, opacity, scale, translate]);

  return (
    <Animated.View
      style={[
        { flex: 1, transform: [{ translateX: translate }, { translateY: translate }, { scale }], opacity },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
