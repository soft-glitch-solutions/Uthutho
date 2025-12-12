import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, CreditCard, Grid3x3 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import CardComponent from '@/components/tracker/CardComponent';
import AddCardModal from '@/components/tracker/AddCardModal';
import AddEntryModal from '@/components/tracker/AddEntryModal';
import EditCardModal from '@/components/tracker/EditCardModal';
import { UserCard } from '@/types/tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

// Skeleton Loader Component
const CardSkeletonLoader = () => {
  return (
    <View style={[styles.skeletonCard, isDesktop && styles.skeletonCardDesktop]}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonLogo, isDesktop && styles.skeletonLogoDesktop]} />
        <View style={[styles.skeletonTitle, isDesktop && styles.skeletonTitleDesktop]} />
        <View style={[styles.skeletonMenu, isDesktop && styles.skeletonMenuDesktop]} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonNumber, isDesktop && styles.skeletonNumberDesktop]} />
        <View style={[styles.skeletonHolder, isDesktop && styles.skeletonHolderDesktop]} />
      </View>
      <View style={styles.skeletonBalance}>
        <View style={[styles.skeletonBalanceLabel, isDesktop && styles.skeletonBalanceLabelDesktop]} />
        <View style={[styles.skeletonBalanceAmount, isDesktop && styles.skeletonBalanceAmountDesktop]} />
      </View>
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonType, isDesktop && styles.skeletonTypeDesktop]} />
        <View style={[styles.skeletonArrow, isDesktop && styles.skeletonArrowDesktop]} />
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    try {
      console.log('Attempting to remove card from Supabase:', cardId);
      
      // Soft delete (set is_active to false)
      const { error } = await supabase
        .from('user_cards')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Card successfully removed from Supabase');
      
      // Update local state immediately for better UX
      setUserCards(prevCards => prevCards.filter(card => card.id !== cardId));
      
      // Update selected card if needed
      if (selectedCard?.id === cardId) {
        setSelectedCard(userCards.find(card => card.id !== cardId) || null);
      }

      // Show success message
      Alert.alert('Success', 'Card removed successfully');
      
    } catch (error) {
      console.error('Error removing card:', error);
      Alert.alert('Error', 'Failed to remove card. Please try again.');
      
      // Reload cards to sync with server state
      loadUserCards();
    }
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
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, isDesktop && styles.headerTitleDesktop]}>My Cards</Text>
          {isDesktop && userCards.length > 0 && (
            <TouchableOpacity
              style={styles.viewModeToggle}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Grid3x3 size={20} color="#1ea2b1" />
              <Text style={styles.viewModeText}>
                {viewMode === 'grid' ? 'Grid View' : 'List View'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={isDesktop ? styles.desktopHeaderActions : styles.mobileHeaderActions}>
          {isDesktop && userCards.length > 0 && (
            <View style={styles.quickActionButtons}>
              <TouchableOpacity 
                style={[styles.desktopActionButton, { marginRight: 8 }]}
                onPress={() => {
                  setSelectedAction('ride');
                  setShowAddEntryModal(true);
                }}
              >
                <Text style={styles.desktopActionButtonText}>Log Ride</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.desktopActionButton}
                onPress={() => {
                  setSelectedAction('purchase');
                  setShowAddEntryModal(true);
                }}
              >
                <Text style={styles.desktopActionButtonText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.addButton, isDesktop && styles.addButtonDesktop]}
            onPress={() => setShowAddCardModal(true)}
          >
            <Plus size={isDesktop ? 20 : 24} color="#1ea2b1" />
            {isDesktop && <Text style={styles.addButtonText}>Add Card</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={isDesktop}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop
        ]}
      >
        {loading ? (
          // Skeleton Loaders while loading
          <View style={[styles.skeletonContainer, isDesktop && styles.skeletonContainerDesktop]}>
            {isDesktop && (
              <View style={styles.dragInstructions}>
                <Text style={styles.dragInstructionsText}>
                  💡 Drag and drop cards to reorder them
                </Text>
              </View>
            )}
            <View style={[styles.skeletonGrid, isDesktop && styles.skeletonGridDesktop]}>
              {[1, 2, 3, 4].map((item) => (
                <CardSkeletonLoader key={item} />
              ))}
            </View>
            {!isDesktop && (
              <View style={styles.quickActions}>
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.actionButtons}>
                  <View style={styles.skeletonActionButton} />
                  <View style={styles.skeletonActionButton} />
                </View>
              </View>
            )}
          </View>
        ) : userCards.length === 0 ? (
          // Empty state
          <View style={[styles.emptyState, isDesktop && styles.emptyStateDesktop]}>
            <CreditCard size={isDesktop ? 80 : 64} color="#666" />
            <Text style={[styles.emptyTitle, isDesktop && styles.emptyTitleDesktop]}>
              No Cards Added
            </Text>
            <Text style={[styles.emptySubtitle, isDesktop && styles.emptySubtitleDesktop]}>
              Add your first transport card to start tracking your usage
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, isDesktop && styles.emptyButtonDesktop]}
              onPress={() => setShowAddCardModal(true)}
            >
              <Plus size={isDesktop ? 18 : 20} color="#ffffff" />
              <Text style={[styles.emptyButtonText, isDesktop && styles.emptyButtonTextDesktop]}>
                Add Your First Card
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Loaded state
          <>
            {!isDesktop && (
              <View style={styles.dragInstructions}>
                <Text style={styles.dragInstructionsText}>
                  💡 Long press and drag to reorder cards
                </Text>
              </View>
            )}

            <View style={[
              styles.cardsGrid, 
              isDesktop && styles.cardsGridDesktop,
              viewMode === 'list' && isDesktop && styles.cardsListDesktop
            ]}>
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

            {!isDesktop && (
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
            )}

            {isDesktop && userCards.length > 0 && (
              <View style={styles.statsContainer}>
                <Text style={[styles.sectionTitle, styles.statsTitle]}>Card Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{userCards.length}</Text>
                    <Text style={styles.statLabel}>Total Cards</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      R{userCards.reduce((sum, card) => sum + (card.balance || 0), 0).toFixed(2)}
                    </Text>
                    <Text style={styles.statLabel}>Total Balance</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {userCards.filter(card => card.card_type === 'gold').length}
                    </Text>
                    <Text style={styles.statLabel}>Gold Cards</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {userCards.filter(card => card.card_type === 'student').length}
                    </Text>
                    <Text style={styles.statLabel}>Student Cards</Text>
                  </View>
                </View>
              </View>
            )}
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
  containerDesktop: {
    width: '100%',
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerDesktop: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTitleDesktop: {
    fontSize: 28,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  viewModeText: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
  },
  mobileHeaderActions: {
    flexDirection: 'row',
  },
  desktopHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickActionButtons: {
    flexDirection: 'row',
  },
  desktopActionButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  desktopActionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDesktop: {
    width: 'auto',
    height: 'auto',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#1ea2b1',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentDesktop: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  scrollContentDesktop: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dragInstructions: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
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
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 8,
  },
  cardsListDesktop: {
    flexDirection: 'column',
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
  emptyStateDesktop: {
    padding: 60,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleDesktop: {
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptySubtitleDesktop: {
    fontSize: 16,
    maxWidth: 400,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyButtonTextDesktop: {
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  statsTitle: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Skeleton Styles
  skeletonContainer: {
    gap: 16,
  },
  skeletonContainerDesktop: {
    gap: 20,
  },
  skeletonGrid: {
    gap: 16,
  },
  skeletonGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    height: 180,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skeletonCardDesktop: {
    width: 'calc(50% - 10px)',
    minWidth: 280,
    height: 160,
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
  skeletonLogoDesktop: {
    width: 35,
    height: 18,
  },
  skeletonTitle: {
    width: 80,
    height: 16,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginLeft: 8,
  },
  skeletonTitleDesktop: {
    width: 70,
    height: 14,
  },
  skeletonMenu: {
    width: 18,
    height: 18,
    backgroundColor: '#333333',
    borderRadius: 9,
  },
  skeletonMenuDesktop: {
    width: 16,
    height: 16,
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
  skeletonNumberDesktop: {
    width: 100,
    height: 18,
  },
  skeletonHolder: {
    width: 80,
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonHolderDesktop: {
    width: 70,
    height: 12,
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
  skeletonBalanceLabelDesktop: {
    width: 50,
    height: 12,
  },
  skeletonBalanceAmount: {
    width: 80,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  skeletonBalanceAmountDesktop: {
    width: 70,
    height: 20,
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
  skeletonTypeDesktop: {
    width: 80,
    height: 10,
  },
  skeletonArrow: {
    width: 14,
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 7,
  },
  skeletonArrowDesktop: {
    width: 12,
    height: 12,
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