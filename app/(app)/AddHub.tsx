import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle } from "lucide-react-native";
import WarningModal from '@/components/WarningModal';

export default function AddHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [transportType, setTransportType] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(true);

  const extractCoordinates = (url: string) => {
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
          status: 'pending'
        });

      if (error) throw error;
      await awardPoints(userId, 0);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting hub request:', error);
      Alert.alert('Error', 'Failed to submit hub request');
    }
  };

  const awardPoints = async (userId: string, points: number) => {
    try {
      const { error } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          points,
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
      <WarningModal
        visible={showWarningModal}
        onAccept={handleAcceptWarning}
        onReject={handleRejectWarning}
        colors={colors}
        type="hub"
      />

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
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  dropdown: { borderWidth: 1, borderRadius: 8, marginBottom: 16 },
  submitButton: { borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { width: '100%', borderRadius: 15, padding: 25, alignItems: 'center' },
  successIcon: { marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center', lineHeight: 22 },
  rewardText: { fontSize: 18, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  modalButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 30, width: '100%' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
