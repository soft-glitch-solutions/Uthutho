// components/modals/ApplyModal.tsx
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
import { X, User, Mail, Phone, MapPin, BookOpen } from 'lucide-react-native';

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

    // Clear form after successful submission
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
    // Clear error when user starts typing
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Transport</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Student Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <User size={16} color="#1ea2b1" />
                <Text style={styles.inputLabel}>Student Name *</Text>
              </View>
              <TextInput
                style={[styles.input, errors.studentName && styles.inputError]}
                placeholder="Full name of student"
                placeholderTextColor="#666666"
                value={formData.studentName}
                onChangeText={(text) => updateField('studentName', text)}
                editable={!loading}
              />
              {errors.studentName && (
                <Text style={styles.errorText}>{errors.studentName}</Text>
              )}
            </View>

            {/* Grade */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <BookOpen size={16} color="#1ea2b1" />
                <Text style={styles.inputLabel}>Grade/Class</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., Grade 8, Standard 5"
                placeholderTextColor="#666666"
                value={formData.grade}
                onChangeText={(text) => updateField('grade', text)}
                editable={!loading}
              />
            </View>

            {/* Pickup Address */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <MapPin size={16} color="#1ea2b1" />
                <Text style={styles.inputLabel}>Pickup Address *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea, errors.pickupAddress && styles.inputError]}
                placeholder="Full address for daily pickup"
                placeholderTextColor="#666666"
                value={formData.pickupAddress}
                onChangeText={(text) => updateField('pickupAddress', text)}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
              {errors.pickupAddress && (
                <Text style={styles.errorText}>{errors.pickupAddress}</Text>
              )}
            </View>

            {/* Parent Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Phone size={16} color="#1ea2b1" />
                <Text style={styles.inputLabel}>Parent Phone *</Text>
              </View>
              <TextInput
                style={[styles.input, errors.parentPhone && styles.inputError]}
                placeholder="+27 11 123 4567"
                placeholderTextColor="#666666"
                value={formData.parentPhone}
                onChangeText={(text) => updateField('parentPhone', text)}
                keyboardType="phone-pad"
                editable={!loading}
              />
              {errors.parentPhone && (
                <Text style={styles.errorText}>{errors.parentPhone}</Text>
              )}
            </View>

            {/* Parent Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Mail size={16} color="#1ea2b1" />
                <Text style={styles.inputLabel}>Parent Email</Text>
              </View>
              <TextInput
                style={[styles.input, errors.parentEmail && styles.inputError]}
                placeholder="parent@example.com"
                placeholderTextColor="#666666"
                value={formData.parentEmail}
                onChangeText={(text) => updateField('parentEmail', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.parentEmail && (
                <Text style={styles.errorText}>{errors.parentEmail}</Text>
              )}
            </View>

            {/* Additional Notes */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requirements or notes for the driver..."
                placeholderTextColor="#666666"
                value={formData.additionalNotes}
                onChangeText={(text) => updateField('additionalNotes', text)}
                multiline
                numberOfLines={4}
                editable={!loading}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {formData.additionalNotes.length}/500 characters
              </Text>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                The driver will review your application and contact you directly for confirmation.
                Please ensure all contact information is accurate.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formContainer: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  charCount: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  infoNote: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  infoNoteText: {
    color: '#1ea2b1',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});