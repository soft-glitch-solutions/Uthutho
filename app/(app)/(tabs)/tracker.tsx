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
  TrendingDown,
  TrendingUp,
  X,
  Trash2,
  MoreVertical,
  ArrowUpRight,
  Receipt,
  Edit3
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserCard {
  id: string;
  user_id: string;
  card_type: 'myciti' | 'golden_arrow';
  card_number: string;
  card_holder: string;
  current_balance: number;
  created_at: string;
  is_active: boolean;
}

interface CardEntry {
  id: string;
  user_id: string;
  card_id: string;
  action: 'purchase' | 'ride';
  amount: number;
  balance_after: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface ActivityData {
  date: string;
  count: number;
  level: number;
}

const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    icon: CreditCard,
    color: '#1ea2b1',
    pointsName: 'Points',
    gradient: ['#1ea2b1', '#158194'],
    cardImage: 'https://www.sapeople.com/wp-content/uploads/2023/10/MyCiTi-bus-2-1024x683.jpg',
    backgroundColor: '#1a2b3c'
  },
  golden_arrow: {
    name: 'Golden Arrow',
    icon: null, // Using image instead of icon
    color: '#f59e0b',
    pointsName: 'Rides',
    gradient: ['#f59e0b', '#d97706'],
    cardImage: null,
    logoImage: 'https://www.gabs.co.za/Assets/Images/logo_main.png',
    backgroundColor: '#3c2a1a'
  }
};

