import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface ProfileFormProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    preferred_transport: string | null;
  };
  isLoading: boolean;
  onSubmit: () => void;
  onChange: (profile: any) => void;
}

const ProfileForm = ({ profile, isLoading, onSubmit, onChange }: ProfileFormProps) => {
  const transportOptions = ['train', 'taxi', 'bus'];

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        value={profile.first_name || ''}
        onChangeText={(text) => onChange({ ...profile, first_name: text })}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={profile.last_name || ''}
        onChangeText={(text) => onChange({ ...profile, last_name: text })}
      />

      <Text style={styles.label}>Preferred Transport</Text>
      <Picker
        selectedValue={profile.preferred_transport || ''}
        onValueChange={(itemValue) => onChange({ ...profile, preferred_transport: itemValue })}
        style={styles.picker}
      >
        <Picker.Item label="Select an option" value="" />
        {transportOptions.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Profile'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  picker: {
    height: 40,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileForm;