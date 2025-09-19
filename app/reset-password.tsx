// app/reset-password.tsx
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
  const params = useLocalSearchParams<{ access_token?: string }>();
  const paramToken = params.access_token ?? null;

  const [token, setToken] = useState<string | null>(null);
  const [sessionAvailable, setSessionAvailable] = useState<boolean | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Attempt to detect token from params, hash (web), or query
    console.log('[ResetPassword] platform:', Platform.OS);
    console.log('[ResetPassword] paramToken (from useLocalSearchParams):', paramToken);

    const detectTokenFromHash = () => {
      try {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash || '';
        if (!hash) return null;
        // hash like "#access_token=...&type=...&refresh_token=..."
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        return hashParams.get('access_token') || hashParams.get('accessToken') || null;
      } catch (err) {
        console.warn('[ResetPassword] error parsing window.location.hash', err);
        return null;
      }
    };

    const detectTokenFromSearch = () => {
      try {
        if (typeof window === 'undefined') return null;
        const search = window.location.search || '';
        if (!search) return null;
        const searchParams = new URLSearchParams(search);
        return searchParams.get('access_token') || searchParams.get('accessToken') || null;
      } catch (err) {
        console.warn('[ResetPassword] error parsing window.location.search', err);
        return null;
      }
    };

    const runDetection = async () => {
      const hashToken = Platform.OS === 'web' ? detectTokenFromHash() : null;
      const searchToken = Platform.OS === 'web' ? detectTokenFromSearch() : null;

      const detected = paramToken || hashToken || searchToken;
      console.log('[ResetPassword] detected tokens:', { paramToken, hashToken, searchToken });

      if (Platform.OS === 'web') {
        // If there is a hash (typical for Supabase redirect), try to let Supabase parse and store a session
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash && hash.includes('access_token')) {
          console.log('[ResetPassword] calling supabase.auth.getSessionFromUrl() (web hash present)');
          try {
            // This will attempt to read and store the session that Supabase placed in the URL fragment
            const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            console.log('[ResetPassword] getSessionFromUrl result:', { data, error });
            if (error) {
              console.warn('[ResetPassword] getSessionFromUrl error:', error);
            }
            const { data: sessionData, error: getSessionErr } = await supabase.auth.getSession();
            console.log('[ResetPassword] session after getSessionFromUrl:', sessionData, getSessionErr);
            setSessionAvailable(!!sessionData?.session);
            if (sessionData?.session) {
              setToken(null); // session is available so we don't need a raw token
            } else if (detected) {
              setToken(detected);
            }
            return;
          } catch (err) {
            console.error('[ResetPassword] getSessionFromUrl threw:', err);
            // fallback below
          }
        }
      }

      // Not web hash flow or getSessionFromUrl failed: just set whatever token we detected
      if (detected) {
        console.log('[ResetPassword] Using detected token (no web session created):', detected);
        setToken(detected);
      } else {
        console.log('[ResetPassword] No token detected from params/hash/search.');
        setToken(null);
      }

      // Also try to read existing session (if any)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[ResetPassword] session from getSession():', sessionData);
        setSessionAvailable(!!sessionData?.session);
      } catch (err) {
        console.warn('[ResetPassword] error checking session:', err);
        setSessionAvailable(false);
      }
    };

    runDetection();
  }, [paramToken]);

  // Helper that tries to reset using available session or token
  const handleResetPassword = async () => {
    console.log('[ResetPassword] password changed. length=', password.length);
    console.log('[ResetPassword] confirmPassword changed. length=', confirmPassword.length);
    console.log('[ResetPassword] token state at submit:', token);
    console.log('[ResetPassword] sessionAvailable at submit:', sessionAvailable);

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
      // If there's a valid browser session (web) or a stored session (mobile), update the user directly:
      const { data: currentSessionData } = await supabase.auth.getSession();
      const hasSession = !!currentSessionData?.session;
      console.log('[ResetPassword] currentSessionData:', currentSessionData);

      if (hasSession) {
        console.log('[ResetPassword] Updating user using existing session...');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        Alert.alert('Success', 'Password updated successfully.');
        router.replace('/auth');
        return;
      }

      // No session — if we have a token we can try updateUser with accessToken (some supabase clients accept this)
      if (token) {
        console.log('[ResetPassword] No active session but token present. Attempting updateUser with accessToken...');
        try {
          // Some Supabase JS versions accept `accessToken` when updating user to authenticate the call.
          // If your SDK doesn't support this, you'll need to establish a session on the client first
          // or handle the reset on a server-side endpoint.
          const { error } = await supabase.auth.updateUser({ password, accessToken: token } as any);
          // NOTE: using `as any` because TS types may not include accessToken depending on supabase-js version
          if (error) throw error;

          Alert.alert('Success', 'Password updated successfully.');
          router.replace('/auth');
          return;
        } catch (err) {
          console.warn('[ResetPassword] updateUser with accessToken failed:', err);
          // Fallthrough to show an explanatory message below
        }
      }

      // If we reach here, we couldn't update password because no session and token-based update failed
      console.error('[ResetPassword] No reset session found and token-based update failed.');
      Alert.alert(
        'Reset failed',
        'No reset session or valid token was found. If you clicked the link in email, try opening it in the browser (not the app), or request a new reset email.'
      );
    } catch (err: any) {
      console.error('[ResetPassword] unexpected error:', err);
      Alert.alert('Error', err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // UI: show helpful message if no token and no session
  const showInvalid = token === null && sessionAvailable === false;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter and confirm your new password</Text>

        {showInvalid && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No reset token or session detected. If you clicked the link in an email, try opening the link in your device browser (web) or request a new reset email.
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              console.log('[ResetPassword] password onChange length=', t.length);
            }}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel="Toggle password visibility"
          >
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
            onChangeText={(t) => {
              setConfirmPassword(t);
              console.log('[ResetPassword] confirmPassword onChange length=', t.length);
            }}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            accessibilityLabel="Toggle confirm password visibility"
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
          <Text style={styles.debugText}>token={token ? token.slice(0, 12) + '...' : 'null'}</Text>
          <Text style={styles.debugText}>sessionAvailable={String(sessionAvailable)}</Text>
          <Text style={styles.debugText}>passwordLen={password.length}</Text>
          <Text style={styles.debugText}>confirmLen={confirmPassword.length}</Text>
        </View>
      </View>
    </View>
  );
}

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
