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
  MapPin,
  Clock,
  Plus,
  Minus,
  School,
  DollarSign,
  Users,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateSchoolServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolArea: '',
    pickupAreas: [''],
    pickupTimes: [new Date()],
    capacity: '10',
    pricePerMonth: '',
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
    setFormData(prev => ({ ...prev, pickupAreas: [...prev.pickupAreas, ''] }));
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

  const handleTimeChange = (index: number, event: any, selectedTime?: Date) => {
    setShowTimePicker(null);
    if (selectedTime) {
      const newPickupTimes = [...formData.pickupTimes];
      newPickupTimes[index] = selectedTime;
      setFormData(prev => ({ ...prev, pickupTimes: newPickupTimes }));
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmit = async () => {
    if (!formData.schoolName.trim() || !formData.schoolArea.trim() || !formData.pricePerMonth) {
      Alert.alert('Error', 'Please fill in all required fields');
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
          price_per_month: parseFloat(formData.pricePerMonth),
          is_active: true,
          is_verified: false,
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
          <Text style={styles.headingText}>School Transport</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* School Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SCHOOL DETAILS</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <School size={18} color="#1ea2b1" />
                  <TextInput
                    style={styles.input}
                    placeholder="School Name"
                    placeholderTextColor="#444"
                    value={formData.schoolName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, schoolName: text }))}
                  />
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <MapPin size={18} color="#1ea2b1" />
                  <TextInput
                    style={styles.input}
                    placeholder="School Area / Suburb"
                    placeholderTextColor="#444"
                    value={formData.schoolArea}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, schoolArea: text }))}
                  />
                </View>
              </View>
            </View>

            {/* Pickup Areas Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>PICKUP AREAS</Text>
                <TouchableOpacity onPress={handleAddPickupArea}>
                  <Plus size={18} color="#1ea2b1" />
                </TouchableOpacity>
              </View>
              {formData.pickupAreas.map((area, index) => (
                <View key={index} style={styles.arrayInputRow}>
                  <View style={styles.arrayInputCard}>
                    <MapPin size={16} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder={`Area ${index + 1}`}
                      placeholderTextColor="#444"
                      value={area}
                      onChangeText={(text) => handlePickupAreaChange(index, text)}
                    />
                  </View>
                  {formData.pickupAreas.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemovePickupArea(index)} style={styles.removeBtn}>
                      <Minus size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Capacity & Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CAPACITY & PRICING</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <Users size={18} color="#1ea2b1" />
                  <TextInput
                    style={styles.input}
                    placeholder="Capacity (Seats)"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={formData.capacity}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, capacity: text }))}
                  />
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <DollarSign size={18} color="#1ea2b1" />
                  <TextInput
                    style={styles.input}
                    placeholder="Monthly Price (ZAR)"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={formData.pricePerMonth}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerMonth: text }))}
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
                {loading ? 'CREATING...' : 'CREATE SERVICE'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By creating this service, you agree to our driver terms and safety guidelines.
            </Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showTimePicker !== null && (
        <DateTimePicker
          value={formData.pickupTimes[showTimePicker]}
          mode="time"
          onChange={(event, time) => handleTimeChange(showTimePicker, event, time)}
        />
      )}
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
  formContainer: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  arrayInputCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#1ea2b1',
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