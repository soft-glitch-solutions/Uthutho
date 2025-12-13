import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  UserCheck, 
  TriangleAlert as AlertTriangle,
  FileText,
  CheckCircle,
  Globe,
  Server,
  Key,
  Users
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

// Desktop Layout Component
const DesktopPrivacyScreen = ({ router }) => {
  const privacySections = [
    {
      title: 'Data Protection',
      icon: Shield,
      color: '#1ea2b1',
      items: [
        {
          icon: Lock,
          title: 'End-to-End Encryption',
          description: 'All sensitive data is encrypted both in transit and at rest.'
        },
        {
          icon: Key,
          title: 'Secure Authentication',
          description: 'Multi-factor authentication and secure password hashing.'
        },
        {
          icon: Server,
          title: 'Secure Infrastructure',
          description: 'Hosted on trusted cloud platforms with regular security audits.'
        }
      ]
    },
    {
      title: 'Data Usage',
      icon: Database,
      color: '#10B981',
      items: [
        {
          icon: Eye,
          title: 'Service Improvement',
          description: 'We analyze usage patterns to enhance your experience.'
        },
        {
          icon: Users,
          title: 'Community Features',
          description: 'Data powers community features like waiting status and popularity rankings.'
        },
        {
          icon: Globe,
          title: 'Personalization',
          description: 'Your data helps us provide relevant transport recommendations.'
        }
      ]
    },
    {
      title: 'Your Rights',
      icon: UserCheck,
      color: '#F59E0B',
      items: [
        {
          icon: FileText,
          title: 'Data Access',
          description: 'Download your complete data anytime from your profile settings.'
        },
        {
          icon: CheckCircle,
          title: 'Control & Consent',
          description: 'Opt-in/out of specific data collection features.'
        },
        {
          icon: Shield,
          title: 'Account Deletion',
          description: 'Permanently delete your account and all associated data.'
        }
      ]
    }
  ];

  const faqItems = [
    {
      question: 'What data do you collect?',
      answer: 'We collect location data for route planning, travel history for personalization, and basic profile information.'
    },
    {
      question: 'Is my location data shared?',
      answer: 'No. Location data is only used for your route planning and is never shared with third parties.'
    },
    {
      question: 'How can I delete my data?',
      answer: 'Go to Profile Settings → Privacy → Delete Account to permanently remove all your data.'
    },
    {
      question: 'How often do you update security?',
      answer: 'We conduct security audits quarterly and implement updates immediately when needed.'
    }
  ];

  return (
    <ScrollView style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.desktopHeaderTitle}>
          <Shield size={32} color="#1ea2b1" />
          <Text style={styles.desktopHeaderTitleText}>Privacy & Security</Text>
        </View>
        <View style={styles.desktopHeaderRight} />
      </View>

      {/* Desktop Hero Section */}
      <View style={styles.desktopHero}>
        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <Shield size={64} color="#1ea2b1" />
          </View>
          <Text style={styles.heroTitle}>Your Privacy, Our Priority</Text>
          <Text style={styles.heroDescription}>
            At Uthutho, we believe in transparent data practices and robust security measures. 
            Your trust is essential to building a better transport community.
          </Text>
        </View>
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Privacy Overview */}
        <View style={styles.leftColumn}>
          <View style={styles.desktopOverviewCard}>
            <Text style={styles.overviewTitle}>Our Commitment</Text>
            <View style={styles.commitmentList}>
              <View style={styles.commitmentItem}>
                <View style={[styles.commitmentIcon, { backgroundColor: '#1ea2b115' }]}>
                  <Lock size={20} color="#1ea2b1" />
                </View>
                <Text style={styles.commitmentText}>Zero data sharing with advertisers</Text>
              </View>
              <View style={styles.commitmentItem}>
                <View style={[styles.commitmentIcon, { backgroundColor: '#10B98115' }]}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.commitmentText}>Full GDPR compliance</Text>
              </View>
              <View style={styles.commitmentItem}>
                <View style={[styles.commitmentIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Eye size={20} color="#F59E0B" />
                </View>
                <Text style={styles.commitmentText}>Transparent data practices</Text>
              </View>
              <View style={styles.commitmentItem}>
                <View style={[styles.commitmentIcon, { backgroundColor: '#DC262615' }]}>
                  <Server size={20} color="#DC2626" />
                </View>
                <Text style={styles.commitmentText}>Enterprise-grade security</Text>
              </View>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.desktopFaqCard}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {faqItems.map((item, index) => (
                <View key={index} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Right Column - Detailed Privacy Sections */}
        <ScrollView style={styles.rightColumn} showsVerticalScrollIndicator={true}>
          {privacySections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <View key={index} style={styles.desktopSectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: `${section.color}15` }]}>
                    <IconComponent size={24} color={section.color} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: section.color }]}>
                    {section.title}
                  </Text>
                </View>
                
                <View style={styles.sectionItems}>
                  {section.items.map((item, itemIndex) => {
                    const ItemIcon = item.icon;
                    return (
                      <View key={itemIndex} style={styles.sectionItem}>
                        <View style={[styles.itemIcon, { backgroundColor: `${section.color}10` }]}>
                          <ItemIcon size={20} color={section.color} />
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemDescription}>{item.description}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Contact Section */}
          <View style={styles.desktopContactCard}>
            <View style={styles.contactHeader}>
              <AlertTriangle size={28} color="#F59E0B" />
              <Text style={styles.contactTitle}>Need Assistance?</Text>
            </View>
            <Text style={styles.contactDescription}>
              Our privacy team is here to help with any questions about your data rights or privacy concerns.
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactEmail}>privacy@uthutho.co.za</Text>
              <Text style={styles.contactHours}>Response time: 24-48 hours</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.desktopFooter}>
            <Text style={styles.footerNote}>
              Developed by Soft Glitch Solutions • Last updated: January 2025
            </Text>
            <Text style={styles.footerLegal}>
              Uthutho complies with all applicable privacy laws including GDPR, POPIA, and CCPA.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

// Mobile Layout Component
const MobilePrivacyScreen = ({ router }) => {
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
};

export default function PrivacyScreen() {
  const router = useRouter();

  if (isDesktop) {
    return <DesktopPrivacyScreen router={router} />;
  }

  return <MobilePrivacyScreen router={router} />;
}

const styles = StyleSheet.create({
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopHeaderTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopHeaderRight: {
    width: 100,
  },
  
  // Desktop Hero Section
  desktopHero: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 40,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 28,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  leftColumn: {
    width: '40%',
    minWidth: 0,
  },
  rightColumn: {
    width: '60%',
    minWidth: 0,
    flex: 1,
  },
  
  // Desktop Overview Card
  desktopOverviewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  commitmentList: {
    gap: 16,
  },
  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commitmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commitmentText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  
  // Desktop FAQ Card
  desktopFaqCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  faqList: {
    gap: 20,
  },
  faqItem: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 22,
  },
  
  // Desktop Section Cards
  desktopSectionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionItems: {
    gap: 20,
  },
  sectionItem: {
    flexDirection: 'row',
    gap: 16,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 22,
  },
  
  // Desktop Contact Card
  desktopContactCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  contactDescription: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  contactInfo: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  contactHours: {
    fontSize: 14,
    color: '#cccccc',
  },
  
  // Desktop Footer
  desktopFooter: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  footerNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLegal: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Mobile Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
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