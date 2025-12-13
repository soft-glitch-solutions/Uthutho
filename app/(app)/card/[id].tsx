import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, Plus, Calendar, TrendingUp, BarChart3 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import ActivityGraph from '@/components/tracker/ActivityGraph';
import QuickStats from '@/components/tracker/QuickStats';
import TransactionList from '@/components/tracker/TransactionList';
import AddEntryModal from '@/components/tracker/AddEntryModal';
import { UserCard, CardEntry, ActivityData } from '@/types/tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

// Card type configurations
const CARD_TYPES = {
  myciti: {
    name: 'MyCiti Card',
    color: '#1ea2b1',
    pointsName: 'Points',
    icon: '🚌',
  },
  golden_arrow: {
    name: 'Golden Arrow',
    color: '#f59e0b',
    pointsName: 'Rides',
    icon: '🚍',
  },
  go_george: {
    name: 'Go George',
    color: '#2563eb',
    pointsName: 'Trips',
    icon: '🚎',
  },
  rea_vaya: {
    name: 'Rea Vaya',
    color: '#dc2626',
    pointsName: 'Trips',
    icon: '🚌',
  },
  gautrain: {
    name: 'Gautrain',
    color: '#0f172a',
    pointsName: 'Trips',
    icon: '🚄',
  }
};

// Skeleton Loading Component for Desktop
const DesktopSkeletonLoader = () => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonItem = ({ width, height, style = {} }) => (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Desktop Header Skeleton */}
      <View style={styles.desktopHeader}>
        <SkeletonItem width={100} height={44} style={{ borderRadius: 12 }} />
        <View style={styles.desktopHeaderTitleContainer}>
          <SkeletonItem width={48} height={48} style={{ borderRadius: 24 }} />
          <View>
            <SkeletonItem width={150} height={24} style={{ marginBottom: 4 }} />
            <SkeletonItem width={120} height={14} />
          </View>
        </View>
        <SkeletonItem width={120} height={44} style={{ borderRadius: 12 }} />
      </View>

      {/* Desktop Layout Skeleton */}
      <View style={styles.desktopLayout}>
        {/* Left Column Skeleton */}
        <View style={styles.leftColumn}>
          {/* Card Overview Skeleton */}
          <View style={styles.desktopCardOverview}>
            <SkeletonItem width="100%" height={80} style={{ marginBottom: 20 }} />
            <View style={styles.cardInfo}>
              <SkeletonItem width="80%" height={20} style={{ marginBottom: 12 }} />
              <SkeletonItem width="70%" height={20} />
            </View>
          </View>

          {/* Quick Stats Skeleton */}
          <View style={[styles.quickStats, styles.quickStatsDesktop]}>
            <SkeletonItem width={120} height={24} style={{ marginBottom: 20 }} />
            <View style={styles.quickStatsGrid}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={styles.statItemDesktop}>
                  <SkeletonItem width={40} height={40} style={{ borderRadius: 20, marginBottom: 8 }} />
                  <SkeletonItem width={60} height={24} style={{ marginBottom: 4 }} />
                  <SkeletonItem width={80} height={12} />
                </View>
              ))}
            </View>
          </View>

          {/* Activity Graph Skeleton */}
          <View style={styles.activityGraphWrapper}>
            <SkeletonItem width="100%" height={30} style={{ marginBottom: 16 }} />
            <View style={styles.graphContainerDesktop}>
              <View style={styles.weekLabelsDesktop}>
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <SkeletonItem key={item} width={30} height={12} style={{ marginBottom: 2 }} />
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gridContainerDesktop}>
                  {Array.from({ length: 53 }).map((_, weekIndex) => (
                    <View key={weekIndex} style={styles.weekColumnDesktop}>
                      {Array.from({ length: 7 }).map((_, dayIndex) => (
                        <SkeletonItem
                          key={dayIndex}
                          width={14}
                          height={14}
                          style={{ marginBottom: 2 }}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
            <SkeletonItem width="60%" height={20} style={{ marginTop: 16, alignSelf: 'flex-end' }} />
          </View>
        </View>

        {/* Right Column - Transactions Skeleton */}
        <View style={styles.rightColumn}>
          <SkeletonItem width={120} height={28} style={{ marginBottom: 24 }} />
          
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <View key={item} style={[styles.transactionItemSkeleton, styles.transactionItemSkeletonDesktop]}>
              <View style={styles.transactionHeaderSkeleton}>
                <SkeletonItem width={32} height={32} style={{ borderRadius: 16 }} />
                <View style={styles.transactionInfoSkeleton}>
                  <SkeletonItem width={100} height={16} style={{ marginBottom: 4 }} />
                  <SkeletonItem width={80} height={12} />
                </View>
              </View>
              <SkeletonItem width={60} height={24} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Skeleton Loading Component for Mobile
const MobileSkeletonLoader = () => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const animateShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animateShimmer());
    };

    animateShimmer();
  }, []);

  const shimmerAnimation = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  const SkeletonItem = ({ width, height, style = {} }) => (
    <View style={[styles.skeletonItem, { width, height }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerAnimation }],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Mobile Header Skeleton */}
      <View style={styles.header}>
        <SkeletonItem width={44} height={44} style={{ borderRadius: 22 }} />
        <SkeletonItem width={120} height={24} />
        <SkeletonItem width={44} height={44} style={{ borderRadius: 22 }} />
      </View>

      {/* Mobile Content Skeleton */}
      <ScrollView style={styles.content}>
        {/* Activity Graph Skeleton */}
        <View style={styles.activityGraph}>
          <SkeletonItem width="100%" height={20} style={{ marginBottom: 16 }} />
          <SkeletonItem width="100%" height={150} style={{ marginBottom: 16 }} />
          <SkeletonItem width="50%" height={16} style={{ alignSelf: 'flex-end' }} />
        </View>

        {/* Quick Stats Skeleton */}
        <View style={styles.quickStats}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.statItem}>
              <SkeletonItem width={40} height={20} style={{ marginBottom: 4 }} />
              <SkeletonItem width={60} height={12} />
            </View>
          ))}
        </View>

        {/* Transactions Skeleton */}
        <View style={styles.transactionsSection}>
          <SkeletonItem width={120} height={20} style={{ marginBottom: 16 }} />
          
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.transactionItemSkeleton}>
              <View style={styles.transactionHeaderSkeleton}>
                <SkeletonItem width={32} height={32} style={{ borderRadius: 16 }} />
                <View style={styles.transactionInfoSkeleton}>
                  <SkeletonItem width={100} height={16} style={{ marginBottom: 4 }} />
                  <SkeletonItem width={80} height={12} />
                </View>
              </View>
              <SkeletonItem width={60} height={20} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Desktop Layout Component
