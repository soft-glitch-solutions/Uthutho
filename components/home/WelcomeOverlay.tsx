import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Image,
} from 'react-native';
import {
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';

// Only import web components on web
let DotLottieReact: any = null;
if (Platform.OS === 'web') {
  try {
    const module = require('@lottiefiles/dotlottie-react');
    DotLottieReact = module.DotLottieReact;
  } catch (error) {
    console.warn('DotLottieReact not available');
  }
}

interface WelcomeOverlayProps {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

/* -------------------------------------------------------------------------- */
/*                                   SLIDES                                   */
/* -------------------------------------------------------------------------- */

const slides = [
  {
    id: 1,
    title: 'Welcome to Uthutho',
    subtitle: 'Travel doesn’t have to feel lonely',
    // Mobile Lottie file
    lottieSource: require('@/assets/animations/Celebrate.json'),
    // Web Lottie URL
    lottieUrl: 'https://lottie.host/e298b4d7-ec25-4809-9971-fd981511e67a/rWHuAlLHeZ.lottie',
    content:
      'Uthutho is built around people who travel every day. It helps you feel connected, informed, and part of something shared.',
  },
  {
    id: 2,
    title: 'A social transport app',
    subtitle: 'Built around real journeys',
    lottieSource: require('@/assets/animations/understand.json'),
    lottieUrl: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
    content:
      'Uthutho is a social transport app. You join communities through the stops, hubs, and routes you actually use.',
  },
  {
    id: 3,
    title: 'Join stops & hubs',
    subtitle: 'Your travel communities',
    lottieSource: require('@/assets/animations/intro.json'),
    lottieUrl: 'https://lottie.host/a9aeaf82-2750-44e9-b048-0bc121ed60db/GkljgALnFY.lottie',
    content:
      'Every stop and hub is its own community. Save the ones you use and see who else travels through them.',
  },
  {
    id: 4,
    title: 'Join a journey',
    subtitle: 'Travel together, stay informed',
    lottieSource: require('@/assets/animations/travel.json'),
    lottieUrl: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
    content:
      'When you\'re traveling a route, you join a journey. Other commuters on the same route can see activity and help keep everyone informed about when transport is coming.',
  },
  {
    id: 5,
    title: 'Earn points by traveling',
    subtitle: 'Your journey matters',
    lottieSource: require('@/assets/animations/Success.json'),
    lottieUrl: 'https://lottie.host/b6e8a86c-ab25-4d67-a925-3b343636293b/SY1IXt6wHF.lottie',
    content:
      'Every journey earns you points. Travel more, contribute more, and unlock levels and titles that reflect how you move.',
  },
];

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function WelcomeOverlay({
  visible,
  onClose,
  onGetStarted,
}: WelcomeOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / SLIDE_WIDTH,
    );
    setCurrentSlide(index);
  };

  const goNext = () => {
    if (currentSlide === slides.length - 1) {
      onGetStarted();
    } else {
      scrollRef.current?.scrollTo({
        x: (currentSlide + 1) * SLIDE_WIDTH,
        animated: true,
      });
    }
  };

  const goPrev = () => {
    scrollRef.current?.scrollTo({
      x: (currentSlide - 1) * SLIDE_WIDTH,
      animated: true,
    });
  };

  const Slide = ({ slide }: { slide: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
        {/* Lottie Animation */}
        <View style={styles.animationWrap}>
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <LottieView
              source={slide.lottieSource}
              autoPlay
              loop
              style={styles.lottieAnimation}
              resizeMode="contain"
            />
          ) : Platform.OS === 'web' && DotLottieReact ? (
            <DotLottieReact
              src={slide.lottieUrl}
              loop
              autoplay
              style={styles.lottieAnimation}
            />
          ) : (
            // Fallback if Lottie is not available
            <View style={styles.fallbackAnimation}>
              <Image 
                source={require('@/assets/logo.png')}
                style={styles.fallbackImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={styles.content}>{slide.content}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Image 
                source={require('@/assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>Uthutho</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* SLIDES */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {slides.map((slide) => (
              <Slide key={slide.id} slide={slide} />
            ))}
          </ScrollView>

          {/* INDICATORS */}
          <View style={styles.indicators}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  currentSlide === i && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* NAVIGATION */}
          <View style={styles.nav}>
            {currentSlide > 0 && (
              <TouchableOpacity style={styles.prev} onPress={goPrev}>
                <ChevronLeft size={18} color="#1ea2b1" />
                <Text style={styles.prevText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.next} onPress={goNext}>
              <Text style={styles.nextText}>
                {currentSlide === slides.length - 1
                  ? 'Get Started'
                  : 'Next'}
              </Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#111',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skip: {
    color: '#666',
  },
  slide: {
    padding: 32,
    alignItems: 'center',
  },
  animationWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  fallbackAnimation: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderRadius: 20,
  },
  fallbackImage: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    marginTop: 6,
    textAlign: 'center',
  },
  content: {
    marginTop: 20,
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    textAlign: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#1ea2b1',
  },
  nav: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  prev: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  prevText: {
    color: '#1ea2b1',
  },
  next: {
    flex: 2,
    backgroundColor: '#1ea2b1',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
  },
});