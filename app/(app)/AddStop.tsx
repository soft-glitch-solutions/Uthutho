import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddStop() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available routes when the component mounts
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        console.log('Fetching routes...');
        const { data: routesData, error } = await supabase
          .from('routes')
          .select('id, name');

        if (error) {
          console.error('Error fetching routes:', error);
          throw error;
        }

        console.log('Routes fetched successfully:', routesData);
        setRoutes(routesData || []);
      } catch (error) {
        console.error('Error in fetchRoutes:', error);
        Alert.alert('Error', 'Failed to fetch routes: ' + error.message);
      }
    };

    fetchRoutes();
  }, []);

  // Function to extract latitude and longitude from Google Maps URL
  const extractCoordinates = (url) => {
    try {
      console.log('Extracting coordinates from URL:', url);
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(regex);
      
      if (match) {
        const lat = match[1];
        const lng = match[2];
        console.log('Extracted coordinates - Latitude:', lat, 'Longitude:', lng);
        setLatitude(lat);
        setLongitude(lng);
        return { latitude: lat, longitude: lng };
      } else {
        console.warn('No coordinates found in URL');
        Alert.alert('Error', 'Invalid Google Maps URL format');
        return null;
      }
    } catch (error) {
      console.error('Error in extractCoordinates:', error);
      return null;
    }
  };

  const awardPoints = async (userId, points) => {
    try {
      console.log(`Awarding ${points} TP to user ${userId}`);
      const { data, error } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          points: points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Error awarding points:', error);
        throw error;
      }

      console.log('Points awarded successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in awardPoints:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    console.log('--- Starting submission process ---');
    console.log('Form data:', {
      name,
      googleMapsUrl,
      latitude,
      longitude,
      cost,
      description,
      routeId
    });

    try {
      // 1. Verify user session
      console.log('Checking user session...');
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      const userId = session.user.id;
      
      if (sessionError || !session?.user) {
        console.error('Session error or no user:', { sessionError, session });
        throw new Error('You must be logged in to submit a stop request.');
      }

      console.log('User session verified:', session.user.id);

      // 2. Validate form inputs
      if (!routeId) {
        console.error('Validation failed: No route selected');
        throw new Error('Please select a route.');
      }

      if (!latitude || !longitude) {
        console.error('Validation failed: Missing coordinates');
        throw new Error('Please provide a valid Google Maps URL.');
      }

      if (!name) {
        console.error('Validation failed: Missing stop name');
        throw new Error('Please provide a stop name.');
      }

      // 3. Prepare submission data
      const submissionData = {
        user_id: session.user.id,
        route_id: routeId,
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cost: cost ? parseFloat(cost) : null,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Prepared submission data:', submissionData);

      // 4. Submit to Supabase
      console.log('Submitting to stop_requests table...');
      const { data: submissionResult, error: submissionError } = await supabase
        .from('stop_requests')
        .insert(submissionData)
        .select();

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw submissionError;
      }

      console.log('Submission successful:', submissionResult);

      // 5. Award points
      try {
        await awardPoints(session.user.id, 10);
      } catch (pointsError) {
        console.error('Failed to award points, but submission succeeded:', pointsError);
        // Continue even if points fail
      }

      // 6. Show success
      setShowSuccessModal(true);
      console.log('--- Submission process completed successfully ---');
    } catch (error) {
      console.error('Submission failed:', error);
      Alert.alert(
        'Submission Error',
        error.message || 'Failed to submit stop request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Stop Name *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Enter stop name"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Google Maps URL *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={googleMapsUrl}
        onChangeText={(text) => {
          setGoogleMapsUrl(text);
          extractCoordinates(text);
        }}
        placeholder="https://maps.google.com/?q=..."
        placeholderTextColor={colors.placeholder}
        keyboardType="url"
      />

      <View style={styles.coordinatesContainer}>
        <View style={styles.coordinateInput}>
          <Text style={[styles.label, { color: colors.text }]}>Latitude</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={latitude}
            editable={false}
            placeholder="Auto-filled from URL"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.coordinateInput}>
          <Text style={[styles.label, { color: colors.text }]}>Longitude</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={longitude}
            editable={false}
            placeholder="Auto-filled from URL"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Cost (Optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        placeholderTextColor={colors.placeholder}
        keyboardType="decimal-pad"
      />

      <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, { 
          borderColor: colors.border, 
          color: colors.text,
          minHeight: 100,
          textAlignVertical: 'top',
          paddingTop: 12,
        }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe this stop..."
        placeholderTextColor={colors.placeholder}
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Select Route *</Text>
      <Picker
        selectedValue={routeId}
        onValueChange={(itemValue) => setRouteId(itemValue)}
        style={[styles.dropdown, { color: colors.text, backgroundColor: colors.inputBackground }]}
        dropdownIconColor={colors.text}
      >
        <Picker.Item label="Select a route" value="" enabled={false} />
        {routes.map((route) => (
          <Picker.Item 
            key={route.id} 
            label={route.name} 
            value={route.id} 
          />
        ))}
      </Picker>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Stop Request'}
        </Text>
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
            <MaterialIcons name="check-circle" size={60} color="#4BB543" style={styles.successIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thank You!</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Your stop submission has been received. We'll review it and provide feedback soon.
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
    marginBottom: 24,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coordinateInput: {
    width: '48%',
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