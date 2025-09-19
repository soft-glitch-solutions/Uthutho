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
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react-native';

const PRIMARY = '#1ea2b1';
const BG = '#000000';
const MUTED = '#666666';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; type?: string }>();
  
  const [accessToken, setAccessToken] = useState<string | undefined>(params.access_token);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('[ResetPassword]', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Extract token from Supabase confirmation URL
  useEffect(() => {
    const extractTokenFromURL = async () => {
      addDebugInfo('Starting token extraction...');
      addDebugInfo(`Initial params: access_token=${params.access_token?.slice(0, 8)}..., type=${params.type}`);

      if (!accessToken) {
        try {
          addDebugInfo('No access token in params, checking URL for Supabase format...');
          
          let url: string | null = null;
          
          if (Platform.OS === 'web') {
            url = window.location.href;
            addDebugInfo(`Web URL: ${url}`);
          } else {
            url = await Linking.getInitialURL();
            addDebugInfo(`Mobile URL: ${url}`);
          }

          if (url && url.includes('/reset-password')) {
            let extractedAccessToken: string | null = null;
            let extractedType: string | null = null;

            // Check hash fragment (Supabase default format)
            if (url.includes('#')) {
              const hashIndex = url.indexOf('#');
              const hash = url.substring(hashIndex + 1);
              const hashParams = new URLSearchParams(hash);
              extractedAccessToken = hashParams.get('access_token');
              extractedType = hashParams.get('type');
              addDebugInfo(`Hash params - access_token: ${extractedAccessToken?.slice(0, 8)}..., type: ${extractedType}`);
            }

            // Check query parameters
            if (!extractedAccessToken && url.includes('?')) {
              const urlObj = new URL(url);
              extractedAccessToken = urlObj.searchParams.get('access_token');
              extractedType = urlObj.searchParams.get('type');
              addDebugInfo(`Query params - access_token: ${extractedAccessToken?.slice(0, 8)}..., type: ${extractedType}`);
            }

            if (extractedAccessToken && extractedType === 'recovery') {
              setAccessToken(extractedAccessToken);
              addDebugInfo('Access token extracted from URL successfully');
            } else {
              addDebugInfo('No valid access token found in URL');
            }
          }
        } catch (error) {
          addDebugInfo(`Error extracting token: ${error}`);
        }
      } else {
        addDebugInfo('Access token already available from params');
      }
    };

    extractTokenFromURL();
  }, []);

  // 🔑 Verify the token and get session
  useEffect(() => {
    const verifyTokenAndGetSession = async () => {
      if (accessToken) {
        addDebugInfo(`Verifying token: ${accessToken.slice(0, 8)}...`);
        
        try {
          // First, verify the token is valid by getting the user
          const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
          
          if (userError) {
            addDebugInfo(`Token verification error: ${userError.message}`);
            Alert.alert('Error', 'Invalid or expired reset link');
            return;
          }

          addDebugInfo(`Token verified for user: ${user?.email}`);
          
          // Now set the session using the token
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: 'will-be-provided-automatically', // Supabase handles this
          });
          
          if (sessionError) {
            addDebugInfo(`Session set error: ${sessionError.message}`);
          } else {
            addDebugInfo(`Session set successfully: ${!!sessionData.session}`);
            addDebugInfo(`User ID: ${sessionData.user?.id}`);
          }
        } catch (err: any) {
          addDebugInfo(`Token verification exception: ${err.message}`);
        }
      } else {
        addDebugInfo('No access token available for verification');
      }
    };

    if (accessToken) {
      verifyTokenAndGetSession();
    }
  }, [accessToken]);

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
    addDebugInfo('Starting password reset...');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      addDebugInfo('Password updated successfully');
      Alert.alert('Success', 'Password updated successfully.');
      router.replace('/auth');
    } catch (err: any) {
      addDebugInfo(`Password reset error: ${err.message}`);
      console.error('Reset password error:', err);
      Alert.alert('Error', err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Invalid or expired reset link.</Text>
        <Text style={styles.debugText}>Please request a new password reset email.</Text>
        
        <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/auth')}>
          <Text style={styles.backToLoginText}>← Back to login</Text>
        </TouchableOpacity>

        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>Debug Information:</Text>
          {debugInfo.map((log, index) => (
            <Text key={index} style={styles.debugLogText}>
              {log}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

        {/* Debug Information */}
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>Debug Information:</Text>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
          <Text style={styles.debugText}>Access Token: {accessToken ? `${accessToken.slice(0, 8)}...` : 'MISSING'}</Text>
          <Text style={styles.debugText}>Password Length: {password.length}</Text>
          <Text style={styles.debugText}>Confirm Length: {confirmPassword.length}</Text>
          
          <Text style={styles.debugSubtitle}>Logs:</Text>
          {debugInfo.map((log, index) => (
            <Text key={index} style={styles.debugLogText}>
              {log}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ... keep the same styles as before ...
const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: BG, 
    justifyContent: 'center', 
    padding: 20 
  },
  inner: { 
    backgroundColor: '#0f0f0f', 
    padding: 20, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  title: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 6 
  },
  subtitle: { 
    color: MUTED, 
    textAlign: 'center', 
    marginBottom: 16 
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
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
    padding: 8 
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonDisabled: { 
    opacity: 0.6 
  },
  resetButtonText: { 
    color: '#000', 
    fontWeight: '700', 
    fontSize: 16 
  },
  backToLogin: { 
    marginTop: 10, 
    alignItems: 'center' 
  },
  backToLoginText: { 
    color: MUTED, 
    fontSize: 13 
  },
  debugBox: { 
    marginTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#222', 
    paddingTop: 10 
  },
  debugTitle: { 
    color: PRIMARY, 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  debugSubtitle: { 
    color: PRIMARY, 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginTop: 8, 
    marginBottom: 4 
  },
  debugText: { 
    color: '#777', 
    fontSize: 12, 
    marginTop: 2 
  },
  debugLogText: { 
    color: '#999', 
    fontSize: 10, 
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
});