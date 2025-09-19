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
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const paramToken = params.access_token ?? null;
  const paramRefresh = params.refresh_token ?? null;

  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessionAvailable, setSessionAvailable] = useState<boolean | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    console.log('[ResetPassword] platform:', Platform.OS);
    console.log('[ResetPassword] params from router:', params);

    // Helper: parse URL fragment (hash) -> returns object of params
    const parseHash = () => {
      try {
        if (typeof window === 'undefined') return {};
        const hash = window.location.hash || '';
        if (!hash) return {};
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const out: Record<string, string> = {};
        hashParams.forEach((v, k) => (out[k] = v));
        return out;
      } catch (err) {
        console.warn('[ResetPassword] parseHash error', err);
        return {};
      }
    };

    // Helper: parse query string
    const parseQuery = () => {
      try {
        if (typeof window === 'undefined') return {};
        const search = window.location.search || '';
        if (!search) return {};
        const searchParams = new URLSearchParams(search);
        const out: Record<string, string> = {};
        searchParams.forEach((v, k) => (out[k] = v));
        return out;
      } catch (err) {
        console.warn('[ResetPassword] parseQuery error', err);
        return {};
      }
    };

    const detectTokensAndSession = async () => {
      const hashParams = Platform.OS === 'web' ? parseHash() : {};
      const queryParams = Platform.OS === 'web' ? parseQuery() : {};

      const detectedAccessToken =
        paramToken || hashParams['access_token'] || hashParams['accessToken'] || queryParams['access_token'] || queryParams['accessToken'] || null;

      const detectedRefreshToken =
        paramRefresh || hashParams['refresh_token'] || hashParams['refreshToken'] || queryParams['refresh_token'] || queryParams['refreshToken'] || null;

      console.log('[ResetPassword] detected tokens:', { detectedAccessToken, detectedRefreshToken, hashParams, queryParams });

      // If web and hash contains tokens, try to set session using setSession()
      if (Platform.OS === 'web' && (hashParams['access_token'] || hashParams['refresh_token'])) {
        try {
          console.log('[ResetPassword] attempting supabase.auth.setSession from fragment (web).');
          const setRes = await supabase.auth.setSession({
            access_token: hashParams['access_token'] || null,
            refresh_token: hashParams['refresh_token'] || null,
          } as any); // some SDKs / typings require casting
          console.log('[ResetPassword] setSession result:', setRes);
          // clear the hash so tokens are not exposed
          try {
            history.replaceState(null, '', window.location.pathname + window.location.search);
            console.log('[ResetPassword] cleared window.location.hash');
          } catch (err) {
            console.warn('[ResetPassword] failed to clear hash:', err);
          }
        } catch (err) {
          console.warn('[ResetPassword] setSession from fragment failed:', err);
        }
      }

      // If we have a detected access token (from params or query) but no web fragment flow, store it in state
      if (detectedAccessToken) {
        setToken(detectedAccessToken);
        if (detectedRefreshToken) setRefreshToken(detectedRefreshToken);
      }

      // Check if we already have a stored session in client
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[ResetPassword] session from getSession():', sessionData);
        setSessionAvailable(!!sessionData?.session);
      } catch (err) {
        console.warn('[ResetPassword] getSession() error:', err);
        setSessionAvailable(false);
      }
    };

    detectTokensAndSession();
  }, [paramToken, paramRefresh, params]);

  const handleResetPassword = async () => {
    console.log('[ResetPassword] submit pressed. token=', token ? token.slice(0, 12) + '...' : null, 'refresh=', refreshToken ? 'present' : null);
    console.log('[ResetPassword] password len', password.length, 'confirm len', confirmPassword.length);

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please enter both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Re-check session
      const { data: currentSession } = await supabase.auth.getSession();
      const hasSession = !!currentSession?.session;
      console.log('[ResetPassword] currentSession at submit:', currentSession);

      if (!hasSession && token) {
        // If we only have access token (maybe came from mobile deep link), try to setSession manually
        try {
          console.log('[ResetPassword] trying supabase.auth.setSession with provided token(s)...');
          const setRes = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken ?? undefined,
          } as any);
          console.log('[ResetPassword] setSession result:', setRes);

          // re-check
          const { data: sessionAfter } = await supabase.auth.getSession();
          console.log('[ResetPassword] sessionAfter setSession:', sessionAfter);
        } catch (err) {
          console.warn('[ResetPassword] setSession failed:', err);
        }
      }

      // Now try updateUser (should work if we have a session)
      try {
        console.log('[ResetPassword] attempting supabase.auth.updateUser({ password })');
        const { error } = await supabase.auth.updateUser({ password } as any);
        if (error) throw error;

        Alert.alert('Success', 'Password updated successfully.');
        router.replace('/auth');
        return;
      } catch (err) {
        console.warn('[ResetPassword] updateUser failed:', err);
      }

      // If updateUser fails, provide guidance
      Alert.alert(
        'Reset failed',
        'We could not complete the reset automatically. If you clicked the link in email, open it in your browser (web) or request a new reset email. If this keeps failing, please contact support.'
      );
    } catch (err) {
      console.error('[ResetPassword] unexpected error:', err);
      Alert.alert('Error', (err as any)?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const showInvalid = token === null && sessionAvailable === false;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter and confirm your new password</Text>

        {showInvalid && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              No reset token or session detected. Open the email link in a browser and try again, or request a new reset email.
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
            onChangeText={(t) => setPassword(t)}
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
            onChangeText={(t) => setConfirmPassword(t)}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={22} color="#fff" /> : <Eye size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.resetButton, loading && styles.resetButtonDisabled]} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.resetButtonText}>Reset Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/auth')}>
          <Text style={styles.backToLoginText}>← Back to login</Text>
        </TouchableOpacity>

        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>platform={Platform.OS}</Text>
          <Text style={styles.debugText}>token={token ? token.slice(0, 12) + '...' : 'null'}</Text>
          <Text style={styles.debugText}>refresh={refreshToken ? 'present' : 'null'}</Text>
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
