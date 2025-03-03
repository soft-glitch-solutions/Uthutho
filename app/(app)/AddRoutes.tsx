import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';

export default function AddRoutes() {
  const { colors } = useTheme();
  const router = useRouter();
  const [hubs, setHubs] = useState([]);
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [transportType, setTransportType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [filteredHubs, setFilteredHubs] = useState([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      const { data, error } = await supabase.from('hubs').select('id, name');
      if (error) throw error;
      setHubs(data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  };

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
          transport_type: transportType,
          description,
          cost,
        });

      if (error) throw error;
      Alert.alert('Success', 'Route request submitted!');
      router.back();
    } catch (error) {
      console.error('Error submitting route request:', error);
      Alert.alert('Error', 'Failed to submit route request');
    }
  };

  const filterHubs = (query) => {
    setFilteredHubs(hubs.filter(hub => hub.name.toLowerCase().includes(query.toLowerCase())));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Start Point</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={startPoint}
        onChangeText={(text) => {
          setStartPoint(text);
          filterHubs(text);
          setShowStartDropdown(true);
        }}
        onFocus={() => setShowStartDropdown(true)}
      />
      {showStartDropdown && (
        <FlatList
          data={filteredHubs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setStartPoint(item.name);
                setShowStartDropdown(false);
              }}
            >
              <Text style={styles.dropdownItem}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
        />
      )}

      <Text style={[styles.label, { color: colors.text }]}>End Point</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={endPoint}
        onChangeText={(text) => {
          setEndPoint(text);
          filterHubs(text);
          setShowEndDropdown(true);
        }}
        onFocus={() => setShowEndDropdown(true)}
      />
      {showEndDropdown && (
        <FlatList
          data={filteredHubs.filter(hub => hub.name !== startPoint)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setEndPoint(item.name);
                setShowEndDropdown(false);
              }}
            >
              <Text style={styles.dropdownItem}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={styles.dropdown}
        />
      )}

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

      <Text style={[styles.label, { color: colors.text }]}>Cost</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
      />

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
    maxHeight: 100,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dropdownStyle: {
    borderRadius: 8,
  },
}); 