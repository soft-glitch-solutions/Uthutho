import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [transportType, setTransportType] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        });

      if (error) throw error;
      
      // Award points - you'll need to implement this in your backend
      await awardPoints(userId, 10);
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting hub request:', error);
      Alert.alert('Error', 'Failed to submit hub request');
    }
  };

  const awardPoints = async (userId, points) => {
    // Implement your points awarding logic here
    // This is just a placeholder - you'll need to update your database
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Hub Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Address</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={address}
        onChangeText={setAddress}
      />

      <Text style={[styles.label, { color: colors.text }]}>Google Maps URL</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={googleMapsUrl}
        onChangeText={setGoogleMapsUrl}
        placeholder="https://maps.google.com/?q=..."
      />

      <Text style={[styles.label, { color: colors.text }]}>Transport Type</Text>
      <Picker
        selectedValue={transportType || ''}
        onValueChange={(itemValue) => setTransportType(itemValue)}
        style={[styles.dropdown, { color: colors.text }]}
      >
        <Picker.Item label="Select Transport Type" value="" />
        <Picker.Item label="Train" value="train" />
        <Picker.Item label="Bus" value="bus" />
        <Picker.Item label="Taxi" value="taxi" />
      </Picker>

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 100 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Submit" onPress={handleSubmit} color={colors.primary} />

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <MaterialIcons name="check-circle" size={60} color="#4BB543" style={styles.successIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thank You!</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Your hub submission has been received. We'll review it and provide feedback soon.
            </Text>
            <Text style={[styles.rewardText, { color: colors.primary }]}>
              You've earned 10 TP for your contribution!
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
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