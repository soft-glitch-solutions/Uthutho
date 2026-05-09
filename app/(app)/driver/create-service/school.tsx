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
  ActivityIndicator,
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
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeOutLeft, FadeInDown } from 'react-native-reanimated';

const BRAND_COLOR = '#1ea2b1';

export default function CreateSchoolServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
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

  const nextStep = () => {
    if (step === 1 && (!formData.schoolName.trim() || !formData.schoolArea.trim())) {
      Alert.alert('Incomplete', 'Please provide school name and area.');
      return;
    }
    if (step === 2 && formData.pickupAreas.some(a => !a.trim())) {
      Alert.alert('Incomplete', 'Please fill in all pickup areas.');
      return;
    }
    if (step === 3 && (!formData.capacity || !formData.pricePerMonth)) {
      Alert.alert('Incomplete', 'Please set capacity and monthly price.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
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

      Alert.alert('Service Live!', 'Your school transport service has been created and is now visible to parents.', [
        { text: 'View Dashboard', onPress: () => router.replace('/driver-dashboard') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(s => (
        <View key={s} style={styles.stepDotContainer}>
          <View style={[
            styles.stepDot,
            step >= s ? styles.stepDotActive : styles.stepDotInactive
          ]} />
          {s < 4 && <View style={[
            styles.stepLine,
            step > s ? styles.stepLineActive : styles.stepLineInactive
          ]} />}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => step > 1 ? prevStep() : router.back()}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>STEP {step} OF 4</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headingText}>
          {step === 1 && "School Details"}
          {step === 2 && "Route & Timing"}
          {step === 3 && "Capacity & Price"}
          {step === 4 && "Review Service"}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {renderStepIndicator()}

          {step === 1 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.formSection}>
              <Text style={styles.sectionDesc}>Which school will you be serving?</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <School size={20} color={BRAND_COLOR} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full School Name"
                    placeholderTextColor="#444"
                    value={formData.schoolName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, schoolName: text }))}
                  />
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <MapPin size={20} color={BRAND_COLOR} />
                  <TextInput
                    style={styles.input}
                    placeholder="Suburb / General Area"
                    placeholderTextColor="#444"
                    value={formData.schoolArea}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, schoolArea: text }))}
                  />
                </View>
              </View>
              <View style={styles.tipCard}>
                <ShieldCheck size={18} color={BRAND_COLOR} />
                <Text style={styles.tipText}>Accurate school names help parents find your service faster.</Text>
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInRight} style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionDesc}>Where will you pick up students?</Text>
                <TouchableOpacity onPress={handleAddPickupArea} style={styles.addBtn}>
                  <Plus size={18} color={BRAND_COLOR} />
                  <Text style={styles.addBtnText}>ADD AREA</Text>
                </TouchableOpacity>
              </View>
              
              {formData.pickupAreas.map((area, index) => (
                <View key={index} style={styles.arrayInputRow}>
                  <View style={styles.arrayInputCard}>
                    <MapPin size={18} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder={`Pickup Suburb ${index + 1}`}
                      placeholderTextColor="#444"
                      value={area}
                      onChangeText={(text) => handlePickupAreaChange(index, text)}
                    />
                    <TouchableOpacity onPress={() => setShowTimePicker(index)} style={styles.timeSelectBtn}>
                      <Clock size={16} color={BRAND_COLOR} />
                      <Text style={styles.timeSelectText}>{formatTime(formData.pickupTimes[index] || new Date())}</Text>
                    </TouchableOpacity>
                  </View>
                  {formData.pickupAreas.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemovePickupArea(index)} style={styles.removeBtn}>
                      <Minus size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInRight} style={styles.formSection}>
              <Text style={styles.sectionDesc}>Set your monthly rates and seats.</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <Users size={20} color={BRAND_COLOR} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TOTAL SEATS</Text>
                    <TextInput
                      style={styles.inputLarge}
                      placeholder="e.g. 15"
                      placeholderTextColor="#444"
                      keyboardType="numeric"
                      value={formData.capacity}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, capacity: text }))}
                    />
                  </View>
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <DollarSign size={20} color={BRAND_COLOR} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>MONTHLY PRICE (ZAR)</Text>
                    <TextInput
                      style={styles.inputLarge}
                      placeholder="e.g. 850"
                      placeholderTextColor="#444"
                      keyboardType="numeric"
                      value={formData.pricePerMonth}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerMonth: text }))}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View entering={FadeInDown} style={styles.formSection}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <CheckCircle2 size={24} color={BRAND_COLOR} />
                  <Text style={styles.reviewTitle}>Service Summary</Text>
                </View>
                
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>SCHOOL</Text>
                  <Text style={styles.reviewValue}>{formData.schoolName}</Text>
                  <Text style={styles.reviewSubValue}>{formData.schoolArea}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>PICKUP AREAS</Text>
                  {formData.pickupAreas.map((area, i) => (
                    <Text key={i} style={styles.reviewValue}>• {area} ({formatTime(formData.pickupTimes[i])})</Text>
                  ))}
                </View>

                <View style={styles.reviewFooter}>
                  <View>
                    <Text style={styles.reviewLabel}>CAPACITY</Text>
                    <Text style={styles.reviewValue}>{formData.capacity} Seats</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.reviewLabel}>PRICE</Text>
                    <Text style={[styles.reviewValue, { color: BRAND_COLOR }]}>R{formData.pricePerMonth}/mo</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={step === 4 ? handleSubmit : nextStep}
          disabled={loading}
        >
          <LinearGradient
            colors={[BRAND_COLOR, '#15808d']}
            style={styles.primaryBtnInner}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {step === 4 ? 'LAUNCH SERVICE' : 'CONTINUE'}
                </Text>
                {step < 4 && <ChevronRight size={20} color="#FFF" />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showTimePicker !== null && (
        <DateTimePicker
          value={formData.pickupTimes[showTimePicker] || new Date()}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  progressTextContainer: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  progressText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headingText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotActive: {
    backgroundColor: BRAND_COLOR,
    transform: [{ scale: 1.2 }],
  },
  stepDotInactive: {
    backgroundColor: '#222',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: BRAND_COLOR,
  },
  stepLineInactive: {
    backgroundColor: '#222',
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 24,
  },
  sectionDesc: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height: 72,
    gap: 16,
  },
  fieldLabel: {
    fontSize: 9,
    color: '#444',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLarge: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    padding: 16,
    borderRadius: 20,
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.1)',
  },
  tipText: {
    flex: 1,
    color: '#1ea2b1',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: '900',
  },
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  arrayInputCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  timeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#050505',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  timeSelectText: {
    color: BRAND_COLOR,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  reviewCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  reviewTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  reviewItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  reviewLabel: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  reviewValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewSubValue: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  primaryBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  primaryBtnInner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});