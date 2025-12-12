import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, MapPin, ArrowLeft, Save, Globe } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  preferred_transport?: string;
  home?: string;
  preferred_language?: string;
  points?: number;
  selected_title?: string;
}

// Skeleton Loading Component
const SkeletonLoader = ({ isDesktop: propIsDesktop = false }) => {
  const desktopMode = isDesktop || propIsDesktop;
  
  if (desktopMode) {
    return (
      <View style={[styles.skeletonContainer, styles.skeletonContainerDesktop]}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.desktopWrapper}>
          <View style={styles.desktopContent}>
            {/* Header Skeleton */}
            <View style={styles.skeletonHeader}>
              <View style={styles.skeletonBackButton} />
              <View style={styles.skeletonHeaderTitle} />
              <View style={styles.skeletonSaveButton} />
            </View>

            {/* Form Skeleton */}
            <View style={styles.skeletonFormDesktop}>
              <View style={styles.skeletonFormGrid}>
                {/* Personal Information Skeleton */}
                <View style={styles.skeletonSection}>
                  <View style={styles.skeletonSectionTitle} />
                  
                  {[1, 2, 3].map((item) => (
                    <View key={item} style={styles.skeletonInputGroup}>
                      <View style={styles.skeletonInputLabel} />
                      <View style={styles.skeletonInputContainer} />
                    </View>
                  ))}
                </View>

                {/* Preferences Skeleton */}
                <View style={styles.skeletonSection}>
                  <View style={styles.skeletonSectionTitle} />
                  
                  <View style={styles.skeletonInputGroup}>
                    <View style={styles.skeletonInputLabel} />
                    <View style={styles.skeletonOptionsGrid}>
                      {[1, 2, 3, 4, 5].map((option) => (
                        <View key={option} style={styles.skeletonOptionButton} />
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.skeletonInputGroup}>
                    <View style={styles.skeletonInputLabel} />
                    <View style={styles.skeletonInputContainer} />
                  </View>

                  <View style={styles.skeletonInputGroup}>
                    <View style={styles.skeletonInputLabel} />
                    <View style={styles.skeletonOptionsGrid}>
                      {[1, 2, 3, 4, 5].map((option) => (
                        <View key={option} style={styles.skeletonOptionButton} />
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Account Stats Skeleton */}
              <View style={styles.skeletonSection}>
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.skeletonStatsContainer}>
                  <View style={styles.skeletonStatItem}>
                    <View style={styles.skeletonStatValue} />
                    <View style={styles.skeletonStatLabel} />
                  </View>
                  <View style={styles.skeletonStatItem}>
                    <View style={styles.skeletonStatValue} />
                    <View style={styles.skeletonStatLabel} />
                  </View>
                </View>
              </View>

              {/* Save Button Skeleton */}
              <View style={styles.skeletonSaveButtonLarge} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.skeletonContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Skeleton */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonBackButton} />
        <View style={styles.skeletonHeaderTitle} />
        <View style={styles.skeletonSaveButton} />
      </View>

      {/* Form Skeleton */}
      <View style={styles.skeletonForm}>
        {/* Personal Information Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.skeletonInputGroup}>
              <View style={styles.skeletonInputLabel} />
              <View style={styles.skeletonInputContainer} />
            </View>
          ))}
        </View>

        {/* Preferences Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          
          {[1, 2].map((item) => (
            <View key={item} style={styles.skeletonInputGroup}>
              <View style={styles.skeletonInputLabel} />
              <View style={styles.skeletonOptionsContainer}>
                {[1, 2, 3, 4].map((option) => (
                  <View key={option} style={styles.skeletonOptionButton} />
                ))}
              </View>
            </View>
          ))}
          
          <View style={styles.skeletonInputGroup}>
            <View style={styles.skeletonInputLabel} />
            <View style={styles.skeletonInputContainer} />
          </View>
        </View>

        {/* Account Stats Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonStatsContainer}>
            <View style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
            <View style={styles.skeletonStatItem}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          </View>
        </View>

        {/* Save Button Skeleton */}
        <View style={styles.skeletonSaveButtonLarge} />
      </View>
    </View>
  );
};

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredTransport, setPreferredTransport] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const transportOptions = ['Taxi', 'Bus', 'Train', 'Walking', 'Mixed'];
  const languageOptions = ['English', 'Zulu', 'Afrikaans', 'Xhosa', 'Sotho'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile({
        ...profileData,
        email: user.email || '',
      });

      // Set form values
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setPreferredTransport(profileData.preferred_transport || '');
      setHomeLocation(profileData.home || '');
      setPreferredLanguage(profileData.preferred_language || 'English');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          preferred_transport: preferredTransport,
          home: homeLocation,
          preferred_language: preferredLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        console.error('Error updating profile:', error);
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    }
    setSaving(false);
  };

  if (loading) {
    return <SkeletonLoader isDesktop={isDesktop} />;
  }

  if (isDesktop) {
    return (
      <ScrollView style={[styles.container, styles.containerDesktop]}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.desktopWrapper}>
          <View style={styles.desktopContent}>
            {/* Header */}
            <View style={styles.headerDesktop}>
              <TouchableOpacity style={[styles.backButton, styles.backButtonDesktop]} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, styles.headerTitleDesktop]}>Edit Profile</Text>
              <TouchableOpacity 
                style={[styles.saveButton, styles.saveButtonDesktop, saving && styles.saveButtonDisabled]} 
                onPress={saveProfile}
                disabled={saving}
              >
                <Save size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Profile Form */}
            <View style={[styles.form, styles.formDesktop]}>
              <View style={styles.formGrid}>
                {/* Personal Information */}
                <View style={[styles.section, styles.sectionDesktop]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleDesktop]}>Personal Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>First Name</Text>
                    <View style={[styles.inputContainer, styles.inputContainerDesktop]}>
                      <User size={20} color="#1ea2b1" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.inputDesktop]}
                        placeholder="Enter your first name"
                        placeholderTextColor="#666666"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>Last Name</Text>
                    <View style={[styles.inputContainer, styles.inputContainerDesktop]}>
                      <User size={20} color="#1ea2b1" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.inputDesktop]}
                        placeholder="Enter your last name"
                        placeholderTextColor="#666666"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>Email Address</Text>
                    <View style={[styles.inputContainer, styles.inputContainerDesktop, styles.disabledInput]}>
                      <Mail size={20} color="#666666" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.inputDesktop, styles.disabledInputText]}
                        value={profile?.email}
                        editable={false}
                      />
                    </View>
                    <Text style={[styles.helperText, styles.helperTextDesktop]}>Email cannot be changed</Text>
                  </View>
                </View>

                {/* Preferences */}
                <View style={[styles.section, styles.sectionDesktop]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleDesktop]}>Preferences</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>Preferred Transport</Text>
                    <View style={styles.optionsGrid}>
                      {transportOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionButton,
                            styles.optionButtonDesktop,
                            preferredTransport === option && styles.optionButtonActive
                          ]}
                          onPress={() => setPreferredTransport(option)}
                        >
                          <Text style={[
                            styles.optionButtonText,
                            styles.optionButtonTextDesktop,
                            preferredTransport === option && styles.optionButtonTextActive
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>Home Location</Text>
                    <View style={[styles.inputContainer, styles.inputContainerDesktop]}>
                      <MapPin size={20} color="#1ea2b1" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.inputDesktop]}
                        placeholder="Enter your home area (e.g., Sandton, Johannesburg)"
                        placeholderTextColor="#666666"
                        value={homeLocation}
                        onChangeText={setHomeLocation}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, styles.inputLabelDesktop]}>Preferred Language</Text>
                    <View style={styles.optionsGrid}>
                      {languageOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionButton,
                            styles.optionButtonDesktop,
                            preferredLanguage === option && styles.optionButtonActive
                          ]}
                          onPress={() => setPreferredLanguage(option)}
                        >
                          <Text style={[
                            styles.optionButtonText,
                            styles.optionButtonTextDesktop,
                            preferredLanguage === option && styles.optionButtonTextActive
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Account Stats */}
              <View style={[styles.section, styles.sectionDesktop]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleDesktop]}>Account Information</Text>
                <View style={[styles.statsContainer, styles.statsContainerDesktop]}>
                  <View style={[styles.statItem, styles.statItemDesktop]}>
                    <Text style={[styles.statValue, styles.statValueDesktop]}>{profile?.points || 0}</Text>
                    <Text style={[styles.statLabel, styles.statLabelDesktop]}>Points Earned</Text>
                  </View>
                  <View style={[styles.statItem, styles.statItemDesktop]}>
                    <Text style={[styles.statValue, styles.statValueDesktop]}>{profile?.selected_title || 'Newbie Explorer'}</Text>
                    <Text style={[styles.statLabel, styles.statLabelDesktop]}>Current Title</Text>
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButtonLarge, styles.saveButtonLargeDesktop, saving && styles.saveButtonDisabled]} 
                onPress={saveProfile}
                disabled={saving}
              >
                <Save size={20} color="#ffffff" style={styles.saveButtonIcon} />
                <Text style={[styles.saveButtonText, styles.saveButtonTextDesktop]}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveProfile}
          disabled={saving}
        >
          <Save size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#1ea2b1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#666666"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#1ea2b1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#666666"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Mail size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInputText]}
                value={profile?.email}
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Transport</Text>
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Home Location</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#1ea2b1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your home area (e.g., Sandton, Johannesburg)"
                placeholderTextColor="#666666"
                value={homeLocation}
                onChangeText={setHomeLocation}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Language</Text>
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
          </View>
        </View>

        {/* Account Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.points || 0}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.selected_title || 'Newbie Explorer'}</Text>
              <Text style={styles.statLabel}>Current Title</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButtonLarge, saving && styles.saveButtonDisabled]} 
          onPress={saveProfile}
          disabled={saving}
        >
          <Save size={20} color="#ffffff" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    width: '100%',
  },
  
  // Desktop layout
  desktopWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  desktopContent: {
    width: '100%',
  },
  
  // Header
  headerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 30,
  },
  backButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitleDesktop: {
    fontSize: 24,
  },
  saveButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  // Form
  formDesktop: {
    paddingHorizontal: 0,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  
  // Section
  sectionDesktop: {
    marginBottom: 0,
    flex: 1,
  },
  sectionTitleDesktop: {
    fontSize: 22,
    marginBottom: 24,
  },
  
  // Input
  inputLabelDesktop: {
    fontSize: 15,
    marginBottom: 10,
  },
  inputContainerDesktop: {
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputDesktop: {
    fontSize: 15,
    paddingVertical: 14,
  },
  
  // Helper text
  helperTextDesktop: {
    fontSize: 13,
  },
  
  // Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  optionButtonDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 0,
  },
  optionButtonTextDesktop: {
    fontSize: 13,
  },
  
  // Stats
  statsContainerDesktop: {
    gap: 20,
  },
  statItemDesktop: {
    padding: 20,
    borderRadius: 12,
  },
  statValueDesktop: {
    fontSize: 20,
    marginBottom: 6,
  },
  statLabelDesktop: {
    fontSize: 13,
  },
  
  // Save button
  saveButtonLargeDesktop: {
    paddingVertical: 14,
    borderRadius: 10,
  },
  saveButtonTextDesktop: {
    fontSize: 17,
  },
  
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skeletonContainerDesktop: {
    width: '100%',
  },
  skeletonFormDesktop: {
    paddingHorizontal: 0,
  },
  skeletonOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  skeletonBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
  },
  skeletonHeaderTitle: {
    width: 120,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
  },
  skeletonSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
  },
  skeletonForm: {
    paddingHorizontal: 20,
  },
  skeletonSection: {
    marginBottom: 30,
  },
  skeletonSectionTitle: {
    width: 180,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    marginBottom: 20,
  },
  skeletonInputGroup: {
    marginBottom: 20,
  },
  skeletonInputLabel: {
    width: 120,
    height: 18,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonInputContainer: {
    height: 54,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  skeletonOptionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  skeletonOptionButton: {
    width: 80,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonStatsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  skeletonStatItem: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  skeletonStatValue: {
    width: 60,
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStatLabel: {
    width: 80,
    height: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  skeletonSaveButtonLarge: {
    height: 56,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 20,
  },
  // Original Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#1ea2b1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
  },
  form: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  disabledInput: {
    backgroundColor: '#0a0a0a',
    borderColor: '#222222',
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
  disabledInputText: {
    color: '#666666',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  optionsScroll: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  saveButtonLarge: {
    backgroundColor: '#1ea2b1',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
});