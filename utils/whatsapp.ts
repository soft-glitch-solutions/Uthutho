import { Linking } from 'react-native';

const WHATSAPP_NUMBER = '+1234567890'; // Replace with your actual WhatsApp number

export const contactUsOnWhatsApp = (searchQuery: string = '', type: string = '') => {
  let message = 'Hi! I need help with the transport app.';
  if (searchQuery && type) {
    message = `Hi! I'm looking for a ${type} called "${searchQuery}" but couldn't find it in the app. Can you please add it?`;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(err => console.error('Failed to open WhatsApp:', err));
};