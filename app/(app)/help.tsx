import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  TextInput, 
  RefreshControl,
  Animated
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Search, HelpCircle, Filter, X, ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';

const BRAND_COLOR = '#1ea2b1';

const HelpSkeleton = () => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <View style={styles.headerTitleBox}>
          <View style={{ width: 120, height: 24, backgroundColor: '#111', borderRadius: 4 }} />
          <View style={{ width: 80, height: 10, backgroundColor: '#111', borderRadius: 4, marginTop: 4 }} />
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { opacity: 0.5 }]} />
      </View>
      <View style={styles.topics}>
        {[1, 2, 3].map(i => (
          <Animated.View key={i} style={[styles.topicCard, { opacity, height: 140 }]} />
        ))}
      </View>
    </View>
  );
};

export default function HelpScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<HelpTopic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { fetchHelpTopics(); }, []);
  useEffect(() => {
    let filtered = [...helpTopics];
    if (selectedCategory !== 'all') filtered = filtered.filter(t => t.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    setFilteredTopics(filtered);
  }, [searchQuery, selectedCategory, helpTopics]);

  const fetchHelpTopics = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('help_topics').select('*').eq('is_active', true).order('category').order('order');
      if (data) {
        setHelpTopics(data);
        setCategories(['all', ...Array.from(new Set(data.map((t: any) => t.category)))]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <HelpSkeleton />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.readyText}>READY TO MOVE</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#444" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search help topics..." 
            placeholderTextColor="#444" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {categories.map(c => (
          <TouchableOpacity key={c} style={[styles.tab, selectedCategory === c && styles.activeTab]} onPress={() => setSelectedCategory(c)}>
            <Text style={[styles.tabLabel, selectedCategory === c && { color: '#FFF' }]}>{c.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.main} 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHelpTopics().then(() => setRefreshing(false)); }} tintColor={BRAND_COLOR} />}
      >
        <View style={styles.topics}>
          {filteredTopics.map(t => (
            <TouchableOpacity key={t.id} style={styles.topicCard} onPress={() => router.push(`/help/${t.id}`)}>
              <View style={styles.topicHeader}>
                <View style={styles.categoryTag}><Text style={styles.categoryTagText}>{t.category}</Text></View>
                <ChevronRight size={18} color="#222" />
              </View>
              <Text style={styles.topicTitle}>{t.title}</Text>
              <Text style={styles.topicDesc} numberOfLines={2}>{t.description}</Text>
            </TouchableOpacity>
          ))}
          {filteredTopics.length === 0 && (
            <View style={styles.empty}>
              <HelpCircle size={48} color="#111" />
              <Text style={styles.emptyText}>NO TOPICS FOUND</Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Still need help?</Text>
            <Text style={styles.supportDesc}>Our support team is ready to assist you with any journey issues.</Text>
            <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/help/contact-support')}>
              <Text style={styles.supportBtnText}>CONTACT SUPPORT</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic', letterSpacing: -1 },
  readyText: { fontSize: 10, fontWeight: '900', color: BRAND_COLOR, letterSpacing: 2 },
  searchSection: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#222', gap: 12 },
  searchInput: { flex: 1, color: '#FFF', fontWeight: '600', fontSize: 15 },
  tabScroll: { maxHeight: 50, marginBottom: 24 },
  tabContent: { paddingHorizontal: 24, gap: 12 },
  tab: { backgroundColor: '#111', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  activeTab: { backgroundColor: '#222', borderColor: BRAND_COLOR },
  tabLabel: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  main: { flex: 1 },
  topics: { paddingHorizontal: 24, gap: 16 },
  topicCard: { backgroundColor: '#111', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222' },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryTag: { backgroundColor: '#000', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  categoryTagText: { fontSize: 9, fontWeight: '900', color: BRAND_COLOR, letterSpacing: 1 },
  topicTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', marginBottom: 8 },
  topicDesc: { fontSize: 14, color: '#444', lineHeight: 20, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '900', color: '#222', letterSpacing: 2 },
  footer: { padding: 24, marginTop: 24 },
  supportCard: { backgroundColor: BRAND_COLOR, borderRadius: 32, padding: 32, alignItems: 'center' },
  supportTitle: { fontSize: 24, fontWeight: '900', color: '#000', fontStyle: 'italic' },
  supportDesc: { fontSize: 14, color: '#000', opacity: 0.7, textAlign: 'center', fontWeight: '600', marginTop: 8, marginBottom: 24 },
  supportBtn: { backgroundColor: '#000', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20 },
  supportBtnText: { color: BRAND_COLOR, fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});