const ActivityGraph = ({ data, selectedYear }: { data: ActivityData[], selectedYear: number }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
  
  // Generate GitHub-style grid (53 weeks x 7 days)
  const generateGitHubGrid = () => {
    const grid = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    
    // Find the start of the week (Sunday)
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());
    
    for (let week = 0; week < 53; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
        
        const dateString = currentDate.toISOString().split('T')[0];
        const activity = data.find(d => d.date === dateString);
        
        weekData.push({
          date: dateString,
          level: activity?.level || 0,
          count: activity?.count || 0
        });
      }
      grid.push(weekData);
    }
    
    return grid;
  };

  const grid = generateGitHubGrid();
  const getActivityColor = (level: number) => {
    const colors = [
      '#ebedf0', // No activity
      '#9be9a8', // Low
      '#40c463', // Medium
      '#30a14e', // High
      '#216e39'  // Very high
    ];
    return colors[level] || colors[0];
  };

  return (
    <View style={styles.activityGraph}>
      <View style={styles.graphHeader}>
        <Text style={styles.graphTitle}>
          Activity in {selectedYear}
        </Text>
        <View style={styles.yearSelector}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.selectedYearButton
              ]}
              onPress={() => {/* You can add year change functionality here */}}
            >
              <Text style={[
                styles.yearButtonText,
                selectedYear === year && styles.selectedYearButtonText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.graphContainer}>
        <View style={styles.weekLabels}>
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, index) => (
            <Text key={index} style={styles.weekLabel}>{day}</Text>
          ))}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridContainer}>
            {grid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.dayCell,
                      { backgroundColor: getActivityColor(day.level) }
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.graphLegend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 1, 2, 3, 4].map(level => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: getActivityColor(level) }
            ]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const CardComponent = ({ 
  card, 
  onPress,
  isSelected,
  onRemoveCard
}: { 
  card: UserCard;
  onPress: () => void;
  isSelected: boolean;
  onRemoveCard: (cardId: string) => void;
}) => {
  const cardType = CARD_TYPES[card.card_type];
  const scaleAnim = new Animated.Value(1);
  const [showMenu, setShowMenu] = useState(false);

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

  const formatCardNumber = (number: string) => {
    return `•••• ${number.slice(-4)}`;
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleRemoveCard = () => {
    setShowMenu(false);
    onRemoveCard(card.id);
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
          { backgroundColor: cardType.backgroundColor }
        ]}
      >
        {/* Card Background with Overlay */}
        <View style={styles.cardBackground}>
          {cardType.cardImage ? (
            <Image 
              source={{ uri: cardType.cardImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardGradient, { 
              backgroundColor: cardType.gradient[0] 
            }]} />
          )}
          {/* Dark overlay for better text readability */}
          <View style={styles.cardOverlay} />
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLogo}>
              {card.card_type === 'golden_arrow' ? (
                <Image 
                  source={{ uri: cardType.logoImage }}
                  style={styles.goldenArrowLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.mycitiLogo}>
                  <Text style={styles.mycitiLogoText}>my</Text>
                  <Text style={[styles.mycitiLogoText, styles.mycitiLogoHighlight]}>Citi</Text>
                </View>
              )}
              <Text style={styles.cardName}>{cardType.name}</Text>
            </View>
            
            {/* Menu Button */}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <MoreVertical size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardNumberSection}>
            <Text style={styles.cardNumber}>{formatCardNumber(card.card_number)}</Text>
            <Text style={styles.cardHolder}>{card.card_holder}</Text>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {card.current_balance} {cardType.pointsName.toLowerCase()}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardTypeText}>
              {card.card_type === 'myciti' ? 'CONTACTLESS BUS CARD' : 'BUS CARD'}
            </Text>
            <ArrowUpRight size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </View>

        {/* Menu Modal */}
        {showMenu && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity 
              style={styles.menuBackdrop}
              onPress={() => setShowMenu(false)}
            />
            <View style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleRemoveCard}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={[styles.menuItemText, styles.removeText]}>Remove Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function TrackerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [entries, setEntries] = useState<CardEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CardEntry[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [selectedAction, setSelectedAction] = useState<'purchase' | 'ride'>('ride');
  const [amount, setAmount] = useState('');
  const [balanceAfter, setBalanceAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'cards' | 'details'>('cards');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // New card form state
  const [newCardType, setNewCardType] = useState<'myciti' | 'golden_arrow'>('myciti');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => {
    if (user) {
      loadUserCards();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCard) {
      loadCardEntries(selectedCard.id);
      loadActivityData(selectedCard.id);
    }
  }, [selectedCard, selectedYear]);

  const loadUserCards = async () => {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserCards(data || []);
      
      // Auto-select first card if available
      if (data && data.length > 0) {
        setSelectedCard(data[0]);
      }
    } catch (error) {
      console.error('Error loading user cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardEntries = async (cardId: string) => {
    try {
      const { data, error } = await supabase
        .from('card_entries')
        .select('*')
        .eq('card_id', cardId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error loading card entries:', error);
    }
  };

  const loadActivityData = async (cardId: string) => {
    try {
      const { data, error } = await supabase
        .from('card_entries')
        .select('date, action')
        .eq('card_id', cardId)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (error) throw error;

      // Process data for GitHub-style activity
      const activityMap = new Map();
      
      data?.forEach(entry => {
        const date = entry.date;
        if (activityMap.has(date)) {
          activityMap.set(date, activityMap.get(date) + 1);
        } else {
          activityMap.set(date, 1);
        }
      });

      const activity: ActivityData[] = [];
      activityMap.forEach((count, date) => {
        let level = 0;
        if (count >= 4) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;
        
        activity.push({ date, count, level });
      });

      setActivityData(activity);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const addNewCard = async () => {
    if (!newCardNumber.trim()) {
      Alert.alert('Error', 'Please enter a card number');
      return;
    }

    if (!newCardHolder.trim()) {
      Alert.alert('Error', 'Please enter card holder name');
      return;
    }

    if (!initialBalance || parseFloat(initialBalance) < 0) {
      Alert.alert('Error', 'Please enter a valid initial balance');
      return;
    }

    try {
      const cardData = {
        user_id: user?.id,
        card_type: newCardType,
        card_number: newCardNumber.trim(),
        card_holder: newCardHolder.trim(),
        current_balance: parseFloat(initialBalance),
        is_active: true
      };

      const { data, error } = await supabase
        .from('user_cards')
        .insert([cardData])
        .select();

      if (error) throw error;

      setShowAddCardModal(false);
      resetCardForm();
      await loadUserCards();
      
      Alert.alert('Success', 'Card added successfully!');
    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Failed to add card');
    }
  };

  const addEntry = async () => {
    if (!selectedCard) return;

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
        card_id: selectedCard.id,
        action: selectedAction,
        amount: parseFloat(amount),
        balance_after: parseFloat(balanceAfter),
        date: selectedDate,
        notes: notes.trim() || null,
      };

      const { error } = await supabase
        .from('card_entries')
        .insert([entryData]);

      if (error) throw error;

      // Update card balance
      const { error: updateError } = await supabase
        .from('user_cards')
        .update({ current_balance: parseFloat(balanceAfter) })
        .eq('id', selectedCard.id);

      if (updateError) throw updateError;

      setShowAddEntryModal(false);
      resetEntryForm();
      await loadCardEntries(selectedCard.id);
      await loadUserCards(); // Refresh cards to update balance
      
      Alert.alert('Success', 'Entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
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

  const resetCardForm = () => {
    setNewCardType('myciti');
    setNewCardNumber('');
    setNewCardHolder('');
    setInitialBalance('');
  };

  const resetEntryForm = () => {
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
      default: return <CreditCard size={18} color="#666" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'purchase': return 'Card Loaded';
      case 'ride': return 'Ride Used';
      default: return action;
    }
  };

  const handleCardPress = (card: UserCard) => {
    setSelectedCard(card);
    setViewMode('details');
  };

  const renderEntryItem = ({ item }: { item: CardEntry }) => {
    const cardType = selectedCard ? CARD_TYPES[selectedCard.card_type] : CARD_TYPES.myciti;

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
            {item.balance_after} {cardType.pointsName.toLowerCase()}
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
                .from('card_entries')
                .delete()
                .eq('id', entryId);

              if (error) throw error;

              if (selectedCard) {
                await loadCardEntries(selectedCard.id);
                await loadUserCards();
              }
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

  if (viewMode === 'details' && selectedCard) {
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
            {CARD_TYPES[selectedCard.card_type].name}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddEntryModal(true)}
          >
            <Plus size={24} color="#1ea2b1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Activity Graph */}
          <ActivityGraph data={activityData} selectedYear={selectedYear} />

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedCard.current_balance}</Text>
              <Text style={styles.statLabel}>Current Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredEntries.filter(e => e.action === 'ride').length}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredEntries.filter(e => e.action === 'purchase').length}
              </Text>
              <Text style={styles.statLabel}>Times Loaded</Text>
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
                  onPress={() => setShowAddEntryModal(true)}
                >
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.emptyButtonText}>Add Entry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredEntries.slice(0, 10)}
                renderItem={renderEntryItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.transactionsList}
              />
            )}
          </View>
        </ScrollView>

        {/* Add Entry Modal */}
        <AddEntryModal
          visible={showAddEntryModal}
          onClose={() => setShowAddEntryModal(false)}
          selectedCard={selectedCard}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          amount={amount}
          setAmount={setAmount}
          balanceAfter={balanceAfter}
          setBalanceAfter={setBalanceAfter}
          notes={notes}
          setNotes={setNotes}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onAddEntry={addEntry}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
        {userCards.length === 0 ? (
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
          <>
            {/* Cards Grid */}
            <View style={styles.cardsGrid}>
              {userCards.map((card) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  onPress={() => handleCardPress(card)}
                  isSelected={selectedCard?.id === card.id}
                  onRemoveCard={removeCard}
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
                    setShowAddEntryModal(true);
                  }}
                >
                  <TrendingDown size={24} color="#ef4444" />
                  <Text style={styles.actionButtonText}>Log Ride</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedAction('purchase');
                    setShowAddEntryModal(true);
                  }}
                >
                  <TrendingUp size={24} color="#10b981" />
                  <Text style={styles.actionButtonText}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Card Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Type</Text>
                <View style={styles.cardOptions}>
                  {Object.entries(CARD_TYPES).map(([key, config]) => {
                    const isSelected = newCardType === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.cardOption,
                          isSelected && { borderColor: config.color, backgroundColor: config.color + '20' }
                        ]}
                        onPress={() => setNewCardType(key as any)}
                      >
                        {key === 'golden_arrow' ? (
                          <Image 
                            source={{ uri: config.logoImage }}
                            style={styles.cardOptionLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <CreditCard size={20} color={isSelected ? config.color : '#666'} />
                        )}
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

              {/* Card Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your card number"
                  value={newCardNumber}
                  onChangeText={setNewCardNumber}
                  placeholderTextColor="#666"
                />
              </View>

              {/* Card Holder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your name as on card"
                  value={newCardHolder}
                  onChangeText={setNewCardHolder}
                  placeholderTextColor="#666"
                />
              </View>

              {/* Initial Balance */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Balance</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 100"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddCardModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, (!newCardNumber || !newCardHolder || !initialBalance) && styles.saveButtonDisabled]}
                onPress={addNewCard}
                disabled={!newCardNumber || !newCardHolder || !initialBalance}
              >
                <Text style={styles.saveButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Entry Modal */}
      <AddEntryModal
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        selectedCard={selectedCard}
        selectedAction={selectedAction}
        setSelectedAction={setSelectedAction}
        amount={amount}
        setAmount={setAmount}
        balanceAfter={balanceAfter}
        setBalanceAfter={setBalanceAfter}
        notes={notes}
        setNotes={setNotes}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onAddEntry={addEntry}
      />
    </View>
  );
}

// Separate Add Entry Modal Component
const AddEntryModal = ({
  visible,
  onClose,
  selectedCard,
  selectedAction,
  setSelectedAction,
  amount,
  setAmount,
  balanceAfter,
  setBalanceAfter,
  notes,
  setNotes,
  selectedDate,
  setSelectedDate,
  onAddEntry
}: any) => {
  if (!selectedCard) return null;

  const cardType = CARD_TYPES[selectedCard.card_type];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Selected Card Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card</Text>
              <View style={styles.selectedCardInfo}>
                <View style={styles.cardInfo}>
                  {selectedCard.card_type === 'golden_arrow' ? (
                    <Image 
                      source={{ uri: cardType.logoImage }}
                      style={styles.cardInfoLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.mycitiLogo, { backgroundColor: 'rgba(255,255,255,0.1)', padding: 4 }]}>
                      <Text style={[styles.mycitiLogoText, { fontSize: 12 }]}>my</Text>
                      <Text style={[styles.mycitiLogoText, styles.mycitiLogoHighlight, { fontSize: 12 }]}>Citi</Text>
                    </View>
                  )}
                  <Text style={styles.cardInfoText}>
                    {cardType.name} •••• {selectedCard.card_number.slice(-4)}
                  </Text>
                </View>
                <Text style={styles.cardBalance}>
                  Balance: {selectedCard.current_balance} {cardType.pointsName.toLowerCase()}
                </Text>
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
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedAction === 'purchase' ? 'Amount Loaded' : 'Rides Used'}
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
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, (!amount || !balanceAfter) && styles.saveButtonDisabled]}
              onPress={onAddEntry}
              disabled={!amount || !balanceAfter}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  // Activity Graph Styles
  activityGraph: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  yearSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  selectedYearButton: {
    backgroundColor: '#1ea2b1',
  },
  yearButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedYearButtonText: {
    color: '#ffffff',
  },
  graphContainer: {
    flexDirection: 'row',
  },
  weekLabels: {
    marginRight: 8,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  weekLabel: {
    fontSize: 10,
    color: '#666',
    height: 12,
    marginBottom: 2,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: 2,
  },
  dayCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
  },
  graphLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    marginHorizontal: 4,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1ea2b1',
    shadowColor: '#1ea2b1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
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
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  goldenArrowLogo: {
    width: 24,
    height: 24,
  },
  mycitiLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mycitiLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  mycitiLogoHighlight: {
    color: '#1ea2b1',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuButton: {
    padding: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 20,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },
  removeText: {
    color: '#ef4444',
  },
  cardNumberSection: {
    marginVertical: 8,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardHolder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
  cardOptionLogo: {
    width: 20,
    height: 20,
  },
  cardOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selectedCardInfo: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfoLogo: {
    width: 20,
    height: 20,
  },
  cardInfoText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  cardBalance: {
    color: '#666',
    fontSize: 14,
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

