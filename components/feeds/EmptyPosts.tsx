// components/feeds/EmptyPosts.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { EmptyPostsProps } from '@/types';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LottieView from 'lottie-react-native';

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

const EmptyPosts: React.FC<EmptyPostsProps> = ({
  title = "No Posts Yet",
  subtitle = "Be the first to post in this community",
  showAnimation = true,
}) => {
  return (
    <View style={styles.emptyPosts}>
      
      <Text style={styles.emptyPostsText}>{title}</Text>
      <Text style={styles.emptyPostsSubtext}>{subtitle}</Text>
      
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Start the conversation:</Text>
        <Text style={styles.suggestion}>• Share your commuting experience</Text>
        <Text style={styles.suggestion}>• Ask questions about routes</Text>
        <Text style={styles.suggestion}>• Post updates about delays or changes</Text>
        <Text style={styles.suggestion}>• Share tips for other commuters</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyPosts: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyPostsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPostsSubtext: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 32,
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
});

export default EmptyPosts;