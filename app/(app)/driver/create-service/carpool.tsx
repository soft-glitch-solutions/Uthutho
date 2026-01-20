// app/(app)/driver/create-service/carpool.tsx
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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Navigation,
  FileText,
  Plus,
  Minus,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateCarpoolServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fromLocation: '',
    toLocation: '',
    pickupTime: new Date(),
    returnTime: null as Date | null,
    daysOfWeek: [] as string[],
    maxMembers: '4',
    pricePerTrip: '',
    priceRange: '',
    vehicleInfo: '',
    rules: '',
  });
  
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  const [includeReturnTime, setIncludeReturnTime] = useState(false);

  const daysOfWeek = [
    { id: 'Mon', label: 'Monday' },
    { id: 'Tue', label: 'Tuesday' },
    { id: 'Wed', label: 'Wednesday' },
    { id: 'Thu', label: 'Thursday' },
    { id: 'Fri', label: 'Friday' },
    { id: 'Sat', label: 'Saturday' },
    { id: 'Sun', label: 'Sunday' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDayToggle = (dayId: string) => {
    setFormData(prev => {
      const newDays = prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(d => d !== dayId)
        : [...prev.daysOfWeek, dayId];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter carpool name');
      return;
    }
    
    if (!formData.fromLocation.trim()) {
      Alert.alert('Error', 'Please enter pickup location');
      return;
    }
    
    if (!formData.toLocation.trim()) {
      Alert.alert('Error', 'Please enter destination');
      return;
    }
    
    if (formData.daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day of operation');
      return;
    }
    
    if (!formData.pricePerTrip && !formData.priceRange) {
      Alert.alert('Error', 'Please enter either price per trip or price range');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to create a carpool');
      return;
    }

    setLoading(true);

    try {
      // Get user profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('carpool_clubs')
        .insert({
          name: formData.name,
          description: formData.description || null,
          creator_id: profileData.id,
          from_location: formData.fromLocation,
          to_location: formData.toLocation,
          pickup_time: formData.pickupTime.toTimeString().split(' ')[0], // HH:MM:SS format
          return_time: includeReturnTime && formData.returnTime 
            ? formData.returnTime.toTimeString().split(' ')[0]
            : null,
          days_of_week: formData.daysOfWeek,
          max_members: parseInt(formData.maxMembers),
          current_members: 1, // Creator is first member
          price_per_trip: formData.pricePerTrip ? parseFloat(formData.pricePerTrip) : null,
          price_range: formData.priceRange || null,
          vehicle_info: formData.vehicleInfo || null,
          rules: formData.rules || null,
          is_active: true,
          is_full: false,
        });

      if (error) throw error;

      Alert.alert(
        'Success!',
        'Carpool club created successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/driver/dashboard')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creating carpool:', error);
      Alert.alert('Error', error.message || 'Failed to create carpool');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

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
          <Text style={styles.title}>Create Carpool Club</Text>
          <Text style={styles.subtitle}>Start a new carpool for commuters</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Users size={16} color="#10B981" /> Basic Information
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Carpool Name *"
                placeholderTextColor="#666666"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#666666"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Route Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Navigation size={16} color="#10B981" /> Route Information
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Pickup Location *"
                placeholderTextColor="#666666"
                value={formData.fromLocation}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fromLocation: text }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Destination *"
                placeholderTextColor="#666666"
                value={formData.toLocation}
                onChangeText={(text) => setFormData(prev => ({ ...prev, toLocation: text }))}
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Clock size={16} color="#10B981" /> Schedule
            </Text>
            
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowPickupTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  Pickup Time: {formatTime(formData.pickupTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Include Return Time</Text>
                <Switch
                  value={includeReturnTime}
                  onValueChange={setIncludeReturnTime}
                  trackColor={{ false: '#333333', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {includeReturnTime && (
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowReturnTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {formData.returnTime 
                      ? `Return Time: ${formatTime(formData.returnTime)}`
                      : 'Select Return Time'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Days of Operation *</Text>
              <View style={styles.daysGrid}>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      formData.daysOfWeek.includes(day.id) && styles.dayButtonSelected
                    ]}
                    onPress={() => handleDayToggle(day.id)}
                  >
                    <Text style={[
                      styles.dayText,
                      formData.daysOfWeek.includes(day.id) && styles.dayTextSelected
                    ]}>
                      {day.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Time Pickers */}
          {showPickupTimePicker && (
            <DateTimePicker
              value={formData.pickupTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(event, selectedTime) => {
                setShowPickupTimePicker(false);
                if (selectedTime) {
                  setFormData(prev => ({ ...prev, pickupTime: selectedTime }));
                }
              }}
            />
          )}

          {showReturnTimePicker && includeReturnTime && (
            <DateTimePicker
              value={formData.returnTime || new Date()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(event, selectedTime) => {
                setShowReturnTimePicker(false);
                if (selectedTime) {
                  setFormData(prev => ({ ...prev, returnTime: selectedTime }));
                }
              }}
            />
          )}

          {/* Members & Pricing */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <DollarSign size={16} color="#10B981" /> Members & Pricing
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Max Members (including you) *"
                placeholderTextColor="#666666"
                value={formData.maxMembers}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maxMembers: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Price per Trip (ZAR) - Optional"
                placeholderTextColor="#666666"
                value={formData.pricePerTrip}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerTrip: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Price Range (e.g., $5-$10) - Optional"
                placeholderTextColor="#666666"
                value={formData.priceRange}
                onChangeText={(text) => setFormData(prev => ({ ...prev, priceRange: text }))}
              />
              <Text style={styles.helperText}>
                Provide either price per trip OR price range
              </Text>
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <Car size={16} color="#10B981" /> Vehicle Information
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vehicle details (optional)"
                placeholderTextColor="#666666"
                value={formData.vehicleInfo}
                onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleInfo: text }))}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helperText}>
                Model, year, color, comfort features, etc.
              </Text>
            </View>
          </View>

          {/* Rules */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              <FileText size={16} color="#10B981" /> Rules & Guidelines
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Set rules for your carpool (optional)"
                placeholderTextColor="#666666"
                value={formData.rules}
                onChangeText={(text) => setFormData(prev => ({ ...prev, rules: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                Smoking policy, music preferences, punctuality expectations, etc.
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
              {loading ? 'Creating...' : 'Create Carpool Club'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields
            {'\n\n'}
            As the creator, you'll be responsible for managing the carpool and members.
            {'\n\n'}
            Ensure all members follow your rules and guidelines.
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
    color: '#10B981',
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
  timeButton: {
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dayText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#10B98180',
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