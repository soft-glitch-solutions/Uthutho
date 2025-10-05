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
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowRight, MapPin, Clock, Users, Bot, ChevronLeft, MessageCircle, Heart, Navigation } from 'lucide-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isVerySmallScreen = height < 600;
const isTinyScreen = height < 500;

// More aggressive scaling for very small screens
const scale = (size: number) => {
  const baseWidth = 375;
  const scaleFactor = isTinyScreen ? 0.8 : isVerySmallScreen ? 0.9 : 1;
  return (width / baseWidth) * size * scaleFactor;
};

const verticalScale = (size: number) => {
  const baseHeight = 667;
  const scaleFactor = isTinyScreen ? 0.7 : isVerySmallScreen ? 0.8 : isSmallScreen ? 0.9 : 1;
  return (height / baseHeight) * size * scaleFactor;
};

const slides = [
  {
    id: 1,
    title: 'Welcome to Uthutho',
    subtitle: 'Your Social Transport App',
    description: 'Connect with fellow commuters, share real-time updates, and transform your daily travel experience across South Africa.',
    icon: MapPin,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/261d0be8-1b97-44d7-9e94-9424f113cb1c/LgneVRy8Za.lottie',
  },
  {
    id: 2,
    title: 'Hubs & Stops',
    subtitle: 'Understand Your Journey',
    description: 'Hubs are major transport centers with multiple routes. Stops are smaller pickup points. Mark yourself as waiting to help others know when vehicles are arriving.',
    icon: Navigation,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
  },
  {
    id: 3,
    title: 'Real-Time Community',
    subtitle: 'Travel Together, Smarter',
    description: 'See how many people are waiting at your stop, share vehicle sightings, and help fellow commuters make informed decisions about their journey.',
    icon: Users,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
  },
  {
    id: 4,
    title: 'Connect & Communicate',
    subtitle: 'Build Commuter Communities',
    description: 'Chat with other commuters at your stop, share travel tips, coordinate rides, and make your daily commute more social and efficient.',
    icon: MessageCircle,
    color: '#1ea2b1',
    animationUrl: 'https://lottie.host/37ec536f-4eb1-4c2f-a8a3-523995f5bb7a/h7PQAmfGF7.lottie',
  },
];

const BRAND_COLOR = '#1ea2b1';
const BACKGROUND_COLOR = '#000000';

// Fallback component for when animations fail to load
const AnimationFallback = ({ icon: Icon, size = 200 }) => {
  const scaledSize = scale(size);
  return (
    <View style={[styles.fallbackContainer, { width: scaledSize, height: scaledSize }]}>
      <Icon size={scaledSize * 0.6} color={BRAND_COLOR} />
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
        router.replace('/(app)/(tabs)/home');
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
        <Text style={styles.logosplash}>Uthutho</Text>
        <Text style={styles.taglinesplash}>Connect. Commute. Community.</Text>
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
                <ChevronLeft size={scale(24)} color={BRAND_COLOR} />
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
                      width: index === currentSlide ? scale(20) : scale(6),
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
              <ArrowRight size={scale(18)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Developer Credit - Only show if there's space */}
          {!isTinyScreen && (
            <View style={styles.credit}>
              <Text style={styles.creditText}>
                Developed by Soft Glitch Solutions
              </Text>
            </View>
          )}

          {/* Swipe Hint - Only show on larger screens */}
          {!isVerySmallScreen && (
            <View style={styles.swipeHint}>
              <Text style={styles.swipeHintText}>
                Swipe to navigate
              </Text>
            </View>
          )}
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
    paddingHorizontal: scale(24),
  },
  splashAnimation: {
    width: scale(150),
    height: scale(150),
    marginBottom: verticalScale(20),
  },
  logosplash: {
    fontSize: scale(36),
    fontWeight: 'bold',
    color: BRAND_COLOR,
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  taglinesplash: {
    fontSize: scale(14),
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5, // Reduced height for smaller screens
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16), // Reduced padding for small screens
    paddingTop: verticalScale(40), // Reduced top padding
    paddingBottom: verticalScale(20), // Reduced bottom padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10), // Reduced margin
    height: verticalScale(40), // Reduced height
    minHeight: verticalScale(40),
  },
  backButton: {
    padding: scale(8), // Reduced padding
    opacity: 0.9,
  },
  placeholder: {
    width: scale(32), // Reduced size
    height: scale(32),
  },
  skipButton: {
    padding: scale(8), // Reduced padding
  },
  skipText: {
    fontSize: scale(14), // Smaller font
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isTinyScreen ? verticalScale(-40) : isVerySmallScreen ? verticalScale(-20) : 0,
  },
  animationContainer: {
    width: isTinyScreen ? '60%' : isVerySmallScreen ? '70%' : '80%',
    maxWidth: scale(280), // Reduced max width
    height: isTinyScreen ? verticalScale(120) : isVerySmallScreen ? verticalScale(150) : verticalScale(200),
    marginBottom: isTinyScreen ? verticalScale(15) : isVerySmallScreen ? verticalScale(20) : verticalScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: scale(12), // Reduced padding
    width: '100%',
    marginTop: isTinyScreen ? verticalScale(-10) : 0,
  },
  title: {
    fontSize: isTinyScreen ? scale(22) : isVerySmallScreen ? scale(26) : scale(30),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(8), // Reduced margin
    letterSpacing: -0.5,
    color: '#ffffff',
    lineHeight: isTinyScreen ? scale(26) : isVerySmallScreen ? scale(30) : scale(36),
  },
  subtitle: {
    fontSize: isTinyScreen ? scale(14) : isVerySmallScreen ? scale(16) : scale(18),
    textAlign: 'center',
    marginBottom: verticalScale(12), // Reduced margin
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
    lineHeight: isTinyScreen ? scale(18) : isVerySmallScreen ? scale(20) : scale(22),
  },
  description: {
    fontSize: isTinyScreen ? scale(12) : isVerySmallScreen ? scale(13) : scale(15),
    textAlign: 'center',
    lineHeight: isTinyScreen ? scale(16) : isVerySmallScreen ? scale(18) : scale(20),
    color: '#ffffff',
    opacity: 0.7,
    maxWidth: '95%', // Increased to use more space
  },
  footer: {
    alignItems: 'center',
    marginTop: isTinyScreen ? verticalScale(10) : isVerySmallScreen ? verticalScale(15) : verticalScale(20),
    paddingBottom: verticalScale(10), // Reduced padding
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTinyScreen ? verticalScale(15) : verticalScale(20),
    height: verticalScale(16), // Reduced height
  },
  dot: {
    height: scale(6), // Smaller dots
    borderRadius: scale(3),
    marginHorizontal: scale(4), // Reduced margin
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32), // Reduced padding
    paddingVertical: verticalScale(14), // Reduced padding
    borderRadius: scale(20), // Smaller border radius
    backgroundColor: BRAND_COLOR,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minWidth: scale(140), // Reduced min width
    minHeight: verticalScale(48), // Reduced height
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: scale(16), // Smaller font
    fontWeight: 'bold',
    marginRight: scale(6), // Reduced margin
  },
  credit: {
    position: 'absolute',
    bottom: verticalScale(15), // Adjusted position
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  creditText: {
    fontSize: scale(10), // Smaller font
    color: BRAND_COLOR,
    opacity: 0.5,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: scale(80), // Smaller radius
  },
  swipeHint: {
    position: 'absolute',
    bottom: verticalScale(50), // Adjusted position
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: scale(12), // Smaller font
    color: BRAND_COLOR,
    opacity: 0.5,
  }, 
});