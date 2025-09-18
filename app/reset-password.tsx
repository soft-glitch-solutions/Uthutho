// app/reset-password.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string }>();
  const tokenFromParams = params?.access_token ?? null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasBrowserSession, setHasBrowserSession] = useState<boolean>(false);
  const [availableToken, setAvailableToken] = useState<string | null>(tokenFromParams);

  useEffect(() => {
    console.log('[ResetPassword] mounted. Platform:', Platform.OS);
    console.log('[ResetPassword] tokenFromParams:', tokenFromParams);

    // On web, attempt to parse tokens in the URL into a session
    // This uses Supabase's getSessionFromUrl() to convert the URL tokens into active browser session.
    // If it succeeds, you can call updateUser() without passing accessToken.
    const tryGetSessionFromUrl = async () => {
      if (Platform.OS === 'web') {
        try {
          console.log('[ResetPassword] running supabase.auth.getSessionFromUrl() (web)');
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) {
            console.warn('[ResetPassword] getSessionFromUrl error:', error.message || error);
          } else {
            console.log('[ResetPassword] getSessionFromUrl completed (no error)');
          }

          // Check whether there's a session now
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.warn('[ResetPassword] getSession after parsing URL error:', sessionError);
          } else {
            console.log('[ResetPassword] session after getSessionFromUrl:', sessionData?.session ?? null);
            if (sessionData?.session) {
              setHasBrowserSession(true);
              // If there's a session, we don't need to use the token param
              setAvailableToken(null);
            }
          }
        } catch (err) {
          console.error('[ResetPassword] error in getSessionFromUrl:', err);
        }
      }
    };

    tryGetSessionFromUrl();
  }, []);

  // console.log on password input changes (helpful for debugging)
  useEffect(() => {
    console.log('[ResetPassword] password changed. length=', password.length);
  }, [password]);

  useEffect(() => {
    console.log('[ResetPassword] confirmPassword changed. length=', confirmPassword.length);
  }, [confirmPassword]);

  const handleResetPassword = async () => {
    console.log('[ResetPassword] handleResetPassword pressed. hasBrowserSession:', hasBrowserSession, 'availableToken:', availableToken);
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      let result;
      if (hasBrowserSession) {
        // There is an active session in the browser (web flow)
        console.log('[ResetPassword] Using browser session flow: calling updateUser without accessToken');
        result = await supabase.auth.updateUser({ password });
      } else if (availableToken) {
        // No session — use accessToken explicitly (mobile deep link / fallback)
        console.log('[ResetPassword] No browser session. Using accessToken to update user. token length:', availableToken.length);
        result = await supabase.auth.updateUser({ password, accessToken: availableToken });
      } else {
        // No token and no session — cannot proceed
        console.error('[ResetPassword] No session and no token available. Aborting');
        Alert.alert('Invalid link', 'No reset token or session found. Please request a new password reset email.');
        return;
      }

      // result has shape { data, error } in many supabase clients; check for error
      // In some environments supabase.auth.updateUser returns { error } or throws — handle both:
      // If an error field exists:
      // @ts-ignore
      if (result?.error) {
        // @ts-ignore
        throw result.error;
      }

      // If supabase throws, it will end up in catch below
      console.log('[ResetPassword] Password update result:', result);
      Alert.alert('Success', 'Password updated successfully. You can sign in now.');
      router.replace('/auth');
    } catch (err: any) {
      console.error('[ResetPassword] Reset password error:', err);
      // Helpful message for missing session
      if (err?.message?.includes('Auth session missing')) {
        Alert.alert('Auth error', 'Session missing. Try opening link in your browser or request a new reset email.');
      } else {
        Alert.alert('Error', err?.message || 'Failed to reset password. Try requesting a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBackLogin = () => {
    console.log('[ResetPassword] goBackLogin pressed');
    router.replace('/auth');
  };

  // If no token and no session, show helpful message
  const showNoTokenWarning = !availableToken && !hasBrowserSession;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter a new password for your account.
        </Text>

        {showNoTokenWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No reset token or session detected. If you clicked the link in an email, try opening the link in your browser (or request a new reset email).
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            placeholder="New password"
            placeholderTextColor="#888"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
          <TouchableOpacity
            onPress={() => {
              setPasswordVisible(!passwordVisible);
              console.log('[ResetPassword] passwordVisible toggled:', !passwordVisible);
            }}
            style={styles.eyeButton}
          >
            {passwordVisible ? <EyeOff size={20} color="#ddd" /> : <Eye size={20} color="#ddd" />}
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Confirm new password"
          placeholderTextColor="#888"
          secureTextEntry={!passwordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, { marginTop: 12 }]}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={goBackLogin} style={styles.backToLogin}>
          <Text style={styles.backToLoginText}>Go back to login</Text>
        </TouchableOpacity>

        {/* Debug info for development */}
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
          <Text style={styles.debugText}>tokenFromParams: {String(tokenFromParams ?? '—')}</Text>
          <Text style={styles.debugText}>hasBrowserSession: {String(hasBrowserSession)}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = '#1ea2b1';
const BG = '#000000';
const MUTED = '#666666';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    padding: 20,
  },
  inner: {
    backgroundColor: '#0f0f0f',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#331111',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#442222',
  },
  warningText: {
    color: '#ffcccb',
    fontSize: 13,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  eyeButton: {
    marginLeft: 8,
    padding: 8,
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  backToLogin: {
    marginTop: 10,
    alignItems: 'center',
  },
  backToLoginText: {
    color: MUTED,
    fontSize: 13,
  },
  debugBox: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 10,
  },
  debugText: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
});
