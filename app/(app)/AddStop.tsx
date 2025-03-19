import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { Picker } from '@react-native-picker/picker';

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
  const [routes, setRoutes] = useState([]); // To store available routes

  // Fetch available routes when the component mounts
  React.useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { data: routesData, error } = await supabase
          .from('routes')
          .select('id, name');

        if (error) throw error;
        setRoutes(routesData || []);
      } catch (error) {
        console.error('Error fetching routes:', error);
        Alert.alert('Error', 'Failed to fetch routes');
      }
    };

    fetchRoutes();
  }, []);

  // Function to extract latitude and longitude from Google Maps URL
  const extractCoordinates = (url) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      setLatitude(match[1]);
      setLongitude(match[2]);
    } else {
      Alert.alert('Error', 'Invalid Google Maps URL');
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'You must be logged in to submit a stop request.');
        return;
      }

      if (!routeId) {
        Alert.alert('Error', 'Please select a route.');
        return;
      }

      if (!latitude || !longitude) {
        Alert.alert('Error', 'Please provide a valid Google Maps URL.');
        return;
      }

      const { error } = await supabase
        .from('stop_requests')
        .insert({
          user_id: session.user.id,
          route_id: routeId,
          name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          cost: cost ? parseFloat(cost) : null,
          description,
        });

      if (error) throw error;
      Alert.alert('Success', 'Stop request submitted!');
      router.back();
    } catch (error) {
      console.error('Error submitting stop request:', error);
      Alert.alert('Error', 'Failed to submit stop request');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Stop Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Enter stop name"
      />

      <Text style={[styles.label, { color: colors.text }]}>Google Maps URL</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={googleMapsUrl}
        onChangeText={(text) => {
          setGoogleMapsUrl(text);
          extractCoordinates(text); // Extract coordinates when the URL changes
        }}
        placeholder="Enter Google Maps URL"
      />

      <Text style={[styles.label, { color: colors.text }]}>Latitude</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={latitude}
        editable={false} // Disable manual editing
        placeholder="Latitude (auto-filled)"
      />

      <Text style={[styles.label, { color: colors.text }]}>Longitude</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={longitude}
        editable={false} // Disable manual editing
        placeholder="Longitude (auto-filled)"
      />

      <Text style={[styles.label, { color: colors.text }]}>Cost (Optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={cost}
        onChangeText={setCost}
        placeholder="Enter cost"
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Select Route</Text>
      <Picker
        selectedValue={routeId}
        onValueChange={(itemValue) => setRouteId(itemValue)}
        style={[styles.dropdown, { color: colors.text }]}
      >
        <Picker.Item label="Select a route" value="" />
        {routes.map((route) => (
          <Picker.Item key={route.id} label={route.name} value={route.id} />
        ))}
      </Picker>

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
});