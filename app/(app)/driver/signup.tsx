import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Car, FileText, CreditCard, Shield, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function DriverOnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleTypes = ['Taxi', 'Bus', 'Minibus', 'Private Car'];

  const steps = [
    {
      id: 1,
      title: 'Driver License',
      description: 'Enter your valid driver license number',
      icon: FileText,
    },
    {
      id: 2,
      title: 'Vehicle Information',
      description: 'Tell us about your vehicle',
      icon: Car,
    },
    {
      id: 3,
      title: 'Vehicle Registration',
      description: 'Enter your vehicle registration number',
      icon: CreditCard,
    },
    {
      id: 4,
      title: 'Verification',
      description: 'Review and submit for verification',
      icon: Shield,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      submitDriverApplication();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const submitDriverApplication = async () => {
    if (!licenseNumber || !vehicleType || !vehicleRegistration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to apply as a driver');
        return;
      }

      const { error } = await supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          license_number: licenseNumber,
          vehicle_type: vehicleType,
          vehicle_registration: vehicleRegistration,
          is_verified: false, // Will be verified by admin
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'You have already applied to be a driver');
        } else {
          Alert.alert('Error', 'Failed to submit application. Please try again.');
        }
        return;
      }

      Alert.alert(
        'Application Submitted!',
        'Your driver application has been submitted for verification. You will be notified once approved.',
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]
      );
    } catch (error) {
      console.error('Error submitting driver application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return licenseNumber.length >= 8;
      case 2:
        return vehicleType !== '';
      case 3:
        return vehicleRegistration.length >= 4;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <FileText size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>Driver License</Text>
            <Text style={styles.stepDescription}>
              Enter your valid South African driver license number
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="License Number (e.g., 12345678)"
                placeholderTextColor="#666666"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Car size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>Vehicle Type</Text>
            <Text style={styles.stepDescription}>
              What type of vehicle will you be driving?
            </Text>
            
            <View style={styles.optionsContainer}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    vehicleType === type && styles.optionButtonActive
                  ]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    vehicleType === type && styles.optionButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <CreditCard size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>Vehicle Registration</Text>
            <Text style={styles.stepDescription}>
              Enter your vehicle registration number
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Registration (e.g., ABC123GP)"
                placeholderTextColor="#666666"
                value={vehicleRegistration}
                onChangeText={setVehicleRegistration}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Shield size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>Review Application</Text>
            <Text style={styles.stepDescription}>
              Please review your information before submitting
            </Text>
            
            <View style={styles.reviewContainer}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>License Number:</Text>
                <Text style={styles.reviewValue}>{licenseNumber}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Vehicle Type:</Text>
                <Text style={styles.reviewValue}>{vehicleType}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Registration:</Text>
                <Text style={styles.reviewValue}>{vehicleRegistration}</Text>
              </View>
            </View>
            
            <View style={styles.verificationNote}>
              <CheckCircle size={20} color="#fbbf24" />
              <Text style={styles.verificationText}>
                Your application will be reviewed and verified within 24-48 hours
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Driver</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              currentStep >= step.id && styles.progressDotActive,
              currentStep > step.id && styles.progressDotCompleted
            ]}>
              {currentStep > step.id ? (
                <CheckCircle size={16} color="#ffffff" />
              ) : (
                <Text style={[
                  styles.progressDotText,
                  currentStep >= step.id && styles.progressDotTextActive
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                currentStep > step.id && styles.progressLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Submitting...' : currentStep === steps.length ? 'Submit Application' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#1ea2b1',
  },
  progressDotCompleted: {
    backgroundColor: '#4ade80',
  },
  progressDotText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressDotTextActive: {
    color: '#ffffff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#333333',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#1ea2b1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  optionButtonText: {
    color: '#cccccc',
    fontSize: 16,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  reviewContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666666',
  },
  reviewValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf2420',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf2450',
  },
  verificationText: {
    color: '#fbbf24',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#333333',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});