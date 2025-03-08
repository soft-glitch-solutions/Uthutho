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
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import the icon library

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Track if the user is logging in or signing up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
  const { colors } = useTheme();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert('Success', 'Successfully signed in!');
      router.replace('/(app)/(tabs)/home'); // Navigate to home
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      if (!firstName.trim()) {
        throw new Error('First name is required');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            preferred_transport: preferredTransport || null,
          },
        },
      });

      if (error) throw error;

      // Automatically log in the user after sign-up
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;

      Alert.alert('Success', 'Registration successful! Please check your email.');
      router.replace('/(app)/(tabs)/home'); // Navigate to home
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon.png')} // Adjust the path to your logo
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isLogin ? 'Welcome' : 'Create Account'}
        </Text>
      </View>

      <View style={styles.form}>
        {!isLogin && (
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
          </>
        )}
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.text}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.text}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible} // Toggle visibility
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Icon
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={isLogin ? handleSignIn : handleSignUp}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
        disabled={isLoading}>
        <Text style={[styles.switchText, { color: colors.text }]}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </Text>
      </TouchableOpacity>

      {/* Footer Section */}
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
    width: 150, // Adjust the size as needed
    height: 150, // Adjust the size as needed
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  form: {
    gap: 15,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    width: '100%', // Ensure full width
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
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Ensure full width
  },
});