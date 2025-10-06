import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Required for Expo OAuth
WebBrowser.maybeCompleteAuthSession();

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { colors } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Uber', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
  
    try {
      // Use app scheme for mobile, web URL for web
      const redirectUrl = Platform.OS === 'web'
        ? 'https://www.mobile.uthutho.co.za/auth/callback'
        : 'uthutho://auth/callback'; // Use app scheme directly
  
      console.log('Google OAuth - Redirect URL:', redirectUrl);
  
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
  
      if (error) throw error;
  
      // For mobile, open the OAuth URL
      if (Platform.OS !== 'web' && data?.url) {
        console.log('Opening WebBrowser for Google OAuth');
        
        // Use openBrowserAsync instead of openAuthSessionAsync for better control
        const result = await WebBrowser.openBrowserAsync(data.url, {
          // These options help ensure return to app
          enableBarCollapsing: true,
          showTitle: false,
          // Force browser to use app links
          readerMode: false,
          // Important: these help with returning to app
          createTask: false,
        });
  
        console.log('WebBrowser closed, checking session...');
        
        // After browser closes, check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error after OAuth:', sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log('OAuth successful, redirecting to home');
          router.replace('/(app)/(tabs)/home');
        } else {
          throw new Error('Authentication failed. No session found.');
        }
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setErrorMessage(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    setErrorMessage(null);
    
    try {
      const redirectUrl = Platform.OS === 'web'
        ? 'https://www.mobile.uthutho.co.za/auth/callback'
        : 'uthutho://auth/callback'; // Use app scheme directly
  
      console.log('Facebook OAuth - Redirect URL:', redirectUrl);
  
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
  
      if (error) throw error;
  
      if (Platform.OS !== 'web' && data?.url) {
        console.log('Opening WebBrowser for Facebook OAuth');
        
        const result = await WebBrowser.openBrowserAsync(data.url, {
          enableBarCollapsing: true,
          showTitle: false,
          readerMode: false,
          createTask: false,
        });
  
        console.log('WebBrowser closed, checking session...');
        
        // Check session after browser closes
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error after OAuth:', sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log('OAuth successful, redirecting to home');
          router.replace('/(app)/(tabs)/home');
        } else {
          throw new Error('Authentication failed. No session found.');
        }
      }
      
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      setErrorMessage(error.message || 'Facebook sign-in failed. Please try again.');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    } catch (error: any) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    if (!firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (!preferredTransport) {
      setErrorMessage('Please select your preferred transport');
      return;
    }
    if (!preferredLanguage) {
      setErrorMessage('Please select your preferred language');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            preferred_transport: preferredTransport,
            preferred_language: preferredLanguage,
          },
          emailRedirectTo: 'uthutho://welcome'
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

      router.push({
        pathname: '/confirmation',
        params: { email }
      });

      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPreferredTransport('');
      setPreferredLanguage('English');
    } catch (error: any) {
      setErrorMessage('Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new user for password reset
        },
      });

      if (error) throw error;

      // Show OTP input screen
      setShowOtpInput(true);
      Alert.alert(
        'OTP Sent',
        'Check your email for a verification code. Enter it below to reset your password.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      });

      if (error) throw error;

      // If OTP is verified, redirect to reset password page
      Alert.alert('Success', 'OTP verified successfully');
      router.push({
        pathname: '/reset-password',
        params: { email }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOptionButtons = (options: string[], selected: string, setSelected: (value: string) => void) => {
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              selected === option && styles.optionButtonActive,
            ]}
            onPress={() => setSelected(option)}
          >
            <Text style={[
              styles.optionText,
              { color: colors.text },
              selected === option && styles.optionTextActive
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // OTP Input Screen
  if (showOtpInput) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowOtpInput(false)}
        >
          <ArrowLeft size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Enter Verification Code
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            We sent a code to {email}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.otpInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Enter OTP Code"
            placeholderTextColor={colors.text}
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            <Text style={[styles.resendText, { color: colors.primary }]}>
              {isLoading ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Logo */}
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
          {showForgotPassword ? 'Reset Password' : isLogin ? 'Transform Your Daily Commute' : 'Create Account'}
        </Text>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Email/Password Form */}
      <View style={styles.form}>
        {!isLogin && !showForgotPassword && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="First Name"
              placeholderTextColor={colors.text}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Last Name"
              placeholderTextColor={colors.text}
              value={lastName}
              onChangeText={setLastName}
            />
            
            <View style={styles.optionsRow}>
              <View style={styles.optionsColumn}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Preferred Transport</Text>
                {renderOptionButtons(transportOptions, preferredTransport, setPreferredTransport)}
              </View>
              
              <View style={styles.optionsColumn}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Preferred Language</Text>
                {renderOptionButtons(languageOptions, preferredLanguage, setPreferredLanguage)}
              </View>
            </View>
          </>
        )}

        <View style={[styles.emailContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <View style={[styles.passwordContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Lock size={20} color="#1ea2b1" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.text}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
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
          onPress={
            showForgotPassword 
              ? handleSendOtp
              : isLogin 
                ? handleSignIn 
                : handleSignUp
          }
          disabled={isLoading || googleLoading || facebookLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading 
              ? 'Loading...' 
              : showForgotPassword 
                ? 'Send OTP Code'
                : isLogin 
                  ? 'Sign In' 
                  : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Social Login Section */}
      {!showForgotPassword && (
        <View style={styles.socialLoginContainer}>
          <Text style={[styles.socialLoginText, { color: colors.text }]}>
            {isLogin ? 'Continue with' : 'Sign up with'}
          </Text>
          
          <View style={styles.socialButtonsRow}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.card }]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Image
                source={require('../../assets/images/google-icon.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.card }]}
              onPress={handleFacebookSignIn}
              disabled={facebookLoading}
            >
              <Image
                source={require('../../assets/images/facebook-icon.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Switch between Login/Signup */}
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
            {showForgotPassword
              ? ''
              : isLogin
                ? 'Sign Up'
                : 'Sign In'}
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 10,
  },
  form: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
  },
  switchActionText: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  input: {
    padding: 15,
    fontSize: 16,
    borderRadius: 10,
    margin: 5,
  },
  otpInput: {
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionsColumn: {
    width: '48%',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  socialLoginContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  socialLoginText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
  },
  resendButton: {
    padding: 10,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});