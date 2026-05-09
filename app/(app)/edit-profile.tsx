import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hook/useProfile';
import { 
  User, 
  Mail, 
  Phone, 
  ChevronLeft, 
  Check, 
  Tag, 
  AlignLeft,
  Shield
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Animated, Easing } from 'react-native';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile, loading } = useProfile();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    selected_title: ''
  });
  
  const [saving, setSaving] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        selected_title: profile.selected_title || ''
      });
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }).start();
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string, 
    value: string, 
    onChangeText: (text: string) => void, 
    icon: React.ReactNode,
    placeholder: string,
    multiline: boolean = false
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, multiline && styles.multilineContainer]}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#444"
          multiline={multiline}
          selectionColor="#1ea2b1"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#1ea2b1" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          }) }] }}>
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Text style={styles.sectionSubtitle}>Update your personal details</Text>
            </View>

            {renderInput(
              "First Name", 
              formData.first_name, 
              (text) => setFormData({...formData, first_name: text}),
              <User size={18} color="#1ea2b1" />,
              "Enter your first name"
            )}

            {renderInput(
              "Last Name", 
              formData.last_name, 
              (text) => setFormData({...formData, last_name: text}),
              <User size={18} color="#1ea2b1" />,
              "Enter your last name"
            )}

            {renderInput(
              "Public Title", 
              formData.selected_title, 
              (text) => setFormData({...formData, selected_title: text}),
              <Tag size={18} color="#1ea2b1" />,
              "e.g. Master Commuter, Eco Warrior"
            )}

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact & Bio</Text>
              <Text style={styles.sectionSubtitle}>How others see you in the community</Text>
            </View>

            {renderInput(
              "Phone Number", 
              formData.phone, 
              (text) => setFormData({...formData, phone: text}),
              <Phone size={18} color="#1ea2b1" />,
              "+27 12 345 6789"
            )}

            {renderInput(
              "Bio", 
              formData.bio, 
              (text) => setFormData({...formData, bio: text}),
              <AlignLeft size={18} color="#1ea2b1" />,
              "Tell the community about yourself...",
              true
            )}

            <View style={styles.infoBox}>
              <Shield size={20} color="#1ea2b1" />
              <Text style={styles.infoText}>
                Your information is stored securely and only used to enhance your experience within the Uthutho network.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.mainSaveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.mainSaveButtonText}>Update Profile</Text>
                  <Check size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#1ea2b1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1ea2b1',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  multilineContainer: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  multilineInput: {
    height: 120,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 32,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 162, 177, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
    marginTop: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
  },
  mainSaveButton: {
    backgroundColor: '#1ea2b1',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 12,
    shadowColor: '#1ea2b1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainSaveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
