import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { AlertCircle, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const WHATSAPP_NUMBER = '+27698826640';

const contactUsOnWhatsApp = () => {
  const message = 'Hi! I need help with my journey in the Uthutho app. Something seems wrong or missing.';
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(err => console.error('Failed to open WhatsApp:', err));
};

export const NoActiveJourney = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <AlertCircle size={48} color="#ef4444" />
      </View>
      
      <Text style={styles.errorTitle}>No Active Journey</Text>
      <Text style={styles.errorText}>
        You don't have an active journey. Mark yourself as waiting at a stop to start tracking your journey.
      </Text>
      
      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.primaryButtonText}>GO TO HOME</Text>
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
        <View style={styles.whatsappIconBox}>
          <MessageCircle size={20} color="#25D366" />
        </View>
        <Text style={styles.whatsappButtonText}>
          MESSAGE US ON WHATSAPP
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
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#1ea2b1',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 16,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  whatsappIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  helpText: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});