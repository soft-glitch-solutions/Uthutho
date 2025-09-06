import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { colors } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

  // 🚨 Session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.log("Session check error:", error.message);
        } else if (data.session) {
          router.replace('/(app)/(tabs)/home');
        }
      } catch (err) {
        console.error("Unexpected session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();

    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(app)/(tabs)/home');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Show loading spinner while checking session
  if (checkingSession) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  // --- AUTH HANDLERS (Google, Facebook, SignIn, SignUp, ForgotPassword) ---
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://www.mobile.uthutho.co.za/auth/callback',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: 'https://www.mobile.uthutho.co.za/auth/callback' },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message || 'Facebook sign-in failed');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleSignIn = async () => {
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('The email or password you entered is incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Please confirm your email first. Check your inbox.');
        } else {
          setErrorMessage('Sign in failed. Please try again.');
        }
        return;
      }
      router.replace('/(app)/(tabs)/home');
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    if (!firstName.trim()) return setErrorMessage('First name is required');
    if (!email.includes('@')) return setErrorMessage('Please enter a valid email address');
    if (password.length < 6) return setErrorMessage('Password must be at least 6 characters');
    if (!preferredTransport) return setErrorMessage('Please select your preferred transport');
    if (!preferredLanguage) return setErrorMessage('Please select your preferred language');

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            preferred_transport: preferredTransport,
            preferred_language: preferredLanguage,
          },
          emailRedirectTo: 'myapp://welcome',
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('This email is already registered. Please sign in.');
        } else {
          setErrorMessage('Registration failed. Please try again later.');
        }
        return;
      }

      router.push({ pathname: '/confirmation', params: { email } });
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPreferredTransport('');
      setPreferredLanguage('English');
    } catch {
      setErrorMessage('Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });
      if (error) throw error;

      Alert.alert(
        'Email Sent',
        'If an account exists with this email, you will receive a password reset link.'
      );
      setShowForgotPassword(false);
    } catch {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOptionButtons = (
    options: string[],
    selected: string,
    setSelected: (value: string) => void
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.optionButton, selected === option && styles.optionButtonActive]}
          onPress={() => setSelected(option)}
        >
          <Text style={[styles.optionText, selected === option && styles.optionTextActive]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // --- UI ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <Text style={styles.logoText}>Uthutho</Text>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {showForgotPassword
            ? 'Reset Password'
            : isLogin
            ? 'Your journey to success starts here'
            : 'Create Account'}
        </Text>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.form}>
        {!isLogin && !showForgotPassword && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="First Name"
              placeholderTextColor={colors.text}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Last Name"
              placeholderTextColor={colors.text}
              value={lastName}
              onChangeText={setLastName}
            />

            <View style={styles.optionsRow}>
              <View style={styles.optionsColumn}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Preferred Transport
                </Text>
                {renderOptionButtons(transportOptions, preferredTransport, setPreferredTransport)}
              </View>

              <View style={styles.optionsColumn}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Preferred Language
                </Text>
                {renderOptionButtons(languageOptions, preferredLanguage, setPreferredLanguage)}
              </View>
            </View>
          </>
        )}

        <View style={[styles.emailContainer, { backgroundColor: colors.card, borderRadius: 10 }]}>
          <Mail size={20} color="#1ea2b1" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1, color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.text}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {!showForgotPassword && (
          <View
            style={[styles.passwordContainer, { backgroundColor: colors.card, borderRadius: 10 }]}
          >
            <Lock size={20} color="#1ea2b1" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.text}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              {passwordVisible ? (
                <EyeOff size={24} color={colors.text} />
              ) : (
                <Eye size={24} color={colors.text} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {isLogin && !showForgotPassword && (
          <TouchableOpacity
            onPress={() => setShowForgotPassword(true)}
            style={styles.forgotPasswordButton}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={showForgotPassword ? handleForgotPassword : isLogin ? handleSignIn : handleSignUp}
          disabled={isLoading || googleLoading || facebookLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? 'Loading...'
              : showForgotPassword
              ? 'Send Reset Link'
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => {
          if (showForgotPassword) {
            setShowForgotPassword(false);
          } else {
            setIsLogin(!isLogin);
          }
        }}
        disabled={isLoading || googleLoading || facebookLoading}
      >
        <Text style={[styles.switchText, { color: colors.text }]}>
          {showForgotPassword
            ? 'Back to Sign In'
            : isLogin
            ? "Don't have an account? "
            : 'Already have an account? '}
          <Text style={[styles.switchActionText, { color: '#1ea2b1' }]}>
            {showForgotPassword ? '' : isLogin ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text }]}>
          Developed by Soft Glitch Solutions
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 150, height: 150 },
  logoText: { fontSize: 48, fontWeight: 'bold', color: '#1ea2b1', marginBottom: 8, textAlign: 'center' },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  form: { gap: 15 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 14 },
  switchActionText: { fontWeight: 'bold' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 12, opacity: 0.6 },
  emailContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#333333' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#333333' },
  input: { padding: 15, fontSize: 16 },
  inputIcon: { marginRight: 12 },
  forgotPasswordButton: { alignSelf: 'flex-end' },
  forgotPasswordText: { fontSize: 14 },
  sectionLabel: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  optionsColumn: { width: '48%' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { borderRadius: 20, color: 'white', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#555555', marginBottom: 8 },
  optionButtonActive: { backgroundColor: '#1ea2b1', borderColor: '#1ea2b1' },
  optionText: { fontSize: 14, color: '#ffffff', fontWeight: '500' },
  optionTextActive: { color: '#ffffff' },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  errorText: { color: '#D32F2F', fontSize: 14 },
});
