import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  MapPin,
  ArrowUpDown,
  Clock,
  Route,
  ChevronRight,
  Bus,
  Footprints,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

// Real South African addresses
const SA_ADDRESSES = [
  { id: '1', label: 'Sandton City Mall', address: '83 Rivonia Rd, Sandton, 2196', city: 'Johannesburg' },
  { id: '2', label: 'OR Tambo International Airport', address: 'OR Tambo Airport Rd, Kempton Park, 1627', city: 'Johannesburg' },
  { id: '3', label: 'Carlton Centre', address: '150 Commissioner St, Johannesburg CBD, 2001', city: 'Johannesburg' },
  { id: '4', label: 'Soweto – Orlando Towers', address: 'Chris Hani Rd, Orlando West, 1804', city: 'Johannesburg' },
  { id: '5', label: 'Rosebank Mall', address: '50 Bath Ave, Rosebank, 2196', city: 'Johannesburg' },
  { id: '6', label: 'Park Station', address: 'Rissik St, Braamfontein, Johannesburg, 2001', city: 'Johannesburg' },
  { id: '7', label: 'Bree Taxi Rank', address: 'Bree St, Johannesburg CBD, 2001', city: 'Johannesburg' },
  { id: '8', label: 'V&A Waterfront', address: 'Dock Rd, V&A Waterfront, Cape Town, 8001', city: 'Cape Town' },
  { id: '9', label: 'Cape Town Station', address: 'Adderley St, Cape Town City Centre, 8001', city: 'Cape Town' },
  { id: '10', label: 'Camps Bay Beach', address: 'Victoria Rd, Camps Bay, 8005', city: 'Cape Town' },
  { id: '11', label: 'Bellville Station', address: 'Durban Rd, Bellville, 7530', city: 'Cape Town' },
  { id: '12', label: 'Stellenbosch Square', address: 'Banghoek Rd, Stellenbosch, 7600', city: 'Cape Town' },
  { id: '13', label: 'Khayelitsha Transport Hub', address: 'Ntlazane Rd, Khayelitsha, 7784', city: 'Cape Town' },
  { id: '14', label: 'Canal Walk Shopping Centre', address: 'Century Blvd, Century City, 7441', city: 'Cape Town' },
  { id: '15', label: 'Durban Station', address: 'NMR Ave, Greyville, 4001', city: 'Durban' },
  { id: '16', label: 'Gateway Theatre of Shopping', address: 'Palm Blvd, Umhlanga Ridge, 4319', city: 'Durban' },
  { id: '17', label: 'Berea Road Station', address: 'Berea Rd, Berea, 4001', city: 'Durban' },
  { id: '18', label: 'Durban Beach Front', address: 'OR Tambo Parade, Durban, 4001', city: 'Durban' },
  { id: '19', label: 'Pretoria Station', address: 'Scheiding St, Pretoria Central, 0002', city: 'Pretoria' },
  { id: '20', label: 'Menlyn Park', address: 'Atterbury Rd & Lois Ave, Menlo Park, 0181', city: 'Pretoria' },
  { id: '21', label: 'Union Buildings', address: 'Government Ave, Arcadia, 0083', city: 'Pretoria' },
  { id: '22', label: 'Hatfield Gautrain Station', address: 'Grosvenor St, Hatfield, Pretoria, 0083', city: 'Pretoria' },
  { id: '23', label: 'Mthatha Bus Terminal', address: 'Sutherland St, Mthatha, 5099', city: 'Mthatha' },
  { id: '24', label: 'East London Station', address: 'Station Rd, East London, 5201', city: 'East London' },
  { id: '25', label: 'Hemingways Mall', address: 'Bonza Bay Rd, Beacon Bay, 5241', city: 'East London' },
  { id: '26', label: 'Bloemfontein Central', address: 'Harvey Rd, Bloemfontein, 9301', city: 'Bloemfontein' },
  { id: '27', label: 'Polokwane CBD', address: 'Landdros Mare St, Polokwane, 0699', city: 'Polokwane' },
  { id: '28', label: 'Nelspruit Crossing', address: 'R40 & Madiba Dr, Nelspruit, 1200', city: 'Nelspruit' },
];

interface TripLeg {
  mode: 'walk' | 'bus';
  description: string;
  duration: number;
  distance: string;
}

interface TripPlan {
  totalDuration: number;
  totalDistance: string;
  legs: TripLeg[];
  fare: string;
  departTime: string;
  arriveTime: string;
}

