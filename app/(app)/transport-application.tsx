import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, MapPin, MessageSquare, School, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { useTheme } from '@/context/ThemeContext';
import StatusModal from '@/components/modals/StatusModal';

const BRAND_COLOR = '#1ea2b1';

export default function TransportApplicationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { transportId, driverId, transportName, schoolArea } = useLocalSearchParams<{
    transportId: string;
    driverId: string;
    transportName: string;
    schoolArea: string;
  }>();

  const [pickupAddress, setPickupAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ pickupAddress?: string }>({});

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const validate = () => {
    const newErrors: { pickupAddress?: string } = {};
    if (!pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup location is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      setStatusModal({
        visible: true,
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to apply for transport.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('school_transport_applications')
        .insert({
          transport_id: transportId,
          user_id: user.id,
          pickup_address: pickupAddress.trim(),
          additional_notes: additionalNotes.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      setStatusModal({
        visible: true,
        type: 'success',
        title: 'Application Sent!',
        message: 'Your application has been submitted. The driver will contact you to confirm.',
      });
    } catch (error: any) {
      const isDuplicate = error?.code === '23505';
      setStatusModal({
        visible: true,
        type: isDuplicate ? 'info' : 'error',
        title: isDuplicate ? 'Already Applied' : 'Submission Failed',
        message: isDuplicate
          ? 'You have already applied for this transport service.'
          : error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    if (statusModal.type === 'success') {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Apply for Transport</Text>
          <Text style={[styles.headerSub, { color: colors.text }]} numberOfLines={1}>
            {transportName}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Service Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${BRAND_COLOR}15` }]}>
              <School size={24} color={BRAND_COLOR} />
            </View>
            <View style={styles.summaryText}>
              <Text style={[styles.summaryName, { color: colors.text }]}>{transportName}</Text>
              <Text style={[styles.summaryArea, { color: colors.text }]}>{schoolArea}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>PICKUP LOCATION</Text>
            <View style={[
              styles.inputBox,
              { backgroundColor: colors.card, borderColor: errors.pickupAddress ? '#EF4444' : colors.border }
            ]}>
              <MapPin size={18} color={errors.pickupAddress ? '#EF4444' : BRAND_COLOR} style={{ marginTop: 3 }} />
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="Your full street address and suburb"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={pickupAddress}
                onChangeText={text => {
                  setPickupAddress(text);
                  if (errors.pickupAddress) setErrors({});
                }}
                editable={!loading}
              />
            </View>
            {errors.pickupAddress && (
              <Text style={styles.errorText}>{errors.pickupAddress}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>MESSAGE TO DRIVER (OPTIONAL)</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MessageSquare size={18} color="#666" style={{ marginTop: 3 }} />
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="Any special requirements or notes..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                editable={!loading}
                maxLength={500}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.text }]}>{additionalNotes.length}/500</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: `${BRAND_COLOR}10`, borderColor: `${BRAND_COLOR}20` }]}>
            <CheckCircle2 size={16} color={BRAND_COLOR} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              The driver will review your application and contact you directly to confirm pickup details and payment.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitBtnText}>SEND APPLICATION</Text>
          }
        </TouchableOpacity>
      </View>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={handleModalClose}
        autoClose={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  scrollContent: { padding: 24 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
  summaryName: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  summaryArea: { fontSize: 13, opacity: 0.55, fontWeight: '600' },
  formSection: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 6, marginLeft: 4 },
  charCount: { fontSize: 11, opacity: 0.4, textAlign: 'right', marginTop: 6 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20, opacity: 0.75 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  submitBtn: {
    backgroundColor: BRAND_COLOR,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
