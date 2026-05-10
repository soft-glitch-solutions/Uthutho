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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;
const isSmallMobile = SCREEN_HEIGHT < 700;

const getSlideConfig = () => [
  {
    id: 1,
    tagline: 'WELCOME TO UTHUTHO',
    title: 'Ready to Move Together?',
    description: 'Uthutho is built around commuters. Stay connected, informed, and part of a shared journey with every trip you take.',
    icon: MapPin,
    webAnimation: 'https://lottie.host/261d0be8-1b97-44d7-9e94-9424f113cb1c/LgneVRy8Za.lottie',
    mobileAnimation: require('../../assets/animations/welcome.json'),
  },
  {
    id: 2,
    tagline: 'HUBS & STOPS',
    title: 'Build Your Community',
    description: 'Read and create posts about the routes and stops you always use. The stronger the community, the more powerful Uthutho becomes.',
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
    tagline: 'COMMUTER REWARDS',
    title: 'Earn Points & Recognition',
    description: 'Earn points for every journey, unlock exclusive titles, and show off being a community hero.',
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
        toValue: -SCREEN_WIDTH * 0.8,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (currentSlideRef.current < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
          slideAnim.setValue(SCREEN_WIDTH * 0.5);
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start(() => setIsTransitioning(false));
        } else {
          router.replace('/auth');
        }
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH * 0.8,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(prev => prev - 1);
        slideAnim.setValue(-SCREEN_WIDTH * 0.5);
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
          slideAnim.setValue(Math.max(Math.min(gestureState.dx, SCREEN_WIDTH * 0.5), -SCREEN_WIDTH * 0.5));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isTransitioningRef.current) return;
        const swipeThreshold = SCREEN_WIDTH * 0.15;
        if (gestureState.dx < -swipeThreshold) handleSlideTransition('next');
        else if (gestureState.dx > swipeThreshold && currentSlideRef.current > 0) handleSlideTransition('prev');
        else Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogoRow}>
          <Text style={styles.logosplash}>Uthutho</Text>
          <Text style={styles.splashDot}>.</Text>
        </View>
        <Text style={styles.splashTagline}>MOVE SMARTER</Text>
      </View>
    );
  }

  const currentItem = slides[currentSlide];

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/auth')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
        <Animated.View
          style={[
            styles.main,
            isDesktop && styles.mainDesktop,
            { transform: [{ translateX: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.animationContainer, isDesktop && styles.animationContainerDesktop]}>
            {Platform.OS === 'web' ? (
              <DotLottieReact key={`web-${currentItem.id}`} src={currentItem.webAnimation} loop autoplay style={styles.animation} />
            ) : (
              <LottieView key={`mobile-${currentItem.id}`} source={currentItem.mobileAnimation} autoPlay loop style={styles.animation} />
            )}
          </View>

          <View style={[styles.textContainer, isDesktop && styles.textContainerDesktop]}>
            <View style={styles.taglineRow}>
              {currentSlide > 0 ? (
                <TouchableOpacity
                  style={styles.inlineActionBtn}
                  onPress={() => handleSlideTransition('prev')}
                >
                  <ChevronLeft size={20} color="#000" />
                </TouchableOpacity>
              ) : (
                <View style={styles.inlineActionBtnEmpty} />
              )}

              <Text style={styles.slideTagline}>{currentItem.tagline}</Text>

              {currentSlide < slides.length - 1 ? (
                <TouchableOpacity
                  style={styles.inlineActionBtn}
                  onPress={() => handleSlideTransition('next')}
                >
                  <ArrowRight size={20} color="#000" />
                </TouchableOpacity>
              ) : (
                <View style={styles.inlineActionBtnEmpty} />
              )}
            </View>

            <Text style={[styles.slideTitle, isSmallMobile && styles.slideTitleSmall]}>
              {currentItem.title}
            </Text>
            <Text style={[styles.slideDescription, isSmallMobile && styles.slideDescriptionSmall]}>
              {currentItem.description}
            </Text>

            {currentSlide === slides.length - 1 && (
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={() => router.replace('/auth')}
              >
                <Text style={styles.getStartedText}>GET STARTED</Text>
                <ArrowRight size={20} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

      </View>

      <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
        {currentSlide < slides.length - 1 && (
          <View style={styles.pagination}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  containerDesktop: {
    paddingTop: 0,
    justifyContent: 'center',
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
    color: '#FFF',
    letterSpacing: -1,
  },
  splashLogoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  splashDot: {
    fontSize: 52,
    fontWeight: '900',
    color: BRAND_COLOR,
    marginLeft: 2,
  },
  splashTagline: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: -8,
  },
  taglineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: isSmallMobile ? 12 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  headerDesktop: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
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
  contentWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  contentWrapperDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 100,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mainDesktop: {
    flexDirection: 'row',
    gap: 80,
    maxWidth: 1200,
    paddingHorizontal: 0,
  },
  animationContainer: {
    width: isSmallMobile ? SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.8,
    height: isSmallMobile ? SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.8,
    maxWidth: 300,
    maxHeight: 300,
    marginBottom: isSmallMobile ? 16 : 48,
  },
  animationContainerDesktop: {
    width: 500,
    height: 500,
    maxWidth: 500,
    maxHeight: 500,
    marginBottom: 0,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  textContainerDesktop: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: isSmallMobile ? 12 : 24,
  },
  slideTagline: {
    fontSize: isSmallMobile ? 12 : 14,
    fontWeight: '900',
    color: '#fed43f',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  slideTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 16,
  },
  slideTitleSmall: {
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
  },
  slideDescription: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  slideDescriptionSmall: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  inlineActionBtn: {
    width: isSmallMobile ? 36 : 44,
    height: isSmallMobile ? 36 : 44,
    borderRadius: isSmallMobile ? 18 : 22,
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  inlineActionBtnEmpty: {
    width: isSmallMobile ? 36 : 44,
    height: isSmallMobile ? 36 : 44,
  },
  getStartedBtn: {
    flexDirection: 'row',
    backgroundColor: '#fed43f',
    width: '100%',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
    shadowColor: '#fed43f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 24,
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  floatingBackBtnDesktop: {
    left: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
  },
  floatingNextBtn: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  floatingNextBtnDesktop: {
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
  },
  footer: {
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  footerDesktop: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#334155',
  },
  dotActive: {
    width: 32,
    backgroundColor: BRAND_COLOR,
  },
});