import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bus, Users, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ServicesSectionProps {
  colors: any;
  router: any;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ colors, router }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: '#FFF' }]}>
        Services
      </Text>

      <View style={styles.servicesGrid}>
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => router.push('/school-transport')}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require('../../assets/images/school.jpg')}
            style={styles.cardImage}
            imageStyle={styles.imageStyle}
          >
            {/* Teal Overlay */}
            <View style={[styles.overlay, { backgroundColor: 'rgba(0, 66, 73, 0.76)' }]} />

            <View style={styles.cardContent}>
              <Text style={styles.serviceTitle}>School{"\n"}Transport</Text>

              <View style={styles.iconWrapper}>
                <Bus size={32} color="#FFFFFF" strokeWidth={1.5} />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => router.push('/carpool')}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require('../../assets/images/carpool.jpg')}
            style={styles.cardImage}
            imageStyle={styles.imageStyle}
          >
            {/* Teal Overlay */}
            <View style={[styles.overlay, { backgroundColor: 'rgba(0, 66, 73, 0.76)' }]} />

            <View style={styles.cardContent}>
              <Text style={styles.serviceTitle}>Carpool</Text>

              <View style={styles.iconWrapper}>
                <Users size={32} color="#FFFFFF" strokeWidth={1.5} />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -1,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  serviceTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  iconWrapper: {
    alignSelf: 'flex-end',
    opacity: 0.9,
  },
});

export default ServicesSection;