const DesktopCardDetail = ({ 
  selectedCard, 
  entries, 
  activityData, 
  showAddEntryModal, 
  setShowAddEntryModal, 
  selectedYear, 
  setSelectedYear, 
  handleEntryAdded, 
  router 
}) => {
  const cardTypeConfig = getCardTypeConfig(selectedCard.card_type);
  
  return (
    <View style={styles.containerDesktop}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Desktop Header */}
      <View style={styles.desktopHeader}>
        <TouchableOpacity style={styles.desktopBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
          <Text style={styles.desktopBackButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.desktopHeaderTitleContainer}>
          <View style={[styles.cardTypeIcon, { backgroundColor: cardTypeConfig.color }]}>
            <Text style={styles.cardTypeIconText}>{cardTypeConfig.icon}</Text>
          </View>
          <View>
            <Text style={styles.desktopHeaderTitle}>{cardTypeConfig.name}</Text>
            <Text style={styles.desktopHeaderSubtitle}>Card Number: {selectedCard.card_number.slice(-4)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.desktopAddButton, { backgroundColor: cardTypeConfig.color }]}
          onPress={() => setShowAddEntryModal(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.desktopAddButtonText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Desktop Layout */}
      <View style={styles.desktopLayout}>
        {/* Left Column - Activity Graph & Quick Stats */}
        <View style={styles.leftColumn}>
          <View style={styles.desktopCardOverview}>
            <View style={styles.cardBalanceContainer}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={[styles.balanceValue, { color: cardTypeConfig.color }]}>
                R{selectedCard.current_balance}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.infoItem}>
                <Calendar size={16} color="#666666" />
                <Text style={styles.infoLabel}>Since {new Date(selectedCard.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.infoItem}>
                <TrendingUp size={16} color="#666666" />
                <Text style={styles.infoLabel}>Last updated: Today</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats - Desktop Version */}
          <View style={[styles.quickStats, styles.quickStatsDesktop]}>
            <View style={styles.quickStatsHeader}>
              <BarChart3 size={20} color={cardTypeConfig.color} />
              <Text style={styles.quickStatsTitle}>Usage Statistics</Text>
            </View>
            <View style={styles.quickStatsGrid}>
              <View style={[styles.statItemDesktop, { borderColor: cardTypeConfig.color }]}>
                <Text style={styles.statValueDesktop}>
                  {entries.filter(e => e.action === 'ride').length}
                </Text>
                <Text style={styles.statLabelDesktop}>Total Rides</Text>
              </View>
              <View style={[styles.statItemDesktop, { borderColor: cardTypeConfig.color }]}>
                <Text style={styles.statValueDesktop}>
                  {entries.filter(e => e.action === 'purchase').length}
                </Text>
                <Text style={styles.statLabelDesktop}>Times Loaded</Text>
              </View>
              <View style={[styles.statItemDesktop, { borderColor: cardTypeConfig.color }]}>
                <Text style={styles.statValueDesktop}>
                  {entries.length}
                </Text>
                <Text style={styles.statLabelDesktop}>Total Entries</Text>
              </View>
              <View style={[styles.statItemDesktop, { borderColor: cardTypeConfig.color }]}>
                <Text style={styles.statValueDesktop}>
                  {new Set(entries.map(e => e.date.split('-')[1])).size}
                </Text>
                <Text style={styles.statLabelDesktop}>Active Months</Text>
              </View>
            </View>
          </View>

          {/* Activity Graph */}
          <View style={styles.activityGraphWrapper}>
            <ActivityGraph 
              data={activityData} 
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              color={cardTypeConfig.color}
              isDesktop={true}
            />
          </View>
        </View>

        {/* Right Column - Transaction List */}
        <ScrollView style={styles.rightColumn} showsVerticalScrollIndicator={true}>
          <TransactionList 
            entries={entries}
            cardType={selectedCard.card_type}
            cardTypeConfig={cardTypeConfig}
            onAddEntry={() => setShowAddEntryModal(true)}
            isDesktop={true}
          />
        </ScrollView>
      </View>

      <AddEntryModal
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        selectedCard={selectedCard}
        onEntryAdded={handleEntryAdded}
        isDesktop={true}
      />
    </View>
  );
};

