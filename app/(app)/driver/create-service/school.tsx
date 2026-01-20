// app/(app)/driver/create-service/school.tsx
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
  Car,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Plus,
  Minus,
  School,
  FileText,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateSchoolServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolArea: '',
    pickupAreas: [''],
    pickupTimes: [new Date()],
    capacity: '10',
    pricePerMonth: '',
    pricePerWeek: '',
    vehicleType: 'Sedan',
    vehicleInfo: '',
    features: ['Safe Driver', 'GPS Tracking'],
    description: '',
  });
  
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);

  useEffect(() => {
    const fetchDriverId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        setDriverId(data.id);
      } catch (error) {
        console.error('Error fetching driver ID:', error);
        Alert.alert('Error', 'Failed to load driver information');
        router.back();
      }
    };

    fetchDriverId();
  }, [user]);

  const handleAddPickupArea = () => {
    setFormData(prev => ({
      ...prev,
      pickupAreas: [...prev.pickupAreas, '']
    }));
  };

  const handleRemovePickupArea = (index: number) => {
    if (formData.pickupAreas.length > 1) {
      setFormData(prev => ({
        ...prev,
        pickupAreas: prev.pickupAreas.filter((_, i) => i !== index)
      }));
    }
  };

  const handlePickupAreaChange = (index: number, value: string) => {
    const newPickupAreas = [...formData.pickupAreas];
    newPickupAreas[index] = value;
    setFormData(prev => ({ ...prev, pickupAreas: newPickupAreas }));
  };

  const handleAddPickupTime = () => {
    setFormData(prev => ({
      ...prev,
      pickupTimes: [...prev.pickupTimes, new Date()]
    }));
  };

  const handleRemovePickupTime = (index: number) => {
    if (formData.pickupTimes.length > 1) {
      setFormData(prev => ({
        ...prev,
        pickupTimes: prev.pickupTimes.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTimeChange = (index: number, event: any, selectedTime?: Date) => {
    setShowTimePicker(null);
    if (selectedTime) {
      const newPickupTimes = [...formData.pickupTimes];
      newPickupTimes[index] = selectedTime;
      setFormData(prev => ({ ...prev, pickupTimes: newPickupTimes }));
    }
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    if (formData.features.length > 0) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.schoolName.trim()) {
      Alert.alert('Error', 'Please enter school name');
      return;
    }
    
    if (!formData.schoolArea.trim()) {
      Alert.alert('Error', 'Please enter school area');
      return;
    }
    
    if (formData.pickupAreas.some(area => !area.trim())) {
      Alert.alert('Error', 'Please fill all pickup areas');
      return;
    }
    
    if (!formData.pricePerMonth) {
      Alert.alert('Error', 'Please enter monthly price');
      return;
    }
    
    if (!driverId) {
      Alert.alert('Error', 'Driver information not found');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('school_transports')
        .insert({
          driver_id: driverId,
          school_name: formData.schoolName,
          school_area: formData.schoolArea,
          pickup_areas: formData.pickupAreas.filter(area => area.trim()),
          pickup_times: formData.pickupTimes.map(time => formatTime(time)),
          capacity: parseInt(formData.capacity),
          current_riders: 0,
          price_per_month: parseFloat(formData.pricePerMonth),
          price_per_week: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : null,
          vehicle_type: formData.vehicleType,
          vehicle_info: formData.vehicleInfo,
          features: formData.features.filter(feature => feature.trim()),
          description: formData.description,
          is_active: true,
          is_verified: false,
        });

      if (error) throw error;

      Alert.alert(
        'Success!',
        'School transport service created successfully. It will be reviewed for verification.',
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

  const vehicleTypes = ['Sedan', 'SUV', 'Minivan', 'Bus', 'Taxi', 'Other'];

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
          <Text style={styles.title}>School Transport Service</Text>
          <Text style={styles.subtitle}>Create a new school transport route</Text>
        </View>

        <View style={styles.formContainer}>
          {/* School Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <School size={16} color="#1ea2b1" /> School Information
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="School Name *"
                placeholderTextColor="#666666"
                value={formData.schoolName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, schoolName: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="School Area/Suburb *"
                placeholderTextColor="#666666"
                value={formData.schoolArea}
                onChangeText={(text) => setFormData(prev => ({ ...prev, schoolArea: text }))}
              />
            </View>
          </View>

          {/* Pickup Areas */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <MapPin size={16} color="#1ea2b1" /> Pickup Areas
            </Text>
            
            {formData.pickupAreas.map((area, index) => (
              <View key={index} style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={`Pickup area ${index + 1} *`}
                  placeholderTextColor="#666666"
                  value={area}
                  onChangeText={(text) => handlePickupAreaChange(index, text)}
                />
                {formData.pickupAreas.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemovePickupArea(index)}
                  >
                    <Minus size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddPickupArea}
            >
              <Plus size={20} color="#1ea2b1" />
              <Text style={styles.addButtonText}>Add Pickup Area</Text>
            </TouchableOpacity>
          </View>

          {/* Pickup Times */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Clock size={16} color="#1ea2b1" /> Pickup Times
            </Text>
            
            {formData.pickupTimes.map((time, index) => (
              <View key={index} style={styles.arrayInputContainer}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(index)}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
                
                {formData.pickupTimes.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemovePickupTime(index)}
                  >
                    <Minus size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {showTimePicker !== null && (
              <DateTimePicker
                value={formData.pickupTimes[showTimePicker]}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => handleTimeChange(showTimePicker, event, selectedTime)}
              />
            )}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddPickupTime}
            >
              <Plus size={20} color="#1ea2b1" />
              <Text style={styles.addButtonText}>Add Pickup Time</Text>
            </TouchableOpacity>
          </View>

          {/* Capacity & Pricing */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Users size={16} color="#1ea2b1" /> Capacity & Pricing
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Capacity (students) *"
                placeholderTextColor="#666666"
                value={formData.capacity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, capacity: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Price per Month (ZAR) *"
                placeholderTextColor="#666666"
                value={formData.pricePerMonth}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerMonth: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Price per Week (ZAR) - Optional"
                placeholderTextColor="#666666"
                value={formData.pricePerWeek}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerWeek: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Car size={16} color="#1ea2b1" /> Vehicle Information
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.vehicleTypeGrid}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleTypeButton,
                      formData.vehicleType === type && styles.vehicleTypeButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, vehicleType: type }))}
                  >
                    <Text style={[
                      styles.vehicleTypeText,
                      formData.vehicleType === type && styles.vehicleTypeTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vehicle Info (model, year, color, registration) - Optional"
                placeholderTextColor="#666666"
                value={formData.vehicleInfo}
                onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleInfo: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Features */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <CheckCircle size={16} color="#1ea2b1" /> Features
            </Text>
            
            {formData.features.map((feature, index) => (
              <View key={index} style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={`Feature ${index + 1}`}
                  placeholderTextColor="#666666"
                  value={feature}
                  onChangeText={(text) => handleFeatureChange(index, text)}
                />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveFeature(index)}
                >
                  <Minus size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddFeature}
            >
              <Plus size={20} color="#1ea2b1" />
              <Text style={styles.addButtonText}>Add Feature</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <FileText size={16} color="#1ea2b1" /> Description
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your service, safety measures, special requirements, etc. - Optional"
                placeholderTextColor="#666666"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create School Transport Service'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields
            {'\n\n'}
            Your service will be reviewed for verification before being listed publicly.
            {'\n\n'}
            By creating this service, you agree to provide safe and reliable transportation for students.
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
    color: '#1ea2b1',
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
  arrayInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
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
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
    gap: 8,
  },
  addButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  timeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
  },
  vehicleTypeButtonSelected: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  vehicleTypeText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleTypeTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#1ea2b180',
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