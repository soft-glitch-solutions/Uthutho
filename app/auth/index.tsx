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
  Dimensions,
} from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check, Chrome, Facebook } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;

const BRAND_COLOR = '#1ea2b1';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Uber', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: Platform.OS === 'web' ? 'https://www.mobile.uthutho.co.za/auth/callback' : 'uthutho://auth/callback' },
      });
      if (error) throw error;
      if (Platform.OS !== 'web' && data?.url) await WebBrowser.openAuthSessionAsync(data.url, 'uthutho://auth/callback');
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <Text style={styles.brandText}>Uthutho</Text>
        <Text style={styles.readyText}>READY TO MOVE</Text>
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join the Community'}</Text>
        <View style={styles.taglineRow}>
          <Text style={[styles.tagline, { color: '#1EA2B1' }]}>Commute.</Text>
          <Text style={[styles.tagline, { color: '#ED67B1' }]}> Connect.</Text>
          <Text style={[styles.tagline, { color: '#FD602D' }]}> Shared.</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}>
          <Text style={[styles.tabText, isLogin && styles.activeTabText]}>SIGN IN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}>
          <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && <View style={styles.errorBox}><Text style={styles.errorText}>{errorMessage}</Text></View>}

      <View style={styles.form}>
        {!isLogin && (
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#444" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#444" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Mail size={18} color={BRAND_COLOR} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#444" value={email} onChangeText={setEmail} autoCapitalize="none" />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={18} color={BRAND_COLOR} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#444" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
          </TouchableOpacity>
        </View>

        {isLogin && (
          <TouchableOpacity onPress={() => setShowForgotPassword(true)} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.mainBtn} onPress={isLogin ? handleSignIn : () => {}} disabled={isLoading}>
          <Text style={styles.mainBtnText}>{isLoading ? 'PROCESSING...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
          {!isLoading && <ArrowRight size={18} color="#000" />}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn}>
            <Chrome size={20} color="#FFF" />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Facebook size={20} color="#FFF" />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 32,
    paddingTop: 80,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: BRAND_COLOR,
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 12,
  },
  taglineRow: {
    flexDirection: 'row',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 6,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#222',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#FFF',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    height: 60,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  mainBtn: {
    backgroundColor: BRAND_COLOR,
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  mainBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 32,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
import { ArrowRight } from 'lucide-react-native';