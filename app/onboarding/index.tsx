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
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowRight, MapPin, Clock, Users, Bot, ChevronLeft, MessageCircle, Heart, Navigation } from 'lucide-react-native';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isVerySmallScreen = height < 600;
const isTinyScreen = height < 500;
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isLargeDesktop = width >= 1440;

// Enhanced scaling for all screen sizes
const scale = (size: number) => {
  const baseWidth = 375;
  let scaleFactor = 1;
  
  if (isTinyScreen) scaleFactor = 0.8;
  else if (isVerySmallScreen) scaleFactor = 0.9;
  else if (isTablet) scaleFactor = 1.2;
  else if (isDesktop) scaleFactor = 1.4;
  else if (isLargeDesktop) scaleFactor = 1.6;
  
  return (width / baseWidth) * size * scaleFactor;
};

const verticalScale = (size: number) => {
  const baseHeight = 667;
  let scaleFactor = 1;
  
  if (isTinyScreen) scaleFactor = 0.7;
  else if (isVerySmallScreen) scaleFactor = 0.8;
  else if (isSmallScreen) scaleFactor = 0.9;
  else if (isTablet) scaleFactor = 1.1;
  else if (isDesktop) scaleFactor = 1.2;
  else if (isLargeDesktop) scaleFactor = 1.3;
  
  return (height / baseHeight) * size * scaleFactor;
};

// Different animation URLs for web vs mobile
const getSlideConfig = () => {
  const isMobile = Platform.OS !== 'web';
  
  return [
    {
      id: 1,
      title: 'Welcome to Uthutho',
      subtitle: 'Your Social Transport App',
      description: 'Connect with fellow commuters, share real-time updates, and transform your daily travel experience across South Africa.',
      icon: MapPin,
      color: '#1ea2b1',
      webAnimation: 'https://lottie.host/261d0be8-1b97-44d7-9e94-9424f113cb1c/LgneVRy8Za.lottie',
      mobileAnimation: require('../../assets/animations/welcome.json'),
    },
    {
      id: 2,
      title: 'Hubs & Stops',
      subtitle: 'Understand Your Journey',
      description: 'Hubs are major transport centers with multiple routes. Stops are smaller pickup points. Mark yourself as waiting to help others know when vehicles are arriving.',
      icon: Navigation,
      color: '#1ea2b1',
      webAnimation: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
      mobileAnimation: require('../../assets/animations/understand.json'),
    },
    {
      id: 3,
      title: 'Real-Time Community',
      subtitle: 'Travel Together, Smarter',
      description: 'See how many people are waiting at your stop, share vehicle sightings, and help fellow commuters make informed decisions about their journey.',
      icon: Users,
      color: '#1ea2b1',
      webAnimation: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
      mobileAnimation: require('../../assets/animations/travel.json'),
    },
    {
      id: 4,
      title: 'Connect & Communicate',
      subtitle: 'Build Commuter Communities',
      description: 'Chat with other commuters at your stop, share travel tips, coordinate rides, and make your daily commute more social and efficient.',
      icon: MessageCircle,
      color: '#1ea2b1',
      webAnimation: 'https://lottie.host/37ec536f-4eb1-4c2f-a8a3-523995f5bb7a/h7PQAmfGF7.lottie',
      mobileAnimation: require('../../assets/animations/connect.json'),
    },
  ];
};

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

// Safe animation component with error handling for web
const WebAnimation = ({ src, style, loop = true, autoplay = true, fallbackIcon }) => {
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
        console.log('Web animation failed to load, using fallback');
        setHasError(true);
      }}
    />
  );
};

// Mobile animation component using LottieView
const MobileAnimation = ({ source, style, loop = true, autoplay = true, fallbackIcon }) => {
  const [hasError, setHasError] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (autoplay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoplay]);

  if (hasError || !source) {
    return <AnimationFallback icon={fallbackIcon} />;
  }

  return (
    <LottieView
      ref={animationRef}
      source={source}
      loop={loop}
      autoPlay={autoplay}
      style={style}
      onAnimationFailure={() => {
        console.log('Mobile animation failed to load, using fallback');
        setHasError(true);
      }}
    />
  );
};

