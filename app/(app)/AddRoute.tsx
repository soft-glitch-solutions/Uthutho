import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import DropDownPicker from 'react-native-dropdown-picker';

// ... existing imports ...

export default function AddRoute() {
  const { colors } = useTheme();
  const router = useRouter();
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number | null>(null); // Optional cost field
  const [hubs, setHubs] = useState([]); // State to store hubs
  const [startOpen, setStartOpen] = useState(false); // State for start dropdown
  const [endOpen, setEndOpen] = useState(false); // State for end dropdown
  const [isSubmitted, setIsSubmitted] = useState(false); // State for thank-you message

  // Fetch hubs from Supabase
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
          status: 'pending', // Default status
          cost, // Optional cost
        });

      if (error) throw error;

      setIsSubmitted(true); // Show thank-you message
      setTimeout(() => {
        router.back(); // Navigate back after 3 seconds
      }, 3000);
    } catch (error) {
      console.error('Error submitting route request:', error);
      Alert.alert('Error', 'Failed to submit route request');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSubmitted ? (
        <View style={styles.thankYouContainer}>
          <Text style={[styles.thankYouText, { color: colors.text }]}>Thank you for your submission!</Text>
          <Text style={[styles.thankYouSubtext, { color: colors.text }]}>
            Your route request has been received. We'll review it shortly.
          </Text>
        </View>
      ) : (
        <>
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
            textStyle={{ color: colors.text }} // Selected text color
            placeholderStyle={{ color: colors.text }} // Placeholder text color
            searchTextInputStyle={{ color: colors.text }} // Search text color
            listItemLabelStyle={{ color: colors.text }} // Dropdown list item text color
            searchPlaceholderTextColor={colors.text} // Search placeholder text color
            tickIconStyle={{ tintColor: colors.text }} // Tick icon color
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
            textStyle={{ color: colors.text }} // Selected text color
            placeholderStyle={{ color: colors.text }} // Placeholder text color
            searchTextInputStyle={{ color: colors.text }} // Search text color
            listItemLabelStyle={{ color: colors.text }} // Dropdown list item text color
            searchPlaceholderTextColor={colors.text} // Search placeholder text color
            tickIconStyle={{ tintColor: colors.text }} // Tick icon color
          />

          <Text style={[styles.label, { color: colors.text }]}>Select Transport</Text>
          {/* ... existing transport selection code ... */}

          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Cost (Optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={cost ? cost.toString() : ''}
            onChangeText={(text) => setCost(text ? parseInt(text, 10) : null)}
            keyboardType="numeric"
            placeholder="Enter cost (optional)"
            placeholderTextColor={colors.text} // Set placeholder text color
          />

          <Button title="Submit" onPress={handleSubmit} color={colors.primary} />
        </>
      )}
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
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  thankYouContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  thankYouSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});