function generateMockPlan(from: string, to: string): TripPlan {
  const now = new Date();
  const departStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dur = 30 + Math.floor(Math.random() * 40);
  const arrive = new Date(now.getTime() + dur * 60 * 1000);
  const arriveStr = arrive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dist = (5 + Math.random() * 15).toFixed(1);

  return {
    totalDuration: dur,
    totalDistance: `${dist} km`,
    fare: `R ${(8 + Math.random() * 20).toFixed(2)}`,
    departTime: departStr,
    arriveTime: arriveStr,
    legs: [
      { mode: 'walk', description: `Walk to nearest stop`, duration: 4 + Math.floor(Math.random() * 4), distance: `${200 + Math.floor(Math.random() * 400)} m` },
      { mode: 'bus', description: `Bus toward ${to.split('–')[0].trim()}`, duration: dur - 12, distance: `${(parseFloat(dist) - 1.5).toFixed(1)} km` },
      { mode: 'walk', description: `Walk to destination`, duration: 5 + Math.floor(Math.random() * 5), distance: `${300 + Math.floor(Math.random() * 500)} m` },
    ],
  };
}

export default function PlannerTab() {
  const { colors } = useTheme();
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSelected, setFromSelected] = useState<typeof SA_ADDRESSES[0] | null>(null);
  const [toSelected, setToSelected] = useState<typeof SA_ADDRESSES[0] | null>(null);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [planning, setPlanning] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Show all addresses when field is focused but empty, filter when typing
  const query = activeField === 'from' ? fromQuery : toQuery;
  const filteredAddresses = activeField
    ? (query.length > 0
        ? SA_ADDRESSES.filter((a) =>
            a.label.toLowerCase().includes(query.toLowerCase()) ||
            a.address.toLowerCase().includes(query.toLowerCase()) ||
            a.city.toLowerCase().includes(query.toLowerCase())
          )
        : SA_ADDRESSES)
    : [];

  const handleSelect = (item: typeof SA_ADDRESSES[0]) => {
    if (activeField === 'from') {
      setFromSelected(item);
      setFromQuery(item.label);
    } else {
      setToSelected(item);
      setToQuery(item.label);
    }
    setActiveField(null);
    setTripPlan(null);
  };

  const handleSwap = () => {
    const ts = fromSelected; const tq = fromQuery;
    setFromSelected(toSelected); setFromQuery(toQuery);
    setToSelected(ts); setToQuery(tq);
    setTripPlan(null);
  };

  const handlePlan = async () => {
    if (!fromSelected || !toSelected) return;
    setPlanning(true);
    setTripPlan(null);
    fadeAnim.setValue(0);
    await new Promise((r) => setTimeout(r, 1200));
    const plan = generateMockPlan(fromSelected.label, toSelected.label);
    setTripPlan(plan);
    setPlanning(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* From / To inputs */}
      <View style={[styles.inputCard, { backgroundColor: colors.card || '#1A1D1E' }]}>
        <View style={styles.inputRow}>
          <View style={styles.dotFilled} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Where from? Try 'Sandton' or 'Cape Town'"
            placeholderTextColor="#555"
            value={fromQuery}
            onChangeText={(t) => { setFromQuery(t); setFromSelected(null); setTripPlan(null); }}
            onFocus={() => setActiveField('from')}
          />
          {fromSelected && <CheckCircle2 size={16} color={colors.primary || '#1ea2b1'} />}
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border || '#222' }]} />

        <View style={styles.inputRow}>
          <View style={[styles.dotOutline, { borderColor: colors.primary || '#1ea2b1' }]} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Where to? Try 'OR Tambo' or 'Pretoria'"
            placeholderTextColor="#555"
            value={toQuery}
            onChangeText={(t) => { setToQuery(t); setToSelected(null); setTripPlan(null); }}
            onFocus={() => setActiveField('to')}
          />
          {toSelected && <CheckCircle2 size={16} color={colors.primary || '#1ea2b1'} />}
        </View>

        {(fromQuery.length > 0 || toQuery.length > 0) && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleSwap} style={styles.actionBtn}>
              <ArrowUpDown size={14} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.actionText, { color: colors.primary || '#1ea2b1' }]}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setFromQuery(''); setToQuery(''); setFromSelected(null); setToSelected(null); setTripPlan(null); setActiveField(null); }}
              style={styles.actionBtn}
            >
              <X size={14} color="#666" />
              <Text style={[styles.actionText, { color: '#666' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Suggestions — shown on focus, filtered while typing */}
      {activeField && filteredAddresses.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: colors.card || '#1A1D1E' }]}>
          <View style={styles.suggestionsHeader}>
            <Search size={13} color="#666" />
            <Text style={styles.suggestionsTitle}>
              {query.length > 0 ? `Results for "${query}"` : 'All addresses'}
            </Text>
          </View>
          {filteredAddresses.slice(0, 8).map((item) => (
            <TouchableOpacity key={item.id} style={styles.suggestion} onPress={() => handleSelect(item)}>
              <View style={[styles.suggestionDot, { backgroundColor: `${colors.primary || '#1ea2b1'}20` }]}>
                <MapPin size={13} color={colors.primary || '#1ea2b1'} />
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={[styles.suggestionLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={styles.suggestionAddr} numberOfLines={1}>{item.address}</Text>
              </View>
              <View style={[styles.cityBadge, { backgroundColor: `${colors.primary || '#1ea2b1'}15` }]}>
                <Text style={[styles.cityText, { color: colors.primary || '#1ea2b1' }]}>{item.city}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {filteredAddresses.length > 8 && (
            <Text style={styles.moreText}>{filteredAddresses.length - 8} more results…</Text>
          )}
        </View>
      )}

      {/* No results */}
      {activeField && query.length > 0 && filteredAddresses.length === 0 && (
        <View style={[styles.noResults, { backgroundColor: colors.card || '#1A1D1E' }]}>
          <Search size={16} color="#555" />
          <Text style={styles.noResultsText}>No addresses match "{query}"</Text>
        </View>
      )}

      {/* Plan button */}
      <TouchableOpacity
        style={[
          styles.planBtn,
          { backgroundColor: colors.primary || '#1ea2b1' },
          (!fromSelected || !toSelected || planning) && styles.planBtnDisabled,
        ]}
        onPress={handlePlan}
        disabled={!fromSelected || !toSelected || planning}
        activeOpacity={0.8}
      >
        {planning ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Route size={18} color="#fff" />
        )}
        <Text style={styles.planBtnText}>{planning ? 'Finding route…' : 'Plan Journey'}</Text>
      </TouchableOpacity>

      {/* Results */}
      {tripPlan && (
        <Animated.View style={[styles.result, { backgroundColor: colors.card || '#1A1D1E', opacity: fadeAnim }]}>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Depart</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>{tripPlan.departTime}</Text>
            </View>
            <ChevronRight size={18} color="#555" />
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Arrive</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>{tripPlan.arriveTime}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, { borderColor: colors.border || '#222' }]}>
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.totalDuration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.totalDistance}</Text>
            </View>
            <View style={styles.metaItem}>
              <Bus size={13} color={colors.primary || '#1ea2b1'} />
              <Text style={[styles.metaText, { color: colors.text }]}>{tripPlan.fare}</Text>
            </View>
          </View>

          {tripPlan.legs.map((leg, i) => (
            <View key={i} style={styles.leg}>
              <View style={styles.legTrack}>
                <View style={[styles.legDot, { backgroundColor: colors.primary || '#1ea2b1' }]} />
                {i < tripPlan.legs.length - 1 && <View style={styles.legLine} />}
              </View>
              <View style={styles.legInfo}>
                <View style={styles.legTop}>
                  {leg.mode === 'walk' ? <Footprints size={14} color="#888" /> : <Bus size={14} color={colors.primary || '#1ea2b1'} />}
                  <Text style={[styles.legDesc, { color: colors.text }]}>{leg.description}</Text>
                </View>
                <Text style={styles.legMeta}>{leg.duration} min · {leg.distance}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },

  inputCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1ea2b1' },
  dotOutline: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  separator: { height: 1, marginHorizontal: 16 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },

  suggestions: { borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  suggestionsTitle: { fontSize: 12, color: '#666', fontWeight: '500' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 10 },
  suggestionDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  suggestionAddr: { fontSize: 12, color: '#666' },
  cityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cityText: { fontSize: 11, fontWeight: '600' },
  moreText: { fontSize: 12, color: '#555', textAlign: 'center', paddingVertical: 10 },

  noResults: { borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  noResultsText: { color: '#555', fontSize: 14 },

  planBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, marginBottom: 20 },
  planBtnDisabled: { opacity: 0.35 },
  planBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  result: { borderRadius: 16, overflow: 'hidden' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  timeBlock: { alignItems: 'center', gap: 2 },
  timeLabel: { fontSize: 12, color: '#888' },
  timeValue: { fontSize: 20, fontWeight: '700' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontWeight: '600' },

  leg: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 },
  legTrack: { alignItems: 'center', marginRight: 12, paddingTop: 4, width: 12 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legLine: { width: 2, flex: 1, backgroundColor: 'rgba(30,162,177,0.2)', marginTop: 4 },
  legInfo: { flex: 1, paddingBottom: 8 },
  legTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  legDesc: { fontSize: 14, fontWeight: '500' },
  legMeta: { fontSize: 12, color: '#888' },
});
