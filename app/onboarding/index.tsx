import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Car, Bus, Train, ArrowRight, MapPin, Clock, Users, Bot } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Welcome to Uthutho',
    subtitle: 'South Africa\'s smart public transport companion',
    description: 'Transform your daily commute with real-time updates and smart route planning.',
    icon: MapPin,
    color: '#FF6B6B',
  },
  {
    id: 2,
    title: 'Real-time Updates',
    subtitle: 'Stop Waiting, Start Moving',
    description: 'Get live updates on routes, schedules, and fares for all public transport options.',
    icon: Clock,
    color: '#4ECDC4',
  },
  {
    id: 3,
    title: 'Community Features',
    subtitle: 'Mark yourself as waiting',
    description: 'Help others know about crowding and queue status at transport stops.',
    icon: Users,
    color: '#6B5B95',
  },
  {
    id: 4,
    title: 'Meet Uthutho AI',
    subtitle: 'Your personal transport guide',
    description: 'Get instant answers about routes, schedules, and travel tips tailored to your needs.',
    icon: Bot,
    color: '#109bf8ff',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const checkAppState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
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
    if (currentSlide === slides.length - 1) {
      setIsLoading(true); // Show splash while checking
      checkAppState();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logosplash}>Uthutho</Text>
        <Text style={styles.taglinesplash}>Transform Your Daily Commute</Text>
      </View>
    );
  }

  const CurrentIcon = slides[currentSlide].icon;
  const currentItem = slides[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: colors.text }]}>Uthutho</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentSlide ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.slideContent}>
            <View style={styles.iconContainer}>
              <CurrentIcon size={64} color={currentItem.color} />
            </View>
            <Text style={styles.title}>{currentItem.title}</Text>
            <Text style={styles.subtitle}>{currentItem.subtitle}</Text>
            <Text style={styles.description}>{currentItem.description}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={nextSlide}
          >
            <Text style={styles.buttonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Developed by Soft Glitch Solutions
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000',
    alignItems: 'center',
    padding: 16,
  },
  logosplash: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 16,
  },
  taglinesplash: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#1ea2b1',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
