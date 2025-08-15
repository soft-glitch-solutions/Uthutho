import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { MessageSquare, Zap, MapPin, Clock, CloudRain, Sun, Navigation, Users , Bot } from 'lucide-react-native';
import { getNearbyHubs, getNearbyRoutes, getNearbyStops, Hub, Route, Stop } from '../../../services/locationService';
import { getWeatherData, getWeatherAdvice, WeatherData } from '../../../services/weatherService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface QuickQuestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: 'location' | 'weather' | 'routes' | 'stops';
}

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Sawubona! I\'m your Uthutho AI Assistant. I can help you find nearby transport options, check the weather for your journey, and provide travel tips based on your current location.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nearbyHubs, setNearbyHubs] = useState<Hub[]>([]);
  const [nearbyRoutes, setNearbyRoutes] = useState<Route[]>([]);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const quickQuestions: QuickQuestion[] = [
    {
      id: 'nearby-hubs',
      text: 'Show me nearby transport hubs',
      icon: <MapPin color="#1ea2b1" size={20} />,
      category: 'location',
    },
    {
      id: 'nearby-routes',
      text: 'What routes are available near me?',
      icon: <Navigation color="#1ea2b1" size={20} />,
      category: 'routes',
    },
    {
      id: 'weather-advice',
      text: 'How\'s the weather for traveling?',
      icon: <Sun color="#1ea2b1" size={20} />,
      category: 'weather',
    },
    {
      id: 'nearby-stops',
      text: 'Find stops close to my location',
      icon: <Clock color="#1ea2b1" size={20} />,
      category: 'stops',
    },
    {
      id: 'travel-tips',
      text: 'Give me travel tips for today',
      icon: <Users color="#1ea2b1" size={20} />,
      category: 'weather',
    },
    {
      id: 'best-routes',
      text: 'What\'s the best route from here?',
      icon: <Zap color="#1ea2b1" size={20} />,
      category: 'routes',
    },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get location permission and current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for personalized assistance.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const { latitude, longitude } = currentLocation.coords;

      // Fetch weather data
      const weatherData = await getWeatherData(latitude, longitude);
      setWeather(weatherData);

      // Fetch nearby transport data
      const [hubs, routes, stops] = await Promise.all([
        getNearbyHubs(latitude, longitude),
        getNearbyRoutes(latitude, longitude),
        getNearbyStops(latitude, longitude),
      ]);

      setNearbyHubs(hubs);
      setNearbyRoutes(routes);
      setNearbyStops(stops);
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load location data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionPress = async (question: QuickQuestion) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question.text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate AI response based on question category
    let aiResponseText = '';

    switch (question.category) {
      case 'location':
        if (question.id === 'nearby-hubs') {
          if (nearbyHubs.length > 0) {
            aiResponseText = `I found ${nearbyHubs.length} transport hubs near you:\n\n`;
            nearbyHubs.forEach((hub, index) => {
              aiResponseText += `${index + 1}. ${hub.name}\n`;
              if (hub.address) aiResponseText += `   📍 ${hub.address}\n`;
              if (hub.transport_type) aiResponseText += `   🚌 ${hub.transport_type}\n`;
              aiResponseText += '\n';
            });
          } else {
            aiResponseText = 'I couldn\'t find any transport hubs very close to your current location. You might need to travel a bit further to reach the nearest hub.';
          }
        }
        break;

      case 'routes':
        if (question.id === 'nearby-routes') {
          if (nearbyRoutes.length > 0) {
            aiResponseText = `Here are ${nearbyRoutes.length} routes available near you:\n\n`;
            nearbyRoutes.forEach((route, index) => {
              aiResponseText += `${index + 1}. ${route.name}\n`;
              aiResponseText += `   🚌 ${route.transport_type}\n`;
              aiResponseText += `   💰 R${route.cost}\n`;
              aiResponseText += `   📍 ${route.start_point} → ${route.end_point}\n\n`;
            });
          } else {
            aiResponseText = 'No routes found in your immediate area. Try checking the Routes tab for more options or move closer to a transport hub.';
          }
        } else if (question.id === 'best-routes') {
          if (nearbyRoutes.length > 0) {
            const cheapestRoute = nearbyRoutes.reduce((prev, current) => 
              prev.cost < current.cost ? prev : current
            );
            aiResponseText = `Based on your location, I recommend the "${cheapestRoute.name}" route:\n\n`;
            aiResponseText += `🚌 Transport: ${cheapestRoute.transport_type}\n`;
            aiResponseText += `💰 Cost: R${cheapestRoute.cost}\n`;
            aiResponseText += `📍 From: ${cheapestRoute.start_point}\n`;
            aiResponseText += `📍 To: ${cheapestRoute.end_point}\n\n`;
            aiResponseText += 'This is the most cost-effective option near you!';
          } else {
            aiResponseText = 'I need to know your destination to recommend the best route. Please check the Routes tab for more detailed planning.';
          }
        }
        break;

      case 'weather':
        if (weather) {
          const advice = getWeatherAdvice(weather);
          if (question.id === 'weather-advice') {
            aiResponseText = `Current weather conditions:\n\n`;
            aiResponseText += `🌡️ Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)\n`;
            aiResponseText += `☁️ Conditions: ${weather.description}\n`;
            aiResponseText += `💧 Humidity: ${weather.humidity}%\n`;
            aiResponseText += `💨 Wind: ${weather.windSpeed} km/h\n\n`;
            aiResponseText += `Travel Advice: ${advice}`;
          } else if (question.id === 'travel-tips') {
            aiResponseText = `Here are today's travel tips based on current conditions:\n\n`;
            aiResponseText += `${advice}\n\n`;
            aiResponseText += `🚌 General Tips:\n`;
            aiResponseText += `• Check stop status before leaving\n`;
            aiResponseText += `• Keep your phone charged for updates\n`;
            aiResponseText += `• Have exact change ready\n`;
            aiResponseText += `• Stay aware of your surroundings\n`;
            aiResponseText += `• Plan for potential delays during peak hours`;
          }
        } else {
          aiResponseText = 'I\'m still loading weather data for your location. Please try again in a moment.';
        }
        break;

      case 'stops':
        if (nearbyStops.length > 0) {
          aiResponseText = `I found ${nearbyStops.length} stops near your location:\n\n`;
          nearbyStops.forEach((stop, index) => {
            aiResponseText += `${index + 1}. ${stop.name}\n`;
            if (stop.cost) aiResponseText += `   💰 Cost: R${stop.cost}\n`;
            aiResponseText += `   📍 Stop #${stop.order_number}\n\n`;
          });
          aiResponseText += 'Check the Stops tab to mark yourself as waiting and see real-time updates!';
        } else {
          aiResponseText = 'No stops found very close to your current location. You might need to walk to the nearest transport hub.';
        }
        break;

      default:
        aiResponseText = 'I\'m here to help with transport information! Try asking about nearby hubs, routes, or weather conditions.';
    }

    // Add AI response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      isUser: false,
      timestamp: new Date(),
    };

    setTimeout(() => {
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const QuickQuestion = ({ question }: { question: QuickQuestion }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => handleQuestionPress(question)}
    >
      <View style={styles.questionIcon}>
        {question.icon}
      </View>
      <Text style={styles.questionText}>{question.text}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#111111']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Zap color="#1ea2b1" size={48} />
            <Text style={styles.loadingText}>Loading your personalized assistant...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.gradient}
      >
      <View style={styles.header}>
        <Bot size={28} color="#1ea2b1" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Uthutho AI Assistant</Text>
          <Text style={styles.subtitle}>Your personal transport guide</Text>
        </View>
      </View>

        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.questionsContainer}>
          <Text style={styles.questionsTitle}>What can I help you with?</Text>
          <View style={styles.questionsGrid}>
            {quickQuestions.map((question) => (
              <QuickQuestion key={question.id} question={question} />
            ))}
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <MapPin color="#1ea2b1" size={16} />
            <Text style={styles.statusText}>
              {location ? 'Location Active' : 'Location Disabled'}
            </Text>
          </View>
          {weather && (
            <View style={styles.statusItem}>
              {weather.description.toLowerCase().includes('rain') ? (
                <CloudRain color="#1ea2b1" size={16} />
              ) : (
                <Sun color="#1ea2b1" size={16} />
              )}
              <Text style={styles.statusText}>{weather.temperature}°C</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  messageContainer: {
    maxWidth: '90%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1ea2b1',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    color: '#cccccc',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  questionsContainer: {
    padding: 8,          // Reduced from 12
    paddingTop: 4,       // Reduced from 8
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  questionsTitle: {
    fontSize: 12,        // Reduced from 14
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,     // Reduced from 8
    textAlign: 'center',
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
 questionCard: {
    backgroundColor: '#1a1a1a',
    width: '48%',
    borderRadius: 6,      // Reduced from 8
    padding: 8,          // Reduced from 12
    alignItems: 'center',
    marginBottom: 6,     // Reduced from 8
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 50,       // Reduced from 60
    justifyContent: 'center',
  },


  questionIcon: {
    marginBottom: 8,
    size: 12,
  },
  questionText: {
    fontSize: 10,        // Reduced from 11
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 12,      // Reduced from 14
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#cccccc',
    fontSize: 12,
    marginLeft: 6,
  },
});