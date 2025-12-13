import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { contactUsOnWhatsApp } from '@/utils/whatsapp';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

interface EmptyStateProps {
  isSearching: boolean;
  type: string;
  searchQuery: string;
}

const FlyboxAnimation = ({ style }: { style?: any }) => {
  const animationRef = useRef<any>(null);
  const isMobile = Platform.OS !== 'web';

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  if (isMobile) {
    return (
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/flybox.json')}
        autoPlay
        loop
        style={style}
      />
    );
  } else {
    return (
      <DotLottieReact
        src="https://lottie.host/b3c284ec-320e-4f2d-8cf4-3f95eea57111/x4PxKADBXK.lottie"
        loop
        autoplay
        style={style}
      />
    );
  }
};

export default function EmptyState({ isSearching, type, searchQuery }: EmptyStateProps) {
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'stop': return 'stop';
      case 'route': return 'route';
      case 'hub': return 'hub';
      default: return type;
    }
  };

  const typeDisplayName = getTypeDisplayName(type);

  return (
    <View style={styles.emptyState}>
      
      <Text style={styles.emptyStateTitle}>
        Oh no! We couldn't find what you were looking for. Message us to 
      </Text>
      
      <View style={styles.whatapp}>
              <TouchableOpacity 
          style={styles.whatsappButton}
          onPress={() => contactUsOnWhatsApp(searchQuery, typeDisplayName)}
        >
          <MessageCircle size={20} color="#ffffff" />
          <Text style={styles.whatsappButtonText}>
            Add your {typeDisplayName}
          </Text>
        </TouchableOpacity>
      </View>


      
      
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>What you can do:</Text>
        <Text style={styles.suggestion}>• Check your spelling and try again</Text>
        <Text style={styles.suggestion}>• Try a different search term</Text>
        <Text style={styles.suggestion}>• Browse through our existing {typeDisplayName}s</Text>
        <Text style={styles.suggestion}>• Contact us to add missing {typeDisplayName}s</Text>
      </View>



    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 400,
    backgroundColor: '#000000',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  emptyStateText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  suggestions: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
  },
  whatapp:{
    backgroundColor: '#000000ff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 12,
  },
  suggestion: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 6,
    lineHeight: 20,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});