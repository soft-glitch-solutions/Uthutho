import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, CreditCard } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import CardComponent from '@/components/tracker/CardComponent';
import AddCardModal from '@/components/tracker/AddCardModal';
import AddEntryModal from '@/components/tracker/AddEntryModal';
import EditCardModal from '@/components/tracker/EditCardModal';
import { UserCard } from '@/types/tracker';

// Skeleton Loader Component
const CardSkeletonLoader = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonLogo} />
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonMenu} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonNumber} />
        <View style={styles.skeletonHolder} />
      </View>
      <View style={styles.skeletonBalance}>
        <View style={styles.skeletonBalanceLabel} />
        <View style={styles.skeletonBalanceAmount} />
      </View>
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonType} />
        <View style={styles.skeletonArrow} />
      </View>
    </View>
  );
};

export default function TrackerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedAction, setSelectedAction] = useState<'purchase' | 'ride'>('ride');

  // Edit card state
  const [editingCard, setEditingCard] = useState<UserCard | null>(null);
  const [showEditCardModal, setShowEditCardModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserCards();
    }
  }, [user]);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserCards(data || []);
      
      if (data && data.length > 0) {
        setSelectedCard(data[0]);
      }
    } catch (error) {
      console.error('Error loading user cards:', error);
      Alert.alert('Error', 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop functionality
  const handlePositionChange = async (fromIndex: number, toIndex: number) => {
    const newIndex = Math.max(0, Math.min(toIndex, userCards.length - 1));
    
    if (fromIndex === newIndex) return;

    const newCards = [...userCards];
    const [movedCard] = newCards.splice(fromIndex, 1);
    newCards.splice(newIndex, 0, movedCard);
    
    setUserCards(newCards);

    try {
      const updatePromises = newCards.map((card, index) =>
        supabase
          .from('user_cards')
          .update({ 
            position: index,
            updated_at: new Date().toISOString()
          })
          .eq('id', card.id)
          .eq('user_id', user?.id)
      );

      const results = await Promise.all(updatePromises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        const errors = results.filter(result => result.error).map(result => result.error);
        console.error('Position update errors:', errors);
        throw new Error('Failed to update some card positions');
      }
    } catch (error) {
      console.error('Error updating card positions:', error);
      loadUserCards();
    }
  };

  const removeCard = async (cardId: string) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card? All associated entries will be kept for historical records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_cards')
                .update({ is_active: false })
                .eq('id', cardId);

              if (error) throw error;

              await loadUserCards();
              if (selectedCard?.id === cardId) {
                setSelectedCard(userCards.find(card => card.id !== cardId) || null);
              }
              Alert.alert('Success', 'Card removed successfully');
            } catch (error) {
              console.error('Error removing card:', error);
              Alert.alert('Error', 'Failed to remove card');
            }
          }
        }
      ]
    );
  };

  const handleEditCard = (card: UserCard) => {
    setEditingCard(card);
    setShowEditCardModal(true);
  };

  const handleCardUpdated = () => {
    setShowEditCardModal(false);
    setEditingCard(null);
    loadUserCards();
  };

  const handleCardPress = (card: UserCard) => {
    router.push(`/card/${card.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddCardModal(true)}
        >
          <Plus size={24} color="#1ea2b1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          // Skeleton Loaders while loading
          <View style={styles.skeletonContainer}>
            <View style={styles.dragInstructions}>
              <Text style={styles.dragInstructionsText}>
                💡 Long press and drag to reorder cards
              </Text>
            </View>
            {[1, 2, 3].map((item) => (
              <CardSkeletonLoader key={item} />
            ))}
            <View style={styles.quickActions}>
              <View style={styles.skeletonSectionTitle} />
              <View style={styles.actionButtons}>
                <View style={styles.skeletonActionButton} />
                <View style={styles.skeletonActionButton} />
              </View>
            </View>
          </View>
        ) : userCards.length === 0 ? (
          // Empty state
          <View style={styles.emptyState}>
            <CreditCard size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Cards Added</Text>
            <Text style={styles.emptySubtitle}>
              Add your first transport card to start tracking your usage
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowAddCardModal(true)}
            >
              <Plus size={20} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Add Your First Card</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Loaded state
          <>
            <View style={styles.dragInstructions}>
              <Text style={styles.dragInstructionsText}>
                💡 Long press and drag to reorder cards
              </Text>
            </View>

            <View style={styles.cardsGrid}>
              {userCards.map((card, index) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  index={index}
                  onPress={() => handleCardPress(card)}
                  onRemoveCard={removeCard}
                  onEditCard={handleEditCard}
                  onPositionChange={handlePositionChange}
                  isSelected={selectedCard?.id === card.id}
                />
              ))}
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedAction('ride');
                    setShowAddEntryModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Log Ride</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedAction('purchase');
                    setShowAddEntryModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <AddCardModal
        visible={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onCardAdded={() => {
          setShowAddCardModal(false);
          loadUserCards();
        }}
      />

      <AddEntryModal
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        selectedCard={selectedCard}
        selectedAction={selectedAction}
        onEntryAdded={() => {
          setShowAddEntryModal(false);
          if (selectedCard) {
            loadUserCards();
          }
        }}
      />

      <EditCardModal
        visible={showEditCardModal}
        card={editingCard}
        onClose={() => {
          setShowEditCardModal(false);
          setEditingCard(null);
        }}
        onCardUpdated={handleCardUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dragInstructions: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.3)',
  },
  dragInstructionsText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Skeleton Styles
  skeletonContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    height: 180,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonLogo: {
    width: 40,
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 80,
    height: 16,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginLeft: 8,
  },
  skeletonMenu: {
    width: 18,
    height: 18,
    backgroundColor: '#333333',
    borderRadius: 9,
  },
  skeletonContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonNumber: {
    width: 120,
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonHolder: {
    width: 80,
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonBalance: {
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonBalanceLabel: {
    width: 60,
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonBalanceAmount: {
    width: 80,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonType: {
    width: 100,
    height: 12,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonArrow: {
    width: 14,
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 7,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonActionButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#333333',
    borderRadius: 12,
  },
});