import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Bus,
  MapPin,
  Navigation,
  DollarSign,
  ChevronDown,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import RNPickerSelect from 'react-native-picker-select';

export default function CreatePublicTransportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    transportType: 'bus',
    routeId: '',
    cost: '',
    startPoint: '',
    endPoint: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setDriverId(driverData?.id);

        const { data: routesData } = await supabase
          .from('routes')
          .select('id, name, start_point, end_point')
          .order('name');
        setRoutes(routesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [user]);

  const transportTypes = [
    { label: 'Bus', value: 'bus' },
    { label: 'Minibus Taxi', value: 'minibus' },
    { label: 'Train', value: 'train' },
    { label: 'Shuttle', value: 'shuttle' },
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.cost) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let finalRouteId = formData.routeId;
      
      if (finalRouteId === 'new') {
        const { data: newRoute, error: routeError } = await supabase
          .from('routes')
          .insert({
            name: formData.name,
            transport_type: formData.transportType,
            cost: parseFloat(formData.cost),
            start_point: formData.startPoint,
            end_point: formData.endPoint,
          })
          .select('id')
          .single();
        if (routeError) throw routeError;
        finalRouteId = newRoute.id;
      }

      const { error } = await supabase
        .from('public_transports')
        .insert({
          driver_id: driverId,
          route_id: finalRouteId,
          transport_type: formData.transportType,
          cost: parseFloat(formData.cost),
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('Success!', 'Service created successfully.', [
        { text: 'OK', onPress: () => router.replace('/driver-dashboard') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const routeOptions = [
    { label: '+ Create New Route', value: 'new' },
    ...(routes.map(route => ({
      label: `${route.name} (${route.start_point} → ${route.end_point})`,
      value: route.id,
    }))),
  ];

  const pickerStyles = {
    inputIOS: styles.pickerInput,
    inputAndroid: styles.pickerInput,
    placeholder: { color: '#444' },
  };

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
                router.replace('/driver/create-service');
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
          <Text style={styles.headingText}>Public Transport</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Service Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SERVICE DETAILS</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <Bus size={18} color="#F59E0B" />
                  <TextInput
                    style={styles.input}
                    placeholder="Service Name (e.g. Route A Express)"
                    placeholderTextColor="#444"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  />
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <Navigation size={18} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <RNPickerSelect
                      placeholder={{ label: 'Select Vehicle Type', value: null }}
                      items={transportTypes}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, transportType: val }))}
                      value={formData.transportType}
                      style={pickerStyles}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Route Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ROUTE SELECTION</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <MapPin size={18} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <RNPickerSelect
                      placeholder={{ label: 'Choose a Route', value: null }}
                      items={routeOptions}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, routeId: val }))}
                      value={formData.routeId}
                      style={pickerStyles}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* New Route Details - Conditional */}
            {formData.routeId === 'new' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>NEW ROUTE DETAILS</Text>
                <View style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <MapPin size={18} color="#F59E0B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Start Point / Station"
                      placeholderTextColor="#444"
                      value={formData.startPoint}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, startPoint: text }))}
                    />
                  </View>
                  <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                    <Navigation size={18} color="#F59E0B" />
                    <TextInput
                      style={styles.input}
                      placeholder="End Point / Destination"
                      placeholderTextColor="#444"
                      value={formData.endPoint}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, endPoint: text }))}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Pricing Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>COST</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <DollarSign size={18} color="#F59E0B" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ticket Price (ZAR)"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={formData.cost}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'CREATING...' : 'PUBLISH SERVICE'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Providing reliable public transport helps build a more connected community.
            </Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#F59E0B',
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
  formContainer: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#444',
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
    gap: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    height: 64,
    paddingRight: 30, // to avoid overlap with icon
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});