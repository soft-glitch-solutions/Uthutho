import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowRight, MapPin, Users, MessageCircle, ChevronLeft, Navigation } from 'lucide-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;

const getSlideConfig = () => [
  {
    id: 1,
    tagline: 'WELCOME TO UTHUTHO',
    title: 'Ready to Move Together?',
    description: 'Connect with fellow commuters, share real-time updates, and transform your daily travel experience.',
    icon: MapPin,
    webAnimation: 'https://lottie.host/261d0be8-1b97-44d7-9e94-9424f113cb1c/LgneVRy8Za.lottie',
    mobileAnimation: require('../../assets/animations/welcome.json'),
  },
  {
    id: 2,
    tagline: 'HUBS & STOPS',
    title: 'Understand Your Journey',
    description: 'Join communities through the routes you actually use. Help others know when transport is arriving.',
    icon: Navigation,
    webAnimation: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
    mobileAnimation: require('../../assets/animations/understand.json'),
  },
  {
    id: 3,
    tagline: 'LIVE UPDATES',
    title: 'Real-Time Community',
    description: 'See how many people are waiting, share vehicle sightings, and stay informed about your route.',
    icon: Users,
    webAnimation: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
    mobileAnimation: require('../../assets/animations/travel.json'),
  },
  {
    id: 4,
    tagline: 'COMMUTER CHAT',
    title: 'Connect & Communicate',
    description: 'Chat with other commuters, share tips, and coordinate your daily travel more efficiently.',
    icon: MessageCircle,
    webAnimation: 'https://lottie.host/37ec536f-4eb1-4c2f-a8a3-523995f5bb7a/h7PQAmfGF7.lottie',
    mobileAnimation: require('../../assets/animations/connect.json'),
  },
];

const BRAND_COLOR = '#1ea2b1';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;
  const isTransitioningRef = useRef(isTransitioning);
  isTransitioningRef.current = isTransitioning;
  const lastTapRef = useRef(0);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const slides = getSlideConfig();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDoubleTapProtection = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) return true;
    lastTapRef.current = now;
    return false;
  };

  const handleSlideTransition = (direction: 'next' | 'prev') => {
    if (isTransitioningRef.current) return;
    setIsTransitioning(true);
    
    if (direction === 'next') {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (currentSlideRef.current < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
          slideAnim.setValue(width * 0.5);
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start(() => setIsTransitioning(false));
        } else {
          router.replace('/auth');
        }
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: width * 0.8,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(prev => prev - 1);
        slideAnim.setValue(-width * 0.5);
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start(() => setIsTransitioning(false));
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !handleDoubleTapProtection(),
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (!isTransitioningRef.current) {
          slideAnim.setValue(Math.max(Math.min(gestureState.dx, width * 0.5), -width * 0.5));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isTransitioningRef.current) return;
        const swipeThreshold = width * 0.15;
        if (gestureState.dx < -swipeThreshold) handleSlideTransition('next');
        else if (gestureState.dx > swipeThreshold && currentSlideRef.current > 0) handleSlideTransition('prev');
        else Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.logosplash}>Uthutho</Text>
        <View style={styles.taglineRow}>
          <Text style={[styles.taglineText, { color: '#1EA2B1' }]}>Commute.</Text>
          <Text style={[styles.taglineText, { color: '#ED67B1' }]}> Connect.</Text>
          <Text style={[styles.taglineText, { color: '#FD602D' }]}> Community.</Text>
        </View>
      </View>
    );
  }

  const currentItem = slides[currentSlide];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {currentSlide > 0 ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleSlideTransition('prev')}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
        ) : <View style={styles.placeholder} />}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/auth')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[styles.main, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.animationContainer}>
          {Platform.OS === 'web' ? (
            <DotLottieReact src={currentItem.webAnimation} loop autoplay style={styles.animation} />
          ) : (
            <LottieView source={currentItem.mobileAnimation} autoPlay loop style={styles.animation} />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.slideTagline}>{currentItem.tagline}</Text>
          <Text style={styles.slideTitle}>{currentItem.title}</Text>
          <Text style={styles.slideDescription}>{currentItem.description}</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={() => handleSlideTransition('next')}>
          <Text style={styles.nextText}>
            {currentSlide === slides.length - 1 ? 'GET STARTED' : 'NEXT'}
          </Text>
          <ArrowRight size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logosplash: {
    fontSize: 48,
    fontWeight: '900',
    color: BRAND_COLOR,
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  taglineRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  placeholder: {
    width: 44,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  animationContainer: {
    width: width * 0.8,
    height: width * 0.8,
    maxWidth: 300,
    maxHeight: 300,
    marginBottom: 48,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTagline: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND_COLOR,
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    padding: 32,
    gap: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  dotActive: {
    width: 24,
    backgroundColor: BRAND_COLOR,
  },
  nextBtn: {
    backgroundColor: BRAND_COLOR,
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nextText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});