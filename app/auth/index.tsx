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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;
const isSmallMobile = SCREEN_HEIGHT < 700;
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

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isDesktop && styles.cardDesktop]}>
          <View style={styles.brandingHeader}>
            <View style={styles.logoRow}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.brandInfo}>
                <View style={styles.logoTextRow}>
                  <Text style={styles.brandText}>Uthutho</Text>
                  <Text style={[styles.brandDot, { color: '#00f5d4' }]}>.</Text>
                </View>
                <Text style={styles.moveSmarter}>MOVE SMARTER</Text>
              </View>
            </View>
            
            <Text style={styles.welcomeBack}>
              {isLogin ? 'Welcome Back' : 'Join Uthutho'}
            </Text>
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
              <View style={styles.inputWrapper}>
                <Mail size={18} color={BRAND_COLOR} style={styles.inputIconLeft} />
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
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.halfInput]}>
                    <TextInput
                      style={styles.inputNoIcon}
                      placeholder="First Name"
                      placeholderTextColor="#666"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={[styles.inputWrapper, styles.halfInput]}>
                    <TextInput
                      style={styles.inputNoIcon}
                      placeholder="Last Name"
                      placeholderTextColor="#666"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Mail size={18} color={BRAND_COLOR} style={styles.inputIconLeft} />
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
                <Lock size={18} color={BRAND_COLOR} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.inputIconRight}>
                  {passwordVisible ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </TouchableOpacity>
              </View>

              {isLogin && (
                <TouchableOpacity onPress={() => setShowForgotPassword(true)} style={styles.forgotLink}>
                  <Text style={styles.forgotLinkText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <View style={styles.socialDivider}>
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialCircle} onPress={handleGoogleSignIn} disabled={googleLoading}>
                  <Image source={require('../../assets/images/google-icon.png')} style={styles.socialIconLarge} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialCircle} onPress={handleFacebookSignIn} disabled={facebookLoading}>
                  <Image source={require('../../assets/images/facebook-icon.png')} style={styles.socialIconLarge} />
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View style={styles.termsContainer}>
                  <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                    <View style={styles.checkbox}>
                      {acceptedTerms && <Check size={14} color="#00f5d4" />}
                    </View>
                    <Text style={styles.termsText}>I agree to the Terms</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.mainButton}
                onPress={isLogin ? handleSignIn : handleSignUp}
                disabled={isLoading}>
                <Text style={styles.mainButtonText}>
                  {isLoading ? '...' : isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
                </Text>
                {!isLoading && <ArrowRight size={20} color="#000" />}
              </TouchableOpacity>

            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  contentContainerDesktop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  card: {
    width: '100%',
  },
  cardDesktop: {
    maxWidth: 450,
    backgroundColor: '#050505',
    padding: 40,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#111',
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  brandInfo: {
    justifyContent: 'center',
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandDot: {
    fontSize: 48,
    fontWeight: '900',
    marginLeft: 2,
  },
  moveSmarter: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: -8,
  },
  welcomeBack: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 6,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#38b2ac',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  activeTabText: {
    color: '#000',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    height: 56,
    marginBottom: 4,
  },
  halfInput: {
    flex: 1,
  },
  inputIconLeft: {
    marginLeft: 16,
    marginRight: 12,
  },
  inputIconRight: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  inputNoIcon: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 16,
    height: 48,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotLinkText: {
    color: '#00f5d4',
    fontSize: 14,
    fontWeight: '800',
  },
  mainButton: {
    backgroundColor: '#00f5d4',
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  mainButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  termsContainer: {
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  termsText: {
    color: '#666',
    fontSize: 12,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  socialDivider: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  socialCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  socialIconLarge: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
});