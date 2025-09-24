import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hook/useAuth';
import { 
  ArrowLeft, 
  Car, 
  Share2,
  User
} from 'lucide-react-native';

export default function OnboardDriverScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const shareMessage = `Join Uthutho - The transport app that helps drivers earn more!

• See passenger demand in real-time
• Digital payments = safer & faster  
• Connect with other drivers

Sign up: https://uthutho.app/driver-signup`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: 'Join Uthutho as a Driver'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleDriverSignup = () => {
    if (user) {
      router.push('/driver-signup');
    } else {
      router.push('/login?redirect=/driver-signup');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Drive with Uthutho
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Content */}
        <View style={styles.mainSection}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
            <Car size={48} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Start Driving with Uthutho
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join our community of drivers and grow your business with smart tools and real-time passenger demand.
          </Text>

          {/* Simple Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>2,500+</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Drivers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>30%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>More Earnings</Text>
            </View>
          </View>
        </View>

        {/* Simple Benefits */}
        <View style={styles.benefits}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>Why drive with us?</Text>
          
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitText, { color: colors.text }]}>• Increase your earnings</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitText, { color: colors.text }]}>• Smart route optimization</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitText, { color: colors.text }]}>• Safe digital payments</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={[styles.benefitText, { color: colors.text }]}>• 24/7 driver support</Text>
          </View>
        </View>

        {/* Main CTA */}
        <TouchableOpacity 
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={handleDriverSignup}
        >
          <Text style={styles.ctaText}>
            {user ? 'Become a Driver' : 'Sign Up to Drive'}
          </Text>
        </TouchableOpacity>

        {/* Share Option */}
        <TouchableOpacity 
          style={[styles.shareButton, { borderColor: colors.border }]}
          onPress={handleShare}
        >
          <Share2 size={20} color={colors.text} />
          <Text style={[styles.shareText, { color: colors.text }]}>
            Share with other drivers
          </Text>
        </TouchableOpacity>

        {/* Existing Driver */}
        {user && (
          <TouchableOpacity 
            style={styles.existingDriver}
            onPress={() => router.push('/driver-dashboard')}
          >
            <User size={20} color={colors.primary} />
            <Text style={[styles.existingDriverText, { color: colors.primary }]}>
              Already a driver? Go to dashboard
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 16,
    lineHeight: 24,
  },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: user ? 16 : 0,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '500',
  },
  existingDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  existingDriverText: {
    fontSize: 16,
    fontWeight: '500',
  },
});