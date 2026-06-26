import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Route as RouteIcon,
  CheckCircle,
  X,
  Search,
  ChevronRight,
  Bus,
  Train,
  Car,
  Zap,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const ORANGE = '#f97316';

interface RouteResult {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
}

interface RouteStop {
  order_number: number;
  stops: { name: string } | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
  onSuccess?: () => void;
}

type Step = 'search' | 'order' | 'success';

const TRANSPORT_ICON: Record<string, React.ComponentType<any>> = {
  Taxi: Car,
  Bus: Bus,
  Train: Train,
  Other: Zap,
};

export default function SuggestRouteForStopModal({ visible, onClose, stopId, stopName, onSuccess }: Props) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [existingStops, setExistingStops] = useState<RouteStop[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('search');
      setQuery('');
      setResults([]);
      setSelectedRoute(null);
      setExistingStops([]);
      setOrderNumber('');
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const searchRoutes = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('routes')
        .select('id, name, transport_type, cost, start_point, end_point')
        .or(`name.ilike.%${q}%,start_point.ilike.%${q}%,end_point.ilike.%${q}%`)
        .limit(20);
      setResults(data || []);
    } catch {}
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchRoutes(query), 350);
    return () => clearTimeout(t);
  }, [query, searchRoutes]);

  const handleSelectRoute = async (route: RouteResult) => {
    setSelectedRoute(route);
    setStep('order');
    setIsLoadingStops(true);
    try {
      const { data } = await supabase
        .from('route_stops')
        .select('order_number, stops(name)')
        .eq('route_id', route.id)
        .order('order_number', { ascending: true });
      const stops = (data || []) as RouteStop[];
      setExistingStops(stops);
      const maxOrder = stops.length > 0 ? Math.max(...stops.map(s => s.order_number)) : 0;
      setOrderNumber(String(maxOrder + 1));
    } catch {}
    setIsLoadingStops(false);
  };

  const handleSubmit = async () => {
    if (!selectedRoute) return;
    const order = parseInt(orderNumber, 10);
    if (isNaN(order) || order < 1) {
      Alert.alert('Invalid position', 'Please enter a valid stop position (1 or higher).');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('route_stops').insert({
        route_id: selectedRoute.id,
        stop_id: stopId,
        order_number: order,
      });
      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already linked', `${stopName} is already part of this route.`);
        } else {
          throw error;
        }
        setIsSubmitting(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
          await supabase.from('profiles').update({ points: (profile?.points ?? 0) + 5 }).eq('id', user.id);
        }
      } catch {}
      setStep('success');
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not link stop to route. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTransportBadge = (type: string) => {
    const Icon = TRANSPORT_ICON[type] || Zap;
    return (
      <View style={[styles.badge, { backgroundColor: `${ORANGE}18`, borderColor: `${ORANGE}40` }]}>
        <Icon size={11} color={ORANGE} />
        <Text style={[styles.badgeText, { color: ORANGE }]}>{type}</Text>
      </View>
    );
  };

  const renderSearchStep = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.stopBanner, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}28` }]}>
        <RouteIcon size={13} color={ORANGE} />
        <Text style={[styles.stopBannerText, { color: ORANGE }]}>
          Linking a route to <Text style={{ fontWeight: '800' }}>{stopName}</Text>
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: query ? ORANGE : colors.border }]}>
        <Search size={16} color={query ? ORANGE : colors.text} style={{ opacity: query ? 1 : 0.45 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by route name or location…"
          placeholderTextColor={colors.text + '55'}
          autoFocus
          returnKeyType="search"
        />
        {isSearching
          ? <ActivityIndicator size="small" color={ORANGE} />
          : query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={15} color={colors.text} style={{ opacity: 0.45 }} />
            </TouchableOpacity>
          )
        }
      </View>

      {query.trim().length === 0 && (
        <Text style={[styles.hint, { color: colors.text }]}>
          Type to search existing routes — select one to link it to this stop.
        </Text>
      )}

      {query.trim().length > 0 && !isSearching && results.length === 0 && (
        <Text style={[styles.noResults, { color: colors.text }]}>No routes found for "{query}"</Text>
      )}

      {results.map((route) => (
        <TouchableOpacity
          key={route.id}
          style={[styles.routeRow, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleSelectRoute(route)}
          activeOpacity={0.78}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeRowName, { color: colors.text }]} numberOfLines={1}>{route.name}</Text>
            <Text style={[styles.routeRowPath, { color: colors.text + '75' }]} numberOfLines={1}>
              {route.start_point} → {route.end_point}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {renderTransportBadge(route.transport_type)}
              {route.cost > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>R {route.cost}</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={18} color={ORANGE} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOrderStep = () => {
    if (!selectedRoute) return null;
    return (
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.selectedRouteCard, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}35` }]}>
          <RouteIcon size={16} color={ORANGE} style={{ flexShrink: 0 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeRowName, { color: colors.text }]} numberOfLines={1}>{selectedRoute.name}</Text>
            <Text style={[styles.routeRowPath, { color: colors.text + '75' }]} numberOfLines={1}>
              {selectedRoute.start_point} → {selectedRoute.end_point}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setStep('search'); setSelectedRoute(null); }}
            style={[styles.changeBtn, { backgroundColor: colors.background }]}
          >
            <Text style={{ color: ORANGE, fontSize: 12, fontWeight: '700' }}>Change</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Current stop order</Text>

        {isLoadingStops ? (
          <ActivityIndicator color={ORANGE} style={{ marginVertical: 20 }} />
        ) : existingStops.length === 0 ? (
          <View style={[styles.stopChain, { borderColor: colors.border }]}>
            <Text style={[styles.hint, { color: colors.text, marginVertical: 0, textAlign: 'left' }]}>
              No stops on this route yet — yours will be the first.
            </Text>
          </View>
        ) : (
          <View style={[styles.stopChain, { borderColor: colors.border }]}>
            {existingStops.map((s, i) => (
              <View key={i}>
                <View style={styles.stopChainRow}>
                  <View style={[styles.stopDot, { backgroundColor: i === 0 ? ORANGE : colors.text, opacity: i === 0 ? 1 : 0.35 }]} />
                  <Text style={[styles.stopChainText, { color: colors.text }]}>
                    <Text style={{ color: ORANGE, fontWeight: '800' }}>#{s.order_number}</Text>
                    {'  '}
                    {(s.stops as any)?.name ?? 'Unknown stop'}
                  </Text>
                </View>
                {i < existingStops.length - 1 && (
                  <View style={[styles.stopChainConnector, { borderColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.text, marginTop: 18 }]}>
          Position for "{stopName}"
        </Text>
        <Text style={[styles.hint, { color: colors.text, textAlign: 'left', marginTop: 0, marginBottom: 10 }]}>
          Where in the stop sequence does this stop belong? (default: end of route)
        </Text>

        <View style={[styles.orderRow, { borderColor: ORANGE, backgroundColor: colors.background }]}>
          <Text style={{ color: ORANGE, fontWeight: '800', fontSize: 18, paddingRight: 4 }}>#</Text>
          <TextInput
            style={[styles.orderInput, { color: colors.text }]}
            value={orderNumber}
            onChangeText={setOrderNumber}
            keyboardType="number-pad"
            placeholder="e.g. 3"
            placeholderTextColor={colors.text + '45'}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: ORANGE, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Text style={styles.submitBtnText}>Link Stop to Route</Text><ChevronRight size={18} color="#fff" /></>
          }
        </TouchableOpacity>
        <Text style={[styles.rewardNote, { color: colors.text }]}>+5 TP earned for linking a stop to a route</Text>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT }]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${ORANGE}18` }]}>
                <RouteIcon size={20} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {step === 'search' ? 'Add Route to Stop' : step === 'order' ? 'Set Stop Position' : 'Stop Linked!'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>{stopName}</Text>
              </View>
            </View>
            {step !== 'success' && (
              <TouchableOpacity
                onPress={step === 'order' ? () => { setStep('search'); setSelectedRoute(null); } : onClose}
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {step !== 'success' && (
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, { backgroundColor: ORANGE }]} />
              <View style={[styles.stepLine, { backgroundColor: step === 'order' ? ORANGE : colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: step === 'order' ? ORANGE : colors.border }]} />
            </View>
          )}

          {step === 'search' && renderSearchStep()}
          {step === 'order' && renderOrderStep()}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: `${ORANGE}20` }]}>
                <CheckCircle size={52} color={ORANGE} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Stop Linked!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                {stopName} has been added{'\n'}to {selectedRoute?.name}.
              </Text>
              <Text style={[styles.successPoints, { color: ORANGE }]}>+5 TP earned 🎉</Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 24,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, opacity: 0.55, marginTop: 1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  stepIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6 },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  stopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  stopBannerText: { fontSize: 12, flex: 1, lineHeight: 16 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },

  hint: { fontSize: 13, opacity: 0.5, textAlign: 'center', marginVertical: 14, lineHeight: 19 },
  noResults: { fontSize: 14, opacity: 0.55, textAlign: 'center', marginVertical: 20 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  routeRowName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  routeRowPath: { fontSize: 12 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  selectedRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.6,
    marginBottom: 10,
  },

  stopChain: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 6 },
  stopChainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  stopChainText: { fontSize: 13, flex: 1 },
  stopChainConnector: { borderLeftWidth: 2, borderStyle: 'dashed', height: 14, marginLeft: 3, marginVertical: 1 },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 6,
  },
  orderInput: { flex: 1, fontSize: 24, fontWeight: '800' },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rewardNote: { textAlign: 'center', fontSize: 12, opacity: 0.45, marginTop: 10 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  successBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  successPoints: { fontSize: 20, fontWeight: '800' },
});
