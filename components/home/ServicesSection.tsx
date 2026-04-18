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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Services
      </Text>

      <View style={styles.servicesGrid}>
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => router.push('/school-transport')}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <ImageBackground
              source={require('../../assets/images/school.jpg')}
              style={styles.cardImage}
              imageStyle={styles.imageStyle}
            />
          </View>
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#1ea2b1' }]}>
                <Bus size={14} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.serviceTitle}>School Transport</Text>
              <View style={styles.arrowContainer}>
                <ChevronRight size={12} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => router.push('/carpool')}
          activeOpacity={0.9}
        >
          <View style={styles.imageContainer}>
            <ImageBackground
              source={require('../../assets/images/carpool.jpg')}
              style={styles.cardImage}
              imageStyle={styles.imageStyle}
            />
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                <Users size={14} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.serviceTitle}>Carpool</Text>
              <View style={styles.arrowContainer}>
                <ChevronRight size={12} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    height: 200, // Slightly taller for portrait illustrations
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F7F8', // Lighter background for seamless contain
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'contain',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Gradient only at the bottom half
    justifyContent: 'space-between',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  arrowContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServicesSection;
