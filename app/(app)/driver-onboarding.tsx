// app/driver-onboarding.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { 
  Car, 
  FileText, 
  CreditCard, 
  Shield, 
  ArrowLeft, 
  CheckCircle,
  Upload,
  Camera,
  IdCard,
  FileCheck
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import StatusModal from '@/components/modals/StatusModal';

export default function DriverOnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehicleType: '',
    vehicleRegistration: '',
    licenseFront: null as string | null,
    licenseBack: null as string | null,
    pdpCertificate: null as string | null,
    vehiclePhotos: [] as string[],
  });

  const [modalStatus, setModalStatus] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  const vehicleTypes = ['Taxi', 'Bus', 'Minibus', 'Private Car'];

  const steps = [
    {
      id: 1,
      title: 'Driver License',
      description: 'Upload your driver license (both sides)',
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
      title: 'PDP Certificate',
      description: 'Upload your Professional Driving Permit',
      icon: FileCheck,
    },
    {
      id: 4,
      title: 'Verification',
      description: 'Review and submit for verification',
      icon: Shield,
    },
  ];

  // Image picker functions
  const pickImage = async (type: 'licenseFront' | 'licenseBack' | 'pdpCertificate' | 'vehiclePhotos') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'vehiclePhotos') {
          setFormData(prev => ({
            ...prev,
            vehiclePhotos: [...prev.vehiclePhotos, result.assets[0].uri]
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [type]: result.assets[0].uri
          }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showModal('error', 'Error', 'Failed to pick image');
    }
  };

  const pickDocument = async (type: 'licenseFront' | 'licenseBack' | 'pdpCertificate') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          [type]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showModal('error', 'Error', 'Failed to pick document');
    }
  };

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalStatus({
      visible: true,
      type,
      title,
      message,
    });
  };

  const uploadFile = async (uri: string, path: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(path, blob, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.licenseNumber.length >= 8 && 
               formData.licenseFront && 
               formData.licenseBack;
      case 2:
        return formData.vehicleType !== '' && 
               formData.vehicleRegistration.length >= 4;
      case 3:
        return formData.pdpCertificate !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const submitDriverApplication = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showModal('error', 'Error', 'You must be logged in to apply as a driver');
        return;
      }

      // Check if already applied
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingDriver) {
        showModal('error', 'Already Applied', 'You have already applied to be a driver');
        return;
      }

      // Upload files to storage
      const uploadPromises = [];
      
      if (formData.licenseFront) {
        uploadPromises.push(
          uploadFile(formData.licenseFront, `licenses/${user.id}/front.jpg`)
        );
      }
      
      if (formData.licenseBack) {
        uploadPromises.push(
          uploadFile(formData.licenseBack, `licenses/${user.id}/back.jpg`)
        );
      }
      
      if (formData.pdpCertificate) {
        uploadPromises.push(
          uploadFile(formData.pdpCertificate, `pdp/${user.id}/certificate.jpg`)
        );
      }

      const uploadedPaths = await Promise.all(uploadPromises);

      // Create driver record
      const { error } = await supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          license_number: formData.licenseNumber,
          license_front_url: uploadedPaths[0] || null,
          license_back_url: uploadedPaths[1] || null,
          pdp_certificate_url: uploadedPaths[2] || null,
          vehicle_type: formData.vehicleType,
          vehicle_registration: formData.vehicleRegistration,
          vehicle_photos: formData.vehiclePhotos,
          is_verified: false,
          is_active: true,
        });

      if (error) throw error;

      showModal('success', 'Application Submitted!', 
        'Your driver application has been submitted for verification. You will be notified once approved.');
      
      // Auto-close and redirect after success
      setTimeout(() => {
        router.replace('/driver/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting driver application:', error);
      showModal('error', 'Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
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
              Upload photos of both sides of your valid South African driver license
            </Text>
            
            {/* License Number */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="License Number (e.g., 12345678)"
                placeholderTextColor="#666666"
                value={formData.licenseNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>

            {/* License Front */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>License Front *</Text>
              {formData.licenseFront ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: formData.licenseFront }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={() => pickImage('licenseFront')}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => pickImage('licenseFront')}
                >
                  <Camera size={24} color="#1ea2b1" />
                  <Text style={styles.uploadButtonText}>Take Photo or Upload</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* License Back */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>License Back *</Text>
              {formData.licenseBack ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: formData.licenseBack }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={() => pickImage('licenseBack')}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => pickImage('licenseBack')}
                >
                  <Camera size={24} color="#1ea2b1" />
                  <Text style={styles.uploadButtonText}>Take Photo or Upload</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Car size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>Vehicle Information</Text>
            <Text style={styles.stepDescription}>
              What type of vehicle will you be driving?
            </Text>
            
            {/* Vehicle Type */}
            <View style={styles.optionsContainer}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    formData.vehicleType === type && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, vehicleType: type }))}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.vehicleType === type && styles.optionButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vehicle Registration */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Vehicle Registration (e.g., ABC123GP)"
                placeholderTextColor="#666666"
                value={formData.vehicleRegistration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleRegistration: text }))}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            {/* Vehicle Photos (Optional) */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Vehicle Photos (Optional)</Text>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => pickImage('vehiclePhotos')}
              >
                <Upload size={24} color="#1ea2b1" />
                <Text style={styles.uploadButtonText}>Add Vehicle Photos</Text>
              </TouchableOpacity>
              
              {formData.vehiclePhotos.length > 0 && (
                <ScrollView horizontal style={styles.photosContainer}>
                  {formData.vehiclePhotos.map((uri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.vehiclePhoto} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            vehiclePhotos: prev.vehiclePhotos.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Text style={styles.removePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <FileCheck size={48} color="#1ea2b1" />
            <Text style={styles.stepTitle}>PDP Certificate</Text>
            <Text style={styles.stepDescription}>
              Upload your Professional Driving Permit (PDP) certificate
            </Text>
            
            <View style={styles.uploadSection}>
              {formData.pdpCertificate ? (
                <View style={styles.previewContainer}>
                  <View style={styles.documentPreview}>
                    <IdCard size={48} color="#1ea2b1" />
                    <Text style={styles.documentText}>PDP Certificate Uploaded</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={() => pickDocument('pdpCertificate')}
                  >
                    <Text style={styles.changeButtonText}>Change Document</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={() => pickDocument('pdpCertificate')}
                >
                  <Upload size={24} color="#1ea2b1" />
                  <Text style={styles.uploadButtonText}>Upload PDP Certificate</Text>
                  <Text style={styles.uploadSubtext}>
                    Supported formats: JPG, PNG, PDF
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                A Professional Driving Permit (PDP) is required for transporting passengers in South Africa.
              </Text>
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
                <Text style={styles.reviewValue}>{formData.licenseNumber}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Vehicle Type:</Text>
                <Text style={styles.reviewValue}>{formData.vehicleType}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Registration:</Text>
                <Text style={styles.reviewValue}>{formData.vehicleRegistration}</Text>
              </View>
              
              {/* Document Status */}
              <View style={styles.documentStatus}>
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color={formData.licenseFront ? "#10B981" : "#666666"} />
                  <Text style={[
                    styles.statusText,
                    formData.licenseFront && styles.statusTextComplete
                  ]}>
                    License Front
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color={formData.licenseBack ? "#10B981" : "#666666"} />
                  <Text style={[
                    styles.statusText,
                    formData.licenseBack && styles.statusTextComplete
                  ]}>
                    License Back
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color={formData.pdpCertificate ? "#10B981" : "#666666"} />
                  <Text style={[
                    styles.statusText,
                    formData.pdpCertificate && styles.statusTextComplete
                  ]}>
                    PDP Certificate
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.verificationNote}>
              <Shield size={20} color="#fbbf24" />
              <Text style={styles.verificationText}>
                Your application will be reviewed and verified within 24-48 hours. 
                You will receive a notification once approved.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
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

      {/* Status Modal */}
      <StatusModal
        visible={modalStatus.visible}
        type={modalStatus.type}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={() => setModalStatus(prev => ({ ...prev, visible: false }))}
      />
    </>
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
  uploadSection: {
    width: '100%',
    marginBottom: 24,
  },
  uploadLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadSubtext: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  documentPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  documentText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
  },
  photosContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
  },
  vehiclePhoto: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 20,
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
  documentStatus: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 8,
  },
  statusTextComplete: {
    color: '#10B981',
  },
  infoNote: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  infoNoteText: {
    color: '#1ea2b1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
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