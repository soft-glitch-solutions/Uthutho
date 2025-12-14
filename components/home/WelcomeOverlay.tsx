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
} from 'react-native';
import {
  Compass,
  Users,
  MapPin,
  Route,
  Trophy,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';

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
    icon: Compass,
    color: '#1ea2b1',
    content:
      'Uthutho is built around people who travel every day. It helps you feel connected, informed, and part of something shared.',
  },
  {
    id: 2,
    title: 'A social transport app',
    subtitle: 'Built around real journeys',
    icon: Users,
    color: '#4ade80',
    content:
      'Uthutho is a social transport app. You join communities through the stops, hubs, and routes you actually use.',
  },
  {
    id: 3,
    title: 'Join stops & hubs',
    subtitle: 'Your travel communities',
    icon: MapPin,
    color: '#fbbf24',
    content:
      'Every stop and hub is its own community. Save the ones you use and see who else travels through them.',
  },
  {
    id: 4,
    title: 'Join a journey',
    subtitle: 'Travel together, stay informed',
    icon: Route,
    color: '#60a5fa',
    content:
      'When you’re traveling a route, you join a journey. Other commuters on the same route can see activity and help keep everyone informed about when transport is coming.',
  },
  {
    id: 5,
    title: 'Earn points by traveling',
    subtitle: 'Your journey matters',
    icon: Trophy,
    color: '#ff6b35',
    content:
      'Every journey earns you points. Travel more, contribute more, and unlock levels and titles that reflect how you move.',
  },
];

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
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
    const Icon = slide.icon;

    return (
      <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${slide.color}20` },
          ]}
        >
          <Icon size={34} color={slide.color} />
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
              <Compass size={20} color="#1ea2b1" />
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
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
