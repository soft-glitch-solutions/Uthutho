import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  FlatList,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  Calendar,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
  Trash2,
  Zap,
  Bus,
  MoreVertical,
  ArrowUpRight,
  Receipt
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardEntry {
  id: string;
  card_type: 'myciti' | 'golden_arrow';
  action: 'purchase' | 'ride' | 'points_check';
  amount: number;
  balance_after: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface CardStats {
  currentBalance: number;
  lastPurchaseAmount: number;
  lastPurchaseDate: string;
  ridesThisMonth: number;
  totalSpent: number;
  daysSinceLastPurchase: number;
}

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    icon: CreditCard,
    color: '#1ea2b1',
    pointsName: 'Points',
    gradient: ['#1ea2b1', '#158194'],
    cardImage: 'https://www.myciti.org.za/docs/categories/3069/myconnect-flat-stack03-17.png',
    backgroundColor: '#1a2b3c'
  },
  golden_arrow: {
    name: 'Golden Arrow',
    icon: Bus,
    color: '#f59e0b',
    pointsName: 'Rides',
    gradient: ['#f59e0b', '#d97706'],
    cardImage: null,
    backgroundColor: '#3c2a1a'
  }
};

const CardComponent = ({ 
  cardType, 
  balance, 
  onPress,
  isSelected 
}: { 
  cardType: 'myciti' | 'golden_arrow';
  balance: number;
  onPress: () => void;
  isSelected: boolean;
}) => {
  const card = CARD_TYPES[cardType];
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCard,
          { backgroundColor: card.backgroundColor }
        ]}
      >
        {/* Card Background Pattern */}
        <View style={styles.cardBackground}>
          {cardType === 'myciti' && card.cardImage ? (
            <Image 
              source={{ uri: card.cardImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardGradient, { 
              backgroundColor: card.gradient[0] 
            }]} />
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLogo}>
              {cardType === 'golden_arrow' ? (
                <Bus size={24} color="#ffffff" />
              ) : null}
              <Text style={styles.cardName}>{card.name}</Text>
            </View>
            <MoreVertical size={20} color="rgba(255,255,255,0.7)" />
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {balance} {card.pointsName.toLowerCase()}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardTypeText}>
              {cardType === 'myciti' ? 'CONTACTLESS' : 'BUS CARD'}
            </Text>
            <ArrowUpRight size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function TrackerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<CardEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CardEntry[]>([]);
  const [stats, setStats] = useState<CardStats>({
    currentBalance: 0,
    lastPurchaseAmount: 0,
    lastPurchaseDate: '',
    ridesThisMonth: 0,
    totalSpent: 0,
    daysSinceLastPurchase: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<'myciti' | 'golden_arrow'>('myciti');
  const [selectedAction, setSelectedAction] = useState<'purchase' | 'ride' | 'points_check'>('ride');
  const [amount, setAmount] = useState('');
  const [balanceAfter, setBalanceAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'cards' | 'details'>('cards');

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    // Filter entries when selected card changes
    const filtered = entries.filter(entry => entry.card_type === selectedCard);
    setFilteredEntries(filtered);
    calculateStats(filtered);
  }, [entries, selectedCard]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('card_tracker_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entriesData: CardEntry[]) => {
    if (entriesData.length === 0) {
      setStats({
        currentBalance: 0,
        lastPurchaseAmount: 0,
        lastPurchaseDate: '',
        ridesThisMonth: 0,
        totalSpent: 0,
        daysSinceLastPurchase: 0
      });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current balance is the last entry's balance
    const currentBalance = entriesData[0].balance_after;

    // Find last purchase
    const lastPurchase = entriesData.find(entry => entry.action === 'purchase');
    const lastPurchaseAmount = lastPurchase?.amount || 0;
    const lastPurchaseDate = lastPurchase?.date || '';

    // Calculate days since last purchase
    let daysSinceLastPurchase = 0;
    if (lastPurchaseDate) {
      const lastPurchaseDateObj = new Date(lastPurchaseDate);
      const diffTime = Math.abs(now.getTime() - lastPurchaseDateObj.getTime());
      daysSinceLastPurchase = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Rides this month
    const ridesThisMonth = entriesData.filter(entry => 
      entry.action === 'ride' && 
      new Date(entry.date).getMonth() === currentMonth &&
      new Date(entry.date).getFullYear() === currentYear
    ).length;

    // Total spent (all purchases)
    const totalSpent = entriesData
      .filter(entry => entry.action === 'purchase')
      .reduce((sum, entry) => sum + entry.amount, 0);

    setStats({
      currentBalance,
      lastPurchaseAmount,
      lastPurchaseDate,
      ridesThisMonth,
      totalSpent,
      daysSinceLastPurchase
    });
  };

  const addEntry = async () => {
    if (!amount || parseFloat(amount) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!balanceAfter || parseFloat(balanceAfter) < 0) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    try {
      const entryData = {
        user_id: user?.id,
        card_type: selectedCard,
        action: selectedAction,
        amount: parseFloat(amount),
        balance_after: parseFloat(balanceAfter),
        date: selectedDate,
        notes: notes.trim() || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('card_tracker_entries')
        .insert([entryData]);

      if (error) throw error;

      setShowAddModal(false);
      resetForm();
      await loadEntries();
      
      Alert.alert('Success', 'Entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const deleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('card_tracker_entries')
                .delete()
                .eq('id', entryId);

              if (error) throw error;

              await loadEntries();
              Alert.alert('Success', 'Entry deleted');
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setSelectedAction('ride');
    setAmount('');
    setBalanceAfter('');
    setNotes('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'purchase': return <TrendingUp size={18} color="#10b981" />;
      case 'ride': return <TrendingDown size={18} color="#ef4444" />;
      case 'points_check': return <RefreshCw size={18} color="#1ea2b1" />;
      default: return <CreditCard size={18} color="#666" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'purchase': return 'Card Loaded';
      case 'ride': return 'Ride Used';
      case 'points_check': return 'Balance Check';
      default: return action;
    }
  };

  const handleCardPress = (cardType: 'myciti' | 'golden_arrow') => {
    setSelectedCard(cardType);
    setViewMode('details');
  };

  const renderEntryItem = ({ item }: { item: CardEntry }) => {
    const card = CARD_TYPES[item.card_type];

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          {getActionIcon(item.action)}
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {getActionText(item.action)}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)} • {formatTime(item.created_at)}
          </Text>
          {item.notes && (
            <Text style={styles.transactionNote}>{item.notes}</Text>
          )}
        </View>

        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            item.action === 'purchase' ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {item.action === 'purchase' ? '+' : '-'}{item.amount}
          </Text>
          <Text style={styles.balanceText}>
            {item.balance_after} {card.pointsName.toLowerCase()}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteEntry(item.id)}
        >
          <Trash2 size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  if (viewMode === 'details') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setViewMode('cards')}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {CARD_TYPES[selectedCard].name} History
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#1ea2b1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.currentBalance}</Text>
              <Text style={styles.statLabel}>Current Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.ridesThisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.daysSinceLastPurchase || 'N/A'}</Text>
              <Text style={styles.statLabel}>Days Since Load</Text>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.transactionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.seeAllText}>{filteredEntries.length} entries</Text>
            </View>

            {filteredEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt size={48} color="#666" />
                <Text style={styles.emptyTitle}>No Activity Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first entry to start tracking
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.emptyButtonText}>Add Entry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredEntries}
                renderItem={renderEntryItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.transactionsList}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#1ea2b1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {Object.keys(CARD_TYPES).map((cardType) => (
            <CardComponent
              key={cardType}
              cardType={cardType as 'myciti' | 'golden_arrow'}
              balance={stats.currentBalance}
              onPress={() => handleCardPress(cardType as 'myciti' | 'golden_arrow')}
              isSelected={selectedCard === cardType}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedAction('ride');
                setShowAddModal(true);
              }}
            >
              <TrendingDown size={24} color="#ef4444" />
              <Text style={styles.actionButtonText}>Log Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedAction('purchase');
                setShowAddModal(true);
              }}
            >
              <TrendingUp size={24} color="#10b981" />
              <Text style={styles.actionButtonText}>Add Funds</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedAction('points_check');
                setShowAddModal(true);
              }}
            >
              <RefreshCw size={24} color="#1ea2b1" />
              <Text style={styles.actionButtonText}>Check Balance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Card Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card</Text>
                <View style={styles.cardOptions}>
                  {Object.entries(CARD_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedCard === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.cardOption,
                          isSelected && { borderColor: config.color, backgroundColor: config.color + '20' }
                        ]}
                        onPress={() => setSelectedCard(key as any)}
                      >
                        <Icon size={20} color={isSelected ? config.color : '#666'} />
                        <Text style={[
                          styles.cardOptionText,
                          isSelected && { color: config.color, fontWeight: '600' }
                        ]}>
                          {config.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Action</Text>
                <View style={styles.actionOptions}>
                  <TouchableOpacity
                    style={[
                      styles.actionOption,
                      selectedAction === 'ride' && { borderColor: '#ef4444', backgroundColor: '#ef444420' }
                    ]}
                    onPress={() => setSelectedAction('ride')}
                  >
                    <TrendingDown size={20} color={selectedAction === 'ride' ? '#ef4444' : '#666'} />
                    <Text style={[
                      styles.actionOptionText,
                      selectedAction === 'ride' && { color: '#ef4444', fontWeight: '600' }
                    ]}>
                      Used Ride
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionOption,
                      selectedAction === 'purchase' && { borderColor: '#10b981', backgroundColor: '#10b98120' }
                    ]}
                    onPress={() => setSelectedAction('purchase')}
                  >
                    <TrendingUp size={20} color={selectedAction === 'purchase' ? '#10b981' : '#666'} />
                    <Text style={[
                      styles.actionOptionText,
                      selectedAction === 'purchase' && { color: '#10b981', fontWeight: '600' }
                    ]}>
                      Loaded Card
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionOption,
                      selectedAction === 'points_check' && { borderColor: '#1ea2b1', backgroundColor: '#1ea2b120' }
                    ]}
                    onPress={() => setSelectedAction('points_check')}
                  >
                    <RefreshCw size={20} color={selectedAction === 'points_check' ? '#1ea2b1' : '#666'} />
                    <Text style={[
                      styles.actionOptionText,
                      selectedAction === 'points_check' && { color: '#1ea2b1', fontWeight: '600' }
                    ]}>
                      Balance Check
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {selectedAction === 'purchase' ? 'Amount Loaded' : 
                   selectedAction === 'ride' ? 'Rides Used' : 'Current Balance'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={selectedAction === 'purchase' ? "e.g., 200" : "e.g., 2"}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Balance After */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Balance After This Action</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 150"
                  value={balanceAfter}
                  onChangeText={setBalanceAfter}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="e.g., Loaded at Canal Walk, Used for work commute..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#666"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, (!amount || !balanceAfter) && styles.saveButtonDisabled]}
                onPress={addEntry}
                disabled={!amount || !balanceAfter}
              >
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Card Styles
  cardsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1ea2b1',
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  // Quick Actions
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
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  // Details View Styles
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  transactionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  balanceText: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cardOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  cardOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  cardOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionOptions: {
    gap: 8,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  actionOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1ea2b1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});