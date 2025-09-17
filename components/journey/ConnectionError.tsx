import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface ConnectionErrorProps {
  message?: string;
}

export const ConnectionError = ({ 
  message = "Connection error. Pull to refresh." 
}: ConnectionErrorProps) => {
  return (
    <View style={styles.connectionError}>
      <WifiOff size={24} color="#ef4444" />
      <Text style={styles.connectionErrorText}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  connectionError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef444420',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  connectionErrorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConnectionError;