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
  Linking,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

// Required for Expo OAuth
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isVerySmallScreen = height < 600;
const isTinyScreen = height < 500;
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isLargeDesktop = width >= 1440;

// Conservative scaling for desktop
const scale = (size: number) => {
  if (isDesktop) {
    // Minimal scaling for desktop
    return Math.min(size * (width / 375), size * 1.1);
  }
  
  const baseWidth = 375;
  let scaleFactor = 1;
  
  if (isTinyScreen) scaleFactor = 0.8;
  else if (isVerySmallScreen) scaleFactor = 0.9;
  else if (isSmallScreen) scaleFactor = 1;
  else if (isTablet) scaleFactor = 1.1;
  
  return (width / baseWidth) * size * scaleFactor;
};

const verticalScale = (size: number) => {
  if (isDesktop) {
    return Math.min(size * (height / 667), size * 1.1);
  }
  
  const baseHeight = 667;
  let scaleFactor = 1;
  
  if (isTinyScreen) scaleFactor = 0.7;
  else if (isVerySmallScreen) scaleFactor = 0.8;
  else if (isSmallScreen) scaleFactor = 0.9;
  else if (isTablet) scaleFactor = 1;
  
  return (height / baseHeight) * size * scaleFactor;
};

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
  
  // Terms and Privacy states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Uber', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

  // URLs for Terms and Privacy Policy
  const termsUrl = 'https://www.uthutho.co.za/terms-and-conditions';
  const privacyUrl = 'https://www.uthutho.co.za/privacy-policy';

  // Desktop layout configuration
  const getLayoutConfig = () => {
    if (isDesktop) {
      return {
        maxContentWidth: 800,
        formWidth: '70%',
        formAlignSelf: 'center' as const,
        optionsDirection: 'row' as const,
        optionsJustify: 'space-between' as const,
        optionsColumnWidth: '48%',
        socialButtonsDirection: 'row' as const,
        socialButtonsGap: 20,
      };
    }
    return {
      maxContentWidth: '100%',
      formWidth: '100%',
      formAlignSelf: 'stretch' as const,
      optionsDirection: isTablet ? 'row' : 'column',
      optionsJustify: 'space-between' as const,
      optionsColumnWidth: isTablet ? '48%' : '100%',
      socialButtonsDirection: 'row' as const,
      socialButtonsGap: 20,
    };
  };

  const layoutConfig = getLayoutConfig();

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open link. Please try again.');
    }
  };

// Replace your current handleGoogleSignIn function with this:
const handleGoogleSignIn = async () => {
  setGoogleLoading(true);
  setErrorMessage(null);

  try {
    // Generate redirect URL based on platform
    let redirectUrl;
    
    if (Platform.OS === 'web') {
      // For web
      redirectUrl = 'https://www.mobile.uthutho.co.za/auth/callback';
    } else {
      // For mobile (Android/iOS) - use your app scheme
      redirectUrl = 'uthutho://auth/callback';
    }

    console.log('Google OAuth - Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: Platform.OS !== 'web', // Skip for mobile
      },
    });

    if (error) throw error;

    // For mobile, open the OAuth URL
    if (Platform.OS !== 'web' && data?.url) {
      console.log('Opening WebBrowser for Google OAuth');
      
      // Use openAuthSessionAsync for better deep link handling
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showTitle: false,
          enableBarCollapsing: true,
          // These settings help with returning to app
          createTask: false,
          preferEphemeralSession: false,
        }
      );

      console.log('OAuth Result Type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('OAuth successful, result URL:', result.url);
        
        // Parse the returned URL
        const { queryParams } = Linking.parse(result.url);
        console.log('Query params from OAuth:', queryParams);
        
        if (queryParams?.error) {
          throw new Error(queryParams.error_description || queryParams.error || 'Authentication failed');
        }
        
        // Check if we got tokens
        if (queryParams?.access_token) {
          // Set the session directly
          setStatus('Setting up session...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: queryParams.access_token as string,
            refresh_token: queryParams.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          
          console.log('OAuth successful, redirecting to home');
          router.replace('/(app)/(tabs)/home');
        } else {
          // If no tokens but URL looks successful, navigate to callback screen
          console.log('No direct tokens, navigating to callback screen');
          router.push('/auth/callback');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Authentication cancelled by user');
      } else {
        console.log('WebBrowser result:', result);
        throw new Error('Authentication failed or browser closed');
      }
    }
    
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    setErrorMessage(error.message || 'Google sign-in failed. Please try again.');
  } finally {
    setGoogleLoading(false);
  }
};
  
