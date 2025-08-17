import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Success', 'Your password has been updated!');
      router.replace('/auth');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Reset Password</Text>
      <TextInput
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 20, padding: 10, borderWidth: 1 }}
      />
      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        style={{ backgroundColor: 'blue', padding: 15, alignItems: 'center' }}
      >
        <Text style={{ color: 'white' }}>
          {loading ? 'Updating...' : 'Update Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}