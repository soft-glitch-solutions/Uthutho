import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowRight, MapPin, Clock, Users, Bot, ChevronLeft } from 'lucide-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Welcome to Uthutho',
    subtitle: 'Your Smart Transport Companion',
    description: 'Transform your daily commute with real-time updates and intelligent route planning across South Africa.',
    icon: MapPin,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/261d0be8-1b97-44d7-9e94-9424f113cb1c/LgneVRy8Za.lottie',
  },
  {
    id: 2,
    title: 'Live Updates',
    subtitle: 'Never Wait Again',
    description: 'Real-time schedules, route changes, and fare information for all public transport options.',
    icon: Clock,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
  },
  {
    id: 3,
    title: 'Community Powered',
    subtitle: 'Travel Together, Smarter',
    description: 'Share real-time crowding updates and help fellow commuters make informed decisions.',
    icon: Users,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
  },
  {
    id: 4,
    title: 'Uthutho AI',
    subtitle: 'Your Personal Guide',
    description: 'Get instant, personalized answers about routes, schedules, and travel tips.',
    icon: Bot,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/37ec536f-4eb1-4c2f-a8a3-523995f5bb7a/h7PQAmfGF7.lottie',
  },
];

const BRAND_COLOR = '#1ea2b1';
const BACKGROUND_COLOR = '#000000';

// Fallback component for when animations fail to load
const AnimationFallback = ({ icon: Icon, size = 200 }) => {
  return (
    <View style={[styles.fallbackContainer, { width: size, height: size }]}>
      <Icon size={size * 0.6} color={BRAND_COLOR} />
    </View>
  );
};

