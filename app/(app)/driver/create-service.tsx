// app/(app)/driver/create-service/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  School,
  Users,
  Bus,
  Car,
  MapPin,
  Clock,
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
    },
    {
      id: 'carpool',
      title: 'Carpool Club',
      description: 'Create a carpool for regular commutes',
      icon: Users,
      color: '#10B981',
      route: '/driver/create-service/carpool',
    },
    {
      id: 'public',
      title: 'Public Transport',
      description: 'List public transport route services',
      icon: Bus,
      color: '#F59E0B',
      route: '/driver/create-service/public',
    },
  ];

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Service</Text>
        <Text style={styles.subtitle}>Choose service type</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.infoText}>
          Select the type of service you want to create. Each service type has different requirements and features.
        </Text>

        <View style={styles.serviceTypesContainer}>
          {serviceTypes.map((service) => {
            const Icon = service.icon;
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { borderColor: service.color }]}
                onPress={() => router.push(service.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${service.color}20` }]}>
                  <Icon size={32} color={service.color} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <View style={styles.serviceFeatures}>
                  {service.id === 'school' && (
                    <>
                      <View style={styles.featureItem}>
                        <MapPin size={14} color="#888888" />
                        <Text style={styles.featureText}>School Routes</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Clock size={14} color="#888888" />
                        <Text style={styles.featureText}>Daily Schedule</Text>
                      </View>
                    </>
                  )}
                  {service.id === 'carpool' && (
                    <>
                      <View style={styles.featureItem}>
                        <Users size={14} color="#888888" />
                        <Text style={styles.featureText}>Shared Rides</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Car size={14} color="#888888" />
                        <Text style={styles.featureText}>Personal Vehicle</Text>
                      </View>
                    </>
                  )}
                  {service.id === 'public' && (
                    <>
                      <View style={styles.featureItem}>
                        <Bus size={14} color="#888888" />
                        <Text style={styles.featureText}>Fixed Routes</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MapPin size={14} color="#888888" />
                        <Text style={styles.featureText}>Stations/Stops</Text>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#111111',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1ea2b1',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  serviceTypesContainer: {
    gap: 20,
  },
  serviceCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
    lineHeight: 20,
  },
  serviceFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#888888',
  },
});