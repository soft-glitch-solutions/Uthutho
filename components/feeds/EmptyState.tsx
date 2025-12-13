// components/feeds/EmptyState.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { EmptyStateProps } from '@/types';
import Header from './Header';

const EmptyState: React.FC<EmptyStateProps> = ({
  unreadNotifications,
  router,
  title = "No Communities",
  subtitle = "Join communities to see feeds",
  buttonText = "Add Community",
  onButtonPress,
}) => {
  const handleButtonPress = onButtonPress || (() => router.push('/favorites'));

  return (
    <View style={styles.container}>
      <Header 
        unreadNotifications={unreadNotifications} 
        router={router} 
      />
      
      <View style={styles.emptyState}>
        
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleButtonPress}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>{buttonText}</Text>
        </TouchableOpacity>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips:</Text>
          <Text style={styles.tip}>• Follow hubs and stops you frequently visit</Text>
          <Text style={styles.tip}>• Get updates from your favorite locations</Text>
          <Text style={styles.tip}>• Connect with other commuters in your area</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#333333',
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 40,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  tipsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    maxWidth: 300,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1ea2b1',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default EmptyState;