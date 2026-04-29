// app/driver-onboarding.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Car,
  FileText,
  Shield,
  ArrowLeft,
  CheckCircle,
  Upload,
  Camera,
  IdCard,
  FileCheck,
  ChevronRight,
  Info,
  Clock,
  Truck,
  Bus as BusIcon,
  CircleCheckBig
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import StatusModal from '@/components/modals/StatusModal';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DriverOnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const [applicationStatus, setApplicationStatus] = useState<{
    exists: boolean;
    isVerified: boolean;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [modalStatus, setModalStatus] = useState({
    visible: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  const vehicleTypes = [
    { label: 'Taxi', icon: Car },
    { label: 'Bus', icon: BusIcon },
    { label: 'Minibus', icon: Truck },
    { label: 'Private Car', icon: Car },
  ];

  const steps = [
    { id: 1, title: 'License', icon: FileText },
    { id: 2, title: 'Vehicle', icon: Car },
    { id: 3, title: 'PDP', icon: FileCheck },
    { id: 4, title: 'Review', icon: Shield },
  ];

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('drivers')
        .select('is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setApplicationStatus({
          exists: true,
          isVerified: data.is_verified
        });
        if (data.is_verified) {
          router.replace('/driver-dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    // Update progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep - 1) / (steps.length - 1),
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

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
          upsert: true
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

      // Add push notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Application Submitted',
        message: 'Thank you for applying! You will be notified once your driver application is successful.',
        type: 'system',
        is_read: false
      });

      showModal('success', 'Application Submitted!',
        'Your driver application has been submitted for verification. You will be notified once approved.');

      setTimeout(() => {
        router.replace('/(app)/(tabs)/home');
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
          <View style={styles.stepWrapper}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <FileText size={24} color="#1ea2b1" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Driver License</Text>
                <Text style={styles.cardSubtitle}>South African valid license</Text>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>LICENSE NUMBER</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter license number"
                placeholderTextColor="#444"
                value={formData.licenseNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.uploadRow}>
              <View style={styles.uploadCol}>
                <Text style={styles.uploadLabel}>FRONT SIDE</Text>
                <TouchableOpacity
                  style={[styles.uploadBox, formData.licenseFront && styles.uploadBoxActive]}
                  onPress={() => pickImage('licenseFront')}
                >
                  {formData.licenseFront ? (
                    <Image source={{ uri: formData.licenseFront }} style={styles.boxImage} />
                  ) : (
                    <Camera size={20} color="#1ea2b1" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.uploadCol}>
                <Text style={styles.uploadLabel}>BACK SIDE</Text>
                <TouchableOpacity
                  style={[styles.uploadBox, formData.licenseBack && styles.uploadBoxActive]}
                  onPress={() => pickImage('licenseBack')}
                >
                  {formData.licenseBack ? (
                    <Image source={{ uri: formData.licenseBack }} style={styles.boxImage} />
                  ) : (
                    <Camera size={20} color="#1ea2b1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepWrapper}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Car size={24} color="#1ea2b1" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Vehicle Info</Text>
                <Text style={styles.cardSubtitle}>Register your transport</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
            <View style={styles.typeGrid}>
              {vehicleTypes.map((item) => {
                const Icon = item.icon;
                const isActive = formData.vehicleType === item.label;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.typeCard, isActive && styles.typeCardActive]}
                    onPress={() => setFormData(prev => ({ ...prev, vehicleType: item.label }))}
                  >
                    <Icon size={20} color={isActive ? "#000" : "#1ea2b1"} />
                    <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.inputWrapper, { marginTop: 24 }]}>
              <Text style={styles.inputLabel}>REGISTRATION NUMBER</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ABC 123 GP"
                placeholderTextColor="#444"
                value={formData.vehicleRegistration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleRegistration: text }))}
                autoCapitalize="characters"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepWrapper}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <FileCheck size={24} color="#1ea2b1" />
              </View>
              <View>
                <Text style={styles.cardTitle}>PDP Certificate</Text>
                <Text style={styles.cardSubtitle}>Professional permit</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.fullUpload, formData.pdpCertificate && styles.fullUploadActive]}
              onPress={() => pickDocument('pdpCertificate')}
            >
              {formData.pdpCertificate ? (
                <View style={styles.pdpPreview}>
                  <CircleCheckBig size={32} color="#1ea2b1" />
                  <Text style={styles.pdpText}>Certificate Uploaded</Text>
                </View>
              ) : (
                <>
                  <Upload size={32} color="#1ea2b1" />
                  <Text style={styles.uploadTitle}>Upload Certificate</Text>
                  <Text style={styles.uploadDesc}>JPG, PNG or PDF format</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.glassInfo}>
              <Info size={16} color="#1ea2b1" />
              <Text style={styles.infoText}>
                A valid PrDP is required by law for public transport services in South Africa.
              </Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepWrapper}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Shield size={24} color="#1ea2b1" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Review</Text>
                <Text style={styles.cardSubtitle}>Finalize application</Text>
              </View>
            </View>

            <View style={styles.reviewList}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewKey}>LICENSE</Text>
                <Text style={styles.reviewVal}>{formData.licenseNumber || '—'}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewKey}>VEHICLE</Text>
                <Text style={styles.reviewVal}>{formData.vehicleType || '—'}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewKey}>REG</Text>
                <Text style={styles.reviewVal}>{formData.vehicleRegistration || '—'}</Text>
              </View>
            </View>

            <View style={styles.verificationCard}>
              <Shield size={20} color="#fbbf24" fill="#fbbf2420" />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifTitle}>VERIFICATION PROCESS</Text>
                <Text style={styles.verifText}>
                  Our team will review your documents. This usually takes 24-48 hours.
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (checkingStatus) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  if (applicationStatus?.exists && !applicationStatus.isVerified) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <View style={styles.glowTop} />
        <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.mainCard, { alignItems: 'center', paddingVertical: 48 }]}>
            <View style={[styles.iconCircle, { width: 80, height: 80, borderRadius: 40, marginBottom: 24 }]}>
              <Clock size={40} color="#fbbf24" />
            </View>
            <Text style={[styles.heroTitle, { textAlign: 'center' }]}>Application Pending</Text>
            <Text style={[styles.heroSubtitle, { textAlign: 'center', marginBottom: 32 }]}>
              We are currently reviewing your documents. You'll receive a notification as soon as you're approved to drive.
            </Text>

            <View style={styles.verificationCard}>
              <Shield size={20} color="#1ea2b1" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.verifTitle, { color: '#1ea2b1' }]}>WHAT HAPPENS NEXT?</Text>
                <Text style={styles.verifText}>
                  Our verification team is checking your license and PDP. This process typically takes 1-2 business days.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { width: '100%', marginTop: 40, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>BACK TO HOME</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Background Glows */}
      <View style={styles.glowTop} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.brandText}>Uthutho</Text>
            <Text style={styles.readyText}>READY TO EARN</Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Become a Driver</Text>
          <Text style={styles.heroSubtitle}>Join the community and move smarter</Text>
        </View>

        {/* Premium Progress Bar */}
        <View style={styles.progressWrapper}>
          <View style={styles.barBackground}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            />
          </View>
          <View style={styles.stepIndicatorRow}>
            {steps.map((step) => (
              <View key={step.id} style={styles.stepPoint}>
                <View style={[
                  styles.dot,
                  currentStep >= step.id && styles.dotActive,
                  currentStep > step.id && styles.dotDone
                ]}>
                  {currentStep > step.id ? (
                    <CheckCircle size={10} color="#000" />
                  ) : (
                    <Text style={[styles.dotText, currentStep >= step.id && styles.dotTextActive]}>
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text style={[styles.dotLabel, currentStep >= step.id && styles.dotLabelActive]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Main Card Content */}
        <Animated.View style={[
          styles.mainCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          {renderStepContent()}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canProceed() && styles.btnDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.btnText}>
                  {currentStep === steps.length ? 'SUBMIT APPLICATION' : 'CONTINUE'}
                </Text>
                <ChevronRight size={18} color="#000" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Secure verification powered by Uthutho Safety
          </Text>
        </View>
      </ScrollView>

      {/* Status Modal */}
      <StatusModal
        visible={modalStatus.visible}
        type={modalStatus.type}
        title={modalStatus.title}
        message={modalStatus.message}
        onClose={() => setModalStatus(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    backgroundColor: '#1ea2b1',
    opacity: 0.1,
    borderRadius: 150,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  headerTitles: {
    flex: 1,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1ea2b1',
    letterSpacing: 2,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressWrapper: {
    marginBottom: 32,
  },
  barBackground: {
    height: 4,
    backgroundColor: '#111',
    borderRadius: 2,
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 2,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepPoint: {
    alignItems: 'center',
    width: 60,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dotActive: {
    backgroundColor: '#111',
    borderColor: '#1ea2b1',
  },
  dotDone: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  dotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333',
  },
  dotTextActive: {
    color: '#1ea2b1',
  },
  dotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#444',
    textTransform: 'uppercase',
  },
  dotLabelActive: {
    color: '#FFF',
  },
  mainCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 24,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  stepWrapper: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30,162,177,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.2)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#222',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadCol: {
    flex: 1,
  },
  uploadLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  uploadBox: {
    height: 120,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadBoxActive: {
    borderStyle: 'solid',
    borderColor: '#1ea2b1',
  },
  boxImage: {
    width: '100%',
    height: '100%',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (SCREEN_WIDTH - 96 - 12) / 2,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    gap: 8,
  },
  typeCardActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  typeLabelActive: {
    color: '#000',
  },
  fullUpload: {
    height: 180,
    backgroundColor: '#000',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  fullUploadActive: {
    borderStyle: 'solid',
    borderColor: '#1ea2b1',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  uploadDesc: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
  },
  pdpPreview: {
    alignItems: 'center',
    gap: 8,
  },
  pdpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1ea2b1',
  },
  glassInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,162,177,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1ea2b1',
    lineHeight: 18,
    fontWeight: '500',
  },
  reviewList: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#111',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewKey: {
    fontSize: 10,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1,
  },
  reviewVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  verificationCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  verifTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1,
    marginBottom: 4,
  },
  verifText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#1ea2b1',
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: '#111',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  footerNote: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});