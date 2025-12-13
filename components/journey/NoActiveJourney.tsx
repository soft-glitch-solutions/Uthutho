import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { AlertCircle, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const WHATSAPP_NUMBER = '+27698826640'; // Your WhatsApp number

const contactUsOnWhatsApp = () => {
  const message = 'Hi! I need help with my journey in the Uthutho app. Something seems wrong or missing.';
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(err => console.error('Failed to open WhatsApp:', err));
};

export const NoActiveJourney = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AlertCircle size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>No Active Journey</Text>
      <Text style={styles.errorText}>
        You don't have an active journey. Mark yourself as waiting at a stop to start tracking your journey.
      </Text>
      
      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.primaryButtonText}>Go to Home</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity 
        style={styles.whatsappButton} 
        onPress={contactUsOnWhatsApp}
      >
        <MessageCircle size={20} color="#25D366" />
        <Text style={styles.whatsappButtonText}>
          Something wrong? Message us on WhatsApp
        </Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Our team is available to help you resolve any issues with your journey.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
});