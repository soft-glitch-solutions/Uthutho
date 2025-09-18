import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string }>();
  const token = params.access_token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert('Invalid Link', 'No token found in URL.');
      router.replace('/auth');
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Use the token to update password without a session
      const { error } = await supabase.auth.updateUser({
        password,
        accessToken: token,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully.');
      router.replace('/auth'); // redirect to login
    } catch (err: any) {
      console.log('Reset password error:', err);
      Alert.alert('Error', err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Invalid reset link.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reset Your Password</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={(text) => {
            console.log('Password changed:', text);
            setPassword(text);
          }}
        />
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setPasswordVisible(!passwordVisible)}
        >
          {passwordVisible ? (
            <EyeOff size={24} color="#fff" />
          ) : (
            <Eye size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/auth')}
        style={styles.backToLogin}
      >
        <Text style={styles.backText}>Go back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#fff',
  },
  icon: {
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#1ea2b1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backToLogin: {
    marginTop: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#aaa',
    fontSize: 14,
  },
});
