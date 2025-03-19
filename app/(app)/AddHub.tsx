import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Picker } from '@react-native-picker/picker';

export default function AddHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [transportType, setTransportType] = useState('');
  const [description, setDescription] = useState('');

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
      Alert.alert('Success', 'Hub request submitted!');
      router.back();
    } catch (error) {
      console.error('Error submitting hub request:', error);
      Alert.alert('Error', 'Failed to submit hub request');
    }
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
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Submit" onPress={handleSubmit} color={colors.primary} />
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
  dropdownStyle: {
    borderRadius: 8,
  },
}); 