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
          <ImageBackground
            source={require('../../assets/images/school.jpg')}
            style={styles.cardImage}
            imageStyle={styles.imageStyle}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#1ea2b1' }]}>
                  <Bus size={16} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.serviceTitle}>School Transport</Text>
                <View style={styles.arrowContainer}>
                  <ChevronRight size={14} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
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
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                  <Users size={16} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.serviceTitle}>Carpool</Text>
                <View style={styles.arrowContainer}>
                  <ChevronRight size={14} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
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
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1D1E',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 4,
  },
  arrowContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServicesSection;
