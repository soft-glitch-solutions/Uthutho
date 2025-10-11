import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import ActivityGraph from '@/components/tracker/ActivityGraph';
import QuickStats from '@/components/tracker/QuickStats';
import TransactionList from '@/components/tracker/TransactionList';
import AddEntryModal from '@/components/tracker/AddEntryModal';
import { UserCard, CardEntry, ActivityData } from '@/types/tracker';

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
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.addButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedCard.card_type === 'myciti' ? 'MyCiti Card' : 'Golden Arrow'}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddEntryModal(true)}
        >
          <Plus size={24} color="#1ea2b1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ActivityGraph 
          data={activityData} 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
        
        <QuickStats 
          card={selectedCard}
          entries={entries}
        />

        <TransactionList 
          entries={entries}
          cardType={selectedCard.card_type}
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
});