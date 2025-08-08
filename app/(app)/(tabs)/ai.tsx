
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Send, Bot, User, MapPin, Clock, Route } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function AIScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Sawubona! I'm your Uthutho AI assistant. How can I help you with your transport needs today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationQuestions, setLocationQuestions] = useState<string[]>([]);

  const defaultQuestions = [
    "What's the fastest route to OR Tambo?",
    "Show me nearby taxi ranks",
    "When is the next train to Pretoria?",
    "How much does it cost to get to Cape Town?",
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      let addressData = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressData.length > 0) {
        const address = `${addressData[0].city || addressData[0].district || ''}, ${addressData[0].region || ''}`.trim();
        setUserLocation({
          latitude,
          longitude,
          address,
        });
        generateLocationQuestions(address);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const generateLocationQuestions = (address: string) => {
    const area = address.split(',')[0].trim();
    const questions = [
      `What transport options are available in ${area}?`,
      `How do I get from ${area} to Sandton?`,
      `What's the cheapest way to travel from ${area}?`,
      `Show me taxi routes near ${area}`,
    ];
    setLocationQuestions(questions);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: getAIResponse(message),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (userMessage: string): string => {
    const responses = {
      'tambo': "The fastest route to OR Tambo International Airport is via Gautrain from Sandton (25 min, R170) or from Johannesburg Park Station (15 min, R165). Both run every 10-15 minutes.",
      'taxi': "Here are nearby taxi ranks:\n• Gandhi Square (0.8km) - City to City routes\n• Bree Street Rank (1.2km) - Local routes\n• Park Station Rank (0.3km) - Various destinations",
      'pretoria': "Next trains to Pretoria:\n• 14:30 - Gautrain (R95, 35 min)\n• 15:15 - Metro Rail (R18, 1h 45min)\n• 16:00 - Gautrain (R95, 35 min)",
      'cape town': "Transport to Cape Town:\n• Flight: From R800 (2h)\n• Bus: Intercape R450 (18h)\n• Train: Shosholoza Meyl R280 (24h)\nRecommended: Book flights in advance for better prices.",
      'sandton': "Routes to Sandton:\n• Gautrain from OR Tambo (13 min, R170)\n• Gautrain from Johannesburg (20 min, R95)\n• Bus Rapid Transit (BRT) from various points\n• Taxi from Johannesburg CBD (30-45 min, R25)",
      'cheapest': "Budget transport options:\n• Minibus taxis (R8-R25 for most routes)\n• Metro Rail trains (R5-R18)\n• Walking + public transport combinations\n• Off-peak Gautrain discounts available",
    };

    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Location-specific responses
    if (userLocation?.address) {
      const userArea = userLocation.address.split(',')[0].toLowerCase();
      if (lowerMessage.includes(userArea)) {
        return `Based on your location in ${userLocation.address}, I can help you find the best transport options. What's your destination?`;
      }
    }

    return "I'm here to help with transport information! You can ask me about routes, schedules, costs, or nearby transport options. What would you like to know?";
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <Bot size={28} color="#1ea2b1" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Uthutho AI Assistant</Text>
          <Text style={styles.subtitle}>Your personal transport guide</Text>
        </View>
      </View>

      {/* Quick Questions */}
      <View style={styles.quickQuestions}>
        <Text style={styles.quickTitle}>Quick Questions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(locationQuestions.length > 0 ? locationQuestions : defaultQuestions).map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickButton}
              onPress={() => handleQuickQuestion(question)}
            >
              <Text style={styles.quickButtonText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location Info */}
      {userLocation && (
        <View style={styles.locationCard}>
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.locationText}>
            Your location: {userLocation.address || 'Location detected'}
          </Text>
        </View>
      )}

      {/* Chat Messages */}
      <ScrollView style={styles.chatContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <View style={styles.messageIcon}>
              {msg.isUser ? (
                <User size={16} color="#ffffff" />
              ) : (
                <Bot size={16} color="#1ea2b1" />
              )}
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.messageText}>{msg.text}</Text>
              <Text style={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask about routes, schedules, or transport options..."
          placeholderTextColor="#666666"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <Send size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 2,
  },
  quickQuestions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickTitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  quickButtonText: {
    color: '#1ea2b1',
    fontSize: 14,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1ea2b150',
  },
  locationText: {
    color: '#1ea2b1',
    fontSize: 12,
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sendButton: {
    backgroundColor: '#1ea2b1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#333333',
  },
});