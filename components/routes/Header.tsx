import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { contactUsOnWhatsApp } from '@/utils/whatsapp';

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Transport</Text>
        <TouchableOpacity 
          style={styles.headerWhatsappButton}
          onPress={() => contactUsOnWhatsApp()}
        >
          <MessageCircle size={20} color="#25D366" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Find stops, routes and hubs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerWhatsappButton: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 4,
  },
});