// Replace your current handleFacebookSignIn function with this:
const handleFacebookSignIn = async () => {
  setFacebookLoading(true);
  setErrorMessage(null);
  
  try {
    // Generate redirect URL based on platform
    let redirectUrl;
    
    if (Platform.OS === 'web') {
      // For web
      redirectUrl = 'https://www.mobile.uthutho.co.za/auth/callback';
    } else {
      // For mobile (Android/iOS) - use your app scheme
      redirectUrl = 'uthutho://auth/callback';
    }

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
      
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showTitle: false,
          enableBarCollapsing: true,
          createTask: false,
          preferEphemeralSession: false,
        }
      );

      console.log('Facebook OAuth Result Type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('Facebook OAuth successful, result URL:', result.url);
        
        // Parse the returned URL
        const { queryParams } = Linking.parse(result.url);
        console.log('Query params from Facebook OAuth:', queryParams);
        
        if (queryParams?.error) {
          throw new Error(queryParams.error_description || queryParams.error || 'Authentication failed');
        }
        
        // Check if we got tokens
        if (queryParams?.access_token) {
          // Set the session directly
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: queryParams.access_token as string,
            refresh_token: queryParams.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          
          console.log('Facebook OAuth successful, redirecting to home');
          router.replace('/(app)/(tabs)/home');
        } else {
          // If no tokens but URL looks successful, navigate to callback screen
          console.log('No direct tokens, navigating to callback screen');
          router.push('/auth/callback');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Authentication cancelled by user');
      } else {
        console.log('Facebook WebBrowser result:', result);
        throw new Error('Authentication failed or browser closed');
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
    
    // Validation
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
    
    // Check if terms and privacy are accepted
    if (!acceptedTerms) {
      setErrorMessage('Please accept the Terms and Conditions');
      return;
    }
    if (!acceptedPrivacy) {
      setErrorMessage('Please accept the Privacy Policy');
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
            accepted_terms: true,
            accepted_privacy: true,
            accepted_terms_at: new Date().toISOString(),
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

      // Reset form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPreferredTransport('');
      setPreferredLanguage('English');
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
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

  // Checkbox Component
  const Checkbox = ({ 
    label, 
    checked, 
    onPress, 
    linkUrl,
    onLinkPress,
    linkText 
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
    linkUrl?: string;
    onLinkPress?: (url: string) => void;
    linkText?: string;
  }) => {
    return (
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          { borderColor: colors.border },
          checked && styles.checkboxChecked
        ]}>
          {checked && <Check size={14} color="#ffffff" />}
        </View>
        <Text style={[styles.checkboxLabel, { color: colors.text }]}>
          {label}
          {linkUrl && linkText && (
            <Text 
              style={styles.linkText}
              onPress={() => onLinkPress?.(linkUrl)}
            >
              {' '}{linkText}
            </Text>
          )}
        </Text>
      </TouchableOpacity>
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
          <ArrowLeft size={isDesktop ? 20 : 24} color={colors.text} />
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
      contentContainerStyle={[
        styles.contentContainer,
        { maxWidth: layoutConfig.maxContentWidth, alignSelf: 'center' }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Uthutho</Text>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {showForgotPassword ? 'Reset Password' : isLogin ? 'Connect Community Community' : 'Join Uthutho Today'}
        </Text>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={[styles.form, { width: layoutConfig.formWidth, alignSelf: layoutConfig.formAlignSelf }]}>
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
            
            <View style={[
              styles.optionsRow,
              { 
                flexDirection: layoutConfig.optionsDirection,
                justifyContent: layoutConfig.optionsJustify,
              }
            ]}>
              <View style={[styles.optionsColumn, { width: layoutConfig.optionsColumnWidth }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Preferred Transport</Text>
                {renderOptionButtons(transportOptions, preferredTransport, setPreferredTransport)}
              </View>
              
              <View style={[styles.optionsColumn, { width: layoutConfig.optionsColumnWidth }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Preferred Language</Text>
                {renderOptionButtons(languageOptions, preferredLanguage, setPreferredLanguage)}
              </View>
            </View>
          </>
        )}

        <View style={[styles.emailContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Mail size={isDesktop ? 18 : 20} color="#1ea2b1" style={styles.inputIcon} />
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
            <Lock size={isDesktop ? 18 : 20} color="#1ea2b1" style={styles.inputIcon} />
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
                <EyeOff size={isDesktop ? 20 : 24} color={colors.text} />
              ) : (
                <Eye size={isDesktop ? 20 : 24} color={colors.text} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {!isLogin && !showForgotPassword && (
          <>
            {/* Terms and Privacy Checkboxes */}
            <View style={styles.checkboxesContainer}>
              <Text style={[styles.agreementTitle, { color: colors.text }]}>
                Agreement
              </Text>
              
              <Checkbox
                label="I accept the"
                checked={acceptedTerms}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                linkUrl={termsUrl}
                onLinkPress={handleOpenLink}
                linkText="Terms and Conditions"
              />
              
              <Checkbox
                label="I accept the"
                checked={acceptedPrivacy}
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                linkUrl={privacyUrl}
                onLinkPress={handleOpenLink}
                linkText="Privacy Policy"
              />
            </View>
          </>
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
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            (!isLogin && (!acceptedTerms || !acceptedPrivacy)) && styles.buttonDisabled
          ]}
          onPress={
            showForgotPassword 
              ? handleSendOtp
              : isLogin 
                ? handleSignIn 
                : handleSignUp
          }
          disabled={
            isLoading || 
            googleLoading || 
            facebookLoading || 
            (!isLogin && (!acceptedTerms || !acceptedPrivacy))
          }
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

      {/* Social Login Section - Only show on web platform */}
      {!showForgotPassword && (
        <View style={styles.socialLoginContainer}>
          <Text style={[styles.socialLoginText, { color: colors.text }]}>
            {isLogin ? 'Continue with' : 'Sign up with'}
          </Text>
          
          <View style={[
            styles.socialButtonsRow,
            { 
              flexDirection: layoutConfig.socialButtonsDirection,
              gap: layoutConfig.socialButtonsGap,
            }
          ]}>
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
              {googleLoading && (
                <View style={styles.socialButtonLoading}>
                  <Text style={styles.socialButtonLoadingText}>...</Text>
                </View>
              )}
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
              {facebookLoading && (
                <View style={styles.socialButtonLoading}>
                  <Text style={styles.socialButtonLoadingText}>...</Text>
                </View>
              )}
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
            // Reset agreement states when switching to sign up
            if (!isLogin) {
              setAcceptedTerms(false);
              setAcceptedPrivacy(false);
            }
          }
          setErrorMessage(null);
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
    padding: isDesktop ? 32 : scale(20),
    justifyContent: 'center',
    minHeight: '100%',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: isDesktop ? 20 : scale(30),
  },
  logo: {
    width: isDesktop ? 120 : scale(150),
    height: isDesktop ? 120 : scale(150),
  },
  logoText: {
    fontSize: isDesktop ? 36 : scale(48),
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: isDesktop ? 8 : scale(8),
    textAlign: 'center',
  },
  header: {
    marginBottom: isDesktop ? 16 : scale(20),
  },
  title: {
    fontSize: isDesktop ? 20 : scale(20),
    fontWeight: 'bold',
    marginBottom: isDesktop ? 16 : scale(20),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isDesktop ? 14 : scale(16),
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: isDesktop ? 8 : scale(10),
  },
  form: {
    gap: isDesktop ? 12 : scale(15),
  },
  button: {
    padding: isDesktop ? 12 : scale(15),
    borderRadius: isDesktop ? 8 : scale(10),
    alignItems: 'center',
    marginTop: isDesktop ? 8 : scale(10),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: isDesktop ? 14 : scale(16),
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: isDesktop ? 16 : scale(20),
    alignItems: 'center',
  },
  switchText: {
    fontSize: isDesktop ? 13 : scale(14),
  },
  switchActionText: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: isDesktop ? 16 : scale(20),
    alignItems: 'center',
  },
  footerText: {
    fontSize: isDesktop ? 11 : scale(12),
    opacity: 0.6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: isDesktop ? 10 : scale(12),
    marginBottom: isDesktop ? 8 : scale(10),
    paddingHorizontal: isDesktop ? 14 : scale(16),
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: isDesktop ? 10 : scale(12),
    marginBottom: isDesktop ? 8 : scale(10),
    paddingHorizontal: isDesktop ? 14 : scale(16),
    borderWidth: 1,
  },
  input: {
    padding: isDesktop ? 12 : scale(15),
    fontSize: isDesktop ? 14 : scale(16),
    borderRadius: isDesktop ? 8 : scale(10),
    margin: isDesktop ? 4 : scale(5),
  },
  otpInput: {
    padding: isDesktop ? 12 : scale(15),
    fontSize: isDesktop ? 16 : scale(18),
    textAlign: 'center',
    borderRadius: isDesktop ? 8 : scale(10),
    borderWidth: 1,
    marginBottom: isDesktop ? 16 : scale(20),
  },
  inputIcon: {
    marginRight: isDesktop ? 10 : scale(12),
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: isDesktop ? 13 : scale(14),
  },
  sectionLabel: {
    fontSize: isDesktop ? 14 : scale(16),
    fontWeight: '500',
    marginBottom: isDesktop ? 6 : scale(8),
  },
  optionsRow: {
    marginBottom: isDesktop ? 16 : scale(20),
    gap: isDesktop ? 12 : scale(15),
  },
  optionsColumn: {
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isDesktop ? 6 : scale(8),
  },
  optionButton: {
    borderRadius: isDesktop ? 16 : scale(20),
    paddingHorizontal: isDesktop ? 10 : scale(12),
    paddingVertical: isDesktop ? 6 : scale(8),
    borderWidth: 1,
    marginBottom: isDesktop ? 6 : scale(8),
  },
  optionButtonActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  optionText: {
    fontSize: isDesktop ? 12 : scale(14),
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: isDesktop ? 12 : scale(15),
    borderRadius: isDesktop ? 6 : scale(8),
    marginBottom: isDesktop ? 16 : scale(20),
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: isDesktop ? 13 : scale(14),
  },
  socialLoginContainer: {
    marginTop: isDesktop ? 24 : scale(30),
    alignItems: 'center',
  },
  socialLoginText: {
    fontSize: isDesktop ? 13 : scale(14),
    marginBottom: isDesktop ? 12 : scale(15),
    color: '#666',
  },
  socialButtonsRow: {
    justifyContent: 'center',
  },
  socialButton: {
    width: isDesktop ? 45 : scale(50),
    height: isDesktop ? 45 : scale(50),
    borderRadius: isDesktop ? 22 : scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  socialIcon: {
    width: isDesktop ? 20 : scale(24),
    height: isDesktop ? 20 : scale(24),
  },
  socialButtonLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: isDesktop ? 22 : scale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonLoadingText: {
    fontSize: isDesktop ? 14 : scale(16),
    fontWeight: 'bold',
    color: '#1ea2b1',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isDesktop ? 16 : scale(20),
  },
  backText: {
    fontSize: isDesktop ? 14 : scale(16),
    marginLeft: isDesktop ? 6 : scale(8),
  },
  resendButton: {
    padding: isDesktop ? 8 : scale(10),
    alignItems: 'center',
  },
  resendText: {
    fontSize: isDesktop ? 13 : scale(14),
    fontWeight: '500',
  },
  // Checkbox Styles
  checkboxesContainer: {
    marginBottom: isDesktop ? 8 : scale(10),
  },
  agreementTitle: {
    fontSize: isDesktop ? 14 : scale(16),
    fontWeight: '600',
    marginBottom: isDesktop ? 10 : scale(12),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isDesktop ? 10 : scale(12),
    paddingVertical: isDesktop ? 3 : scale(4),
  },
  checkbox: {
    width: isDesktop ? 18 : scale(20),
    height: isDesktop ? 18 : scale(20),
    borderRadius: isDesktop ? 3 : scale(4),
    borderWidth: 2,
    marginRight: isDesktop ? 10 : scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  checkboxLabel: {
    fontSize: isDesktop ? 13 : scale(14),
    flex: 1,
    flexWrap: 'wrap',
  },
  linkText: {
    color: '#1ea2b1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});