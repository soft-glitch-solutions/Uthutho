import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    ]).start();

    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        setStatus('Verifying your session...');
        
        // For mobile OAuth, close any open web browser sessions
        if (Platform.OS !== 'web') {
          WebBrowser.dismissAuthSession();
        }

        // Check for any incoming deep link (for mobile OAuth)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { queryParams } = Linking.parse(initialUrl);
          console.log('Deep link detected:', { queryParams });
          
          if (queryParams?.refresh_token || queryParams?.access_token) {
            setStatus('OAuth session detected...');
            
            // Extract tokens from URL for manual session setting if needed
            if (queryParams.access_token && queryParams.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: queryParams.access_token as string,
                refresh_token: queryParams.refresh_token as string,
              });
              
              if (sessionError) {
                console.error('Error setting session from URL:', sessionError);
              }
            }
          }
        }

        // Wait for Supabase to initialize the session
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (session) {
          if (isMounted) {
            setStatus('Authentication successful!');
            console.log('User authenticated:', session.user.email);
            
            // Add a small delay before redirecting to show success message
            await new Promise(resolve => setTimeout(resolve, 1000));
            router.replace('/(app)/(tabs)/home');
          }
        } else {
          // Try one more time after a delay in case session is still loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession) {
            if (isMounted) {
              setStatus('Authentication successful!');
              router.replace('/(app)/(tabs)/home');
            }
          } else {
            throw new Error('No active session found. Please try signing in again.');
          }
        }

      } catch (err: any) {
        console.error('Auth callback error:', err);
        if (isMounted) {
          setError(err.message || 'Authentication failed. Please try again.');
          // Wait a bit before redirecting to show error
          setTimeout(() => {
            router.replace('/auth');
          }, 3000);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Uthutho</Text>
          <Text style={styles.tagline}>Transform Your Daily Commute</Text>
        </View>

        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#1ea2b1" />
          <Text style={styles.statusText}>{status}</Text>
          
          {!error && (
            <Text style={styles.thankYouText}>
              Thank you! Logging you in now...
            </Text>
          )}
        </View>

        {error && (
          <Animated.View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Text style={styles.errorSubtext}>
              Redirecting you back to login...
            </Text>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Developed by Soft Glitch Solutions
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  thankYouText: {
    fontSize: 16,
    color: '#1ea2b1',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.9,
  },
  errorContainer: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.3)',
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});