// Helper function to get card type config
const getCardTypeConfig = (cardType: string) => {
  return CARD_TYPES[cardType as keyof typeof CARD_TYPES] || CARD_TYPES.myciti;
};

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [entries, setEntries] = useState<CardEntry[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user && id) {
      loadCardData();
    }
  }, [user, id]);

  useEffect(() => {
    if (selectedCard) {
      loadCardEntries(selectedCard.id);
      loadActivityData(selectedCard.id);
    }
  }, [selectedCard, selectedYear]);

  const loadCardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSelectedCard(data);
    } catch (error) {
      console.error('Error loading card data:', error);
      Alert.alert('Error', 'Failed to load card data');
      router.back();
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

      const activityMap = new Map();
      data?.forEach(entry => {
        const date = entry.date;
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
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

  const handleEntryAdded = () => {
    setShowAddEntryModal(false);
    if (selectedCard) {
      loadCardEntries(selectedCard.id);
      loadCardData(); // Refresh card data to update balance
    }
  };

  if (loading || !selectedCard) {
    return isDesktop ? <DesktopSkeletonLoader /> : <MobileSkeletonLoader />;
  }

  const cardTypeConfig = getCardTypeConfig(selectedCard.card_type);

  if (isDesktop) {
    return (
      <DesktopCardDetail
        selectedCard={selectedCard}
        entries={entries}
        activityData={activityData}
        showAddEntryModal={showAddEntryModal}
        setShowAddEntryModal={setShowAddEntryModal}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        handleEntryAdded={handleEntryAdded}
        router={router}
      />
    );
  }

  // Mobile Layout (original)
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {cardTypeConfig.name}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddEntryModal(true)}
        >
          <Plus size={24} color={cardTypeConfig.color} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ActivityGraph 
          data={activityData} 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          color={cardTypeConfig.color}
        />
        
        <QuickStats 
          card={selectedCard}
          entries={entries}
          cardTypeConfig={cardTypeConfig}
        />

        <TransactionList 
          entries={entries}
          cardType={selectedCard.card_type}
          cardTypeConfig={cardTypeConfig}
          onAddEntry={() => setShowAddEntryModal(true)}
        />
      </ScrollView>

      <AddEntryModal
        visible={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        selectedCard={selectedCard}
        onEntryAdded={handleEntryAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Common Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Skeleton Styles
  skeletonItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  desktopBackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  desktopHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTypeIconText: {
    fontSize: 24,
  },
  desktopHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  desktopHeaderSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  desktopAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  desktopAddButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Desktop Layout
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    flex: 1,
  },
  leftColumn: {
    width: '40%',
    minWidth: 0,
  },
  rightColumn: {
    width: '60%',
    minWidth: 0,
    flex: 1,
  },
  
  // Desktop Card Overview
  desktopCardOverview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardBalanceContainer: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  cardInfo: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  
  // Desktop Quick Stats
  quickStatsDesktop: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  quickStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItemDesktop: {
    width: 'calc(50% - 8px)',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValueDesktop: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabelDesktop: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Desktop Activity Graph Wrapper
  activityGraphWrapper: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  graphContainerDesktop: {
    flexDirection: 'row',
  },
  weekLabelsDesktop: {
    marginRight: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: 40,
  },
  gridContainerDesktop: {
    flexDirection: 'row',
  },
  weekColumnDesktop: {
    marginRight: 2,
  },
  
  // Transaction Skeleton Items
  transactionItemSkeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  transactionItemSkeletonDesktop: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  transactionHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionInfoSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  
  // Transactions Section (Mobile)
  transactionsSection: {
    paddingHorizontal: 16,
  },
  
  // Mobile Header Styles
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
  
  // Mobile Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Mobile Activity Graph (Skeleton)
  activityGraph: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  
  // Mobile Quick Stats (Skeleton)
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
});