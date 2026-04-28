import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check, ArrowRight } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');
const BRAND_COLOR = '#1ea2b1';

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

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
        setErrorMessage(error.message.includes('Invalid login credentials') ? 'Incorrect email or password' : error.message);
        return;
      }
      router.replace('/(app)/(tabs)/home');
    } catch (error) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    if (!firstName || !lastName) {
      setErrorMessage('Please enter your first and last name');
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setErrorMessage('Please accept the Terms and Privacy Policy');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;
      Alert.alert(
        'Verification Email Sent',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => setIsLogin(true) }]
      );
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'uthutho://auth/callback',
        },
      });
      if (error) throw error;
      if (Platform.OS !== 'web' && data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, 'uthutho://auth/callback');
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'uthutho://auth/callback',
        },
      });
      if (error) throw error;
      if (Platform.OS !== 'web' && data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, 'uthutho://auth/callback');
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert('Success', 'Check your email for password reset instructions.');
      setShowForgotPassword(false);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openTermsLink = () => {
    Linking.openURL('https://uthutho.co.za/terms-and-conditions');
  };

  const openPrivacyLink = () => {
    Linking.openURL('https://uthutho.co.za/privacy-policy');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.logo}>Uthutho</Text>
        <Text style={styles.subtitle}>READY TO MOVE</Text>
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, isLogin && styles.activeTab]}
          onPress={() => setIsLogin(true)}>
          <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !isLogin && styles.activeTab]}
          onPress={() => setIsLogin(false)}>
          <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {showForgotPassword ? (
        <View style={styles.form}>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <Text style={styles.modalSubtitle}>Enter your email to receive reset instructions</Text>

          <View style={styles.inputWrapper}>
            <Mail size={20} color={BRAND_COLOR} style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowForgotPassword(false)} style={styles.backButton}>
            <ArrowLeft size={20} color={BRAND_COLOR} />
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#666"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputWrapper, styles.halfInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#666"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Mail size={20} color={BRAND_COLOR} style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color={BRAND_COLOR} style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.inputIconRight}>
              {passwordVisible ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>

          {isLogin && (
            <TouchableOpacity onPress={() => setShowForgotPassword(true)} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {!isLogin && (
            <View style={styles.termsContainer}>
              <View style={styles.termsRow}>
                <TouchableOpacity style={styles.checkbox} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                  {acceptedTerms && <Check size={16} color={BRAND_COLOR} />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={openTermsLink}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>

              <View style={styles.termsRow}>
                <TouchableOpacity style={styles.checkbox} onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                  {acceptedPrivacy && <Check size={16} color={BRAND_COLOR} />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={openPrivacyLink}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={isLogin ? handleSignIn : handleSignUp}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </Text>
            {!isLoading && <ArrowRight size={18} color="#000" style={styles.buttonIcon} />}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn} disabled={googleLoading}>
              <Image
                source={require('../../assets/images/google-icon.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>{googleLoading ? '...' : 'Google'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignIn} disabled={facebookLoading}>
              <Image
                source={require('../../assets/images/facebook-icon.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>{facebookLoading ? '...' : 'Facebook'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: BRAND_COLOR,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: BRAND_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    height: 52,
    position: 'relative',
  },
  halfInput: {
    flex: 1,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 48,
    height: 52,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotLinkText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: BRAND_COLOR,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222222',
  },
  dividerText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  socialIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    gap: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    color: '#999',
    fontSize: 12,
    flex: 1,
  },
  termsLink: {
    color: BRAND_COLOR,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});