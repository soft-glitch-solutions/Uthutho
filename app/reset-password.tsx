import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react-native';

const PRIMARY = '#1ea2b1';
const BG = '#000000';
const MUTED = '#666666';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const access_token = params.access_token as string | undefined;
  const refresh_token = params.refresh_token as string | undefined;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔑 Restore Supabase session on load (web or mobile)
  useEffect(() => {
    const restoreSession = async () => {
      console.log('[ResetPassword] platform=', Platform.OS);
      console.log('[ResetPassword] access_token=', access_token?.slice(0, 8));
      console.log('[ResetPassword] refresh_token=', refresh_token?.slice(0, 8));

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          console.error('[ResetPassword] setSession error:', error.message);
        } else {
          console.log('[ResetPassword] session restored:', !!data.session);
        }
      }
    };
    restoreSession();
  }, [access_token, refresh_token]);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully.');
      router.replace('/auth');
    } catch (err: any) {
      console.error('Reset password error:', err);
      Alert.alert('Error', err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!access_token || !refresh_token) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Invalid reset link.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter and confirm your new password</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={22} color="#fff" /> : <Eye size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        <View style={[styles.inputRow, { marginTop: 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={22} color="#fff" /> : <Eye size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.resetButtonText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/auth')}>
          <Text style={styles.backToLoginText}>← Back to login</Text>
        </TouchableOpacity>

        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>platform={Platform.OS}</Text>
          <Text style={styles.debugText}>token={access_token?.slice(0, 8)}...</Text>
          <Text style={styles.debugText}>refresh={refresh_token?.slice(0, 8)}...</Text>
          <Text style={styles.debugText}>passwordLen={password.length}</Text>
          <Text style={styles.debugText}>confirmLen={confirmPassword.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 20 },
  inner: { backgroundColor: '#0f0f0f', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: MUTED, textAlign: 'center', marginBottom: 16 },
  warningText: { color: '#ffcccb', fontSize: 13, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  eyeButton: { marginLeft: 8, padding: 8 },
  resetButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonDisabled: { opacity: 0.6 },
  resetButtonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  backToLogin: { marginTop: 10, alignItems: 'center' },
  backToLoginText: { color: MUTED, fontSize: 13 },
  debugBox: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 10 },
  debugText: { color: '#777', fontSize: 12, marginTop: 4 },
});
