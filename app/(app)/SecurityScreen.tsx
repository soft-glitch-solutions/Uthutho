import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Key, Shield, Eye, MapPin, Bell, Smartphone } from 'lucide-react-native';

export default function SecurityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete all your data permanently.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Delete', style: 'destructive', onPress: deleteAccount },
              ]
            );
          }
        },
      ]
    );
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        Alert.alert('Error', 'Failed to delete profile data.');
        return;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
        { text: 'OK', onPress: () => router.replace('/auth') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const unavailableFeature = (featureName: string) => {
    Alert.alert('Not Available', `${featureName} is not yet available. Coming soon!`);
  };

  const securityOptions = [
    { icon: MapPin, title: 'Location Sharing' },
    { icon: Eye, title: 'Data Analytics' },
    { icon: Bell, title: 'Push Notifications' },
    { icon: Smartphone, title: 'Biometric Authentication' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Lock size={48} color="#1ea2b1" />
        <Text style={styles.title}>Secure Your Account</Text>
        <Text style={styles.subtitle}>
          Only account deletion is available. Other security options will be added soon.
        </Text>
      </View>

      {/* Security Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security Options</Text>
        {securityOptions.map((option, idx) => {
          const IconComponent = option.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.optionCard}
              onPress={() => unavailableFeature(option.title)}
            >
              <IconComponent size={24} color="#1ea2b1" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>Not yet available</Text>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account Deletion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleAccountDeletion}
          disabled={loading}
        >
          <Key size={24} color="#fff" />
          <Text style={styles.deleteButtonText}>
            {loading ? 'Deleting Account...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Developed by Soft Glitch Solutions</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#ccc', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionText: { flex: 1, marginLeft: 16 },
  optionTitle: { fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 2 },
  optionSubtitle: { fontSize: 14, color: '#666' },
  optionArrow: { fontSize: 24, color: '#666' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { fontSize: 12, color: '#666' },
});