// Main animation component that chooses between web and mobile
const SafeAnimation = ({ slide, style, loop = true, autoplay = true, fallbackIcon }) => {
  const isMobile = Platform.OS !== 'web';
  
  if (isMobile) {
    return (
      <MobileAnimation
        source={slide.mobileAnimation}
        style={style}
        loop={loop}
        autoplay={autoplay}
        fallbackIcon={fallbackIcon}
      />
    );
  } else {
    return (
      <WebAnimation
        src={slide.webAnimation}
        style={style}
        loop={loop}
        autoplay={autoplay}
        fallbackIcon={fallbackIcon}
      />
    );
  }
};

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { colors } = useTheme();

  const slides = getSlideConfig();
  const isMobile = Platform.OS !== 'web';

  // Calculate max content width for desktop
  const maxContentWidth = isDesktop ? 600 : isTablet ? 500 : '100%';

  // Calculate dynamic heights based on screen size
  const getDynamicHeights = () => {
    if (isTinyScreen) {
      return {
        headerHeight: verticalScale(35),
        animationHeight: verticalScale(120),
        textMarginBottom: verticalScale(10),
        footerMarginTop: verticalScale(5)
      };
    } else if (isVerySmallScreen) {
      return {
        headerHeight: verticalScale(40),
        animationHeight: verticalScale(140),
        textMarginBottom: verticalScale(15),
        footerMarginTop: verticalScale(10)
      };
    } else if (isSmallScreen) {
      return {
        headerHeight: verticalScale(45),
        animationHeight: verticalScale(160),
        textMarginBottom: verticalScale(20),
        footerMarginTop: verticalScale(15)
      };
    } else if (isTablet) {
      return {
        headerHeight: verticalScale(50),
        animationHeight: verticalScale(220),
        textMarginBottom: verticalScale(25),
        footerMarginTop: verticalScale(20)
      };
    } else {
      return {
        headerHeight: verticalScale(55),
        animationHeight: verticalScale(250),
        textMarginBottom: verticalScale(30),
        footerMarginTop: verticalScale(25)
      };
    }
  };

  const dynamicHeights = getDynamicHeights();

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

  // Unified slide transition function for both swipe and button
  const handleSlideTransition = (direction) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    
    if (direction === 'next') {
      // Next slide animation - slide left
      const targetValue = -width * 0.8;

      // Animate current content out to the left
      Animated.timing(slideAnim, {
        toValue: targetValue,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Change slide
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
        } else {
          // If it's the last slide and going next, go to auth
          goToAuth();
          return;
        }

        // Reset position for next slide (coming from right)
        slideAnim.setValue(width * 0.5);
        
        // Animate new content in from right
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      });
    } else {
      // Previous slide animation - slide right
      handleBackWithAnimation();
    }
  };

  // Fixed back slide animation
  const handleBackWithAnimation = () => {
    if (isTransitioning || currentSlide === 0) return;
    
    setIsTransitioning(true);
    
    // Animate current content out to the right
    Animated.timing(slideAnim, {
      toValue: width * 0.8,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      // Go to previous slide
      setCurrentSlide(prev => prev - 1);
      
      // Reset position for previous slide (coming from left)
      slideAnim.setValue(-width * 0.5);
      
      // Animate previous content in from left
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

  // Fixed PanResponder for smooth swipe gestures
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
        const swipeVelocity = Math.abs(gestureState.vx);
        
        // Check if swipe is significant enough or has enough velocity
        if (currentDX < -swipeThreshold || (currentDX < -10 && swipeVelocity > 0.5)) {
          // Swipe left - next slide
          handleSlideTransition('next');
        } else if (currentDX > swipeThreshold || (currentDX > 10 && swipeVelocity > 0.5)) {
          // Swipe right - previous slide
          if (currentSlide > 0) {
            handleSlideTransition('prev');
          } else {
            // Reset if on first slide
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }).start();
          }
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
    handleSlideTransition('next');
  };

  const handleSkip = () => {
    if (handleDoubleTapProtection()) return;
    goToAuth();
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
          style={[styles.content, { maxWidth: maxContentWidth }]} 
          {...panResponder.panHandlers}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          {/* Header with Back Button */}
          <View style={[styles.header, { height: dynamicHeights.headerHeight }]}>
            {currentSlide > 0 ? (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackWithAnimation}
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
            <View style={[styles.animationContainer, { height: dynamicHeights.animationHeight }]}>
              <SafeAnimation
                slide={currentItem}
                style={styles.animation}
                loop={true}
                autoplay={true}
                fallbackIcon={CurrentIcon}
              />
            </View>

            {/* Text Content */}
            <View style={[styles.textContainer, { marginBottom: dynamicHeights.textMarginBottom }]}>
              <Text style={styles.title}>{currentItem.title}</Text>
              <Text style={styles.subtitle}>{currentItem.subtitle}</Text>
              <Text style={styles.description}>{currentItem.description}</Text>
            </View>
          </Animated.View>

          {/* Footer with Navigation */}
          <View style={[styles.footer, { marginTop: dynamicHeights.footerMarginTop }]}>
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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 1200,
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
    height: height * 0.5,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: isDesktop ? scale(40) : isTablet ? scale(32) : scale(16),
    paddingTop: verticalScale(20), // Reduced top padding
    paddingBottom: verticalScale(10), // Reduced bottom padding
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between', // Better distribution of space
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(5), // Reduced margin
    minHeight: verticalScale(30),
  },
  backButton: {
    padding: scale(8),
    opacity: 0.9,
  },
  placeholder: {
    width: scale(32),
    height: scale(32),
  },
  skipButton: {
    padding: scale(8),
  },
  skipText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed negative margins that were causing issues
  },
  animationContainer: {
    width: isDesktop ? '50%' : isTablet ? '60%' : isTinyScreen ? '60%' : isVerySmallScreen ? '70%' : '80%',
    maxWidth: isDesktop ? scale(400) : isTablet ? scale(320) : scale(280),
    justifyContent: 'center',
    alignItems: 'center',
    // Height is now dynamic via props
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: isDesktop ? scale(40) : isTablet ? scale(24) : scale(12),
    width: '100%',
    // Margin bottom is now dynamic via props
  },
  title: {
    fontSize: isDesktop ? scale(36) : isTablet ? scale(32) : isTinyScreen ? scale(22) : isVerySmallScreen ? scale(26) : scale(30),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    letterSpacing: -0.5,
    color: '#ffffff',
    lineHeight: isDesktop ? scale(42) : isTablet ? scale(38) : isTinyScreen ? scale(26) : isVerySmallScreen ? scale(30) : scale(36),
  },
  subtitle: {
    fontSize: isDesktop ? scale(20) : isTablet ? scale(18) : isTinyScreen ? scale(14) : isVerySmallScreen ? scale(16) : scale(18),
    textAlign: 'center',
    marginBottom: isDesktop ? verticalScale(16) : isTablet ? verticalScale(14) : verticalScale(12),
    fontWeight: '600',
    color: BRAND_COLOR,
    opacity: 0.9,
    lineHeight: isDesktop ? scale(24) : isTablet ? scale(22) : isTinyScreen ? scale(18) : isVerySmallScreen ? scale(20) : scale(22),
  },
  description: {
    fontSize: isDesktop ? scale(16) : isTablet ? scale(15) : isTinyScreen ? scale(12) : isVerySmallScreen ? scale(13) : scale(15),
    textAlign: 'center',
    lineHeight: isDesktop ? scale(24) : isTablet ? scale(22) : isTinyScreen ? scale(16) : isVerySmallScreen ? scale(18) : scale(20),
    color: '#ffffff',
    opacity: 0.7,
    maxWidth: isDesktop ? '80%' : isTablet ? '90%' : '95%',
  },
  footer: {
    alignItems: 'center',
    // Margin top is now dynamic via props
    paddingBottom: verticalScale(5), // Reduced padding
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isDesktop ? verticalScale(20) : isTablet ? verticalScale(15) : isTinyScreen ? verticalScale(10) : verticalScale(15),
    height: verticalScale(12), // Reduced height
  },
  dot: {
    height: scale(6),
    borderRadius: scale(3),
    marginHorizontal: scale(4),
    transition: 'all 0.3s ease',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isDesktop ? scale(40) : isTablet ? scale(36) : scale(32),
    paddingVertical: isDesktop ? verticalScale(16) : isTablet ? verticalScale(14) : verticalScale(12), // Reduced padding
    borderRadius: scale(20),
    backgroundColor: BRAND_COLOR,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minWidth: isDesktop ? scale(160) : isTablet ? scale(150) : scale(140),
    minHeight: isDesktop ? verticalScale(52) : isTablet ? verticalScale(48) : verticalScale(44), // Reduced height
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: isDesktop ? scale(18) : isTablet ? scale(17) : scale(16),
    fontWeight: 'bold',
    marginRight: scale(6),
  },
  credit: {
    alignItems: 'center',
    marginTop: verticalScale(5), // Reduced margin
  },
  creditText: {
    fontSize: scale(10),
    color: BRAND_COLOR,
    opacity: 0.5,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: scale(80),
  },
});