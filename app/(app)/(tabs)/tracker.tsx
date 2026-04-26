import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, CreditCard, Grid3x3, LayoutList } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import CardComponent from '@/components/tracker/CardComponent';
import AddCardModal from '@/components/tracker/AddCardModal';
import AddEntryModal from '@/components/tracker/AddEntryModal';
import EditCardModal from '@/components/tracker/EditCardModal';
import { UserCard } from '@/types/tracker';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Modern Skeleton Loader
const CardSkeletonLoader = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonBox} />
        <View style={styles.skeletonCircle} />
      </View>
      <View style={[styles.skeletonLine, { width: '80%', marginBottom: 12 }]} />
      <View style={[styles.skeletonLine, { width: '50%' }]} />
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonLine, { width: 60 }]} />
        <View style={[styles.skeletonLine, { width: 40 }]} />
      </View>
    </Animated.View>
  );
};

export default function TrackerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedAction, setSelectedAction] = useState<'purchase' | 'ride'>('ride');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      if (data && data.length > 0) setSelectedCard(data[0]);
    } catch (error) {
      console.error('Error loading user cards:', error);
      Alert.alert('Error', 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

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
          .update({ position: index, updated_at: new Date().toISOString() })
          .eq('id', card.id)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating positions:', error);
      loadUserCards();
    }
  };

  const removeCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('user_cards')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', cardId);
      if (error) throw error;
      setUserCards(prev => prev.filter(c => c.id !== cardId));
      Alert.alert('Success', 'Card removed');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove card');
    }
  };

  const handleEditCard = (card: UserCard) => {
    setEditingCard(card);
    setShowEditCardModal(true);
  };

  const handleCardPress = (card: UserCard) => {
    router.push(`/card/${card.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Branded Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.brandText}>Uthutho</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <LayoutList size={20} color="#FFF" /> : <Grid3x3 size={20} color="#FFF" />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddCardModal(true)}
            >
              <Plus size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.readyText}>READY TO MOVE</Text>
          <Text style={styles.headingText}>My Wallet</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            <CardSkeletonLoader />
            <CardSkeletonLoader />
          </View>
        ) : userCards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <CreditCard size={40} color="#1ea2b1" />
            </View>
            <Text style={styles.emptyTitle}>No Cards Found</Text>
            <Text style={styles.emptySubtitle}>Add your first transport card to start tracking your commute budget.</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowAddCardModal(true)}
            >
              <Text style={styles.emptyButtonText}>ADD NEW CARD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[
              styles.cardsContainer,
              viewMode === 'grid' ? styles.gridContainer : styles.listContainer
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

            {/* Quick Actions Card */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => {
                    setSelectedAction('ride');
                    setShowAddEntryModal(true);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
                    <Plus size={20} color="#1ea2b1" />
                  </View>
                  <Text style={styles.actionText}>Log Ride</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => {
                    setSelectedAction('purchase');
                    setShowAddEntryModal(true);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <CreditCard size={20} color="#10B981" />
                  </View>
                  <Text style={styles.actionText}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Wallet Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionLabel}>WALLET INSIGHTS</Text>
              <View style={styles.statsCard}>
                <View style={styles.statRow}>
                  <View>
                    <Text style={styles.statLabel}>Total Balance</Text>
                    <Text style={styles.statValue}>
                      R{userCards.reduce((sum, card) => sum + (card.balance || 0), 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statCircle}>
                    <Text style={styles.statPercent}>100%</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.statsSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{userCards.length}</Text>
                    <Text style={styles.summaryLabel}>Cards</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {userCards.filter(c => (c.balance || 0) < 50).length}
                    </Text>
                    <Text style={styles.summaryLabel}>Low Funds</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddCardModal
        visible={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onCardAdded={loadUserCards}
      />

      <AddEntryModal
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        selectedCard={selectedCard}
        selectedAction={selectedAction}
        onEntryAdded={loadUserCards}
      />

      <EditCardModal
        visible={showEditCardModal}
        card={editingCard}
        onClose={() => {
          setShowEditCardModal(false);
          setEditingCard(null);
        }}
        onCardUpdated={loadUserCards}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 0,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  cardsContainer: {
    marginBottom: 32,
  },
  gridContainer: {
    gap: 16,
  },
  listContainer: {
    gap: 12,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#444',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  statCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#1ea2b1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPercent: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 20,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsSummaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#444',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1a1a1a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#111',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 12,
  },
  skeletonContainer: {
    gap: 16,
  },
  skeletonCard: {
    height: 180,
    backgroundColor: '#111',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  skeletonBox: {
    width: 60,
    height: 20,
    backgroundColor: '#222',
    borderRadius: 4,
  },
  skeletonCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#222',
    borderRadius: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
});