import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  const privacyItems = [
    {
      icon: Database,
      title: 'Data Collection',
      description: 'We collect location data, travel preferences, and usage patterns to improve your transport experience.',
      details: [
        'Location data for route planning',
        'Travel history for personalized recommendations',
        'App usage analytics for service improvement',
        'Profile information you provide'
      ]
    },
    {
      icon: Shield,
      title: 'Data Protection',
      description: 'Your data is encrypted and stored securely using industry-standard practices.',
      details: [
        'End-to-end encryption for sensitive data',
        'Secure cloud storage with Supabase',
        'Regular security audits and updates',
        'No data sharing with third parties without consent'
      ]
    },
    {
      icon: Eye,
      title: 'Data Usage',
      description: 'We use your data to provide personalized transport recommendations and improve our services.',
      details: [
        'Route optimization based on your preferences',
        'Real-time updates for your frequent routes',
        'Community features like waiting status',
        'AI-powered transport recommendations'
      ]
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      description: 'You have full control over your personal data and privacy settings.',
      details: [
        'Access and download your data anytime',
        'Delete your account and all associated data',
        'Opt-out of data collection features',
        'Update privacy preferences'
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.introSection}>
          <Shield size={48} color="#1ea2b1" />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            At Uthutho, we're committed to protecting your privacy and ensuring your data is secure. 
            Here's how we handle your information.
          </Text>
        </View>

        {privacyItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <View key={index} style={styles.privacyCard}>
              <View style={styles.cardHeader}>
                <IconComponent size={24} color="#1ea2b1" />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={styles.detailsList}>
                {item.details.map((detail, detailIndex) => (
                  <View key={detailIndex} style={styles.detailItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.contactSection}>
          <AlertTriangle size={24} color="#fbbf24" />
          <Text style={styles.contactTitle}>Questions or Concerns?</Text>
          <Text style={styles.contactText}>
            If you have any questions about our privacy practices or want to exercise your data rights, 
            contact us at privacy@uthutho.co.za
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: January 2025</Text>
          <Text style={styles.footerText}>Developed by Soft Glitch Solutions</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  privacyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsList: {
    marginLeft: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1ea2b1',
    marginTop: 8,
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#cccccc',
    flex: 1,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#fbbf2450',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
    marginTop: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
});