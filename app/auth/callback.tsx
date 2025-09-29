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

  // Close any browser auth session on native
  useEffect(() => {
    if (Platform.OS !== 'web') {
      WebBrowser.dismissAuthSession();
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const finalize = async () => {
      // small settle delay for Supabase to hydrate
      await new Promise(r => setTimeout(r, 600));
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session found.');
      if (!isMounted) return;
      setStatus('Authentication successful!');
      await new Promise(r => setTimeout(r, 400));
      router.replace('/(app)/(tabs)/home');
    };

    const handleIncomingUrl = async (url: string) => {
      try {
        const { queryParams } = Linking.parse(url);
        if (queryParams?.access_token && queryParams?.refresh_token) {
          setStatus('Restoring session...');
          const { error: setErr } = await supabase.auth.setSession({
            access_token: String(queryParams.access_token),
            refresh_token: String(queryParams.refresh_token),
          });
          if (setErr) throw setErr;
        } else if (queryParams?.code) {
          setStatus('Completing OAuth...');
          // @ts-ignore supabase-js v2 supports code exchange
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(String(queryParams.code));
          if (exchErr) throw exchErr;
        }
      } catch (e) {
        if (isMounted) setError('Authentication failed. Please try again.');
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    const init = async () => {
      try {
        setStatus('Verifying your session...');
        // First, see if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await finalize();
          return;
        }
        // Check for any incoming deep link (for mobile OAuth)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { queryParams } = Linking.parse(initialUrl);
          console.log('Deep link detected:', { queryParams });

          if (queryParams?.access_token && queryParams?.refresh_token) {
            setStatus('OAuth session detected...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: String(queryParams.access_token),
              refresh_token: String(queryParams.refresh_token),
            });
            if (sessionError) {
              console.error('Error setting session from URL:', sessionError);
            }
          } else if (queryParams?.code) {
            setStatus('Completing OAuth...');
            // @ts-ignore supabase-js v2 supports code exchange
            const { error: exchErr } = await supabase.auth.exchangeCodeForSession(String(queryParams.code));
            if (exchErr) {
              console.error('Error exchanging code:', exchErr);
            }
          }
        }

        // If still no session, wait a moment and check again
        await finalize();
      } catch (err) {
        if (isMounted) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.replace('/auth'), 1500);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Uthutho</Text>
          <Text style={styles.tagline}>Transform Your Daily Commute</Text>
        </View>

        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#1ea2b1" />
          <Text style={styles.statusText}>{error ? 'Authentication failed' : status}</Text>
          {!error && <Text style={styles.thankYouText}>Thank you! Logging you in now...</Text>}
        </View>

        {error && (
          <Animated.View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Text style={styles.errorSubtext}>Redirecting you back to login...</Text>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Developed by Soft Glitch Solutions</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000', padding: 20 },
  content: { alignItems: 'center', width: '100%', maxWidth: 400 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontSize: 48, fontWeight: 'bold', color: '#1ea2b1', marginBottom: 8, textAlign: 'center' },
  tagline: { fontSize: 16, color: '#ffffff', textAlign: 'center', opacity: 0.8 },
  statusContainer: { alignItems: 'center', marginBottom: 30 },
  statusText: { fontSize: 18, color: '#ffffff', textAlign: 'center', marginTop: 20, marginBottom: 10, fontWeight: '500' },
  thankYouText: { fontSize: 16, color: '#1ea2b1', textAlign: 'center', marginTop: 10, opacity: 0.9 },
  errorContainer: { backgroundColor: 'rgba(211, 47, 47, 0.1)', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(211, 47, 47, 0.3)', marginBottom: 20, alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#ff6b6b', textAlign: 'center', opacity: 0.8 },
  footer: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  footerText: { fontSize: 12, color: '#666666', textAlign: 'center' },
});