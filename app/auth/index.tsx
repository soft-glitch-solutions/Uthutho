import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Uber', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!name || !preferredTransport || !preferredLanguage))) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        router.replace('/(app)/(tabs)/home');
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                first_name: name.split(' ')[0],
                last_name: name.split(' ').slice(1).join(' ') || '',
                preferred_transport: preferredTransport,
                preferred_language: preferredLanguage,
              },
            ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }

        Alert.alert('Success', 'Account created successfully! Please sign in.');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>Uthutho</Text>
        <Text style={styles.tagline}>Your journey to success starts here</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>

        {!isLogin && (
          <>
            <View style={styles.inputContainer}>
              <User size={20} color="#1ea2b1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#666666"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View >
              <Text style={styles.sectionLabel}>Preferred Transport</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {transportOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    preferredTransport === option && styles.optionButtonActive
                  ]}
                  onPress={() => setPreferredTransport(option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    preferredTransport === option && styles.optionButtonTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View >
              <Text style={styles.sectionLabel}>Preferred Language</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {languageOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    preferredLanguage === option && styles.optionButtonActive
                  ]}
                  onPress={() => setPreferredLanguage(option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    preferredLanguage === option && styles.optionButtonTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.inputContainer}>
          <Mail size={20} color="#1ea2b1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#666666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#1ea2b1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.authButton, isLoading && styles.disabledButton]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          <Text style={styles.authButtonText}>
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.switchTextBold}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.bottomMotto}>
        "Izindlela zakho ziqinisekisa impumelelo!"
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Developed by Soft Glitch Solutions</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 16,
  },
  authButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#cccccc',
    fontSize: 16,
  },
  switchTextBold: {
    color: '#1ea2b1',
    fontWeight: '600',
  },
  bottomMotto: {
    color: '#1ea2b1',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsScroll: {
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#555555',
  },
  optionButtonActive: {
    backgroundColor: '#1ea2b1',
    borderColor: '#1ea2b1',
  },
  optionButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
});