// Safe animation component with error handling
const SafeAnimation = ({ src, style, loop = true, autoplay = true, fallbackIcon }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <AnimationFallback icon={fallbackIcon} />;
  }

  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      style={style}
      onError={() => {
        console.log('Animation failed to load, using fallback');
        setHasError(true);
      }}
    />
  );
};

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { colors } = useTheme();

  // Prevent double tap zoom
  const handleDoubleTapProtection = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      return true;
    } else {
      setLastTap(now);
      return false;
    }
  };

  // PanResponder for smooth swipe gestures with double-tap protection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (handleDoubleTapProtection()) {
          return false;
        }
        return true;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && 
               Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isTransitioning) {
          const constrainedDX = Math.max(Math.min(gestureState.dx, width * 0.5), -width * 0.5);
          slideAnim.setValue(constrainedDX);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isTransitioning) return;

        const swipeThreshold = width * 0.15;
        const currentDX = gestureState.dx;
        
        if (currentDX < -swipeThreshold) {
          // Swipe left - next slide
          handleSlideTransition('next');
        } else if (currentDX > swipeThreshold) {
          // Swipe right - previous slide
          handleSlideTransition('prev');
        } else {
          // Reset if not enough swipe
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderGrant: () => {
        return true;
      },
    })
  ).current;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSlideTransition = (direction) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const targetValue = direction === 'next' ? -width * 0.8 : width * 0.8;

    // Animate current content out
    Animated.timing(slideAnim, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Change slide
      if (direction === 'next') {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
        } else {
          // If it's the last slide and swiping next, go to auth
          goToAuth();
          return;
        }
      } else {
        // Swipe back - go to previous slide
        if (currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
        } else {
          // If it's the first slide and swiping back, just reset
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start(() => {
            setIsTransitioning(false);
          });
          return;
        }
      }

      // Reset position for next slide
      const startPosition = direction === 'next' ? width * 0.5 : -width * 0.5;
      slideAnim.setValue(startPosition);
      
      // Animate new content in
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const handleButtonTransition = (direction) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const targetValue = direction === 'next' ? -width * 0.8 : width * 0.8;

    // Animate current content out
    Animated.timing(slideAnim, {
      toValue: targetValue,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      // Change slide
      if (direction === 'next') {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
        } else {
          // Last slide - go to auth
          goToAuth();
          return;
        }
      } else {
        // Previous slide
        if (currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
        } else {
          // Already on first slide, just reset
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start(() => {
            setIsTransitioning(false);
          });
          return;
        }
      }

      // Reset for new slide
      const startPosition = direction === 'next' ? width * 0.5 : -width * 0.5;
      slideAnim.setValue(startPosition);
      
      // Animate new content in
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  // Direct navigation to auth screen
  const goToAuth = () => {
    setIsLoading(true);
    router.replace('/auth');
  };

  const checkAppState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Error checking app state:', error);
      router.replace('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (handleDoubleTapProtection() && isTransitioning) return;
    handleButtonTransition('next');
  };

  const handleSkip = () => {
    if (handleDoubleTapProtection()) return;
    goToAuth();
  };

  const prevSlide = () => {
    if (handleDoubleTapProtection() && isTransitioning) return;
    handleButtonTransition('prev');
  };

  const slideStyle = {
    transform: [
      { 
        translateX: slideAnim.interpolate({
          inputRange: [-width * 0.5, 0, width * 0.5],
          outputRange: [-width * 0.5, 0, width * 0.5],
          extrapolate: 'clamp'
        })
      },
    ],
    opacity: slideAnim.interpolate({
      inputRange: [-width * 0.5, 0, width * 0.5],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp'
    }),
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <SafeAnimation
          src="https://lottie.host/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6/splash-loading.lottie"
          style={styles.splashAnimation}
          fallbackIcon={MapPin}
        />
        <Text style={styles.logosplash}>Uthutho</Text>
        <Text style={styles.taglinesplash}>Transform Your Daily Commute</Text>
      </View>
    );
  }

  const currentItem = slides[currentSlide];
  const CurrentIcon = currentItem.icon;

  return (
    <View 
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    >
      {/* Background */}
      <View style={[styles.background, { backgroundColor: BRAND_COLOR + '10' }]} />
      
      {/* Container with overflow hidden */}
      <View 
        style={styles.contentContainer}
        onStartShouldSetResponder={() => true}
      >
        <View 
          style={styles.content} 
          {...panResponder.panHandlers}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            {currentSlide > 0 ? (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={prevSlide} 
                disabled={isTransitioning}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                delayPressIn={0}
              >
                <ChevronLeft size={28} color={BRAND_COLOR} />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
            
            {/* Skip button - always goes directly to auth */}
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isTransitioning}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              delayPressIn={0}
            >
              <Text style={styles.skipText}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content with Slide Animation */}
          <Animated.View 
            style={[styles.mainContent, slideStyle]}
            onStartShouldSetResponder={() => true}
          >
            {/* Animation */}
            <View style={styles.animationContainer}>
              <SafeAnimation
                src={currentItem.animationUrl}
                style={styles.animation}
                loop={true}
                autoplay={true}
                fallbackIcon={CurrentIcon}
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{currentItem.title}</Text>
              <Text style={styles.subtitle}>{currentItem.subtitle}</Text>
              <Text style={styles.description}>{currentItem.description}</Text>
            </View>
          </Animated.View>

          {/* Footer with Navigation */}
          <View style={styles.footer}>
            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentSlide ? BRAND_COLOR : 'rgba(30, 162, 177, 0.3)',
                      width: index === currentSlide ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Next/Get Started Button */}
            <TouchableOpacity
              style={[
                styles.button, 
                isTransitioning && styles.buttonDisabled
              ]}
              onPress={nextSlide}
              disabled={isTransitioning}
              activeOpacity={0.8}
              delayPressIn={0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.buttonText}>
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Developer Credit */}
          <View style={styles.credit}>
            <Text style={styles.creditText}>
              Developed by Soft Glitch Solutions
            </Text>
          </View>

          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>
              Swipe to navigate
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_COLOR,
  },
  splashAnimation: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  logosplash: {
    fontSize: 48,
    fontWeight: 'bold',
    color: BRAND_COLOR,
    marginBottom: 16,
  },
  taglinesplash: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    height: 50,
  },
  backButton: {
    padding: 12,
    opacity: 0.9,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: '80%',
    maxWidth: 320,
    height: 240,
    marginBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    color: '#ffffff',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#ffffff',
    opacity: 0.7,
    maxWidth: '90%',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 25,
    backgroundColor: BRAND_COLOR,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  credit: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  creditText: {
    fontSize: 12,
    color: BRAND_COLOR,
    opacity: 0.5,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: 100,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 14,
    color: BRAND_COLOR,
    opacity: 0.5,
  },
});