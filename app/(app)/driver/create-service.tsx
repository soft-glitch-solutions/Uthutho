import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  School,
  Users,
  Bus,
  Car,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

export default function CreateServiceSelectionScreen() {
  const router = useRouter();

  const serviceTypes = [
    {
      id: 'school',
      title: 'School Transport',
      description: 'Provide transport service for students to/from school',
      icon: School,
      color: '#1ea2b1',
      route: '/driver/create-service/school',
      features: ['Fixed Routes', 'Daily Schedule']
    },
    {
      id: 'carpool',
      title: 'Carpool Club',
      description: 'Create a carpool for regular commutes',
      icon: Users,
      color: '#10B981',
      route: '/driver/create-service/carpool',
      features: ['Shared Rides', 'Cost Splitting']
    },
    {
      id: 'public',
      title: 'Public Transport',
      description: 'List public transport route services',
      icon: Bus,
      color: '#F59E0B',
      route: '/driver/create-service/public',
      features: ['Route Listing', 'Fixed Stops']
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/driver-dashboard');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Uthutho</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.readyText}>SERVICE CREATION</Text>
          <Text style={styles.headingText}>Choose Type</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.infoText}>
          Expand your fleet by offering different transport solutions. Select a service type to continue.
        </Text>

        <View style={styles.listContainer}>
          {serviceTypes.map((service) => {
            const Icon = service.icon;
            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(service.route)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: `${service.color}10` }]}>
                    <Icon size={24} color={service.color} />
                  </View>
                  <View style={styles.titleArea}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  </View>
                  <ChevronRight size={18} color="#222" />
                </View>
                
                <View style={styles.featuresRow}>
                  {service.features.map((feature, i) => (
                    <View key={i} style={styles.featurePill}>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  headerContent: {
    marginTop: 0,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  scrollContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 24,
    marginBottom: 32,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  featurePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#444',
  },
});