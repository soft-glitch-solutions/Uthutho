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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
  Home,
  Navigation,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address?: string;
  suburb?: string;
  city?: string;
  postal_code?: string;
}

interface TransportInfo {
  id: string;
  school_name: string;
  school_area: string;
  pickup_areas: string[];
  pickup_times: string[];
  driver_id: string;
}

export default function TransportApplicationScreen() {
  const { transportId, driverId, transportName, schoolArea } = useLocalSearchParams<{
    transportId: string;
    driverId: string;
    transportName: string;
    schoolArea: string;
  }>();
  
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transportInfo, setTransportInfo] = useState<TransportInfo | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    studentGrade: '',
    studentAge: '',
    pickupAddress: '',
    pickupSuburb: '',
    pickupCity: '',
    pickupTimePreference: '',
    dropoffAddress: '',
    dropoffSuburb: '',
    dropoffCity: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalNotes: '',
    specialRequirements: '',
    message: '',
  });

  useEffect(() => {
    if (user && transportId) {
      fetchUserData();
    }
  }, [user, transportId]);

  useEffect(() => {
    if (userProfile) {
      prefillFormWithUserData();
    }
  }, [userProfile]);

  const fetchUserData = async () => {
    try {
      setProfileLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Fetch user's children/students
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user?.id)
        .order('created_at', { ascending: false });

      if (!childrenError && childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        // Pre-select the first child
        setSelectedChildId(childrenData[0].id);
        prefillWithChildData(childrenData[0]);
      }

      // Fetch transport details for additional info
      const { data: transportData, error: transportError } = await supabase
        .from('school_transports')
        .select('school_name, school_area, pickup_areas, pickup_times, driver_id')
        .eq('id', transportId)
        .single();

      if (!transportError && transportData) {
        setTransportInfo(transportData);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Could not load your information');
    } finally {
      setProfileLoading(false);
    }
  };

  const prefillFormWithUserData = () => {
    if (!userProfile) return;

    setFormData(prev => ({
      ...prev,
      parentName: `${userProfile.first_name} ${userProfile.last_name}`,
      parentPhone: userProfile.phone || '',
      parentEmail: userProfile.email || '',
      pickupAddress: userProfile.address || '',
      pickupSuburb: userProfile.suburb || '',
      pickupCity: userProfile.city || '',
      // Auto-fill dropoff with school info if available
      dropoffAddress: `${transportInfo?.school_name}` || '',
      dropoffCity: transportInfo?.school_area || schoolArea || '',
    }));
  };

  const prefillWithChildData = (child: any) => {
    setFormData(prev => ({
      ...prev,
      studentName: `${child.first_name} ${child.last_name}`,
      studentGrade: child.grade || '',
      studentAge: child.age ? child.age.toString() : '',
      medicalNotes: child.medical_notes || '',
      specialRequirements: child.special_requirements || '',
    }));
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    const child = children.find(c => c.id === childId);
    if (child) {
      prefillWithChildData(child);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.studentName.trim()) {
      errors.push('Student name is required');
    }
    
    if (!formData.pickupAddress.trim()) {
      errors.push('Pickup address is required');
    }
    
    if (!formData.pickupCity.trim()) {
      errors.push('Pickup city/suburb is required');
    }
    
    if (!formData.parentPhone.trim()) {
      errors.push('Parent phone number is required');
    }
    
    if (!formData.emergencyPhone.trim()) {
      errors.push('Emergency contact phone is required');
    }

    if (errors.length > 0) {
      Alert.alert(
        'Please complete all required fields',
        errors.join('\n• '),
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // First, check if user has already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('transport_requests')
        .select('id')
        .eq('transport_id', transportId)
        .eq('user_id', user?.id)
        .single();

      if (existingApplication && !checkError) {
        Alert.alert(
          'Already Applied',
          'You have already applied to this transport service. You can view your application status in your profile.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Submit the application
      const { error } = await supabase
        .from('transport_requests')
        .insert({
          transport_id: transportId,
          user_id: user?.id,
          driver_id: driverId,
          student_name: formData.studentName.trim(),
          student_grade: formData.studentGrade.trim() || null,
          student_age: formData.studentAge ? parseInt(formData.studentAge) : null,
          
          pickup_address: formData.pickupAddress.trim(),
          pickup_suburb: formData.pickupSuburb.trim(),
          pickup_city: formData.pickupCity.trim(),
          pickup_time_preference: formData.pickupTimePreference.trim() || null,
          
          dropoff_address: formData.dropoffAddress.trim() || null,
          dropoff_suburb: formData.dropoffSuburb.trim() || null,
          dropoff_city: formData.dropoffCity.trim() || null,
          
          parent_name: formData.parentName.trim(),
          parent_phone: formData.parentPhone.trim(),
          parent_email: formData.parentEmail.trim() || null,
          
          emergency_contact: formData.emergencyContact.trim(),
          emergency_phone: formData.emergencyPhone.trim(),
          
          medical_notes: formData.medicalNotes.trim() || null,
          special_requirements: formData.specialRequirements.trim() || null,
          additional_notes: formData.message.trim() || null,
          
          status: 'pending',
          application_date: new Date().toISOString(),
        });

      if (error) throw error;

      // Send notification to driver (if you have a notifications system)
      await sendDriverNotification();

      Alert.alert(
        'Application Submitted Successfully! 🎉',
        `Your application for ${transportName} has been sent to the driver. They will review it and contact you within 24-48 hours.`,
        [
          {
            text: 'View Application',
            onPress: () => {
              router.push({
                pathname: '/profile',
                params: { section: 'applications' }
              });
            }
          },
          {
            text: 'Return to Transport',
            onPress: () => {
              router.push(`/school-transport/${transportId}`);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit application. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const sendDriverNotification = async () => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: driverId,
          title: 'New Transport Application',
          message: `You have a new application for ${transportName} from ${userProfile?.first_name}`,
          type: 'transport_application',
          data: { transport_id: transportId, applicant_id: user?.id },
          read: false,
        });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Non-critical error, continue anyway
    }
  };

  const handleAddNewChild = () => {
    router.push({
      pathname: '/add-child',
      params: { returnTo: `/transport-application?transportId=${transportId}` }
    });
  };

  const getCurrentTimeSlots = () => {
    if (!transportInfo?.pickup_times) return [];
    return transportInfo.pickup_times.map(time => ({ label: time, value: time }));
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1ea2b1" />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Apply for Transport</Text>
              <View style={styles.transportBadge}>
                <School size={16} color="#1ea2b1" />
                <Text style={styles.transportName} numberOfLines={1}>
                  {transportName}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>
                {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
              <Text style={styles.userContact}>
                {userProfile?.phone} • {userProfile?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Student Selection */}
          {children.length > 0 && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <User size={20} color="#1ea2b1" />
                <Text style={styles.sectionTitle}>Select Student</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.childrenContainer}
              >
                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childCard,
                      selectedChildId === child.id && styles.childCardSelected
                    ]}
                    onPress={() => handleChildSelect(child.id)}
                  >
                    <View style={styles.childAvatar}>
                      <Text style={styles.childInitials}>
                        {child.first_name?.[0]}{child.last_name?.[0]}
                      </Text>
                    </View>
                    <Text style={styles.childName} numberOfLines={1}>
                      {child.first_name} {child.last_name}
                    </Text>
                    <Text style={styles.childGrade}>
                      {child.grade ? `Grade ${child.grade}` : 'Student'}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.addChildCard}
                  onPress={handleAddNewChild}
                >
                  <View style={styles.addChildIcon}>
                    <Text style={styles.addChildPlus}>+</Text>
                  </View>
                  <Text style={styles.addChildText}>Add New</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Student Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Student Information</Text>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Student's full name"
                    placeholderTextColor="#666666"
                    value={formData.studentName}
                    onChangeText={(text) => handleInputChange('studentName', text)}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grade/Class</Text>
                <View style={styles.inputContainer}>
                  <School size={16} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Grade 8"
                    placeholderTextColor="#666666"
                    value={formData.studentGrade}
                    onChangeText={(text) => handleInputChange('studentGrade', text)}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 14"
                    placeholderTextColor="#666666"
                    value={formData.studentAge}
                    onChangeText={(text) => handleInputChange('studentAge', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup Time Preference</Text>
                <View style={styles.inputContainer}>
                  <Clock size={16} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 7:00 AM"
                    placeholderTextColor="#666666"
                    value={formData.pickupTimePreference}
                    onChangeText={(text) => handleInputChange('pickupTimePreference', text)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Pickup Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Pickup Location *</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <View style={styles.inputContainer}>
                <Home size={16} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123 Main Street"
                  placeholderTextColor="#666666"
                  value={formData.pickupAddress}
                  onChangeText={(text) => handleInputChange('pickupAddress', text)}
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Suburb</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Suburb"
                    placeholderTextColor="#666666"
                    value={formData.pickupSuburb}
                    onChangeText={(text) => handleInputChange('pickupSuburb', text)}
                  />
                </View>
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#666666"
                    value={formData.pickupCity}
                    onChangeText={(text) => handleInputChange('pickupCity', text)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Dropoff Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <School size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Dropoff Location</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>School/Institution</Text>
              <View style={styles.inputContainer}>
                <School size={16} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={transportName || 'School Name'}
                  placeholderTextColor="#666666"
                  value={formData.dropoffAddress}
                  onChangeText={(text) => handleInputChange('dropoffAddress', text)}
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Area</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={schoolArea || 'School Area'}
                    placeholderTextColor="#666666"
                    value={formData.dropoffCity}
                    onChangeText={(text) => handleInputChange('dropoffCity', text)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Parent/Guardian Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Parent/Guardian Details</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Parent/Guardian name"
                  placeholderTextColor="#666666"
                  value={formData.parentName}
                  onChangeText={(text) => handleInputChange('parentName', text)}
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputContainer}>
                  <Phone size={16} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="072 123 4567"
                    placeholderTextColor="#666666"
                    value={formData.parentPhone}
                    onChangeText={(text) => handleInputChange('parentPhone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="parent@email.com"
                    placeholderTextColor="#666666"
                    value={formData.parentEmail}
                    onChangeText={(text) => handleInputChange('parentEmail', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Emergency Contact *</Text>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Emergency contact "
                    placeholderTextColor="#666666"
                    value={formData.emergencyContact}
                    onChangeText={(text) => handleInputChange('emergencyContact', text)}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputContainer}>
                  <Phone size={16} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="083 123 4567"
                    placeholderTextColor="#666666"
                    value={formData.emergencyPhone}
                    onChangeText={(text) => handleInputChange('emergencyPhone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Special Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color="#1ea2b1" />
              <Text style={styles.sectionTitle}>Special Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medical Notes/Allergies</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any medical conditions, allergies, or special medical needs..."
                  placeholderTextColor="#666666"
                  value={formData.medicalNotes}
                  onChangeText={(text) => handleInputChange('medicalNotes', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Requirements</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any special requirements for the driver..."
                  placeholderTextColor="#666666"
                  value={formData.specialRequirements}
                  onChangeText={(text) => handleInputChange('specialRequirements', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any other important information..."
                  placeholderTextColor="#666666"
                  value={formData.message}
                  onChangeText={(text) => handleInputChange('message', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Important Notes */}
          <View style={styles.notesContainer}>
            <View style={styles.noteHeader}>
              <AlertCircle size={16} color="#FBBF24" />
              <Text style={styles.noteTitle}>Important Information</Text>
            </View>
            <Text style={styles.noteText}>
              • Applications are subject to driver approval{'\n'}
              • You will be contacted within 24-48 hours{'\n'}
              • Please ensure all information is accurate{'\n'}
              • Required fields are marked with *{'\n'}
              • Payment terms will be discussed upon approval
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#111111',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  transportName: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userContact: {
    color: '#888888',
    fontSize: 12,
  },
  formContainer: {
    padding: 20,
  },
  formSection: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  childrenContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  childCard: {
    width: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  childCardSelected: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderColor: '#1ea2b1',
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  childInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  childName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  childGrade: {
    color: '#888888',
    fontSize: 10,
    textAlign: 'center',
  },
  addChildCard: {
    width: 100,
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
    borderStyle: 'dashed',
  },
  addChildIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addChildPlus: {
    color: '#1ea2b1',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addChildText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 0,
  },
  notesContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  noteText: {
    color: '#FBBF24',
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#1ea2b180',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});