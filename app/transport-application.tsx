// app/transport-application.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, School, MapPin, Phone, Mail, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

export default function TransportApplicationScreen() {
  const { transportId, driverId, transportName } = useLocalSearchParams<{
    transportId: string;
    driverId: string;
    transportName: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    studentGrade: '',
    pickupAddress: '',
    dropoffAddress: '',
    parentPhone: '',
    parentEmail: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setUserProfile(data);
      
      // Pre-fill form with user data
      if (data) {
        setFormData(prev => ({
          ...prev,
          studentName: `${data.first_name} ${data.last_name}`,
          parentPhone: data.phone || '',
          parentEmail: data.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }
    
    if (!formData.pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }
    
    if (!formData.parentPhone.trim()) {
      Alert.alert('Error', 'Please enter parent phone number');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          transport_id: transportId,
          user_id: user?.id,
          student_name: formData.studentName,
          student_grade: formData.studentGrade,
          pickup_address: formData.pickupAddress,
          dropoff_address: formData.dropoffAddress || null,
          parent_phone: formData.parentPhone,
          parent_email: formData.parentEmail || null,
          message: formData.message || null,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Applied', 'You have already applied to this transport service');
          router.back();
          return;
        }
        throw error;
      }

      Alert.alert(
        'Application Submitted!',
        'Your application has been sent to the driver. They will review it and contact you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              // Navigate back to transport details or home
              setTimeout(() => {
                router.push(`/school-transport/${transportId}`);
              }, 100);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Apply for Transport</Text>
          <Text style={styles.subtitle}>{transportName}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Student Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Student Information</Text>
            
            <View style={styles.inputContainer}>
              <User size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#666666"
                value={formData.studentName}
                onChangeText={(text) => handleInputChange('studentName', text)}
              />
            </View>

            <View style={styles.inputContainer}>
              <School size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Grade/Class (Optional)"
                placeholderTextColor="#666666"
                value={formData.studentGrade}
                onChangeText={(text) => handleInputChange('studentGrade', text)}
              />
            </View>
          </View>

          {/* Pickup/Dropoff Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Transport Details</Text>
            
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pickup Address *"
                placeholderTextColor="#666666"
                value={formData.pickupAddress}
                onChangeText={(text) => handleInputChange('pickupAddress', text)}
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <MapPin size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dropoff Address (Optional)"
                placeholderTextColor="#666666"
                value={formData.dropoffAddress}
                onChangeText={(text) => handleInputChange('dropoffAddress', text)}
                multiline
              />
            </View>
          </View>

          {/* Parent Contact Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Parent Contact</Text>
            
            <View style={styles.inputContainer}>
              <Phone size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor="#666666"
                value={formData.parentPhone}
                onChangeText={(text) => handleInputChange('parentPhone', text)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email (Optional)"
                placeholderTextColor="#666666"
                value={formData.parentEmail}
                onChangeText={(text) => handleInputChange('parentEmail', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Additional Message */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <MessageSquare size={20} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requirements or notes for the driver..."
                placeholderTextColor="#666666"
                value={formData.message}
                onChangeText={(text) => handleInputChange('message', text)}
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
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields
            {'\n\n'}
            By submitting this application, you agree to share your contact information with the driver for communication purposes.
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 0,
  },
  submitButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 18,
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
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});