import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { AlertTriangle , CheckCircle } from "lucide-react-native";

// New Warning Component
const Warning = ({ visible, onAccept, onReject, colors }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.warningContent, { backgroundColor: colors.card }]}>
          <AlertTriangle size={50} color="#FFA500" style={styles.warningIcon} />
          <Text style={[styles.warningTitle, { color: colors.text }]}>Important Notice</Text>
          
          <ScrollView style={styles.warningTextContainer}>
            <Text style={[styles.warningText, { color: colors.text }]}>
              Thank you for taking the time to submit data to help keep our app updated.
              {"\n\n"}
              If your submission is approved by our admin team, you will be awarded <Text style={{ fontWeight: 'bold' }}>100 points</Text> to your profile.
              {"\n\n"}
              Please ensure all information is accurate and valid. We fact-check all submissions, and:
              {"\n\n"}
              • Submitting nonsense or inaccurate data may result in rejection
              {"\n"}
              • Repeated violations could risk your account being <Text style={{ fontWeight: 'bold' }}>banned</Text>
              {"\n\n"}
              By submitting, you confirm your data is accurate to the best of your knowledge.
            </Text>
          </ScrollView>

          <View style={styles.warningButtons}>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: colors.danger }]}
              onPress={onReject}
            >
              <Text style={styles.warningButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: colors.primary }]}
              onPress={onAccept}
            >
              <Text style={styles.warningButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Updated AddHub Component with Warning
export default function AddHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [transportType, setTransportType] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(true); // Show warning first

  const extractCoordinates = (url) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session) {
        throw new Error('No user session found. Please log in.');
      }

      const userId = session.session.user.id;
      const coordinates = extractCoordinates(googleMapsUrl);
      if (!coordinates) {
        Alert.alert('Error', 'Invalid Google Maps URL');
        return;
      }

      const { error } = await supabase
        .from('hub_requests')
        .insert({
          user_id: userId,
          name,
          address,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          transport_type: transportType,
          description,
          status: 'pending' // Added status field
        });

      if (error) throw error;
      
      // Award temporary points (100 points will be awarded after admin approval)
      await awardPoints(userId, 0); // 0 points now, admin will approve 100 later
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting hub request:', error);
      Alert.alert('Error', 'Failed to submit hub request');
    }
  };

  const awardPoints = async (userId, points) => {
    try {
      const { error } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          points: points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const handleAcceptWarning = () => {
    setShowWarningModal(false);
  };

  const handleRejectWarning = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Warning Modal - shows first */}
      <Warning 
        visible={showWarningModal}
        onAccept={handleAcceptWarning}
        onReject={handleRejectWarning}
        colors={colors}
      />

      {/* Form Content */}
      <Text style={[styles.label, { color: colors.text }]}>Hub Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Enter hub name"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Address</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={address}
        onChangeText={setAddress}
        placeholder="Full address"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Google Maps URL</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={googleMapsUrl}
        onChangeText={setGoogleMapsUrl}
        placeholder="https://maps.google.com/?q=..."
        placeholderTextColor={colors.placeholder}
        keyboardType="url"
      />

      <Text style={[styles.label, { color: colors.text }]}>Transport Type</Text>
      <Picker
        selectedValue={transportType || ''}
        onValueChange={(itemValue) => setTransportType(itemValue)}
        style={[styles.dropdown, { color: colors.text, backgroundColor: colors.inputBackground }]}
        dropdownIconColor={colors.text}
      >
        <Picker.Item label="Select Transport Type" value="" />
        <Picker.Item label="Train" value="train" />
        <Picker.Item label="Bus" value="bus" />
        <Picker.Item label="Taxi" value="taxi" />
      </Picker>

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          color: colors.text, 
          minHeight: 100,
          textAlignVertical: 'top'
        }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe this transportation hub..."
        placeholderTextColor={colors.placeholder}
        multiline
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Submit Hub</Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <CheckCircle size={60} color="#4BB543" style={styles.successIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thank You!</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Your hub submission has been received for review. Our team will verify the information.
            </Text>
            <Text style={[styles.rewardText, { color: colors.primary }]}>
              If approved, you'll earn 100 TP for your contribution!
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={closeModal}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Warning Modal Styles
  warningContent: {
    width: '90%',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  warningTextContainer: {
    maxHeight: '60%',
    marginBottom: 20,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 22,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  warningButton: {
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  warningButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});