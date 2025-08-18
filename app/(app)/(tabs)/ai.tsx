import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  MessageSquare,
  Zap,
  MapPin,
  Clock,
  CloudRain,
  Sun,
  Navigation,
  Users,
  Bot
} from 'lucide-react-native';
import {
  getNearbyHubs,
  getNearbyRoutes,
  getNearbyStops,
  Hub,
  Route,
  Stop
} from '../../../services/locationService';
import { getWeatherData, getWeatherAdvice, WeatherData } from '../../../services/weatherService';

// Types
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface QuickQuestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: 'location' | 'weather' | 'routes' | 'stops';
}

// Components
const TypingIndicator = () => {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length === 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.typingText}>Thinking{dots}</Text>;
};

const QuickQuestionCard = ({ question, onPress }: { question: QuickQuestion, onPress: () => void }) => (
  <TouchableOpacity style={styles.questionCard} onPress={onPress}>
    <View style={styles.questionIcon}>{question.icon}</View>
    <Text style={styles.questionText}>{question.text}</Text>
  </TouchableOpacity>
);

const StatusBarItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <View style={styles.statusItem}>
    {icon}
    <Text style={styles.statusText}>{text}</Text>
  </View>
);

export default function AIScreen() {
  // State
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Sawubona! I\'m your Uthutho AI Assistant. I can help you find nearby transport options, check the weather for your journey, and provide travel tips based on your current location.',
    isUser: false,
    timestamp: new Date(),
  }]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nearbyHubs, setNearbyHubs] = useState<Hub[]>([]);
  const [nearbyRoutes, setNearbyRoutes] = useState<Route[]>([]);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAITyping, setIsAITyping] = useState(false);

  // Constants
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

  // Effects
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for personalized assistance.');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        
        const { latitude, longitude } = currentLocation.coords;
        const [weatherData, hubs, routes, stops] = await Promise.all([
          getWeatherData(latitude, longitude),
          getNearbyHubs(latitude, longitude),
          getNearbyRoutes(latitude, longitude),
          getNearbyStops(latitude, longitude),
        ]);

        setWeather(weatherData);
        setNearbyHubs(hubs);
        setNearbyRoutes(routes);
        setNearbyStops(stops);
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to load location data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handlers
  const handleQuestionPress = async (question: QuickQuestion) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question.text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add typing indicator
    const typingId = `${Date.now()}_typing`;
    setMessages(prev => [...prev, {
      id: typingId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    }]);
    setIsAITyping(true);

    // Generate response
    const response = await generateAIResponse(question);
    
    // Replace typing indicator with actual response
    setMessages(prev => prev.map(msg => 
      msg.id === typingId 
        ? { ...msg, text: response, isTyping: false }
        : msg
    ));
    setIsAITyping(false);
  };

  const generateAIResponse = async (question: QuickQuestion): Promise<string> => {
    switch (question.category) {
      case 'location':
        return generateHubResponse();
      case 'routes':
        return question.id === 'best-routes' 
          ? generateBestRouteResponse() 
          : generateRoutesResponse();
      case 'weather':
        return question.id === 'travel-tips'
          ? generateTravelTips()
          : generateWeatherResponse();
      case 'stops':
        return generateStopsResponse();
      default:
        return 'I\'m here to help with transport information!';
    }
  };

  const generateHubResponse = (): string => {
    if (!nearbyHubs.length) {
      return 'No transport hubs found nearby. Try moving closer to a main road.';
    }
    
    return `Found ${nearbyHubs.length} transport hubs:\n\n${
      nearbyHubs.map((hub, i) => 
        `${i+1}. ${hub.name}\n` +
        (hub.address ? `📍 ${hub.address}\n` : '') +
        (hub.transport_type ? `🚌 ${hub.transport_type}\n` : '')
      ).join('\n')
    }`;
  };

  const generateRoutesResponse = (): string => {
    if (!nearbyRoutes.length) {
      return 'No routes found nearby. Check the Routes tab for more options.';
    }
    
    return `Available routes:\n\n${
      nearbyRoutes.map((route, i) =>
        `${i+1}. ${route.name}\n` +
        `🚌 ${route.transport_type}\n` +
        `💰 R${route.cost}\n` +
        `📍 ${route.start_point} → ${route.end_point}`
      ).join('\n\n')
    }`;
  };

  const generateBestRouteResponse = (): string => {
    if (!nearbyRoutes.length) {
      return 'Need your destination to recommend routes. Check the Routes tab.';
    }
    
    const bestRoute = nearbyRoutes.reduce((a, b) => a.cost < b.cost ? a : b);
    return `Recommended route:\n\n` +
      `🚌 ${bestRoute.name}\n` +
      `💰 Cost: R${bestRoute.cost}\n` +
      `📍 From: ${bestRoute.start_point}\n` +
      `📍 To: ${bestRoute.end_point}\n\n` +
      `Most cost-effective option near you!`;
  };

  const generateWeatherResponse = (): string => {
    if (!weather) return 'Weather data not available. Please try again.';
    
    return `Current weather:\n\n` +
      `🌡️ Temp: ${weather.temperature}°C (feels ${weather.feelsLike}°C)\n` +
      `☁️ ${weather.description}\n` +
      `💧 Humidity: ${weather.humidity}%\n` +
      `💨 Wind: ${weather.windSpeed} km/h\n\n` +
      `Travel advice: ${getWeatherAdvice(weather)}`;
  };

  const generateTravelTips = (): string => {
    if (!weather) return 'Loading weather data...';
    
    return `Today's travel tips:\n\n` +
      `${getWeatherAdvice(weather)}\n\n` +
      `🚌 General Tips:\n` +
      `• Check stop status before leaving\n` +
      `• Keep phone charged\n` +
      `• Have exact change ready\n` +
      `• Stay aware of surroundings\n` +
      `• Plan for peak hour delays`;
  };

  const generateStopsResponse = (): string => {
    if (!nearbyStops.length) {
      return 'No stops found nearby. Walk to the nearest transport hub.';
    }
    
    return `Nearby stops:\n\n${
      nearbyStops.map((stop, i) =>
        `${i+1}. ${stop.name}\n` +
        (stop.cost ? `💰 R${stop.cost}\n` : '') +
        `📍 Stop #${stop.order_number}`
      ).join('\n\n')
    }\n\nCheck Stops tab for real-time updates!`;
  };

  // Render
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000', '#111']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Zap color="#1ea2b1" size={48} />
            <Text style={styles.loadingText}>Loading your assistant...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000', '#111']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Bot size={28} color="#1ea2b1" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Uthutho AI Assistant</Text>
            <Text style={styles.subtitle}>Your personal transport guide</Text>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView 
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
              ]}
            >
              {message.isTyping ? (
                <TypingIndicator />
              ) : (
                <Text style={styles.messageText}>{message.text}</Text>
              )}
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Questions */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionTitle}>What can I help you with?</Text>
          <View style={styles.questionsGrid}>
            {quickQuestions.map(question => (
              <QuickQuestionCard
                key={question.id}
                question={question}
                onPress={() => handleQuestionPress(question)}
              />
            ))}
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <StatusBarItem
            icon={<MapPin color="#1ea2b1" size={16} />}
            text={location ? 'Location Active' : 'Location Disabled'}
          />
          {weather && (
            <StatusBarItem
              icon={weather.description.includes('rain') 
                ? <CloudRain color="#1ea2b1" size={16} /> 
                : <Sun color="#1ea2b1" size={16} />}
              text={`${weather.temperature}°C`}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1ea2b1',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  typingText: {
    color: '#ccc',
    fontSize: 14,
    fontStyle: 'italic',
  },
  questionsSection: {
    padding: 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  questionCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  questionIcon: {
    marginBottom: 8,
  },
  questionText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 6,
  },
});