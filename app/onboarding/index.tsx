import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext'; // Adjust the path
import { useRouter } from 'expo-router'; // For navigation
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Updated icon library

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Uthutho',
    description: 'For commuters, by commuters',
    icon: 'car', // Using MaterialCommunityIcons
    color: '#FF6B6B', // Custom color for taxi
  },
  {
    id: '2',
    title: 'Plan Your Journey',
    description: 'Find the best routes and transport options',
    icon: 'bus', // Using MaterialCommunityIcons
    color: '#4ECDC4', // Custom color for bus
  },
  {
    id: '3',
    title: 'Stay Connected',
    description: 'Get real-time updates and travel insights',
    icon: 'train', // Using MaterialCommunityIcons
    color: '#6B5B95', // Custom color for train
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter(); // For navigation
  const { colors } = useTheme(); // For theme colors

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      router.replace('/auth'); // Navigate to auth screen
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo and App Name */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')} // Adjust the path to your logo
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: colors.text }]}>Uthutho</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>
            For commuters, by commuters
          </Text>
        </View>

        {/* Onboarding Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Pagination Dots */}
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

          {/* Slide Content */}
          <View style={styles.slideContent}>
            <View style={styles.iconContainer}>
              <Icon
                name={slides[currentSlide].icon}
                size={64}
                color={slides[currentSlide].color}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {slides[currentSlide].title}
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {slides[currentSlide].description}
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={nextSlide}>
            <Text style={styles.buttonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
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
    alignItems: 'center',
    padding: 16,
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
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
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