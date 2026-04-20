import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, User, Mail, Phone, MapPin, BookOpen, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface ApplyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentName: string;
    grade: string;
    pickupAddress: string;
    parentPhone: string;
    parentEmail: string;
    additionalNotes?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export default function ApplyModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: ApplyModalProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    studentName: '',
    grade: '',
    pickupAddress: '',
    parentPhone: '',
    parentEmail: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Parent phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = 'Please enter a valid phone number';
    }

    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    await onSubmit({
      studentName: formData.studentName.trim(),
      grade: formData.grade.trim(),
      pickupAddress: formData.pickupAddress.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim(),
      additionalNotes: formData.additionalNotes.trim(),
    });

    if (!loading) {
      setFormData({
        studentName: '',
        grade: '',
        pickupAddress: '',
        parentPhone: '',
        parentEmail: '',
        additionalNotes: '',
      });
      setErrors({});
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        studentName: '',
        grade: '',
        pickupAddress: '',
        parentPhone: '',
        parentEmail: '',
        additionalNotes: '',
      });
      setErrors({});
      onClose();
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Apply for Transport</Text>
                <Text style={[styles.modalSubtitle, { color: colors.text, opacity: 0.5 }]}>Send your request to the driver</Text>
              </View>
              <TouchableOpacity onPress={handleClose} disabled={loading} style={[styles.closeButton, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Input: Student Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Student Name <Text style={{ color: colors.primary }}>*</Text></Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: errors.studentName ? '#EF4444' : colors.border }]}>
                  <User size={18} color={errors.studentName ? '#EF4444' : colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Full name of student"
                    placeholderTextColor="#666"
                    value={formData.studentName}
                    onChangeText={(text) => updateField('studentName', text)}
                    editable={!loading}
                  />
                </View>
                {errors.studentName && <Text style={styles.errorText}>{errors.studentName}</Text>}
              </View>

              {/* Input: Grade */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Grade/Class</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <BookOpen size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g., Grade 8"
                    placeholderTextColor="#666"
                    value={formData.grade}
                    onChangeText={(text) => updateField('grade', text)}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Input: Pickup Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Pickup Address <Text style={{ color: colors.primary }}>*</Text></Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.card, borderColor: errors.pickupAddress ? '#EF4444' : colors.border }]}>
                  <MapPin size={18} color={errors.pickupAddress ? '#EF4444' : colors.primary} style={{ marginTop: 14 }} />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.text }]}
                    placeholder="Full home address"
                    placeholderTextColor="#666"
                    value={formData.pickupAddress}
                    onChangeText={(text) => updateField('pickupAddress', text)}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                </View>
                {errors.pickupAddress && <Text style={styles.errorText}>{errors.pickupAddress}</Text>}
              </View>

              {/* Input: Parent Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Parent Phone <Text style={{ color: colors.primary }}>*</Text></Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: errors.parentPhone ? '#EF4444' : colors.border }]}>
                  <Phone size={18} color={errors.parentPhone ? '#EF4444' : colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="+27 12 345 6789"
                    placeholderTextColor="#666"
                    value={formData.parentPhone}
                    onChangeText={(text) => updateField('parentPhone', text)}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
                {errors.parentPhone && <Text style={styles.errorText}>{errors.parentPhone}</Text>}
              </View>

              {/* Input: Parent Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Parent Email (Optional)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Mail size={18} color={colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="parent@example.com"
                    placeholderTextColor="#666"
                    value={formData.parentEmail}
                    onChangeText={(text) => updateField('parentEmail', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Additional Notes */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Additional Notes</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.text, paddingLeft: 0 }]}
                    placeholder="Any special requirements..."
                    placeholderTextColor="#666"
                    value={formData.additionalNotes}
                    onChangeText={(text) => updateField('additionalNotes', text)}
                    multiline
                    numberOfLines={4}
                    editable={!loading}
                    maxLength={500}
                  />
                </View>
                <Text style={styles.charCount}>{formData.additionalNotes.length}/500</Text>
              </View>

              {/* Info Pill */}
              <View style={[styles.infoPill, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
                <AlertCircle size={14} color={colors.primary} />
                <Text style={[styles.infoPillText, { color: colors.text }]}>
                  The driver will contact you directly to confirm.
                </Text>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Actions */}
            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    maxHeight: '90%',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    height: '100%',
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  charCount: {
    color: '#666',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});