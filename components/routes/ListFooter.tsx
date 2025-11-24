import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ListFooterProps {
  loadingMore: boolean;
  isSearchMode: boolean;
}

export default function ListFooter({ loadingMore, isSearchMode }: ListFooterProps) {
  if (isSearchMode) return null; // Don't show load more in search mode
  
  if (!loadingMore) return null;
  
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color="#1ea2b1" />
      <Text style={styles.footerText}>Loading more...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    color: '#1ea2b1',
    marginLeft: 8,
    fontSize: 14,
  },
});