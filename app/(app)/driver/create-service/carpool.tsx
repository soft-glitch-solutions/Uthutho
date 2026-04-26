import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Navigation,
  Clock,
  Users,
  DollarSign,
  MapPin,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateCarpoolServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    fromLocation: '',
    toLocation: '',
    pickupTime: new Date(),
    maxMembers: '4',
    pricePerTrip: '',
  });
  
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.fromLocation.trim() || !formData.toLocation.trim() || !formData.pricePerTrip) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('carpool_clubs')
        .insert({
          name: formData.name,
          creator_id: profileData?.id,
          from_location: formData.fromLocation,
          to_location: formData.toLocation,
          pickup_time: formData.pickupTime.toTimeString().split(' ')[0],
          max_members: parseInt(formData.maxMembers),
          current_members: 1,
          price_per_trip: parseFloat(formData.pricePerTrip),
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('Success!', 'Carpool club created successfully.', [
        { text: 'OK', onPress: () => router.replace('/driver-dashboard') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create carpool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/driver/create-service');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Uthutho</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.readyText}>SERVICE CREATION</Text>
          <Text style={styles.headingText}>Carpool Club</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Basic Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CLUB DETAILS</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <Users size={18} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="Carpool Club Name"
                    placeholderTextColor="#444"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  />
                </View>
              </View>
            </View>

            {/* Route Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ROUTE INFORMATION</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <MapPin size={18} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="Pickup Point"
                    placeholderTextColor="#444"
                    value={formData.fromLocation}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fromLocation: text }))}
                  />
                </View>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <Navigation size={18} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="Destination"
                    placeholderTextColor="#444"
                    value={formData.toLocation}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, toLocation: text }))}
                  />
                </View>
              </View>
            </View>

            {/* Time & Capacity Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TIME & CAPACITY</Text>
              <View style={styles.inputCard}>
                <TouchableOpacity style={styles.inputRow} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color="#10B981" />
                  <Text style={[styles.input, { color: formData.pickupTime ? '#FFF' : '#444' }]}>
                    Pickup at {formatTime(formData.pickupTime)}
                  </Text>
                </TouchableOpacity>
                <View style={[styles.inputRow, { borderTopWidth: 1, borderTopColor: '#1a1a1a' }]}>
                  <Users size={18} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="Max Members"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={formData.maxMembers}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, maxMembers: text }))}
                  />
                </View>
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRICING</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <DollarSign size={18} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="Price per Trip (ZAR)"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={formData.pricePerTrip}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerTrip: text }))}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'CREATING...' : 'START CARPOOL'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Commute together, save costs, and reduce your carbon footprint.
            </Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showTimePicker && (
        <DateTimePicker
          value={formData.pickupTime}
          mode="time"
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (time) setFormData(prev => ({ ...prev, pickupTime: time }));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  headerContent: {
    marginTop: 0,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#10B981',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#444',
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
    gap: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10B981',
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});