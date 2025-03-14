import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import DropDownPicker from 'react-native-dropdown-picker';


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
  const [startOpen, setStartOpen] = useState(false); // State for start dropdown
  const [endOpen, setEndOpen] = useState(false); // State for end dropdown
  const [hubs, setHubs] = useState([]); // State to store hubs


  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const { data, error } = await supabase
          .from('hubs')
          .select('id, name'); // Fetch hub ID and name

        if (error) throw error;

        // Format hubs for dropdown
        const formattedHubs = data.map((hub) => ({
          label: hub.name,
          value: hub.id,
        }));
        setHubs(formattedHubs);
      } catch (error) {
        console.error('Error fetching hubs:', error);
        Alert.alert('Error', 'Failed to fetch hubs');
      }
    };

    fetchHubs();
  }, []);


  const handleSubmit = async () => {

    if (!startPoint || !endPoint) {
      Alert.alert('Error', 'Please select both start and end points');
      return;
    }

    if (startPoint === endPoint) {
      Alert.alert('Error', 'Start and end points cannot be the same');
      return;
    }

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
      <DropDownPicker
        open={startOpen}
        value={startPoint}
        items={hubs}
        setOpen={setStartOpen}
        setValue={setStartPoint}
        placeholder="Select start point"
        searchable={true}
        searchPlaceholder="Search for a hub..."
        style={[styles.dropdown, { borderColor: colors.border }]}
        dropDownContainerStyle={{ borderColor: colors.border }}
        textStyle={{ color: colors.text }}
      />

      <Text style={[styles.label, { color: colors.text }]}>End Point</Text>
      <DropDownPicker
        open={endOpen}
        value={endPoint}
        items={hubs}
        setOpen={setEndOpen}
        setValue={setEndPoint}
        placeholder="Select end point"
        searchable={true}
        searchPlaceholder="Search for a hub..."
        style={[styles.dropdown, { borderColor: colors.border }]}
        dropDownContainerStyle={{ borderColor: colors.border }}
        textStyle={{ color: colors.text }}
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
}); 