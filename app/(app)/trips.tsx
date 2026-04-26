import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  Clock, 
  MapPin, 
  Car, 
  Award, 
  Leaf, 
  TrendingUp, 
  Star,
  Calendar,
  ChevronRight,
  X,
  ArrowLeft,
  BarChart3,
  Route as RouteIcon
} from 'lucide-react-native';
import { useTripHistory, CompletedJourney } from '@/hook/useTripHistory';
import { format } from 'date-fns';

const BRAND_COLOR = '#1ea2b1';

const TripsSkeleton = () => {
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
        <View style={styles.refreshBtn} />
      </View>
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {[1, 2, 3].map(i => (
            <Animated.View key={i} style={[styles.statCard, { opacity, height: 80 }]} />
          ))}
        </View>
      </View>
      <View style={styles.historySection}>
        {[1, 2, 3].map(i => (
          <Animated.View key={i} style={[styles.tripCard, { opacity, height: 140, marginBottom: 12 }]} />
        ))}
      </View>
    </View>
  );
};

export default function TripHistoryScreen() {
  const router = useRouter();
  const { trips, loading, stats, refresh, addRating } = useTripHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<CompletedJourney | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const tripsByMonth = useMemo(() => {
    const groups: { [key: string]: CompletedJourney[] } = {};
    trips.forEach(trip => {
      const label = format(new Date(trip.completed_at), 'MMMM yyyy');
      if (!groups[label]) groups[label] = [];
      groups[label].push(trip);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[1][0].completed_at).getTime() - new Date(a[1][0].completed_at).getTime());
  }, [trips]);

  const handleRateTrip = (trip: CompletedJourney) => {
    setSelectedTrip(trip);
    setRating(trip.rating || 0);
    setNotes(trip.notes || '');
    setShowRatingModal(true);
  };

  if (loading && !refreshing) return <TripsSkeleton />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Trip History</Text>
          <Text style={styles.readyText}>READY TO MOVE</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Clock size={20} color={BRAND_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLOR} />}>
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {[
              { label: 'TOTAL TRIPS', value: stats.totalTrips, icon: TrendingUp, color: BRAND_COLOR },
              { label: 'POINTS', value: stats.totalPoints, icon: Award, color: '#FFD700' },
              { label: 'CO2 SAVED', value: `${stats.totalCo2Saved.toFixed(1)}kg`, icon: Leaf, color: '#10b981' }
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <s.icon size={16} color={s.color} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.historySection}>
          {tripsByMonth.map(([month, monthTrips]) => (
            <View key={month} style={styles.monthBox}>
              <Text style={styles.monthTitle}>{month.toUpperCase()}</Text>
              {monthTrips.map(trip => (
                <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => handleRateTrip(trip)}>
                  <View style={styles.tripHeader}>
                    <View style={styles.routeBox}>
                      <Text style={styles.routeName} numberOfLines={1}>{trip.route_name}</Text>
                      <View style={styles.typeBadge}><Text style={styles.typeText}>{trip.transport_type.toUpperCase()}</Text></View>
                    </View>
                    <Text style={styles.tripDate}>{format(new Date(trip.completed_at), 'MMM d')}</Text>
                  </View>
                  <View style={styles.tripPoints}>
                    <MapPin size={12} color="#444" />
                    <Text style={styles.pointText} numberOfLines={1}>{trip.start_point} → {trip.end_point}</Text>
                  </View>
                  <View style={styles.tripFooter}>
                    <View style={styles.footerStat}>
                      <Clock size={12} color={BRAND_COLOR} />
                      <Text style={styles.footerStatText}>{Math.floor(trip.duration_seconds / 60)}m</Text>
                    </View>
                    <View style={styles.footerStat}>
                      <Award size={12} color="#FFD700" />
                      <Text style={styles.footerStatText}>+{trip.points_earned} PTS</Text>
                    </View>
                    {trip.rating && (
                      <View style={styles.ratingBox}>
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{trip.rating}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {trips.length === 0 && (
            <View style={styles.empty}>
              <Clock size={48} color="#111" />
              <Text style={styles.emptyText}>NO JOURNEYS YET</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Trip</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}><X size={24} color="#FFF" /></TouchableOpacity>
            </View>
            {selectedTrip && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalRoute}>{selectedTrip.route_name}</Text>
                <Text style={styles.modalDate}>{format(new Date(selectedTrip.completed_at), 'PPP')}</Text>
                
                <View style={styles.starsBox}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Star size={40} color={s <= rating ? '#FFD700' : '#222'} fill={s <= rating ? '#FFD700' : 'transparent'} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput 
                  style={styles.notesInput} 
                  placeholder="Share your experience..." 
                  placeholderTextColor="#444" 
                  value={notes} 
                  onChangeText={setNotes} 
                  multiline 
                />

                <TouchableOpacity style={styles.submitBtn} onPress={async () => {
                  await addRating(selectedTrip.id, rating, notes);
                  setShowRatingModal(false);
                }}>
                  <Text style={styles.submitBtnText}>SUBMIT REVIEW</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  refreshBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  main: { flex: 1 },
  statsSection: { paddingHorizontal: 24, marginBottom: 32 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  statLabel: { fontSize: 8, fontWeight: '900', color: '#444', letterSpacing: 1 },
  historySection: { paddingHorizontal: 24 },
  monthBox: { marginBottom: 32 },
  monthTitle: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 2, marginBottom: 16 },
  tripCard: { backgroundColor: '#111', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 12 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  routeBox: { flex: 1, gap: 4 },
  routeName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic' },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#000', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#222' },
  typeText: { fontSize: 8, fontWeight: '900', color: BRAND_COLOR, letterSpacing: 1 },
  tripDate: { fontSize: 12, fontWeight: '700', color: '#444' },
  tripPoints: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pointText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tripFooter: { flexDirection: 'row', gap: 16 },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerStatText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '900', color: '#FFD700' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 10, fontWeight: '900', color: '#222', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, maxHeight: '80%', borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  modalRoute: { fontSize: 20, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', marginBottom: 4 },
  modalDate: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 32 },
  starsBox: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  notesInput: { backgroundColor: '#000', borderRadius: 20, padding: 20, color: '#FFF', fontWeight: '600', fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#222', marginBottom: 24 },
  submitBtn: { backgroundColor: BRAND_COLOR, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});