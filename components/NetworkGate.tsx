import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

type Props = { children: React.ReactNode };

export default function NetworkGate({ children }: Props) {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(s => {
      // Treat unknown reachability as online to avoid false offline
      const reachable = s.isInternetReachable ?? true;
      setOnline(!!s.isConnected && reachable);
    });
    NetInfo.fetch().then(s => {
      const reachable = s.isInternetReachable ?? true;
      setOnline(!!s.isConnected && reachable);
    });
    return () => sub();
  }, []);

  if (online === null) return null;           // waiting for first reading
  if (!online) return <OfflineView />;        // show offline UI

  return <>{children}</>;
}

function OfflineView() {
  const onRetry = () => NetInfo.fetch().then(() => { /* state updates via listener */ });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>Please connect to the internet to continue.</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.settingsButton]} onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', gap: 12, marginBottom: 20 },
  logo: { width: 96, height: 96, opacity: 0.9 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#cccccc', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 12 },
  buttonsRow: { flexDirection: 'row', gap: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, minWidth: 130, alignItems: 'center' },
  retryButton: { backgroundColor: '#145c63', borderWidth: 1, borderColor: '#1ea2b1' },
  settingsButton: { backgroundColor: '#1ea2b1' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});