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
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string }>();
  const token = params.access_token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert('Invalid Link', 'No token found in URL.');
      router.replace('/auth');
    }
  }, [token]);

  useEffect(() => {
    console.log('Password changed:', password);
  }, [password]);

  useEffect(() => {
    console.log('Confirm password changed:', confirmPassword);
  }, [confirmPassword]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid or expired reset link.');
      return;
    }

    setLoading(true);
    try {
      // Set session from the token first
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token: token });
      if (sessionError) throw sessionError;

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      Alert.alert('Success', 'Password updated successfully.');
      router.replace('/auth'); // Redirect to login
    } catch (err: any) {
      console.error('Reset password error:', err);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reset your password</Text>

      <View style={styles.inputContainer}>
        <Lock size={20} color="#1ea2b1" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          {passwordVisible ? <EyeOff size={24} color="#fff" /> : <Eye size={24} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color="#1ea2b1" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!confirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
          {confirmPasswordVisible ? <EyeOff size={24} color="#fff" /> : <Eye size={24} color="#fff" />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1ea2b1" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
      )}

      {/* Small "Go back to login" link */}
      <TouchableOpacity onPress={() => router.replace('/auth')} style={styles.goBackContainer}>
        <Text style={styles.goBackText}>Go back to login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#ffffff',
  },
  icon: {
    marginRight: 8,
  },
  button: {
    backgroundColor: '#1ea2b1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    color: '#ffffff',
    textAlign: 'center',
  },
  goBackContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  goBackText: {
    color: '#1ea2b1',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
