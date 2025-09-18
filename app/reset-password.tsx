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
    console.log('[ResetPassword] tokenFromParams (raw):', tokenFromParams);

    const tryWebSession = async () => {
      if (Platform.OS !== 'web') {
        console.log('[ResetPassword] not web — skipping web session parse');
        return;
      }

      try {
        console.log('[ResetPassword] calling supabase.auth.getSessionFromUrl() (web)');
        const { error: parseError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (parseError) {
          console.warn('[ResetPassword] getSessionFromUrl returned error:', parseError);
        } else {
          console.log('[ResetPassword] getSessionFromUrl completed (no immediate error)');
        }
      } catch (err) {
        console.warn('[ResetPassword] getSessionFromUrl threw:', err);
      }

      // Check if we have a session now
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[ResetPassword] getSession error:', sessionError);
        } else {
          console.log('[ResetPassword] session after getSessionFromUrl:', sessionData?.session ?? null);
          if (sessionData?.session) {
            setHasBrowserSession(true);
            setAvailableToken(null);
            // remove token param if present for cleanliness
            if (window?.location?.search?.includes('access_token=')) {
              try {
                const u = new URL(window.location.href);
                u.searchParams.delete('access_token');
                window.history.replaceState({}, '', u.toString());
                console.log('[ResetPassword] removed access_token from URL');
              } catch (err) {
                console.warn('[ResetPassword] removing token from URL failed:', err);
              }
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[ResetPassword] checking session threw:', err);
      }

      // If we didn't get a session but we do have an access_token in query params, try setSession
      if (tokenFromParams) {
        try {
          console.log('[ResetPassword] No session yet — attempting supabase.auth.setSession({ access_token }) using tokenFromParams');
          // supabase.auth.setSession expects { access_token, refresh_token? }
          const setResult = await supabase.auth.setSession({ access_token: tokenFromParams });
          // setResult may contain data/error depending on SDK version
          // Try both shapes:
          // v2 -> returns { data, error }
          // older -> may throw
          console.log('[ResetPassword] setSession result:', setResult);
          if ((setResult as any)?.error) {
            console.warn('[ResetPassword] setSession returned error:', (setResult as any).error);
          } else {
            // Confirm session now
            const { data: sessionData2, error: sessionError2 } = await supabase.auth.getSession();
            if (sessionError2) {
              console.warn('[ResetPassword] getSession after setSession error:', sessionError2);
            } else {
              console.log('[ResetPassword] session after setSession:', sessionData2?.session ?? null);
              if (sessionData2?.session) {
                setHasBrowserSession(true);
                setAvailableToken(null);
                // remove access_token from URL for cleanliness
                try {
                  const u = new URL(window.location.href);
                  u.searchParams.delete('access_token');
                  window.history.replaceState({}, '', u.toString());
                  console.log('[ResetPassword] removed access_token from URL after setSession');
                } catch (err) {
                  console.warn('[ResetPassword] removing token from URL failed:', err);
                }
                return;
              }
            }
          }
        } catch (err) {
          console.warn('[ResetPassword] setSession threw:', err);
          // keep fallback token in availableToken for updateUser fallback
          setAvailableToken(tokenFromParams);
        }
      }

      // If we reach here, no browser session yet — keep availableToken as fallback
      console.log('[ResetPassword] finished web session attempts. hasBrowserSession:', hasBrowserSession, 'availableToken:', availableToken);
    };

    tryWebSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Branch: browser session available -> call updateUser normally
      if (hasBrowserSession) {
        console.log('[ResetPassword] calling updateUser with password using browser session');
        const { data, error } = await supabase.auth.updateUser({ password });
        console.log('[ResetPassword] updateUser returned:', { data, error });
        if (error) throw error;
      } else if (availableToken) {
        // No session - pass accessToken explicitly
        console.log('[ResetPassword] calling updateUser with accessToken fallback');
        // Some SDK versions accept { password, accessToken }
        // Others might throw. We'll try and log result.
        try {
          // @ts-ignore - accessToken param in updateUser is supported in some Supabase clients
          const { data, error } = await supabase.auth.updateUser({ password, accessToken: availableToken });
          console.log('[ResetPassword] updateUser(accessToken) returned:', { data, error });
          if (error) throw error;
        } catch (err) {
          console.warn('[ResetPassword] updateUser(accessToken) threw, trying setSession+updateUser fallback', err);
          // fallback: try to set session and then update user
          try {
            const setResult = await supabase.auth.setSession({ access_token: availableToken });
            console.log('[ResetPassword] fallback setSession result:', setResult);
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
            console.log('[ResetPassword] session after fallback setSession:', { sessionData, sessionErr });
            if (sessionErr) throw sessionErr;
            const { data: updData, error: updErr } = await supabase.auth.updateUser({ password });
            console.log('[ResetPassword] fallback updateUser after setSession:', { updData, updErr });
            if (updErr) throw updErr;
          } catch (innerErr) {
            console.error('[ResetPassword] fallback setSession+updateUser failed:', innerErr);
            throw innerErr;
          }
        }
      } else {
        console.error('[ResetPassword] No session and no token available - cannot reset password');
        Alert.alert('Invalid link', 'No reset token or session found. Please request a new password reset email.');
        return;
      }

      console.log('[ResetPassword] password update successful');
      Alert.alert('Success', 'Password updated successfully. You can sign in now.');
      router.replace('/auth');
    } catch (err: any) {
      console.error('[ResetPassword] Reset password error:', err);
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
              No reset token or session detected. If you clicked the link in an email, try opening the link in your browser or request a new reset email.
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

        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
          <Text style={styles.debugText}>tokenFromParams: {String(tokenFromParams ?? '—')}</Text>
          <Text style={styles.debugText}>hasBrowserSession: {String(hasBrowserSession)}</Text>
          <Text style={styles.debugText}>availableToken: {String(availableToken ?? '—')}</Text>
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
