import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Lock } from 'lucide-react-native';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string }>();
  const token = params.access_token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Access token from URL:', token);
    if (!token) {
      Alert.alert('Invalid Link', 'No token found in URL.');
      console.log('Redirecting to /auth because token is missing');
      router.replace('/auth');
    }
  }, [token]);

  const handleResetPassword = async () => {
    console.log('Reset password clicked', password, confirmPassword);

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
      const { error } = await supabase.auth.updateUser({
        accessToken: token,
        password,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully.');
      console.log('Password reset successful, redirecting to /auth');
      router.replace('/auth');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>
          Enter your new password below
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#1ea2b1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#ccc"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              console.log('Password changed:', text);
            }}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? (
              <EyeOff size={24} color="#fff" />
            ) : (
              <Eye size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#1ea2b1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            secureTextEntry={!confirmVisible}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              console.log('Confirm password changed:', text);
            }}
          />
          <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
            {confirmVisible ? (
              <EyeOff size={24} color="#fff" />
            ) : (
              <Eye size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1ea2b1" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
