// app/(app)/driver/create-service/public.tsx
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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bus,
  MapPin,
  DollarSign,
  Navigation,
  Building,
  FileText,
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
  const [hubs, setHubs] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    transportType: 'bus',
    routeId: '',
    hubId: '',
    cost: '',
    startPoint: '',
    endPoint: '',
    instructions: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch driver ID
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (driverError) throw driverError;
        setDriverId(driverData.id);

        // Fetch available routes
        const { data: routesData, error: routesError } = await supabase
          .from('routes')
          .select('id, name, transport_type, start_point, end_point')
          .order('name');

        if (routesError) throw routesError;
        setRoutes(routesData || []);

        // Fetch hubs
        const { data: hubsData, error: hubsError } = await supabase
          .from('hubs')
          .select('id, name, location')
          .order('name');

        if (hubsError) throw hubsError;
        setHubs(hubsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load required information');
        router.back();
      }
    };

    fetchData();
  }, [user]);

  const transportTypes = [
    { label: 'Bus', value: 'bus' },
    { label: 'Minibus Taxi', value: 'minibus' },
    { label: 'Train', value: 'train' },
    { label: 'Shuttle', value: 'shuttle' },
    { label: 'Taxi', value: 'taxi' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter service name');
      return;
    }
    
    if (!formData.transportType) {
      Alert.alert('Error', 'Please select transport type');
      return;
    }
    
    if (!formData.routeId) {
      Alert.alert('Error', 'Please select a route');
      return;
    }
    
    if (!formData.cost) {
      Alert.alert('Error', 'Please enter cost');
      return;
    }
    
    if (!formData.startPoint.trim()) {
      Alert.alert('Error', 'Please enter start point');
      return;
    }
    
    if (!formData.endPoint.trim()) {
      Alert.alert('Error', 'Please enter end point');
      return;
    }
    
    if (!driverId) {
      Alert.alert('Error', 'Driver information not found');
      return;
    }

    setLoading(true);

    try {
      // First, create or get the route
      let routeId = formData.routeId;
      
      if (routeId === 'new') {
        // Create new route
        const { data: newRoute, error: routeError } = await supabase
          .from('routes')
          .insert({
            name: formData.name,
            transport_type: formData.transportType,
            cost: parseFloat(formData.cost),
            start_point: formData.startPoint,
            end_point: formData.endPoint,
            hub_id: formData.hubId || null,
            instructions: formData.instructions || null,
          })
          .select('id')
          .single();

        if (routeError) throw routeError;
        routeId = newRoute.id;
      }

      // Create public transport service
      const { error } = await supabase
        .from('public_transports')
        .insert({
          driver_id: driverId,
          route_id: routeId,
          transport_type: formData.transportType,
          cost: parseFloat(formData.cost),
          current_passengers: 0,
          max_capacity: 50, // Default for public transport
          is_active: true,
          is_verified: false,
        });

      if (error) throw error;

      Alert.alert(
        'Success!',
        'Public transport service created successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/driver/dashboard')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creating service:', error);
      Alert.alert('Error', error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const pickerSelectStyles = {
    inputIOS: {
      backgroundColor: '#111111',
      color: '#FFFFFF',
      fontSize: 16,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#333333',
      minHeight: 50,
    },
    inputAndroid: {
      backgroundColor: '#111111',
      color: '#FFFFFF',
      fontSize: 16,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#333333',
      minHeight: 50,
    },
    placeholder: {
      color: '#666666',
    },
  };

  const routeOptions = [
    { label: 'Create New Route', value: 'new' },
    ...(routes.map(route => ({
      label: `${route.name} (${route.start_point} → ${route.end_point})`,
      value: route.id,
    }))),
  ];

  const hubOptions = [
    { label: 'No Hub/Station', value: '' },
    ...(hubs.map(hub => ({
      label: `${hub.name} - ${hub.location}`,
      value: hub.id,
    }))),
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Public Transport Service</Text>
          <Text style={styles.subtitle}>Create a new public transport route</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Service Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Bus size={16} color="#F59E0B" /> Service Information
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Service Name *"
                placeholderTextColor="#666666"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Transport Type *</Text>
              <View style={styles.typeGrid}>
                {transportTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.transportType === type.value && styles.typeButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, transportType: type.value }))}
                  >
                    <Text style={[
                      styles.typeText,
                      formData.transportType === type.value && styles.typeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Route Selection */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Navigation size={16} color="#F59E0B" /> Route
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Route *</Text>
              <RNPickerSelect
                placeholder={{ label: 'Select a route or create new...', value: '' }}
                items={routeOptions}
                onValueChange={(value) => setFormData(prev => ({ ...prev, routeId: value }))}
                value={formData.routeId}
                style={pickerSelectStyles}
                Icon={() => <ChevronDown size={20} color="#888888" />}
              />
            </View>
          </View>

          {/* Route Details (show when creating new route or for reference) */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <MapPin size={16} color="#F59E0B" /> Route Details
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Start Point (Station/Stop) *"
                placeholderTextColor="#666666"
                value={formData.startPoint}
                onChangeText={(text) => setFormData(prev => ({ ...prev, startPoint: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="End Point (Station/Stop) *"
                placeholderTextColor="#666666"
                value={formData.endPoint}
                onChangeText={(text) => setFormData(prev => ({ ...prev, endPoint: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Cost (ZAR) *"
                placeholderTextColor="#666666"
                value={formData.cost}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Associated Hub/Station (Optional)</Text>
              <RNPickerSelect
                placeholder={{ label: 'Select a hub...', value: '' }}
                items={hubOptions}
                onValueChange={(value) => setFormData(prev => ({ ...prev, hubId: value }))}
                value={formData.hubId}
                style={pickerSelectStyles}
                Icon={() => <ChevronDown size={20} color="#888888" />}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special Instructions (optional)"
                placeholderTextColor="#666666"
                value={formData.instructions}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helperText}>
                Operating hours, special schedules, accessibility info, etc.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Public Transport Service'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields
            {'\n\n'}
            Your service will be listed on public transport routes.
            {'\n\n'}
            Ensure all information is accurate for passengers.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
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
    color: '#F59E0B',
  },
  formContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  helperText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
  },
  typeButtonSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  typeText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  typeTextSelected: {
    color: '#000000',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#F59E0B80',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});