import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

export default function AddRoute() {
  const { colors } = useTheme();
  const router = useRouter();
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('');
  const [description, setDescription] = useState('');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: 'Bus', value: 'bus' },
    { label: 'Train', value: 'train' },
    { label: 'Taxi', value: 'taxi' },
  ]);

  const handleSubmit = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('route_requests')
        .insert({
          user_id: session.user.id,
          start_point: startPoint,
          end_point: endPoint,
          transport_type: selectedTransport,
          description,
        });

      if (error) throw error;
      Alert.alert('Success', 'Route request submitted!');
      router.back();
    } catch (error) {
      console.error('Error submitting route request:', error);
      Alert.alert('Error', 'Failed to submit route request');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Start Point</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={startPoint}
        onChangeText={setStartPoint}
      />

      <Text style={[styles.label, { color: colors.text }]}>End Point</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={endPoint}
        onChangeText={setEndPoint}
      />

      <Text style={[styles.label, { color: colors.text }]}>Select Transport</Text>


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
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
  },
}); 