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
  X,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 48;

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

const slides = [
  {
    id: 1,
    tagline: 'WELCOME TO UTHUTHO',
    title: 'Ready to Move Together?',
    lottieSource: require('@/assets/animations/Celebrate.json'),
    lottieUrl: 'https://lottie.host/e298b4d7-ec25-4809-9971-fd981511e67a/rWHuAlLHeZ.lottie',
    content: 'Uthutho is built around commuters. Stay connected, informed, and part of a shared journey every single day.',
  },
  {
    id: 2,
    tagline: 'SOCIAL TRANSPORT',
    title: 'Real People, Real Routes',
    lottieSource: require('@/assets/animations/understand.json'),
    lottieUrl: 'https://lottie.host/6a2179e4-c19b-447f-abf8-ba546671c275/buGwONChJP.lottie',
    content: 'Connect with other commuters at your stops, hubs, and on the routes you actually use.',
  },
  {
    id: 3,
    tagline: 'LIVE COMMUNITIES',
    title: 'Join Your Local Hubs',
    lottieSource: require('@/assets/animations/intro.json'),
    lottieUrl: 'https://lottie.host/a9aeaf82-2750-44e9-b048-0bc121ed60db/GkljgALnFY.lottie',
    content: 'Save your favorite stops and see activity from other travelers in real-time.',
  },
  {
    id: 4,
    tagline: 'JOURNEY TRACKING',
    title: 'Travel Smarter, Faster',
    lottieSource: require('@/assets/animations/travel.json'),
    lottieUrl: 'https://lottie.host/94a02803-32cc-4b11-9147-4b26f8cda9ee/4D5V0Q1cBG.lottie',
    content: 'Stay updated on transit times and route activity shared by your community.',
  },
  {
    id: 5,
    tagline: 'TRAVEL REWARDS',
    title: 'Your Commute, Rewarded',
    lottieSource: require('@/assets/animations/Success.json'),
    lottieUrl: 'https://lottie.host/b6e8a86c-ab25-4d67-a925-3b343636293b/SY1IXt6wHF.lottie',
    content: 'Earn points for every journey, unlock exclusive titles, and show the world how you move.',
  },
];

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
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setCurrentSlide(index);
  };

  const goNext = () => {
    if (currentSlide === slides.length - 1) {
      onGetStarted();
    } else {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * SLIDE_WIDTH, animated: true });
    }
  };

  const goPrev = () => {
    scrollRef.current?.scrollTo({ x: (currentSlide - 1) * SLIDE_WIDTH, animated: true });
  };

  const Slide = ({ slide }: { slide: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
        <View style={styles.animationContainer}>
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <LottieView
              source={slide.lottieSource}
              autoPlay
              loop
              style={styles.lottie}
              resizeMode="contain"
            />
          ) : Platform.OS === 'web' && DotLottieReact ? (
            <DotLottieReact src={slide.lottieUrl} loop autoplay style={styles.lottie} />
          ) : (
            <View style={styles.fallbackBox}><Flame size={40} color="#1ea2b1" /></View>
          )}
        </View>

        <Text style={styles.slideTagline}>{slide.tagline}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideContent}>{slide.content}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>Uthutho</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
          >
            {slides.map((slide) => (
              <Slide key={slide.id} slide={slide} />
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.indicatorRow}>
              {slides.map((_, i) => (
                <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.navActions}>
              {currentSlide > 0 && (
                <TouchableOpacity style={styles.backBtn} onPress={goPrev}>
                  <ChevronLeft size={20} color="#FFF" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                <Text style={styles.nextBtnText}>
                  {currentSlide === slides.length - 1 ? 'GET STARTED' : 'NEXT'}
                </Text>
                <ChevronRight size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#111',
    borderRadius: 40,
    width: SCREEN_WIDTH - 32,
    maxWidth: 450,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  scrollContent: {
    paddingVertical: 12,
  },
  slide: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  animationContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  lottie: {
    width: 160,
    height: 160,
  },
  fallbackBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  slideTagline: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1ea2b1',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideContent: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#222',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#1ea2b1',
  },
  navActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  nextBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#1ea2b1',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});